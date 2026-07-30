import { NextResponse } from "next/server";
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

/**
 * Varre pedidos em PENDING/CANCELLED com pagamento do Mercado Pago vinculado e
 * confere o status real no gateway. Existe porque o webhook pode falhar ou
 * atrasar e o pedido fica preso como pendente/cancelado mesmo já tendo sido
 * pago de fato — feito sob demanda pelo admin, não em cron, pra não estourar
 * o rate limit do Mercado Pago.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { status: { in: ["PENDING", "CANCELLED"] } },
    select: { id: true, status: true, mpPaymentId: true },
  });

  const payment = new Payment(client);
  let recovered = 0;
  let checked = 0;
  // Pedidos sem mpPaymentId (venda manual, PIX avulso etc.) não têm como ser
  // conferidos no Mercado Pago — entram aqui junto com falhas de consulta,
  // pra o admin saber que precisa olhar esses na mão.
  let naoConferidos = 0;

  for (const order of orders) {
    if (!order.mpPaymentId) {
      naoConferidos++;
      continue;
    }
    try {
      const paymentData = await payment.get({ id: order.mpPaymentId });
      checked++;
      const newStatus = STATUS_MAP[paymentData.status ?? ""] ?? order.status;
      if (newStatus !== order.status) {
        await updateOrderStatus(order.id, newStatus);
        if (newStatus === "PAID") recovered++;
      }
    } catch (err) {
      naoConferidos++;
      console.error(`Erro ao verificar pagamento do pedido ${order.id}:`, err);
    }
  }

  return NextResponse.json({ total: orders.length, checked, recovered, naoConferidos });
}
