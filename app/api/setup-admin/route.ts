import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Endpoint temporário para criar admin — remover após uso
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== "hearts2024setup") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const existing = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (existing) {
    return NextResponse.json({ message: "Admin já existe", email: existing.email });
  }

  const hash = await bcrypt.hash("Hearts@2024", 12);
  const admin = await prisma.user.create({
    data: {
      name: "Administrador",
      email: "admin@heartscouro.com.br",
      password: hash,
      role: "ADMIN",
    },
  });

  return NextResponse.json({ ok: true, email: admin.email, senha: "Hearts@2024" });
}
