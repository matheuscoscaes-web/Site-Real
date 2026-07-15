import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrementStockForItems, InsufficientStockError } from "@/lib/stock";
import { MANUAL_PAYMENT_METHODS } from "@/lib/utils";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const {
    customerId,
    newCustomer,
    delivery,
    address,
    items,
    shipping,
    paymentMethod,
    status,
    vendorId,
    notes,
  }: {
    customerId?: string;
    newCustomer?: { name: string; email?: string; phone?: string };
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
  if (status && !["PAID", "PREPARING", "SHIPPED", "DELIVERED"].includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }
  if (delivery === "ENTREGA" && (!address?.street || !address?.number || !address?.district || !address?.city || !address?.state || !address?.zipCode)) {
    return NextResponse.json({ error: "Preencha o endereço de entrega" }, { status: 400 });
  }
  if (!customerId && !newCustomer?.name) {
    return NextResponse.json({ error: "Selecione um cliente ou informe o nome do novo cliente" }, { status: 400 });
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      // Cliente
      let userId = customerId;
      if (!userId) {
        let user = newCustomer!.email
          ? await tx.user.findUnique({ where: { email: newCustomer!.email } })
          : null;

        if (!user) {
          const email = newCustomer!.email || `venda-manual-${crypto.randomBytes(6).toString("hex")}@heartscouro.local`;
          const randomPassword = crypto.randomBytes(16).toString("hex");
          user = await tx.user.create({
            data: {
              name: newCustomer!.name,
              email,
              phone: newCustomer!.phone || null,
              password: await bcrypt.hash(randomPassword, 10),
              role: "CUSTOMER",
            },
          });
        }
        userId = user.id;
      }

      // Endereço
      const addressData = delivery === "RETIRADA"
        ? { name: "Retirada na loja", cpf: null, ...STORE_ADDRESS }
        : { name: newCustomer?.name ?? "Cliente", cpf: address!.cpf?.replace(/\D/g, "") || null, street: address!.street, number: address!.number, complement: address!.complement || "", district: address!.district, city: address!.city, state: address!.state, zipCode: address!.zipCode.replace(/\D/g, "") };

      const savedAddress = await tx.address.create({
        data: { userId, isDefault: false, ...addressData },
      });

      const catalogItems = items.filter((i): i is ManualItem & { productId: string } => !!i.productId);
      await decrementStockForItems(tx, catalogItems);

      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const finalShipping = delivery === "RETIRADA" ? 0 : Math.max(0, shipping || 0);
      const total = subtotal + finalShipping;

      const vendor = vendorId ? await tx.vendor.findUnique({ where: { id: vendorId } }) : null;
      const commissionValue = vendor ? subtotal * 0.05 : null;

      return tx.order.create({
        data: {
          userId,
          addressId: savedAddress.id,
          status: status || "PAID",
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
            create: items.map((item) => ({
              productId: item.productId || null,
              customName: item.productId ? null : (item.customName?.trim() || null),
              quantity: item.quantity,
              price: item.price,
              color: item.color || null,
              size: item.size || null,
              // Item avulso (sem produto do catalogo) nunca tem estoque pra descontar.
              skipStock: item.productId ? !!item.skipStock : true,
            })),
          },
        },
        include: { items: true },
      });
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
