import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { orderId, items, email } = await request.json();

  const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
  });

  const preference = new Preference(client);

  const baseUrl = process.env.NEXT_PUBLIC_URL!;

  const result = await preference.create({
    body: {
      items: items.map((item: { title: string; quantity: number; unit_price: number }) => ({
        id: orderId,
        title: item.title,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        currency_id: "BRL",
      })),
      payer: { email },
      back_urls: {
        success: `${baseUrl}/checkout/sucesso?pedido=${orderId}`,
        failure: `${baseUrl}/checkout?erro=pagamento`,
        pending: `${baseUrl}/checkout/sucesso?pedido=${orderId}`,
      },
      auto_return: "approved",
      external_reference: orderId,
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
      statement_descriptor: "HEARTS COURO",
    },
  });

  return NextResponse.json({ init_point: result.init_point });
}
