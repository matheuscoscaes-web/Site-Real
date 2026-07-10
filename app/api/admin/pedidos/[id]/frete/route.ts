import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { shippingServiceId, shippingService, shippingCarrier } = await request.json();

  if (!shippingServiceId || !shippingService || !shippingCarrier) {
    return NextResponse.json({ error: "Selecione uma opção de frete" }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: { shippingServiceId, shippingService, shippingCarrier },
  });

  return NextResponse.json(order);
}
