import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = session.user.role;

  if (role === "VENDOR") {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.user.id },
      include: {
        resellers: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
            orders: {
              where: { status: { not: "CANCELLED" } },
              orderBy: { createdAt: "desc" },
              select: { id: true, total: true, commissionValue: true, createdAt: true, status: true, couponCode: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        // Vendas diretas com cupom do próprio vendedor
        orders: {
          where: { resellerId: null, status: { not: "CANCELLED" } },
          orderBy: { createdAt: "desc" },
          select: { id: true, total: true, commissionValue: true, createdAt: true, status: true },
        },
      },
    });
    return NextResponse.json({ role: "VENDOR", vendor });
  }

  if (role === "ADMIN") {
    const vendors = await prisma.vendor.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        resellers: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
            orders: {
              where: { status: { not: "CANCELLED" } },
              orderBy: { createdAt: "desc" },
              select: {
                id: true, total: true, subtotal: true, shipping: true,
                commissionValue: true, couponCode: true, couponDiscount: true,
                paymentMethod: true, status: true, createdAt: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        orders: {
          where: { resellerId: null, status: { not: "CANCELLED" } },
          orderBy: { createdAt: "desc" },
          select: {
            id: true, total: true, subtotal: true, shipping: true,
            commissionValue: true, couponCode: true, couponDiscount: true,
            paymentMethod: true, status: true, createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ role: "ADMIN", vendors });
  }

  if (role === "RESELLER") {
    const reseller = await prisma.reseller.findUnique({
      where: { userId: session.user.id },
      include: {
        vendor: { include: { user: { select: { name: true, email: true } } } },
        orders: {
          where: { status: { not: "CANCELLED" } },
          orderBy: { createdAt: "desc" },
          select: { id: true, total: true, commissionValue: true, createdAt: true, status: true },
        },
      },
    });
    return NextResponse.json({ role: "RESELLER", reseller });
  }

  return NextResponse.json({ error: "Sem acesso" }, { status: 403 });
}
