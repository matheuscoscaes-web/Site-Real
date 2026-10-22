import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// Compra sem login: o pedido continua ligado a um User (o e-mail digitado no
// checkout), mas quem paga prova que é dono do pedido com uma chave assinada,
// entregue só pra quem criou o pedido — não com a sessão.

function sign(orderId: string): string {
  return crypto.createHmac("sha256", process.env.NEXTAUTH_SECRET!).update(`guest-order:${orderId}`).digest("hex");
}

export function guestOrderToken(orderId: string): string {
  return sign(orderId);
}

export function isValidGuestOrderToken(orderId: string, token: unknown): boolean {
  if (typeof token !== "string") return false;
  const expected = sign(orderId);
  return token.length === expected.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

/** Dono do pedido: a conta logada que fez o pedido, ou quem tem a chave do pedido feito sem login. */
export function ownsOrder(order: { id: string; userId: string }, sessionUserId: string | undefined, token: unknown): boolean {
  return (!!sessionUserId && order.userId === sessionUserId) || isValidGuestOrderToken(order.id, token);
}

export interface GuestContact {
  name: string;
  email: string;
  phone: string;
}

/** Valida os dados de quem compra sem login. Devolve a mensagem de erro, ou null se estiver tudo certo. */
export function validateGuestContact(raw: unknown): { contact: GuestContact | null; error: string | null } {
  const g = (raw ?? {}) as Partial<Record<keyof GuestContact, unknown>>;
  const name = typeof g.name === "string" ? g.name.trim() : "";
  const email = typeof g.email === "string" ? g.email.trim().toLowerCase() : "";
  const phone = typeof g.phone === "string" ? g.phone.replace(/\D/g, "") : "";
  if (name.length < 3) return { contact: null, error: "Digite seu nome completo." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { contact: null, error: "Digite um e-mail válido." };
  if (phone.length < 10 || phone.length > 11) return { contact: null, error: "Digite um WhatsApp válido com DDD." };
  return { contact: { name, email, phone }, error: null };
}

/**
 * Cliente de um pedido sem login: reaproveita a conta com o mesmo e-mail (o
 * pedido aparece em "Meus Pedidos" se ela entrar depois) ou cria uma conta nova
 * com senha aleatória — a pessoa cria a senha dela pelo "Esqueci minha senha".
 * Os dados de uma conta que já existe nunca são alterados aqui.
 */
export async function findOrCreateGuestUser(contact: GuestContact): Promise<{ id: string; isNew: boolean }> {
  // E-mail exato primeiro; se só existir com outra maiúscula, usa a conta mais recente
  const existing =
    (await prisma.user.findUnique({ where: { email: contact.email }, select: { id: true } })) ??
    (await prisma.user.findFirst({
      where: { email: { equals: contact.email, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    }));
  if (existing) return { id: existing.id, isNew: false };

  try {
    const created = await prisma.user.create({
      data: {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        password: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
        role: "CUSTOMER",
      },
      select: { id: true },
    });
    return { id: created.id, isNew: true };
  } catch (err) {
    // Duas abas criando a mesma conta ao mesmo tempo: usa a que ganhou
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const user = await prisma.user.findFirstOrThrow({ where: { email: { equals: contact.email, mode: "insensitive" } }, select: { id: true } });
      return { id: user.id, isNew: false };
    }
    throw err;
  }
}
