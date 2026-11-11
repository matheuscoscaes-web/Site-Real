import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ownsOrder } from "@/lib/guestOrder";
import { reserveStockForRetry } from "@/lib/orders";
import { InsufficientStockError } from "@/lib/stock";
import { fullOrderTotal } from "@/lib/pixDiscount";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const { orderId, orderToken } = await request.json();

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, user: { select: { email: true } } } });
  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  if (!ownsOrder(order, session?.user.id, orderToken)) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  if (order.status !== "PENDING" && order.status !== "CANCELLED") {
    return NextResponse.json({ error: "Pedido não está mais pendente de pagamento" }, { status: 409 });
  }

  try {
    await reserveStockForRetry(order);
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json({ error: `${err.message}. Volte ao carrinho e ajuste o pedido antes de tentar pagar de novo.` }, { status: 409 });
    }
    throw err;
  }

  const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
  });

  const preference = new Preference(client);

  const baseUrl = process.env.NEXT_PUBLIC_URL!;

  const result = await preference.create({
    body: {
      items: [{
        id: orderId,
        title: "Hearts Couro",
        quantity: 1,
        unit_price: fullOrderTotal(order),
        currency_id: "BRL",
      }],
      payer: { email: order.user.email },
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
