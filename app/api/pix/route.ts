import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ownsOrder } from "@/lib/guestOrder";
import { reserveStockForRetry } from "@/lib/orders";
import { InsufficientStockError } from "@/lib/stock";
import { pixOrderTotal } from "@/lib/pixDiscount";

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const { orderId, cpf, orderToken } = await request.json();

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

  const payment = new Payment(client);
  const pixTotal = pixOrderTotal(order);

  let result;
  try {
    result = await payment.create({
      body: {
        payment_method_id: "pix",
        transaction_amount: pixTotal,
        description: "Hearts Couro",
        external_reference: orderId,
        notification_url: `${process.env.NEXT_PUBLIC_URL}/api/mercadopago/webhook`,
        payer: {
          email: order.user.email,
          ...(cpf ? { identification: { type: "CPF", number: cpf } } : {}),
        },
      },
      // Chave com o valor: o mesmo pedido pode ter tido um PIX gerado antes com outro valor.
      requestOptions: { idempotencyKey: `pix-${orderId}-${pixTotal.toFixed(2)}` },
    });
  } catch (err) {
    console.error("Erro ao criar pagamento PIX no Mercado Pago:", err);
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro ao gerar PIX: ${message}` }, { status: 500 });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "PENDING", mpPaymentId: result.id ? String(result.id) : null, total: pixTotal },
  });

  const qrCode = result.point_of_interaction?.transaction_data?.qr_code ?? null;
  const qrBase64 = result.point_of_interaction?.transaction_data?.qr_code_base64 ?? null;

  if (!qrCode) {
    console.error("Mercado Pago não retornou QR Code para o pagamento PIX:", JSON.stringify(result));
    return NextResponse.json({ error: "Erro ao gerar PIX" }, { status: 500 });
  }

  return NextResponse.json({ qrCode, qrBase64, total: pixTotal });
}
