import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail, passwordCreateEmail } from "@/lib/authEmails";
import { findUserByEmail } from "@/lib/userEmail";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  if (!rateLimit(`recuperar-senha:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  // criar: veio do botão "Criar senha" depois de comprar sem login — só muda o texto do e-mail
  const { email, criar } = await request.json();
  if (!email) return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });

  const user = await findUserByEmail(email);

  // Sempre responde ok, mesmo se o e-mail não existir, para não vazar quais e-mails têm conta.
  if (user) {
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_URL}/redefinir-senha?token=${token}${criar ? "&criar=1" : ""}`;
    const { subject, html } = criar ? passwordCreateEmail(user.name, resetUrl) : passwordResetEmail(user.name, resetUrl);
    await sendEmail({ to: user.email, subject, html });
  }

  return NextResponse.json({ ok: true });
}
