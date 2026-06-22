import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ChevronRight, Users } from "lucide-react";

export default async function AdminClientesPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: {
      orders: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const enriched = customers.map((c) => ({
    ...c,
    totalSpent: c.orders.reduce((sum, o) => sum + o.total, 0),
    lastOrder: c.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null,
  }));

  const topCustomers = [...enriched].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 3);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clientes / CRM</h1>
        <p className="text-sm text-gray-500 mt-1">{customers.length} clientes cadastrados</p>
      </div>

      {/* Top clientes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {topCustomers.map((c, i) => (
          <Link key={c.id} href={`/admin/clientes/${c.id}`} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                {i + 1}°
              </span>
              <span className="text-xs text-gray-400">Top cliente</span>
            </div>
            <p className="font-bold text-gray-900 truncate">{c.name}</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{c.email}</p>
            <p className="text-lg font-bold text-brand-700 mt-2">{formatCurrency(c.totalSpent)}</p>
            <p className="text-xs text-gray-400">{c._count.orders} pedidos</p>
          </Link>
        ))}
      </div>

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
                    <p className="text-gray-400 text-sm">Nenhum cliente cadastrado ainda.</p>
                  </td>
                </tr>
              ) : enriched.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[180px]">{c.email}</p>
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
      </div>
    </div>
  );
}
