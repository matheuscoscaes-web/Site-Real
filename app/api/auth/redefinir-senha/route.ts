import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  if (!rateLimit(`redefinir-senha:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  const { token, password } = await request.json();
  if (!token || !password) return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 });

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link inválido ou expirado. Solicite um novo." }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashed } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: resetToken.userId } });

  return NextResponse.json({ ok: true });
}
