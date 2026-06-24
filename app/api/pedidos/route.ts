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
  const { address, paymentMethod, items, subtotal, shipping } = body;

  // Verifica se é a primeira compra (server-side, não confia no cliente)
  const orderCount = await prisma.order.count({
    where: { userId: session.user.id, status: { not: "CANCELLED" } },
  });
  const isFirstPurchase = orderCount === 0;
  const finalShipping = isFirstPurchase ? 0 : shipping;
  const discount = isFirstPurchase ? subtotal * 0.4 : 0;
  const finalTotal = subtotal - discount + finalShipping;

  // Cria ou reutiliza endereço
  const savedAddress = await prisma.address.create({
    data: {
      userId: session.user.id,
      ...address,
      isDefault: false,
    },
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

  // Simula pagamento confirmado automaticamente para PIX e cartão
  if (paymentMethod !== "BOLETO") {
    setTimeout(async () => {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "PAID" },
      });
    }, 2000);
  }

  return NextResponse.json(order, { status: 201 });
}
