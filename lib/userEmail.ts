import { prisma } from "./prisma";

/**
 * Acha a conta pelo e-mail sem ligar pra maiúscula/minúscula ("Maria@..." e
 * "maria@..." são a mesma pessoa). O e-mail exato tem preferência, porque
 * algumas contas antigas foram cadastradas duas vezes só mudando maiúscula —
 * nesse caso, sem o exato, não dá pra saber qual é e não devolve nenhuma.
 */
export async function findUserByEmail(email: string) {
  const exact = await prisma.user.findUnique({ where: { email } });
  if (exact) return exact;
  const matches = await prisma.user.findMany({ where: { email: { equals: email.trim(), mode: "insensitive" } }, take: 2 });
  return matches.length === 1 ? matches[0] : null;
}
