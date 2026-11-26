import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findOwnPendingOrders } from "@/lib/orders";
import { isValidGuestOrderToken } from "@/lib/guestOrder";

/**
 * Peças que estão reservadas pra própria pessoa (pedido dela ainda não pago).
 * O carrinho soma isso ao estoque na hora de conferir — senão, quando ela saía
 * no meio do pagamento e voltava, a reserva dela mesma fazia o produto parecer
 * esgotado e ele era tirado do carrinho. Ao refazer o pedido, essas reservas
 * são liberadas (ver releaseOwnPendingOrders).
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await request.json().catch(() => ({}));
  const prev = body?.previousGuestOrder as { id?: unknown; token?: unknown } | undefined;

  const guestOrder =
    !session && typeof prev?.id === "string" && isValidGuestOrderToken(prev.id, prev.token) ? { id: prev.id } : undefined;
  if (!session && !guestOrder) return NextResponse.json([]);

  const orders = await findOwnPendingOrders({ userId: session?.user.id, guestOrder });
  const reserved = orders.flatMap((o) =>
    o.items
      .filter((i) => i.productId && !i.skipStock)
      .map((i) => ({ productId: i.productId, color: i.color, size: i.size, quantity: i.quantity }))
  );
  return NextResponse.json(reserved);
}
