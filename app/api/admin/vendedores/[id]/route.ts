import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  if (body.discount !== undefined) {
    const d = Number(body.discount);
    if (d < 0 || d > 50) {
      return NextResponse.json({ error: "Desconto deve ser entre 0% e 50%" }, { status: 400 });
    }
  }

  const vendor = await prisma.vendor.update({
    where: { id },
    data: {
      ...(body.couponCode !== undefined && { couponCode: body.couponCode.toUpperCase() }),
      ...(body.discount !== undefined && { discount: Number(body.discount) }),
      ...(body.active !== undefined && { active: body.active }),
    },
  });

  return NextResponse.json(vendor);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const vendor = await prisma.vendor.findUnique({ where: { id }, include: { user: true } });
  if (!vendor) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.user.delete({ where: { id: vendor.userId } });

  return NextResponse.json({ ok: true });
}
