import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WELCOME_COUPON_CODE, WELCOME_COUPON_DISCOUNT } from "@/app/api/cupom/route";
import { decrementStockForItems, InsufficientStockError } from "@/lib/stock";

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
  const { address, paymentMethod, items, subtotal, shipping, couponCode, shippingServiceId, shippingService, shippingCarrier } = body;

  // Primeira compra
  const orderCount = await prisma.order.count({
    where: { userId: session.user.id, status: { notIn: ["PENDING", "CANCELLED"] } },
  });
  const isFirstPurchase = orderCount === 0;

  // Cupom (boas-vindas ou vendedor/revendedor)
  let couponDiscount = 0;
  let freeShipping = false;
  let vendorId: string | null = null;
  let resellerId: string | null = null;
  let commissionValue: number | null = null;
  let appliedCoupon: string | null = null;

  if (couponCode) {
    const code = couponCode.toUpperCase().trim();

    if (code === WELCOME_COUPON_CODE && isFirstPurchase) {
      couponDiscount = WELCOME_COUPON_DISCOUNT;
      freeShipping = true;
      appliedCoupon = code;
    } else {
      const vendor = await prisma.vendor.findUnique({ where: { couponCode: code } });
      if (vendor && vendor.active && vendor.discount !== null) {
        couponDiscount = vendor.discount;
        vendorId = vendor.id;
        appliedCoupon = code;
        // Venda direta do vendedor: comissão fixa de 5%
        commissionValue = subtotal * 0.05;
      } else {
        const reseller = await prisma.reseller.findUnique({
          where: { couponCode: code },
          include: { vendor: true },
        });
        if (reseller && reseller.active && reseller.discount !== null) {
          couponDiscount = reseller.discount;
          resellerId = reseller.id;
          vendorId = reseller.vendor.id;
          appliedCoupon = code;
          // Venda de revendedor cadastrado: vendedor ganha comissão fixa de 2,5%
          commissionValue = subtotal * 0.025;
        }
      }
    }
  }

  // Cálculo do total
  const couponAmount = subtotal * couponDiscount / 100;
  const finalShipping = freeShipping ? 0 : shipping;
  const finalTotal = subtotal - couponAmount + finalShipping;

  try {
    const order = await prisma.$transaction(async (tx) => {
      await decrementStockForItems(tx, items);

      const savedAddress = await tx.address.create({
        data: { userId: session.user.id, ...address, isDefault: false },
      });

      return tx.order.create({
        data: {
          userId: session.user.id,
          addressId: savedAddress.id,
          paymentMethod,
          status: "PENDING",
          subtotal,
          shipping: finalShipping,
          total: finalTotal,
          couponCode: appliedCoupon,
          couponDiscount: couponDiscount > 0 ? couponDiscount : null,
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
    throw err;
  }
}
