import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.type !== "payment" || !body.data?.id) {
      return NextResponse.json({ ok: true });
    }

    const payment = new Payment(client);
    const paymentData = await payment.get({ id: String(body.data.id) });

    const orderId = paymentData.external_reference;
    if (!orderId) return NextResponse.json({ ok: true });

    const statusMap: Record<string, string> = {
      approved: "PAID",
      rejected: "CANCELLED",
      cancelled: "CANCELLED",
      refunded: "CANCELLED",
      in_process: "PENDING",
      pending: "PENDING",
    };

    const newStatus = statusMap[paymentData.status ?? ""] ?? "PENDING";

    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
