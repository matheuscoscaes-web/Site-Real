import { prisma } from "./prisma";
import { updateOrderStatus } from "./orders";

const ME_URL = "https://melhorenvio.com.br/api/v2/me";

/** Link que já abre direto no rastreio daquele código. */
export function trackingUrl(code: string) {
  return `https://www.melhorrastreio.com.br/rastreio/${encodeURIComponent(code)}`;
}

export type MeShipmentInfo = {
  status?: string | null; // "released" | "generated" | "posted" | "delivered" | "canceled" | ...
  tracking?: string | null;
};

/**
 * Aplica no pedido o que o Melhor Envio informou (via webhook ou consulta):
 * - salva o código de rastreio assim que ele existir;
 * - postado + com código → "Enviado" (dispara o e-mail com o código);
 * - entregue → "Entregue".
 * Só avança o status, nunca volta (ex: não tira um pedido de "Entregue").
 *
 * Postado mas ainda sem código (a transportadora pode levar até 1 dia útil pra
 * gerar): espera o código chegar antes de virar "Enviado", senão o e-mail de envio
 * sairia sem o rastreio.
 */
export async function applyShipmentInfo(orderId: string, info: MeShipmentInfo) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, trackingCode: true },
  });
  if (!order) return;

  const tracking = info.tracking?.trim() || null;
  if (tracking && tracking !== order.trackingCode) {
    await prisma.order.update({ where: { id: orderId }, data: { trackingCode: tracking } });
  }
  const hasTracking = !!(tracking || order.trackingCode);

  const meStatus = (info.status ?? "").toLowerCase();
  if (meStatus === "delivered" && ["PAID", "PREPARING", "SHIPPED"].includes(order.status)) {
    await updateOrderStatus(orderId, "DELIVERED");
  } else if (meStatus === "posted" && hasTracking && ["PAID", "PREPARING"].includes(order.status)) {
    await updateOrderStatus(orderId, "SHIPPED");
  }
}

/** Consulta vários envios de uma vez no Melhor Envio. Nunca lança erro. */
async function fetchShipments(meIds: string[]): Promise<Record<string, MeShipmentInfo>> {
  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (!token || meIds.length === 0) return {};
  try {
    const res = await fetch(`${ME_URL}/shipment/tracking`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": process.env.MELHOR_ENVIO_USER_AGENT ?? "HeartsCouro/1.0",
      },
      body: JSON.stringify({ orders: meIds }),
      // Não deixa a página travar se o Melhor Envio estiver lento
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return {};
    return (await res.json()) as Record<string, MeShipmentInfo>;
  } catch {
    return {};
  }
}

// Última consulta de cada pedido (por instância do servidor) — evita bater no
// Melhor Envio a cada carregamento de página.
const lastChecked = new Map<string, number>();
const CHECK_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Reserva caso o webhook falhe: consulta no Melhor Envio os pedidos com etiqueta
 * que ainda não foram entregues e atualiza código/status. Chamado quando o admin
 * abre a lista de pedidos ou o cliente abre "Meus pedidos".
 * Best-effort: qualquer falha é ignorada e a página carrega normalmente.
 */
export async function syncPendingShipments(opts: { userId?: string } = {}) {
  try {
    const now = Date.now();
    const candidates = await prisma.order.findMany({
      where: {
        melhorEnvioId: { not: null },
        status: { in: ["PAID", "PREPARING", "SHIPPED"] },
        // Etiquetas de mais de 60 dias já deviam ter sido entregues — não fica consultando pra sempre
        createdAt: { gte: new Date(now - 60 * 24 * 60 * 60 * 1000) },
        ...(opts.userId ? { userId: opts.userId } : {}),
      },
      select: { id: true, melhorEnvioId: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const due = candidates.filter((o) => now - (lastChecked.get(o.id) ?? 0) > CHECK_INTERVAL_MS);
    if (due.length === 0) return;
    for (const o of due) lastChecked.set(o.id, now);

    const data = await fetchShipments(due.map((o) => o.melhorEnvioId!));
    for (const o of due) {
      const info = data[o.melhorEnvioId!];
      if (info) await applyShipmentInfo(o.id, info);
    }
  } catch (err) {
    console.error("[rastreio] falha ao sincronizar envios", err);
  }
}
