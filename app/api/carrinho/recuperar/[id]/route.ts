import { currentPrice, isFlashSaleActive } from "@/lib/black";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseProductImages, isCupomElegivel, isFreteGratisElegivel } from "@/lib/utils";

/**
 * Itens de um pedido que expirou sem pagamento, pra remontar o carrinho
 * (link de recuperação mandado pelo WhatsApp). Só pedido nunca pago e só
 * dados do produto — nada do cliente (endereço, nome, telefone).
 */
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      status: true,
      confirmedAt: true,
      couponCode: true,
      items: {
        select: {
          quantity: true,
          color: true,
          size: true,
          product: {
            select: {
              id: true, name: true, slug: true, price: true, images: true, active: true,
              permiteCupom: true, categories: true, freteGratis: true,
              variants: { select: { color: true, size: true, stock: true } },
            },
          },
        },
      },
    },
  });

  if (!order || order.confirmedAt || !["CANCELLED", "PENDING"].includes(order.status)) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  const items = [];
  const esgotados: string[] = [];
  for (const it of order.items) {
    const p = it.product;
    if (!p || !p.active) continue;
    const disponivel = p.variants
      .filter((v) => (!it.color || v.color === it.color) && (!it.size || v.size === it.size))
      .reduce((s, v) => s + v.stock, 0);
    if (p.variants.length > 0 && disponivel <= 0) {
      esgotados.push(p.name);
      continue;
    }
    const images = parseProductImages(p.images);
    const image = (it.color && images.find((img) => img.color === it.color)?.url) || images[0]?.url || "";
    items.push({
      productId: p.id,
      name: p.name,
      price: currentPrice(p.price),
      image,
      quantity: p.variants.length > 0 ? Math.min(it.quantity, disponivel) : it.quantity,
      color: it.color || undefined,
      size: it.size || undefined,
      slug: p.slug,
      cupomElegivel: isCupomElegivel(p.permiteCupom),
      freteGratisElegivel: isFreteGratisElegivel(p.categories),
      freteGratis: !!p.freteGratis && !isFlashSaleActive(),
    });
  }

  return NextResponse.json({ items, esgotados, couponCode: order.couponCode });
}
