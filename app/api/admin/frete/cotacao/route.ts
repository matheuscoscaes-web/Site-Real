import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseCaixa } from "@/lib/caixa";

/**
 * Cotação real do Melhor Envio pro admin (sem a margem do frete do cliente),
 * com o tamanho/peso da caixa e o seguro informados na tela do pedido.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const cep = String(body.cep ?? "").replace(/\D/g, "");
  if (cep.length !== 8) return NextResponse.json({ error: "CEP inválido" }, { status: 400 });

  const caixa = parseCaixa(body.caixa, 1);
  const origem = process.env.MELHOR_ENVIO_CEP_ORIGEM?.replace(/\D/g, "");
  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (!token || !origem) return NextResponse.json({ error: "Melhor Envio não configurado" }, { status: 500 });

  const res = await fetch("https://melhorenvio.com.br/api/v2/me/shipment/calculate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": process.env.MELHOR_ENVIO_USER_AGENT ?? "HeartsCouro/1.0",
    },
    body: JSON.stringify({
      from: { postal_code: origem },
      to: { postal_code: cep },
      volumes: [{ height: caixa.height, width: caixa.width, length: caixa.length, weight: caixa.weight }],
      options: { insurance_value: caixa.insuranceValue, receipt: false, own_hand: false },
    }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !Array.isArray(data)) {
    const msg = data?.errors?.postal_code ? "CEP não encontrado pelo Melhor Envio — confira o CEP." : "Erro ao cotar no Melhor Envio";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  type MeQuote = { id: number; name: string; price?: string | number; delivery_time?: number; error?: string; company?: { name?: string } };
  const options = (data as MeQuote[])
    .filter((q) => !q.error && q.price != null)
    .map((q) => ({
      id: q.id,
      name: q.name,
      company: q.company?.name ?? "",
      price: Math.round(Number(q.price) * 100) / 100,
      days: q.delivery_time ?? null,
    }))
    .sort((a, b) => a.price - b.price);

  return NextResponse.json(options);
}
