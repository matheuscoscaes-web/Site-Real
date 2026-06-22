import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { orders: { include: { items: { include: { product: true } } } }, addresses: true },
  });

  if (!user) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  const { password: _pw1, ...safe } = user;
  return NextResponse.json(safe);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const user = await prisma.user.update({ where: { id }, data: body });
  const { password: _pw2, ...safe } = user;
  return NextResponse.json(safe);
}
