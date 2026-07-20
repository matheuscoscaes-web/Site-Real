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
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  const body = await request.json();
  const vendorId: string | null = body.vendorId || null;

  if (vendorId === null) {
    const updated = await prisma.order.update({
      where: { id },
      data: { vendorId: null, resellerId: null, commissionValue: null },
    });
    return NextResponse.json(updated);
  }

  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor || !vendor.active) {
    return NextResponse.json({ error: "Vendedor inválido ou inativo" }, { status: 400 });
  }

  // Mesma base de calculo usada no checkout e na venda manual: o que o
  // cliente de fato pagou pelos produtos (subtotal ja com desconto do
  // cupom aplicado), sem contar o frete.
  const valorPagoPelosProdutos = order.subtotal - (order.couponDiscountAmount ?? 0);
  const commissionValue = valorPagoPelosProdutos * 0.05;

  const updated = await prisma.order.update({
    where: { id },
    data: { vendorId, resellerId: null, commissionValue },
  });

  return NextResponse.json(updated);
}
