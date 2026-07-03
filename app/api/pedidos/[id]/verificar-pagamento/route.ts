import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateOrderStatus } from "@/lib/orders";

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

const STATUS_MAP: Record<string, string> = {
  approved: "PAID",
  rejected: "CANCELLED",
  cancelled: "CANCELLED",
  refunded: "CANCELLED",
  in_process: "PENDING",
  pending: "PENDING",
};

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  if (session.user.role !== "ADMIN" && order.userId !== session.user.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  if (!order.mpPaymentId) {
    return NextResponse.json({ status: order.status, checked: false });
  }

  try {
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: order.mpPaymentId });
    const newStatus = STATUS_MAP[paymentData.status ?? ""] ?? order.status;
    await updateOrderStatus(id, newStatus);

    return NextResponse.json({ status: newStatus, checked: true });
  } catch (err) {
    console.error("Erro ao verificar pagamento no Mercado Pago:", err);
    return NextResponse.json({ status: order.status, checked: false, error: "Erro ao consultar o Mercado Pago" }, { status: 500 });
  }
}
