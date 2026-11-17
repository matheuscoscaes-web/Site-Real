import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { applyShipmentInfo } from "@/lib/rastreio";

/**
 * Webhook do Melhor Envio — avisa quando a etiqueta é postada, entregue etc.
 * Configurado em: Melhor Envio > Integrações > Área Dev. > Seus aplicativos > Novo Webhook.
 * A assinatura (header X-ME-Signature) é um HMAC-SHA256 do corpo com o secret do
 * aplicativo, que fica na variável MELHOR_ENVIO_WEBHOOK_SECRET.
 */
function validSignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const mac = createHmac("sha256", secret).update(rawBody);
  const digest = mac.digest();
  // A doc mostra a assinatura em base64; aceita hex também por garantia
  for (const expected of [digest.toString("base64"), digest.toString("hex")]) {
    const a = Buffer.from(expected);
    const b = Buffer.from(signature.trim());
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

export async function POST(request: NextRequest) {
  const secret = process.env.MELHOR_ENVIO_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook não configurado" }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!validSignature(rawBody, request.headers.get("x-me-signature"), secret)) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  let payload: { event?: string; data?: { id?: string; status?: string; tracking?: string | null } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const meId = payload.data?.id;
  if (!meId) return NextResponse.json({ ok: true });

  const order = await prisma.order.findFirst({ where: { melhorEnvioId: meId }, select: { id: true } });
  // Etiqueta que não é de um pedido do site (gerada à mão no painel): só confirma o recebimento
  if (!order) return NextResponse.json({ ok: true });

  try {
    await applyShipmentInfo(order.id, {
      status: payload.data?.status ?? payload.event?.replace(/^order\./, ""),
      tracking: payload.data?.tracking,
    });
  } catch (err) {
    console.error("[melhorenvio webhook] erro ao atualizar pedido", order.id, err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
