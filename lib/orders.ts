import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { orderConfirmedEmail, orderShippedEmail } from "./orderEmails";
import { restoreStockForItems, decrementStockForItems, StockItem } from "./stock";
import { hasRealEmail } from "./utils";

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
 *
 * O e-mail de "pagamento confirmado" NÃO é disparado automaticamente aqui quando o
 * status vira PAID — isso acontece via webhook do Mercado Pago sem revisão humana.
 * Ele só é enviado quando o admin aceita o pedido manualmente, ver `confirmOrder`.
 */
export async function updateOrderStatus(orderId: string, newStatus: string) {
  // Só precisa do status aqui pra comparar a transição — o include pesado
  // (itens+produto+endereço+cliente) só é buscado abaixo quando realmente
  // for usado (envio de e-mail ou devolução de estoque), não em toda troca de status.
  const current = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!current) return null;
  if (current.status === newStatus) return current;

  const willEmailShipped = newStatus === "SHIPPED" && current.status !== "SHIPPED";
  const willRestoreStock = newStatus === "CANCELLED" && current.status !== "CANCELLED";

  if (!willEmailShipped && !willRestoreStock) {
    return prisma.order.update({ where: { id: orderId }, data: { status: newStatus } });
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
    include: ORDER_EMAIL_INCLUDE,
  });

  if (willEmailShipped && hasRealEmail(updated.user.email)) {
    // Não bloqueia a resposta esperando o Gmail — envia em segundo plano
    // (sendEmail já trata os próprios erros, não precisa de .catch aqui).
    const { subject, html } = orderShippedEmail(updated);
    sendEmail({ to: updated.user.email, subject, html });
  }

  // Pedido cancelado/recusado devolve o estoque que foi descontado na criação
  // (itens avulsos, sem produto do catalogo, nunca tiveram estoque descontado).
  if (willRestoreStock) {
    await restoreStockForItems(updated.items.filter((i): i is typeof i & { productId: string } => !!i.productId));
  }

  return updated;
}

/**
 * Quando o cliente tenta pagar de novo (outro cartão, novo PIX...) um pedido que já
 * foi cancelado (pagamento recusado), o estoque desse pedido já tinha sido devolvido —
 * sem reservar de novo aqui, o pagamento podia ser aprovado sem nenhum estoque
 * reservado, permitindo vender a mesma peça duas vezes. Lança InsufficientStockError
 * se não tiver mais estoque disponível (ex: alguém comprou a última unidade nesse meio-tempo).
 */
export async function reserveStockForRetry(order: {
  id: string;
  status: string;
  items: (Omit<StockItem, "productId"> & { productId: string | null })[];
}) {
  if (order.status !== "CANCELLED") return;

  const items = order.items.filter((i): i is typeof i & { productId: string } => !!i.productId);

  await prisma.$transaction(async (tx) => {
    await decrementStockForItems(tx, items);
    await tx.order.update({ where: { id: order.id }, data: { status: "PENDING" } });
  });
}

/**
 * Aceite manual do pedido pelo admin: dispara o e-mail de "pagamento confirmado"
 * pro cliente (com o botão de acompanhar pedido). Só pode ser feito uma vez por
 * pedido (protegido por `confirmedAt`) e só faz sentido pra pedidos já pagos.
 */
export async function confirmOrder(orderId: string) {
  const current = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_EMAIL_INCLUDE });
  if (!current) return { ok: false as const, error: "Pedido não encontrado" };
  if (current.status === "PENDING" || current.status === "CANCELLED") {
    return { ok: false as const, error: "Pedido ainda não está pago" };
  }
  if (current.confirmedAt) {
    return { ok: false as const, error: "Pedido já foi confirmado" };
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { confirmedAt: new Date() },
    include: ORDER_EMAIL_INCLUDE,
  });

  // Não bloqueia a resposta esperando o Gmail — envia em segundo plano.
  if (hasRealEmail(updated.user.email)) {
    const { subject, html } = orderConfirmedEmail(updated);
    sendEmail({ to: updated.user.email, subject, html });
  }

  return { ok: true as const, order: updated };
}
