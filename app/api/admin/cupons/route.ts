import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WELCOME_COUPON_CODE } from "@/lib/coupons";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(coupons);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { code, discountType, discountValue, freeShipping, minPurchase, maxUses, expiresAt } = body;

  const normalizedCode = String(code ?? "").toUpperCase().trim();
  if (!normalizedCode) {
    return NextResponse.json({ error: "Informe o código do cupom" }, { status: 400 });
  }
  if (normalizedCode === WELCOME_COUPON_CODE) {
    return NextResponse.json({ error: "Esse código já é usado pelo cupom de boas-vindas" }, { status: 400 });
  }
  if (discountType !== "PERCENT" && discountType !== "FIXED") {
    return NextResponse.json({ error: "Tipo de desconto inválido" }, { status: 400 });
  }
  const value = Number(discountValue);
  if (!Number.isFinite(value) || value <= 0) {
    return NextResponse.json({ error: "Informe um valor de desconto válido" }, { status: 400 });
  }
  if (discountType === "PERCENT" && value > 100) {
    return NextResponse.json({ error: "Desconto percentual não pode passar de 100%" }, { status: 400 });
  }
  const minPurchaseValue = minPurchase !== undefined && minPurchase !== null && minPurchase !== "" ? Number(minPurchase) : null;
  if (minPurchaseValue !== null && (!Number.isFinite(minPurchaseValue) || minPurchaseValue < 0)) {
    return NextResponse.json({ error: "Valor mínimo de compra inválido" }, { status: 400 });
  }
  const maxUsesValue = maxUses !== undefined && maxUses !== null && maxUses !== "" ? parseInt(maxUses, 10) : null;
  if (maxUsesValue !== null && (!Number.isInteger(maxUsesValue) || maxUsesValue <= 0)) {
    return NextResponse.json({ error: "Limite de usos inválido" }, { status: 400 });
  }
  const expiresAtValue = expiresAt ? new Date(expiresAt) : null;
  if (expiresAtValue && isNaN(expiresAtValue.getTime())) {
    return NextResponse.json({ error: "Data de expiração inválida" }, { status: 400 });
  }

  // Vendedores/revendedores tem prioridade na resolucao do codigo — evita cadastrar
  // um cupom personalizado que nunca sera alcancado por colidir com um deles.
  const [vendorClash, resellerClash] = await Promise.all([
    prisma.vendor.findUnique({ where: { couponCode: normalizedCode } }),
    prisma.resellerCoupon.findUnique({ where: { code: normalizedCode } }),
  ]);
  if (vendorClash || resellerClash) {
    return NextResponse.json({ error: "Esse código já está em uso por um vendedor/revendedor" }, { status: 400 });
  }

  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: normalizedCode,
        discountType,
        discountValue: value,
        freeShipping: !!freeShipping,
        minPurchase: minPurchaseValue,
        maxUses: maxUsesValue,
        expiresAt: expiresAtValue,
      },
    });
    return NextResponse.json(coupon, { status: 201 });
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Já existe um cupom com esse código" }, { status: 409 });
    }
    throw err;
  }
}
