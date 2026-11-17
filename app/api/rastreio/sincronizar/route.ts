import { NextResponse } from "next/server";
import { syncPendingShipments } from "@/lib/rastreio";

/**
 * Chamado de tempos em tempos pelo GitHub Actions (.github/workflows/rastreio.yml)
 * pra atualizar código de rastreio e status dos pedidos com o Melhor Envio mesmo
 * quando ninguém abre o site. Não recebe nada nem devolve dados de pedido: só
 * sincroniza com o que o Melhor Envio já informa — por isso não precisa de senha.
 */
let lastRun = 0;

export const dynamic = "force-dynamic";

export async function GET() {
  // Evita rodar várias vezes seguidas se alguém chamar repetidamente
  if (Date.now() - lastRun < 2 * 60 * 1000) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  lastRun = Date.now();
  await syncPendingShipments();
  return NextResponse.json({ ok: true });
}
