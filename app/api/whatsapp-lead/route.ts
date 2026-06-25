import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { name, phone } = await request.json();

  if (!name?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: "Nome e WhatsApp são obrigatórios" }, { status: 400 });
  }

  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 10) {
    return NextResponse.json({ error: "WhatsApp inválido" }, { status: 400 });
  }

  await prisma.whatsappLead.create({
    data: { name: name.trim(), phone: cleaned },
  });

  return NextResponse.json({ ok: true });
}
