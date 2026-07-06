import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateOrderStatus } from "@/lib/orders";

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { formData, orderId } = await request.json();

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
        ...formData,
        transaction_amount: order.total,
        description: "Hearts Couro",
        external_reference: orderId,
        notification_url: `${process.env.NEXT_PUBLIC_URL}/api/mercadopago/webhook`,
        payer: {
          email: session.user.email,
          ...(formData.payer ?? {}),
        },
      },
      requestOptions: { idempotencyKey: orderId },
    });
  } catch (err) {
    console.error("Erro ao criar pagamento no Mercado Pago:", err);
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro ao processar pagamento: ${message}` }, { status: 500 });
  }

  const statusMap: Record<string, string> = {
    approved: "PAID",
    rejected: "CANCELLED",
    pending: "PENDING",
    in_process: "PENDING",
  };

  await prisma.order.update({
    where: { id: orderId },
    data: { mpPaymentId: result.id ? String(result.id) : null },
  });
  await updateOrderStatus(orderId, statusMap[result.status ?? ""] ?? "PENDING");

  return NextResponse.json({
    status: result.status,
    statusDetail: result.status_detail,
    // PIX
    qrCode: result.point_of_interaction?.transaction_data?.qr_code ?? null,
    qrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
    // Boleto
    boletoUrl: result.transaction_details?.external_resource_url ?? null,
    boletoCode: (result as { barcode?: { content?: string } }).barcode?.content ?? null,
  });
}
