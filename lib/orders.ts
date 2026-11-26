import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { orderConfirmedEmail, orderShippedEmail } from "./orderEmails";
import { restoreStockForItems, decrementStockForItems, reclaimStockForItems, StockItem } from "./stock";
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
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  opts: { reopen?: boolean } = {}
) {
  // Só precisa do status aqui pra comparar a transição — o include pesado
  // (itens+produto+endereço+cliente) só é buscado abaixo quando realmente
  // for usado (envio de e-mail ou devolução de estoque), não em toda troca de status.
  const current = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!current) return null;
  if (current.status === newStatus) return current;

  // Pedido cancelado (estoque já devolvido) que o Mercado Pago ainda mostra como
  // "pendente" — ex: PIX antigo, não pago, de um pedido que a pessoa refez. Não
  // reabre: senão ele voltaria a segurar a peça (e devolveria o estoque duas vezes
  // quando expirasse). Só o admin reabre um cancelado na mão.
  if (current.status === "CANCELLED" && newStatus === "PENDING" && !opts.reopen) return current;

  const willEmailShipped = newStatus === "SHIPPED" && current.status !== "SHIPPED";
  const willRestoreStock = newStatus === "CANCELLED" && current.status !== "CANCELLED";
  // Cancelado voltando a valer (pago depois, ou reaberto pelo admin): reserva o estoque de novo
  const willReclaimStock = current.status === "CANCELLED" && newStatus !== "CANCELLED";

  if (!willEmailShipped && !willRestoreStock && !willReclaimStock) {
    return prisma.order.update({ where: { id: orderId }, data: { status: newStatus } });
  }

  // Só troca se o status ainda for o que lemos: webhook + verificação podem chegar
  // juntos, e sem isso o estoque seria devolvido/reservado duas vezes.
  const changed = await prisma.order.updateMany({
    where: { id: orderId, status: current.status },
    data: { status: newStatus },
  });
  if (changed.count === 0) {
    return prisma.order.findUnique({ where: { id: orderId } });
  }
  const updated = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
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
  if (willReclaimStock) {
    await reclaimStockForItems(updated.items.filter((i): i is typeof i & { productId: string } => !!i.productId));
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

type CartLine = { productId: string; color?: string | null; size?: string | null };

const sameVariant = (a: CartLine, b: CartLine) =>
  a.productId === b.productId && (a.color || null) === (b.color || null) && (a.size || null) === (b.size || null);

/**
 * Pedidos ainda não pagos da própria pessoa que estão segurando estoque.
 * Logada: os pedidos PENDING da conta. Sem login: só o pedido cuja chave ela
 * tem (`guestOrder`), já que o e-mail digitado não prova quem é.
 */
export async function findOwnPendingOrders(who: { userId?: string; guestOrder?: { id: string } }) {
  // Só pedidos do site: venda manual do admin (PIX manual, maquininha...) nunca é mexida
  const where = who.userId
    ? { userId: who.userId, status: "PENDING", paymentMethod: "MERCADOPAGO" }
    : who.guestOrder
      ? { id: who.guestOrder.id, status: "PENDING", paymentMethod: "MERCADOPAGO" }
      : null;
  if (!where) return [];
  return prisma.order.findMany({
    where,
    select: {
      id: true,
      mpPaymentId: true,
      items: { select: { productId: true, color: true, size: true, quantity: true, skipStock: true } },
    },
  });
}

/**
 * A pessoa começou a pagar, saiu/atualizou a página e voltou pra refazer o pedido:
 * o pedido antigo dela ainda está segurando as mesmas peças, e o novo dava
 * "estoque insuficiente" — bloqueado pela reserva dela mesma. Cancela (devolvendo
 * o estoque) os pedidos não pagos dela que:
 *  - nunca tiveram tentativa de pagamento (carrinho abandonado no meio), ou
 *  - têm alguma das mesmas peças do pedido novo (ex: PIX gerado e não pago).
 * Se o PIX antigo ainda for pago depois, o webhook volta o pedido pra pago e
 * reserva o estoque de novo (ver updateOrderStatus).
 *
 * `emailUserId` (compra sem login): a conta do e-mail digitado. Como qualquer um
 * pode digitar um e-mail, por ela só cancela pedido com as MESMAS peças — que o
 * pedido novo vai reservar pra essa mesma conta de qualquer jeito.
 */
export async function releaseOwnPendingOrders(opts: {
  userId?: string;
  guestOrder?: { id: string };
  emailUserId?: string;
  cart: CartLine[];
}) {
  const overlaps = (items: CartLine[]) => items.some((i) => opts.cart.some((c) => sameVariant(i, c)));

  const own = await findOwnPendingOrders({ userId: opts.userId, guestOrder: opts.guestOrder });
  const toCancel = new Set(
    own
      .filter((o) => !o.mpPaymentId || overlaps(o.items.filter((i): i is typeof i & { productId: string } => !!i.productId)))
      .map((o) => o.id)
  );

  if (opts.emailUserId && opts.emailUserId !== opts.userId) {
    const byEmail = await findOwnPendingOrders({ userId: opts.emailUserId });
    for (const o of byEmail) {
      if (overlaps(o.items.filter((i): i is typeof i & { productId: string } => !!i.productId))) toCancel.add(o.id);
    }
  }

  for (const id of toCancel) {
    await updateOrderStatus(id, "CANCELLED");
  }
  return toCancel.size;
}
