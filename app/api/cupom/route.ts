import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const WELCOME_COUPON_CODE = "BEMVINDO";
export const WELCOME_COUPON_DISCOUNT = 40;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.toUpperCase().trim();

  if (!code) return NextResponse.json({ error: "Código obrigatório" }, { status: 400 });

  // Cupom de boas-vindas (1ª compra)
  if (code === WELCOME_COUPON_CODE) {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ valid: false, error: "Faça login para usar este cupom." });
    }
    const orderCount = await prisma.order.count({
      where: { userId: session.user.id, status: { notIn: ["PENDING", "CANCELLED"] } },
    });
    if (orderCount > 0) {
      return NextResponse.json({ valid: false, error: "Este cupom é válido apenas na primeira compra." });
    }
    return NextResponse.json({
      valid: true,
      type: "welcome",
      vendorId: null,
      resellerId: null,
      discount: WELCOME_COUPON_DISCOUNT,
      freeShipping: true,
      ownerName: "Hearts Couro",
    });
  }

  // Tenta como cupom de vendedor
  const vendor = await prisma.vendor.findUnique({
    where: { couponCode: code },
    include: { user: { select: { name: true } } },
  });
  if (vendor && vendor.active && vendor.discount !== null) {
    return NextResponse.json({
      valid: true,
      type: "vendor",
      vendorId: vendor.id,
      resellerId: null,
      discount: vendor.discount,
      ownerName: vendor.user.name,
    });
  }

  // Tenta como cupom de revendedor
  const reseller = await prisma.reseller.findUnique({
    where: { couponCode: code },
    include: {
      user: { select: { name: true } },
      vendor: { select: { id: true } },
    },
  });
  if (reseller && reseller.active) {
    return NextResponse.json({
      valid: true,
      type: "reseller",
      vendorId: reseller.vendor.id,
      resellerId: reseller.id,
      discount: reseller.discount,
      ownerName: reseller.user.name,
    });
  }

  return NextResponse.json({ valid: false, error: "Cupom inválido ou inativo" });
}
