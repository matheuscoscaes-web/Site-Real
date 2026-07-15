import { prisma } from "./prisma";
import { updateOrderStatus } from "./orders";

const SWEEP_INTERVAL_MS = 15 * 60 * 1000;

// Pedido criado mas o cliente nunca chegou a tentar pagar (sem mpPaymentId) —
// carrinho abandonado no passo de endereço/frete. Seguro expirar rápido.
const NO_ATTEMPT_EXPIRY_MS = 2 * 60 * 60 * 1000;

// Pedido com tentativa de pagamento (mpPaymentId setado) pode ser um boleto
// ou PIX ainda não compensado — boleto pode levar alguns dias úteis pra cair.
// Só expira depois de um prazo bem folgado pra não cancelar pagamento em trânsito.
const WITH_ATTEMPT_EXPIRY_MS = 4 * 24 * 60 * 60 * 1000;

/**
 * O estoque é descontado na criação do pedido (antes do pagamento ser
 * confirmado) e só é devolvido quando o pedido vira CANCELLED. Sem essa
 * varredura, pedido PENDING abandonado prende estoque pra sempre e o produto
 * fica com falso "esgotado" pra outros clientes.
 */
async function expireStaleOrders() {
  const now = Date.now();
  const pending = await prisma.order.findMany({
    where: { status: "PENDING" },
    select: { id: true, createdAt: true, mpPaymentId: true },
  });

  for (const order of pending) {
    const age = now - order.createdAt.getTime();
    const limit = order.mpPaymentId ? WITH_ATTEMPT_EXPIRY_MS : NO_ATTEMPT_EXPIRY_MS;
    if (age <= limit) continue;
    try {
      await updateOrderStatus(order.id, "CANCELLED");
      console.log(`Pedido PENDING ${order.id} expirado automaticamente (estoque devolvido).`);
    } catch (err) {
      console.error(`Erro ao expirar pedido PENDING ${order.id}:`, err);
    }
  }
}

export function startOrderExpirySweep() {
  expireStaleOrders().catch((err) => console.error("Erro na varredura inicial de pedidos expirados:", err));
  const timer = setInterval(() => {
    expireStaleOrders().catch((err) => console.error("Erro na varredura de pedidos expirados:", err));
  }, SWEEP_INTERVAL_MS);
  timer.unref?.();
}
