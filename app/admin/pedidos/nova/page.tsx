import { prisma } from "@/lib/prisma";
import { NovaVendaForm } from "./NovaVendaForm";

export default async function NovaVendaPage() {
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nova Venda Manual</h1>
        <p className="text-sm text-gray-500 mt-1">Registre uma venda feita fora do site (balcão, WhatsApp, etc.)</p>
      </div>
      <NovaVendaForm customers={customers} products={products} vendors={vendors} />
    </div>
  );
}
