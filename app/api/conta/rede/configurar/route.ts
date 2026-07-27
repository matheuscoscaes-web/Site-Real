import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WELCOME_COUPON_CODE } from "@/app/api/cupom/route";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = session.user.role;
  if (role !== "VENDOR" && role !== "RESELLER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  // Vendedor/admin: cupom próprio único, desconto fixo em 50%
  if (role === "VENDOR" || role === "ADMIN") {
    const { couponCode } = await req.json();
    if (!couponCode) return NextResponse.json({ error: "Código do cupom obrigatório" }, { status: 400 });

    const code = couponCode.toUpperCase().trim();
    if (code === WELCOME_COUPON_CODE) {
      return NextResponse.json({ error: "Esse código é reservado para o cupom de boas-vindas" }, { status: 409 });
    }

    const dup = await prisma.vendor.findFirst({ where: { couponCode: code, NOT: { userId: session.user.id } } });
    if (dup) return NextResponse.json({ error: "Esse cupom já está em uso" }, { status: 409 });
    const dupR = await prisma.resellerCoupon.findUnique({ where: { code } });
    if (dupR) return NextResponse.json({ error: "Esse cupom já está em uso" }, { status: 409 });

    // upsert: admin pode não ter um registro de Vendor ainda na primeira configuração
    const vendor = await prisma.vendor.upsert({
      where: { userId: session.user.id },
      update: { couponCode: code, discount: 50 },
      create: { userId: session.user.id, couponCode: code, discount: 50 },
    });
    return NextResponse.json(vendor);
  }

  // Revendedor: informa só um nome e o sistema cria 5 cupons automaticamente,
  // um pra cada faixa de desconto (10%, 20%, 30%, 40%, 50%), ex: NOME10, NOME20...
  const TIERS = [10, 20, 30, 40, 50];
  const { name } = await req.json();
  const base = String(name ?? "").toUpperCase().trim().replace(/[^A-Z0-9]/g, "");

  if (!base) return NextResponse.json({ error: "Informe um nome para gerar seus cupons" }, { status: 400 });
  if (base.length < 3) return NextResponse.json({ error: "Use um nome com pelo menos 3 letras" }, { status: 400 });

  const codes = TIERS.map((t) => `${base}${t}`);
  if (codes.includes(WELCOME_COUPON_CODE)) {
    return NextResponse.json({ error: "Esse nome é reservado, escolha outro" }, { status: 409 });
  }

  const reseller = await prisma.reseller.findUnique({ where: { userId: session.user.id } });
  if (!reseller) return NextResponse.json({ error: "Revendedor não encontrado" }, { status: 404 });

  const [vendorClash, resellerClash] = await Promise.all([
    prisma.vendor.findFirst({ where: { couponCode: { in: codes } } }),
    prisma.resellerCoupon.findFirst({ where: { code: { in: codes }, resellerId: { not: reseller.id } } }),
  ]);
  if (vendorClash || resellerClash) {
    return NextResponse.json({ error: "Esse nome já está em uso, escolha outro" }, { status: 409 });
  }

  await prisma.resellerCoupon.deleteMany({ where: { resellerId: reseller.id } });
  const updated = await prisma.reseller.update({
    where: { id: reseller.id },
    data: {
      couponName: base,
      coupons: { create: TIERS.map((t) => ({ code: `${base}${t}`, discount: t })) },
    },
    include: { coupons: true },
  });

  return NextResponse.json(updated);
}
