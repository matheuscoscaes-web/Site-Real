import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buscarCodigoRastreio } from "@/lib/frete";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, select: { melhorEnvioId: true } });

  if (!order?.melhorEnvioId) {
    return NextResponse.json({ error: "Pedido sem etiqueta do Melhor Envio gerada" }, { status: 400 });
  }

  const trackingCode = await buscarCodigoRastreio(order.melhorEnvioId);

  if (trackingCode) {
    await prisma.order.update({ where: { id }, data: { trackingCode } });
  }

  return NextResponse.json({ trackingCode });
}
