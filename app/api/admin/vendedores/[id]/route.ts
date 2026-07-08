import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WELCOME_COUPON_CODE } from "@/app/api/cupom/route";

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

  let code: string | undefined;
  if (body.couponCode !== undefined) {
    code = body.couponCode.toUpperCase().trim();
    if (code === WELCOME_COUPON_CODE) {
      return NextResponse.json({ error: "Esse código é reservado para o cupom de boas-vindas" }, { status: 409 });
    }
    const dup = await prisma.vendor.findFirst({ where: { couponCode: code, NOT: { id } } });
    if (dup) return NextResponse.json({ error: "Esse cupom já está em uso" }, { status: 409 });
    const dupR = await prisma.reseller.findUnique({ where: { couponCode: code } });
    if (dupR) return NextResponse.json({ error: "Esse cupom já está em uso" }, { status: 409 });
  }

  const vendor = await prisma.vendor.update({
    where: { id },
    data: {
      ...(code !== undefined && { couponCode: code }),
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

  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: { user: true, resellers: true, _count: { select: { orders: true } } },
  });
  if (!vendor) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  if (vendor.resellers.length > 0) {
    return NextResponse.json(
      { error: "Não é possível remover: esse vendedor tem revendedores cadastrados. Remova os revendedores primeiro ou apenas desative o vendedor." },
      { status: 409 }
    );
  }
  if (vendor._count.orders > 0) {
    return NextResponse.json(
      { error: "Não é possível remover: esse vendedor já tem pedidos vinculados (isso apagaria o histórico de vendas). Desative-o em vez de remover." },
      { status: 409 }
    );
  }

  await prisma.user.delete({ where: { id: vendor.userId } });

  return NextResponse.json({ ok: true });
}
