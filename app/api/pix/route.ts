import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { orderId, cpf } = await request.json();

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  if (order.userId !== session.user.id) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  if (order.status !== "PENDING" && order.status !== "CANCELLED") {
    return NextResponse.json({ error: "Pedido não está mais pendente de pagamento" }, { status: 409 });
  }

  const payment = new Payment(client);

  let result;
  try {
    result = await payment.create({
      body: {
        payment_method_id: "pix",
        transaction_amount: order.total,
        description: "Hearts Couro",
        external_reference: orderId,
        notification_url: `${process.env.NEXT_PUBLIC_URL}/api/mercadopago/webhook`,
        payer: {
          email: session.user.email,
          ...(cpf ? { identification: { type: "CPF", number: cpf } } : {}),
        },
      },
      requestOptions: { idempotencyKey: `pix-${orderId}` },
    });
  } catch (err) {
    console.error("Erro ao criar pagamento PIX no Mercado Pago:", err);
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro ao gerar PIX: ${message}` }, { status: 500 });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "PENDING", mpPaymentId: result.id ? String(result.id) : null },
  });

  const qrCode = result.point_of_interaction?.transaction_data?.qr_code ?? null;
  const qrBase64 = result.point_of_interaction?.transaction_data?.qr_code_base64 ?? null;

  if (!qrCode) {
    console.error("Mercado Pago não retornou QR Code para o pagamento PIX:", JSON.stringify(result));
    return NextResponse.json({ error: "Erro ao gerar PIX" }, { status: 500 });
  }

  return NextResponse.json({ qrCode, qrBase64 });
}
