import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveCoupon, computeDiscountAmount, CouponExhaustedError } from "@/lib/coupons";
import { decrementStockForItems, InsufficientStockError } from "@/lib/stock";
import { isCupomElegivel, formatCurrency } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const where = session.user.role === "ADMIN" ? {} : { userId: session.user.id };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } }, address: true, user: true },
  });

  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { address, addressId, paymentMethod, items, subtotal, shipping, couponCode, shippingServiceId, shippingService, shippingCarrier } = body;

  // Cupom (boas-vindas, vendedor/revendedor ou cupom personalizado do admin) —
  // sempre resolvido de novo aqui, nunca confiando no valor calculado no navegador.
  let couponDiscount: number | null = null; // percentual (so quando discountType === PERCENT), mantido pra compatibilidade com a visao do vendedor/revendedor
  let couponDiscountAmount = 0; // valor real descontado em R$, sempre preenchido quando ha cupom valido
  let freeShipping = false;
  let vendorId: string | null = null;
  let resellerId: string | null = null;
  let commissionValue: number | null = null;
  let appliedCoupon: string | null = null;
  let couponId: string | null = null;
  let couponMaxUses: number | null = null;

  if (couponCode) {
    const result = await resolveCoupon(couponCode, session.user.id);
    if (!result.valid) {
      return NextResponse.json({ error: result.error || "Cupom inválido" }, { status: 400 });
    }
    if (result.minPurchase && subtotal < result.minPurchase) {
      return NextResponse.json({ error: `Este cupom exige compra mínima de ${formatCurrency(result.minPurchase)}` }, { status: 400 });
    }

    appliedCoupon = couponCode.toUpperCase().trim();
    freeShipping = !!result.freeShipping;
    vendorId = result.vendorId ?? null;
    resellerId = result.resellerId ?? null;
    couponId = result.couponId ?? null;
    couponMaxUses = result.maxUses ?? null;
    if (result.discountType === "PERCENT") couponDiscount = result.discountValue ?? null;
    if (resellerId) commissionValue = subtotal * 0.025;
    else if (vendorId) commissionValue = subtotal * 0.05;

    // Cupom só se aplica sobre o valor dos itens elegíveis
    const products = await prisma.product.findMany({
      where: { id: { in: items.map((item: { productId: string }) => item.productId) } },
      select: { id: true, categories: true, permiteCupom: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));
    const eligibleSubtotal = items.reduce((sum: number, item: { productId: string; price: number; quantity: number }) => {
      const product = productMap.get(item.productId);
      const elegivel = product ? isCupomElegivel(product.categories, product.permiteCupom) : true;
      return elegivel ? sum + item.price * item.quantity : sum;
    }, 0);

    couponDiscountAmount = computeDiscountAmount(result.discountType!, result.discountValue!, eligibleSubtotal);
  }

  const finalShipping = freeShipping ? 0 : shipping;
  const finalTotal = subtotal - couponDiscountAmount + finalShipping;

  try {
    const order = await prisma.$transaction(async (tx) => {
      await decrementStockForItems(tx, items);

      // Reserva o uso do cupom de forma atomica (evita duas compras simultaneas
      // furarem o limite de usos, igual ao desconto de estoque).
      if (couponId) {
        const res = couponMaxUses !== null
          ? await tx.coupon.updateMany({ where: { id: couponId, active: true, usedCount: { lt: couponMaxUses } }, data: { usedCount: { increment: 1 } } })
          : await tx.coupon.updateMany({ where: { id: couponId, active: true }, data: { usedCount: { increment: 1 } } });
        if (res.count === 0) throw new CouponExhaustedError();
      }

      // Endereço: reaproveita um já salvo em vez de criar uma linha nova a cada pedido.
      // Retirada na loja tem endereço fixo e nunca mexe no endereço padrão do cliente.
      let finalAddressId: string;
      if (address?.name === "Retirada na loja") {
        const pickupAddress = await tx.address.findFirst({
          where: { userId: session.user.id, name: "Retirada na loja" },
        });
        finalAddressId = pickupAddress
          ? pickupAddress.id
          : (await tx.address.create({ data: { userId: session.user.id, ...address, isDefault: false } })).id;
      } else {
        const reused = addressId
          ? await tx.address.findFirst({ where: { id: addressId, userId: session.user.id } })
          : null;
        if (reused) {
          finalAddressId = reused.id;
          if (!reused.isDefault) {
            await tx.address.updateMany({ where: { userId: session.user.id, isDefault: true }, data: { isDefault: false } });
            await tx.address.update({ where: { id: reused.id }, data: { isDefault: true } });
          }
        } else {
          await tx.address.updateMany({ where: { userId: session.user.id, isDefault: true }, data: { isDefault: false } });
          const created = await tx.address.create({ data: { userId: session.user.id, ...address, isDefault: true } });
          finalAddressId = created.id;
        }
      }

      return tx.order.create({
        data: {
          userId: session.user.id,
          addressId: finalAddressId,
          paymentMethod,
          status: "PENDING",
          subtotal,
          shipping: finalShipping,
          total: finalTotal,
          couponCode: appliedCoupon,
          couponDiscount,
          couponDiscountAmount: appliedCoupon ? couponDiscountAmount : null,
          vendorId,
          resellerId,
          commissionValue,
          shippingServiceId: shippingServiceId ?? null,
          shippingService: shippingService ?? null,
          shippingCarrier: shippingCarrier ?? null,
          items: {
            create: items.map((item: { productId: string; quantity: number; price: number; color?: string; size?: string }) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              color: item.color,
              size: item.size,
            })),
          },
        },
        include: { items: true, address: true },
      });
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof CouponExhaustedError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
