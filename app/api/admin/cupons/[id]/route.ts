import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  if (typeof body.active === "boolean" && Object.keys(body).length === 1) {
    const coupon = await prisma.coupon.update({ where: { id }, data: { active: body.active } });
    return NextResponse.json(coupon);
  }

  const { discountType, discountValue, freeShipping, minPurchase, maxUses, expiresAt, active } = body;

  const data: Record<string, unknown> = {};
  if (discountType !== undefined) {
    if (discountType !== "PERCENT" && discountType !== "FIXED") {
      return NextResponse.json({ error: "Tipo de desconto inválido" }, { status: 400 });
    }
    data.discountType = discountType;
  }
  if (discountValue !== undefined) {
    const value = Number(discountValue);
    if (!Number.isFinite(value) || value <= 0) {
      return NextResponse.json({ error: "Informe um valor de desconto válido" }, { status: 400 });
    }
    data.discountValue = value;
  }
  if (freeShipping !== undefined) data.freeShipping = !!freeShipping;
  if (minPurchase !== undefined) {
    const v = minPurchase === null || minPurchase === "" ? null : Number(minPurchase);
    if (v !== null && (!Number.isFinite(v) || v < 0)) {
      return NextResponse.json({ error: "Valor mínimo de compra inválido" }, { status: 400 });
    }
    data.minPurchase = v;
  }
  if (maxUses !== undefined) {
    const v = maxUses === null || maxUses === "" ? null : parseInt(maxUses, 10);
    if (v !== null && (!Number.isInteger(v) || v <= 0)) {
      return NextResponse.json({ error: "Limite de usos inválido" }, { status: 400 });
    }
    data.maxUses = v;
  }
  if (expiresAt !== undefined) {
    const v = expiresAt ? new Date(expiresAt) : null;
    if (v && isNaN(v.getTime())) {
      return NextResponse.json({ error: "Data de expiração inválida" }, { status: 400 });
    }
    data.expiresAt = v;
  }
  if (active !== undefined) data.active = !!active;

  const coupon = await prisma.coupon.update({ where: { id }, data });
  return NextResponse.json(coupon);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
