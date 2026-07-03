import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { updateOrderStatus } from "@/lib/orders";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

const STATUS_MAP: Record<string, string> = {
  approved: "PAID",
  rejected: "CANCELLED",
  cancelled: "CANCELLED",
  refunded: "CANCELLED",
  in_process: "PENDING",
  pending: "PENDING",
};

async function handleNotification(request: NextRequest, body: Record<string, unknown>) {
  const url = new URL(request.url);

  // Mercado Pago manda ora no corpo (JSON), ora como query string (formato IPN antigo)
  const type = (body as { type?: string }).type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const dataId = (body as { data?: { id?: string } }).data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id");

  if (type !== "payment" || !dataId) {
    console.log("Webhook Mercado Pago ignorado (não é notificação de pagamento):", { type, dataId });
    return NextResponse.json({ ok: true });
  }

  const payment = new Payment(client);
  const paymentData = await payment.get({ id: String(dataId) });

  const orderId = paymentData.external_reference;
  if (!orderId) {
    console.error("Webhook Mercado Pago sem external_reference no pagamento:", dataId);
    return NextResponse.json({ ok: true });
  }

  const newStatus = STATUS_MAP[paymentData.status ?? ""] ?? "PENDING";

  await prisma.order.update({
    where: { id: orderId },
    data: { mpPaymentId: String(dataId) },
  });
  await updateOrderStatus(orderId, newStatus);

  console.log(`Webhook Mercado Pago: pedido ${orderId} atualizado para ${newStatus} (pagamento ${dataId})`);

  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}) as Record<string, unknown>);
    return await handleNotification(request, body);
  } catch (err) {
    console.error("Erro ao processar webhook do Mercado Pago (POST):", err);
    return NextResponse.json({ ok: true });
  }
}

export async function GET(request: NextRequest) {
  try {
    return await handleNotification(request, {});
  } catch (err) {
    console.error("Erro ao processar webhook do Mercado Pago (GET):", err);
    return NextResponse.json({ ok: true });
  }
}
