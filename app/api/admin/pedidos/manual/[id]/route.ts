import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrementStockForItems, restoreStockForItems, InsufficientStockError } from "@/lib/stock";
import { MANUAL_PAYMENT_METHODS, isManualSale } from "@/lib/utils";

const STORE_ADDRESS = {
  street: "Rua Desembargador Omar Dutra",
  number: "60",
  complement: "",
  district: "",
  city: "",
  state: "",
  zipCode: "",
};

interface ManualItem {
  productId?: string | null;
  customName?: string | null;
  quantity: number;
  price: number;
  color?: string | null;
  size?: string | null;
  skipStock?: boolean;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!existing) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  if (!isManualSale(existing.paymentMethod)) {
    return NextResponse.json({ error: "Só é possível editar vendas registradas manualmente" }, { status: 403 });
  }

  const body = await request.json();
  const {
    delivery,
    address,
    items,
    shipping,
    paymentMethod,
    status,
    vendorId,
    notes,
  }: {
    delivery: "RETIRADA" | "ENTREGA";
    address?: { cpf?: string; street: string; number: string; complement?: string; district: string; city: string; state: string; zipCode: string };
    items: ManualItem[];
    shipping: number;
    paymentMethod: string;
    status: string;
    vendorId?: string;
    notes?: string;
  } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Adicione ao menos um item" }, { status: 400 });
  }
  if (items.some((i) => (!i.productId && !i.customName?.trim()) || i.quantity < 1 || i.price < 0)) {
    return NextResponse.json({ error: "Item inválido" }, { status: 400 });
  }
  if (!MANUAL_PAYMENT_METHODS.includes(paymentMethod)) {
    return NextResponse.json({ error: "Forma de pagamento inválida" }, { status: 400 });
  }
  if (status && !["PENDING", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"].includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }
  if (delivery === "ENTREGA" && (!address?.street || !address?.number || !address?.district || !address?.city || !address?.state || !address?.zipCode)) {
    return NextResponse.json({ error: "Preencha o endereço de entrega" }, { status: 400 });
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      // Devolve o estoque dos itens antigos (respeitando skipStock) antes de descontar os novos.
      // Só devolve se o pedido ainda estava ativo — se já estava CANCELLED, o estoque
      // já foi devolvido antes e devolver de novo geraria estoque fantasma.
      const oldStockItems = existing.items.filter((i): i is typeof i & { productId: string } => !!i.productId);
      if (existing.status !== "CANCELLED") {
        await restoreStockForItems(oldStockItems, tx);
      }

      const addressData = delivery === "RETIRADA"
        ? { ...STORE_ADDRESS, cpf: null }
        : { cpf: address!.cpf?.replace(/\D/g, "") || null, street: address!.street, number: address!.number, complement: address!.complement || "", district: address!.district, city: address!.city, state: address!.state, zipCode: address!.zipCode.replace(/\D/g, "") };

      await tx.address.update({ where: { id: existing.addressId }, data: addressData });

      // Só reserva estoque pros novos itens se o pedido continuar ativo. Se o admin
      // está marcando como CANCELLED (cliente não pagou), o estoque deve só ser
      // devolvido acima, nunca descontado de novo pro pedido cancelado.
      const finalStatus = status || existing.status;
      const catalogItems = items.filter((i): i is ManualItem & { productId: string } => !!i.productId);
      if (finalStatus !== "CANCELLED") {
        await decrementStockForItems(tx, catalogItems);
      }

      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const finalShipping = delivery === "RETIRADA" ? 0 : Math.max(0, shipping || 0);
      const total = subtotal + finalShipping;

      const vendor = vendorId ? await tx.vendor.findUnique({ where: { id: vendorId } }) : null;
      const commissionValue = vendor ? subtotal * 0.05 : null;

      return tx.order.update({
        where: { id },
        data: {
          status: status || existing.status,
          paymentMethod,
          subtotal,
          shipping: finalShipping,
          total,
          notes: notes || null,
          vendorId: vendor?.id ?? null,
          commissionValue,
          shippingService: delivery === "RETIRADA" ? "Retirada no balcão" : null,
          shippingCarrier: delivery === "RETIRADA" ? "Loja" : null,
          items: {
            deleteMany: {},
            create: items.map((item) => ({
              productId: item.productId || null,
              customName: item.productId ? null : (item.customName?.trim() || null),
              quantity: item.quantity,
              price: item.price,
              color: item.color || null,
              size: item.size || null,
              skipStock: item.productId ? !!item.skipStock : true,
            })),
          },
        },
        include: { items: true },
      });
    });

    return NextResponse.json(order);
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
