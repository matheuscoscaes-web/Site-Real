import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { productId, orderId, rating, comment } = await request.json();

  if (!productId || !orderId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: session.user.id,
      items: { some: { productId } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado ou produto não pertence a este pedido" }, { status: 404 });
  }

  try {
    const review = await prisma.review.create({
      data: {
        productId,
        userId: session.user.id,
        orderId,
        rating: Math.round(rating),
        comment: comment?.trim() || null,
      },
    });
    return NextResponse.json(review, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Você já avaliou este produto neste pedido" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
