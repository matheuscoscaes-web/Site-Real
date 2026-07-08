import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { orderConfirmedEmail, orderShippedEmail } from "./orderEmails";
import { restoreStockForItems } from "./stock";

const ORDER_EMAIL_INCLUDE = {
  items: { include: { product: true } },
  address: true,
  user: true,
} as const;

/**
 * Atualiza o status de um pedido e dispara o e-mail correspondente apenas na
 * transição de status (evita reenviar e-mail se o mesmo status for setado de novo,
 * o que acontece com frequência aqui: webhook + polling + verificação manual
 * podem todos tentar marcar o mesmo pedido como PAID).
 */
export async function updateOrderStatus(orderId: string, newStatus: string) {
  const current = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_EMAIL_INCLUDE });
  if (!current) return null;
  if (current.status === newStatus) return current;

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
    include: ORDER_EMAIL_INCLUDE,
  });

  if (newStatus === "PAID" && current.status !== "PAID") {
    const { subject, html } = orderConfirmedEmail(updated);
    await sendEmail({ to: updated.user.email, subject, html });
  }

  if (newStatus === "SHIPPED" && current.status !== "SHIPPED") {
    const { subject, html } = orderShippedEmail(updated);
    await sendEmail({ to: updated.user.email, subject, html });
  }

  // Pedido cancelado/recusado devolve o estoque que foi descontado na criação
  if (newStatus === "CANCELLED" && current.status !== "CANCELLED") {
    await restoreStockForItems(updated.items);
  }

  return updated;
}
