"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ActiveCoupon {
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  freeShipping: boolean;
  minPurchase: number | null;
  ownerName: string;
}

interface CouponStore {
  coupon: ActiveCoupon | null;
  setCoupon: (coupon: ActiveCoupon) => void;
  clearCoupon: () => void;
}

/**
 * Cupom que a cliente ativou no menu (ou pelo link ?cupom=). Fica salvo no
 * navegador e faz a vitrine mostrar os precos ja descontados; carrinho e
 * checkout aplicam ele sozinhos. O desconto de verdade continua sendo
 * recalculado no servidor na criacao do pedido.
 */
export const useCouponStore = create<CouponStore>()(
  persist(
    (set) => ({
      coupon: null,
      setCoupon: (coupon) => set({ coupon }),
      clearCoupon: () => set({ coupon: null }),
    }),
    { name: "hearts-cupom-ativo" }
  )
);

/** Monta o cupom ativo a partir da resposta de /api/cupom. */
export function toActiveCoupon(code: string, data: {
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  freeShipping?: boolean;
  minPurchase?: number | null;
  ownerName?: string;
}): ActiveCoupon {
  return {
    code: code.trim().toUpperCase(),
    discountType: data.discountType,
    discountValue: data.discountValue,
    freeShipping: !!data.freeShipping,
    minPurchase: data.minPurchase ?? null,
    ownerName: data.ownerName ?? "",
  };
}

/**
 * Preco unitario com o cupom, ou null quando o cupom nao muda o preco da peca:
 * produto fora de cupom, cupom de valor fixo (desconta do pedido, nao de cada
 * item) ou cupom com compra minima (so vale se o carrinho atingir o valor).
 */
export function couponUnitPrice(coupon: ActiveCoupon | null, price: number, eligible: boolean): number | null {
  if (!coupon || !eligible) return null;
  if (coupon.discountType !== "PERCENT" || coupon.minPurchase || coupon.discountValue <= 0) return null;
  return Math.round(price * (100 - coupon.discountValue)) / 100;
}

/** Texto curto do que o cupom da: "10% OFF", "R$ 20,00 OFF"... */
export function describeCoupon(coupon: ActiveCoupon, formatCurrency: (v: number) => string): string {
  const parts: string[] = [];
  if (coupon.discountValue > 0) {
    parts.push(coupon.discountType === "FIXED" ? `${formatCurrency(coupon.discountValue)} OFF` : `${coupon.discountValue}% OFF`);
  }
  if (coupon.freeShipping) parts.push("frete grátis");
  let text = parts.join(" + ") || "Cupom ativo";
  if (coupon.minPurchase) text += ` em compras acima de ${formatCurrency(coupon.minPurchase)}`;
  else if (coupon.discountType === "FIXED" && coupon.discountValue > 0) text += " no seu pedido";
  return text;
}
