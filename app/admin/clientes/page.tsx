import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate, displayEmail } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Search, Users } from "lucide-react";

// So vendas pagas contam (mesma regra do Financeiro): aguardando pagamento e
// canceladas ficam de fora do total gasto, da contagem e do ranking.
const PAID_ORDERS: Prisma.OrderWhereInput = { status: { notIn: ["CANCELLED", "PENDING"] } };

const PAGE_SIZE = 50;

export default async function AdminClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; pagina?: string }>;
}) {
  const { busca, pagina } = await searchParams;
  const termo = busca?.trim() ?? "";
  const page = Math.max(1, Number(pagina) || 1);

  const where: Prisma.UserWhereInput = { role: "CUSTOMER" };
  if (termo) {
    where.OR = [
      { name: { contains: termo, mode: "insensitive" } },
      { email: { contains: termo, mode: "insensitive" } },
      { phone: { contains: termo } },
    ];
  }

  // Antes carregava os ~2 mil clientes (com todos os pedidos) numa tela só, o que
  // deixava o painel lento. Agora: 50 por página + top 3 calculado direto no banco.
  const [total, customers, topSpent] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        orders: { where: PAID_ORDERS, select: { total: true, createdAt: true } },
        _count: { select: { orders: { where: PAID_ORDERS } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    termo || page > 1
      ? Promise.resolve([])
      : prisma.order.groupBy({
          by: ["userId"],
          where: { ...PAID_ORDERS, user: { role: "CUSTOMER" } },
          _sum: { total: true },
          _count: { _all: true },
          orderBy: { _sum: { total: "desc" } },
          take: 3,
        }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const topUsers = topSpent.length
    ? await prisma.user.findMany({
        where: { id: { in: topSpent.map((t) => t.userId) } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const topCustomers = topSpent
    .map((t) => {
      const u = topUsers.find((x) => x.id === t.userId);
      return u ? { ...u, totalSpent: t._sum.total ?? 0, _count: { orders: t._count._all } } : null;
    })
    .filter((c): c is NonNullable<typeof c> => !!c && c.totalSpent > 0);

  const enriched = customers.map((c) => ({
    ...c,
    totalSpent: c.orders.reduce((sum, o) => sum + o.total, 0),
    lastOrder: [...c.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null,
  }));

  const pageHref = (p: number) => {
    const qs = new URLSearchParams();
    if (termo) qs.set("busca", termo);
    if (p > 1) qs.set("pagina", String(p));
    const q = qs.toString();
    return q ? `/admin/clientes?${q}` : "/admin/clientes";
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clientes / CRM</h1>
        <p className="text-sm text-gray-500 mt-1">
          {total} cliente{total !== 1 ? "s" : ""}{termo ? ` encontrado${total !== 1 ? "s" : ""} para "${termo}"` : " cadastrados"}
        </p>
      </div>

      <form method="GET" className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            name="busca"
            defaultValue={termo}
            className="input-field pl-9 py-2 text-sm"
            placeholder="Buscar por nome, e-mail ou telefone..."
          />
        </div>
        <button type="submit" className="btn-primary text-sm py-2 px-4">Buscar</button>
        {termo && (
          <Link href="/admin/clientes" className="btn-ghost text-sm py-2 px-4">Limpar</Link>
        )}
      </form>

      {/* Top clientes */}
      {topCustomers.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {topCustomers.map((c, i) => (
          <Link key={c.id} href={`/admin/clientes/${c.id}`} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                {i + 1}°
              </span>
              <span className="text-xs text-gray-400">Top cliente · só vendas pagas</span>
            </div>
            <p className="font-bold text-gray-900 truncate">{c.name}</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{displayEmail(c.email)}</p>
            <p className="text-lg font-bold text-brand-700 mt-2">{formatCurrency(c.totalSpent)}</p>
            <p className="text-xs text-gray-400">{c._count.orders} pedido{c._count.orders !== 1 ? "s" : ""} pago{c._count.orders !== 1 ? "s" : ""}</p>
          </Link>
        ))}
      </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Telefone</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Pedidos</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Total gasto</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Última compra</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Cadastro</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enriched.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Users size={40} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">{termo ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}</p>
                  </td>
                </tr>
              ) : enriched.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[180px]">{displayEmail(c.email)}</p>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <p className="text-sm text-gray-600">{c.phone || "—"}</p>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <p className="text-sm font-medium text-gray-900">{c._count.orders}</p>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(c.totalSpent)}</p>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <p className="text-sm text-gray-600">{c.lastOrder ? formatDate(c.lastOrder.createdAt) : "—"}</p>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <p className="text-sm text-gray-600">{formatDate(c.createdAt)}</p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/admin/clientes/${c.id}`} className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline font-medium">
                      Ver <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 text-sm">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="inline-flex items-center gap-1 text-brand-600 font-medium hover:underline">
                <ChevronLeft size={14} /> Anterior
              </Link>
            ) : <span />}
            <span className="text-gray-500">Página {page} de {totalPages}</span>
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} className="inline-flex items-center gap-1 text-brand-600 font-medium hover:underline">
                Próxima <ChevronRight size={14} />
              </Link>
            ) : <span />}
          </div>
        )}
      </div>
    </div>
  );
}
