import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateOrderStatus } from "@/lib/orders";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, address: true, user: true },
  });

  if (!order) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (session.user.role !== "ADMIN" && order.userId !== session.user.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  return NextResponse.json(order);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { status, ...rest } = await request.json();

  const afterStatus = status ? await updateOrderStatus(id, status) : null;

  const order = Object.keys(rest).length > 0
    ? await prisma.order.update({ where: { id }, data: rest })
    : afterStatus ?? (await prisma.order.findUnique({ where: { id } }));

  return NextResponse.json(order);
}
