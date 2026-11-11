import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveCoupon, computeDiscountAmount, CouponExhaustedError } from "@/lib/coupons";
import { decrementStockForItems, InsufficientStockError } from "@/lib/stock";
import { isCupomElegivel, isFreteGratisElegivel, formatCurrency } from "@/lib/utils";
import { updateOrderStatus } from "@/lib/orders";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { currentPrice, isFlashSaleActive } from "@/lib/black";
import { validateGuestContact, findOrCreateGuestUser, guestOrderToken, isValidGuestOrderToken } from "@/lib/guestOrder";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const where = session.user.role === "ADMIN" ? {} : { userId: session.user.id };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } }, address: true, user: true },
  });

  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await request.json();
  const { address, addressId, paymentMethod, items, shipping, couponCode, shippingServiceId, shippingService, shippingCarrier } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
  }

  // Preco de cada item sempre vem do banco (com a oferta relampago, se estiver
  // valendo), nunca do navegador. Se o carrinho da pessoa estiver com um preco
  // diferente (oferta comecou/acabou, preco mudou), pede pra ela revisar antes.
  const flashSale = isFlashSaleActive();
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: items.map((item: { productId: string }) => item.productId) } },
    select: { id: true, price: true },
  });
  const unitPriceMap = new Map(dbProducts.map((p) => [p.id, currentPrice(p.price)]));
  for (const item of items as { productId: string; price: number; quantity: number; skipStock?: boolean }[]) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return NextResponse.json({ error: "Quantidade inválida no carrinho." }, { status: 400 });
    }
    item.skipStock = false; // so o admin (venda manual) pode vender sem baixar estoque
    const unit = unitPriceMap.get(item.productId);
    if (unit === undefined) {
      return NextResponse.json({ error: "Um dos produtos do carrinho não está mais disponível. Volte ao carrinho para revisar." }, { status: 409 });
    }
    if (Math.abs(unit - Number(item.price)) > 0.009) {
      return NextResponse.json({ error: "Os preços de alguns produtos foram atualizados. Volte ao carrinho para ver os valores novos." }, { status: 409 });
    }
    item.price = unit;
  }
  const subtotal = Math.round(
    (items as { productId: string; price: number; quantity: number }[]).reduce((sum, item) => sum + item.price * item.quantity, 0) * 100
  ) / 100;

  // Sem login: o pedido fica na conta do e-mail digitado (criada na hora se não existir)
  let userId: string;
  let isGuest = false;
  let guestIsNewUser = false;
  if (session) {
    userId = session.user.id;
  } else {
    if (!rateLimit(`guest-order:${getClientIp(request.headers)}`, 10, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." }, { status: 429 });
    }
    const { contact, error } = validateGuestContact(body.guest);
    if (!contact) return NextResponse.json({ error }, { status: 400 });
    const guestUser = await findOrCreateGuestUser(contact);
    userId = guestUser.id;
    isGuest = true;
    guestIsNewUser = guestUser.isNew;
  }

  // Se a pessoa saiu do checkout sem nunca ter tentado pagar (voltou pro carrinho pra
  // adicionar outra peça, fechou a aba, etc.) e volta a "Continuar para pagamento", um
  // pedido novo seria criado sem cancelar o antigo — a mesma peça ficaria com estoque
  // descontado duas vezes. Cancela qualquer pendente sem tentativa de pagamento antes.
  // Sem login, o pedido anterior só é reconhecido pela chave dele: o e-mail digitado
  // pode ser de outra pessoa, então nunca cancela pelo userId nesse caso.
  const previous = body.previousGuestOrder as { id?: unknown; token?: unknown } | undefined;
  const pedidosAbandonados = isGuest
    ? typeof previous?.id === "string" && isValidGuestOrderToken(previous.id, previous.token)
      ? await prisma.order.findMany({ where: { id: previous.id, status: "PENDING", mpPaymentId: null }, select: { id: true } })
      : []
    : await prisma.order.findMany({
        where: { userId, status: "PENDING", mpPaymentId: null },
        select: { id: true },
      });
  for (const pedido of pedidosAbandonados) {
    await updateOrderStatus(pedido.id, "CANCELLED");
  }

  // Cupom (boas-vindas, vendedor/revendedor ou cupom personalizado do admin) —
  // sempre resolvido de novo aqui, nunca confiando no valor calculado no navegador.
  let couponDiscount: number | null = null; // percentual (so quando discountType === PERCENT), mantido pra compatibilidade com a visao do vendedor/revendedor
  let couponDiscountAmount = 0; // valor real descontado em R$, sempre preenchido quando ha cupom valido
  let freeShipping = false;
  let vendorId: string | null = null;
  let resellerId: string | null = null;
  let commissionValue: number | null = null;
  let appliedCoupon: string | null = null;
  let couponId: string | null = null;
  let couponMaxUses: number | null = null;

  if (couponCode) {
    const result = await resolveCoupon(couponCode, userId);
    if (!result.valid) {
      return NextResponse.json({ error: result.error || "Cupom inválido" }, { status: 400 });
    }
    if (result.minPurchase && subtotal < result.minPurchase) {
      return NextResponse.json({ error: `Este cupom exige compra mínima de ${formatCurrency(result.minPurchase)}` }, { status: 400 });
    }

    appliedCoupon = couponCode.toUpperCase().trim();
    vendorId = result.vendorId ?? null;
    resellerId = result.resellerId ?? null;
    couponId = result.couponId ?? null;
    couponMaxUses = result.maxUses ?? null;
    if (result.discountType === "PERCENT") couponDiscount = result.discountValue ?? null;

    // Cupom só se aplica sobre o valor dos itens elegíveis
    const products = await prisma.product.findMany({
      where: { id: { in: items.map((item: { productId: string }) => item.productId) } },
      select: { id: true, categories: true, permiteCupom: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));
    const eligibleSubtotal = items.reduce((sum: number, item: { productId: string; price: number; quantity: number }) => {
      const product = productMap.get(item.productId);
      const elegivel = product ? isCupomElegivel(product.permiteCupom) : true;
      return elegivel ? sum + item.price * item.quantity : sum;
    }, 0);

    // Frete grátis do cupom só vale se tiver ao menos uma peça fora de Acessórios/Calçados
    // (acessório ou calçado sozinho ganha o desconto, mas paga o frete).
    freeShipping = !!result.freeShipping && products.some((p) => isFreteGratisElegivel(p.categories));

    couponDiscountAmount = computeDiscountAmount(result.discountType!, result.discountValue!, eligibleSubtotal);

    // Comissao calculada sobre o que o cliente de fato pagou pelos produtos
    // (subtotal ja com o desconto do cupom aplicado), sem contar o frete.
    const valorPagoPelosProdutos = subtotal - couponDiscountAmount;
    if (resellerId) commissionValue = valorPagoPelosProdutos * 0.025;
    else if (vendorId) commissionValue = valorPagoPelosProdutos * 0.05;
  }

  // Produto marcado com frete grátis no admin libera o frete do pedido inteiro, com ou sem cupom
  // (menos na oferta relampago: nela o frete e cobrado normalmente)
  if (!freeShipping && !flashSale) {
    const comFreteGratis = await prisma.product.count({
      where: { id: { in: items.map((item: { productId: string }) => item.productId) }, freteGratis: true },
    });
    freeShipping = comFreteGratis > 0;
  }

  const finalShipping = freeShipping ? 0 : shipping;
  const finalTotal = subtotal - couponDiscountAmount + finalShipping;

  try {
    const order = await prisma.$transaction(async (tx) => {
      await decrementStockForItems(tx, items);

      // Reserva o uso do cupom de forma atomica (evita duas compras simultaneas
      // furarem o limite de usos, igual ao desconto de estoque).
      if (couponId) {
        const res = couponMaxUses !== null
          ? await tx.coupon.updateMany({ where: { id: couponId, active: true, usedCount: { lt: couponMaxUses } }, data: { usedCount: { increment: 1 } } })
          : await tx.coupon.updateMany({ where: { id: couponId, active: true }, data: { usedCount: { increment: 1 } } });
        if (res.count === 0) throw new CouponExhaustedError();
      }

      // Endereço: reaproveita um já salvo em vez de criar uma linha nova a cada pedido.
      // Retirada na loja tem endereço fixo e nunca mexe no endereço padrão do cliente.
      let finalAddressId: string;
      if (address?.name === "Retirada na loja") {
        const pickupAddress = await tx.address.findFirst({
          where: { userId, name: "Retirada na loja" },
        });
        finalAddressId = pickupAddress
          ? pickupAddress.id
          : (await tx.address.create({ data: { userId, ...address, isDefault: false } })).id;
      } else if (isGuest) {
        // Sem login nunca reaproveita nem troca o endereço padrão de uma conta que já existia
        const created = await tx.address.create({ data: { userId, ...address, isDefault: guestIsNewUser } });
        finalAddressId = created.id;
      } else {
        const reused = addressId
          ? await tx.address.findFirst({ where: { id: addressId, userId } })
          : null;
        if (reused) {
          finalAddressId = reused.id;
          if (!reused.isDefault) {
            await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
            await tx.address.update({ where: { id: reused.id }, data: { isDefault: true } });
          }
        } else {
          await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
          const created = await tx.address.create({ data: { userId, ...address, isDefault: true } });
          finalAddressId = created.id;
        }
      }

      return tx.order.create({
        data: {
          userId,
          addressId: finalAddressId,
          paymentMethod,
          status: "PENDING",
          subtotal,
          shipping: finalShipping,
          total: finalTotal,
          couponCode: appliedCoupon,
          couponDiscount,
          couponDiscountAmount: appliedCoupon ? couponDiscountAmount : null,
          vendorId,
          resellerId,
          commissionValue,
          shippingServiceId: shippingServiceId ?? null,
          shippingService: shippingService ?? null,
          shippingCarrier: shippingCarrier ?? null,
          items: {
            create: items.map((item: { productId: string; quantity: number; price: number; color?: string; size?: string }) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              color: item.color,
              size: item.size,
            })),
          },
        },
        include: { items: true, address: true },
      });
    });

    return NextResponse.json(isGuest ? { ...order, guestToken: guestOrderToken(order.id) } : order, { status: 201 });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof CouponExhaustedError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
