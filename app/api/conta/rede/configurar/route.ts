import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (session.user.role !== "VENDOR") {
    return NextResponse.json({ error: "Apenas vendedores podem configurar cupom" }, { status: 403 });
  }

  const { couponCode, discount } = await req.json();

  if (!couponCode) return NextResponse.json({ error: "Código do cupom obrigatório" }, { status: 400 });

  const discountNum = Number(discount);
  if (isNaN(discountNum) || discountNum < 10 || discountNum > 50) {
    return NextResponse.json({ error: "Desconto deve ser entre 10% e 50%" }, { status: 400 });
  }

  const code = couponCode.toUpperCase().trim();

  // Verifica se já existe o cupom em outro vendedor ou revendedor
  const couponVendor = await prisma.vendor.findFirst({
    where: { couponCode: code, NOT: { userId: session.user.id } },
  });
  if (couponVendor) return NextResponse.json({ error: "Esse cupom já está em uso" }, { status: 409 });

  const couponReseller = await prisma.reseller.findUnique({ where: { couponCode: code } });
  if (couponReseller) return NextResponse.json({ error: "Esse cupom já está em uso" }, { status: 409 });

  const vendor = await prisma.vendor.update({
    where: { userId: session.user.id },
    data: { couponCode: code, discount: discountNum },
  });

  return NextResponse.json(vendor);
}
