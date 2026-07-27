import { prisma } from "./prisma";

export const WELCOME_COUPON_CODE = "BEMVINDO";
export const WELCOME_COUPON_DISCOUNT = 40;

export class CouponExhaustedError extends Error {
  constructor() {
    super("Este cupom atingiu o limite de usos");
  }
}

export interface CouponResolution {
  valid: boolean;
  error?: string;
  type?: "welcome" | "vendor" | "reseller" | "custom";
  vendorId?: string | null;
  resellerId?: string | null;
  couponId?: string | null;
  maxUses?: number | null;
  discountType?: "PERCENT" | "FIXED";
  discountValue?: number;
  freeShipping?: boolean;
  minPurchase?: number | null;
  ownerName?: string;
}

/**
 * Resolve um codigo de cupom pra um dos 4 tipos existentes: boas-vindas (fixo,
 * so 1a compra), vendedor/revendedor (cadastro em Vendor/Reseller, sempre
 * percentual) ou cupom personalizado criado pelo admin (tabela Coupon, aceita
 * percentual ou valor fixo). Usado tanto na validacao do checkout quanto na
 * criacao do pedido (pra nunca confiar no desconto calculado no navegador).
 */
export async function resolveCoupon(code: string, userId: string | null): Promise<CouponResolution> {
  const normalized = code.toUpperCase().trim();

  if (normalized === WELCOME_COUPON_CODE) {
    if (!userId) return { valid: false, error: "Faça login para usar este cupom." };
    const orderCount = await prisma.order.count({
      where: { userId, status: { notIn: ["PENDING", "CANCELLED"] } },
    });
    if (orderCount > 0) return { valid: false, error: "Este cupom é válido apenas na primeira compra." };
    return {
      valid: true,
      type: "welcome",
      vendorId: null,
      resellerId: null,
      couponId: null,
      discountType: "PERCENT",
      discountValue: WELCOME_COUPON_DISCOUNT,
      freeShipping: true,
      minPurchase: null,
      ownerName: "Hearts Couro",
    };
  }

  const vendor = await prisma.vendor.findUnique({
    where: { couponCode: normalized },
    include: { user: { select: { name: true } } },
  });
  if (vendor && vendor.active && vendor.discount !== null) {
    return {
      valid: true,
      type: "vendor",
      vendorId: vendor.id,
      resellerId: null,
      couponId: null,
      discountType: "PERCENT",
      discountValue: vendor.discount,
      freeShipping: false,
      minPurchase: null,
      ownerName: vendor.user.name,
    };
  }

  const resellerCoupon = await prisma.resellerCoupon.findUnique({
    where: { code: normalized },
    include: {
      reseller: { include: { user: { select: { name: true } }, vendor: { select: { id: true } } } },
    },
  });
  if (resellerCoupon && resellerCoupon.active && resellerCoupon.reseller.active) {
    return {
      valid: true,
      type: "reseller",
      vendorId: resellerCoupon.reseller.vendor.id,
      resellerId: resellerCoupon.reseller.id,
      couponId: null,
      discountType: "PERCENT",
      discountValue: resellerCoupon.discount,
      freeShipping: false,
      minPurchase: null,
      ownerName: resellerCoupon.reseller.user.name,
    };
  }

  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });
  if (coupon) {
    if (!coupon.active) return { valid: false, error: "Cupom inativo" };
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, error: "Cupom expirado" };
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return { valid: false, error: "Cupom esgotado" };
    return {
      valid: true,
      type: "custom",
      vendorId: null,
      resellerId: null,
      couponId: coupon.id,
      maxUses: coupon.maxUses,
      discountType: coupon.discountType as "PERCENT" | "FIXED",
      discountValue: coupon.discountValue,
      freeShipping: coupon.freeShipping,
      minPurchase: coupon.minPurchase,
      ownerName: "Hearts Couro",
    };
  }

  return { valid: false, error: "Cupom inválido ou inativo" };
}

export function computeDiscountAmount(discountType: "PERCENT" | "FIXED", discountValue: number, eligibleSubtotal: number): number {
  if (discountType === "FIXED") return Math.min(discountValue, eligibleSubtotal);
  return (eligibleSubtotal * discountValue) / 100;
}
