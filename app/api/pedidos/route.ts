import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const { address, paymentMethod, items, subtotal, shipping, couponCode } = body;

  // Primeira compra
  const orderCount = await prisma.order.count({
    where: { userId: session.user.id, status: { not: "CANCELLED" } },
  });
  const isFirstPurchase = orderCount === 0;

  // Cupom de vendedor/revendedor
  let couponDiscount = 0;
  let vendorId: string | null = null;
  let resellerId: string | null = null;
  let commissionValue: number | null = null;
  let appliedCoupon: string | null = null;

  if (couponCode && !isFirstPurchase) {
    const code = couponCode.toUpperCase().trim();

    const vendor = await prisma.vendor.findUnique({ where: { couponCode: code } });
    if (vendor && vendor.active && vendor.discount !== null) {
      couponDiscount = vendor.discount;
      vendorId = vendor.id;
      appliedCoupon = code;
      // Venda direta do vendedor: comissão = (50 - desconto)%
      commissionValue = subtotal * (50 - vendor.discount) / 100;
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
        // Venda de revendedor: vendedor ganha 5% fixo do valor da loja
        commissionValue = subtotal * 0.05;
      }
    }
  }

  // Cálculo do total
  const firstDiscount = isFirstPurchase ? subtotal * 0.4 : 0;
  const couponAmount = subtotal * couponDiscount / 100;
  const finalShipping = isFirstPurchase ? 0 : shipping;
  const finalTotal = subtotal - firstDiscount - couponAmount + finalShipping;

  // Cria endereço
  const savedAddress = await prisma.address.create({
    data: { userId: session.user.id, ...address, isDefault: false },
  });

  const order = await prisma.order.create({
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

  return NextResponse.json(order, { status: 201 });
}
