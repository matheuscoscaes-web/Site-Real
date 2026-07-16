import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { isManualSale } from "@/lib/utils";
import { NovaVendaForm, type ExistingOrderData } from "../../nova/NovaVendaForm";

export default async function EditarVendaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      address: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (!order) notFound();
  if (!isManualSale(order.paymentMethod)) redirect(`/admin/pedidos/${id}`);

  const [customers, products, vendors] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, phone: true },
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        price: true,
        images: true,
        variants: { select: { id: true, color: true, size: true, stock: true } },
      },
    }),
    prisma.vendor.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, user: { select: { name: true } } },
    }),
  ]);

  const editOrder: ExistingOrderData = {
    id: order.id,
    customerName: order.user.name,
    customerEmail: order.user.email,
    delivery: order.shippingCarrier === "Loja" ? "RETIRADA" : "ENTREGA",
    address: {
      cpf: order.address.cpf ?? "",
      street: order.address.street,
      number: order.address.number,
      complement: order.address.complement ?? "",
      district: order.address.district,
      city: order.address.city,
      state: order.address.state,
      zipCode: order.address.zipCode,
    },
    shipping: order.shipping,
    items: order.items.map((item) => ({
      key: `existing-${item.id}`,
      productId: item.productId,
      productName: item.product?.name ?? item.customName ?? "Item",
      color: item.color,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
      skipStock: item.skipStock,
    })),
    paymentMethod: order.paymentMethod,
    status: order.status,
    vendorId: order.vendorId ?? "",
    notes: order.notes ?? "",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar Venda Manual</h1>
        <p className="text-sm text-gray-500 mt-1">Pedido #{order.id.slice(-8).toUpperCase()} — {order.user.name}</p>
      </div>
      <NovaVendaForm customers={customers} products={products} vendors={vendors} editOrder={editOrder} />
    </div>
  );
}
