import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.toUpperCase().trim();

  if (!code) return NextResponse.json({ error: "Código obrigatório" }, { status: 400 });

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
