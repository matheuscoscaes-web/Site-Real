// Desconto do PIX: 5% sobre o valor dos produtos (já com o cupom), sem contar o frete — mesma
// conta que a página do produto mostra ("5% de desconto no PIX"). O pedido nasce com o total
// cheio; quando a cliente gera o PIX, o total do pedido passa a ser o do PIX, e se ela trocar
// pra cartão/boleto volta ao cheio. As duas contas saem só dos campos do pedido, então dá pra
// ir e voltar quantas vezes quiser.
export const PIX_DISCOUNT_PERCENT = 5;

type OrderAmounts = { subtotal: number; shipping: number; couponDiscountAmount?: number | null };

const round2 = (n: number) => Math.round(n * 100) / 100;

export function pixDiscountAmount(productsValue: number): number {
  return round2(Math.max(0, productsValue) * (PIX_DISCOUNT_PERCENT / 100));
}

export function fullOrderTotal(order: OrderAmounts): number {
  return round2(order.subtotal - (order.couponDiscountAmount ?? 0) + order.shipping);
}

export function pixOrderTotal(order: OrderAmounts): number {
  return round2(fullOrderTotal(order) - pixDiscountAmount(order.subtotal - (order.couponDiscountAmount ?? 0)));
}
