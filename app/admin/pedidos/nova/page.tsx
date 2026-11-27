import { prisma } from "@/lib/prisma";
import { NovaVendaForm, TrocaPrefill } from "./NovaVendaForm";

export default async function NovaVendaPage({ searchParams }: { searchParams: Promise<{ troca?: string }> }) {
  const { troca: trocaId } = await searchParams;
  const original = trocaId
    ? await prisma.order.findUnique({
        where: { id: trocaId },
        include: { address: true, user: { select: { id: true, name: true, email: true, phone: true } } },
      })
    : null;
  // Troca: novo pedido pra mesma cliente, no mesmo endereço, sem cobrança. A peça
  // nova é escolhida no formulário e a etiqueta sai pelo Melhor Envio no pedido novo.
  const temEndereco = !!original?.address.zipCode;
  const troca: TrocaPrefill | undefined = original
    ? {
        originalCode: original.id.slice(-8).toUpperCase(),
        customer: original.user,
        delivery: temEndereco ? "ENTREGA" : "RETIRADA",
        address: {
          cpf: original.address.cpf ?? "",
          street: original.address.street,
          number: original.address.number,
          complement: original.address.complement ?? "",
          district: original.address.district,
          city: original.address.city,
          state: original.address.state,
          zipCode: original.address.zipCode,
        },
      }
    : undefined;

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
        <h1 className="text-2xl font-bold text-gray-900">{troca ? `Troca do pedido #${troca.originalCode}` : "Nova Venda Manual"}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {troca
            ? "Escolha a peça nova que vai pra cliente. Depois de salvar, gere a etiqueta (novo código de rastreio) na página do pedido novo."
            : "Registre uma venda feita fora do site (balcão, WhatsApp, etc.)"}
        </p>
      </div>
      <NovaVendaForm customers={customers} products={products} vendors={vendors} troca={troca} />
    </div>
  );
}
