import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

const STATUS_LIST = ["", "PENDING", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"];
const ORIGEM_LIST = [
  { value: "", label: "Todas as origens" },
  { value: "site", label: "Venda direta (site)" },
  { value: "vendedor", label: "Vendedores" },
  { value: "revendedor", label: "Revendedores" },
];

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; origem?: string; vendorId?: string }>;
}) {
  const { status, origem, vendorId } = await searchParams;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (vendorId) where.vendorId = vendorId;
  else if (origem === "site") where.vendorId = null;
  else if (origem === "vendedor") { where.vendorId = { not: null }; where.resellerId = null; }
  else if (origem === "revendedor") where.resellerId = { not: null };

  const [orders, vendors] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        address: true,
        items: { include: { product: true } },
        vendor: { include: { user: true } },
        reseller: { include: { user: true } },
      },
    }),
    prisma.vendor.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-sm text-gray-500 mt-1">{orders.length} pedido{orders.length !== 1 ? "s" : ""}{status ? ` com status "${ORDER_STATUS_LABELS[status]}"` : ""}</p>
        </div>
      </div>

      {/* Filtro por status */}
      <div className="flex flex-wrap gap-2 mb-3">
        {STATUS_LIST.map((s) => (
          <Link
            key={s || "all"}
            href={{ pathname: "/admin/pedidos", query: { ...(s ? { status: s } : {}), ...(origem ? { origem } : {}), ...(vendorId ? { vendorId } : {}) } }}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              status === s || (!s && !status)
                ? "bg-brand-700 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            {s ? ORDER_STATUS_LABELS[s] : "Todos"}
          </Link>
        ))}
      </div>

      {/* Filtro por origem */}
      <div className="flex flex-wrap gap-2 mb-2">
        {ORIGEM_LIST.map((o) => (
          <Link
            key={o.value || "all"}
            href={{ pathname: "/admin/pedidos", query: { ...(status ? { status } : {}), ...(o.value ? { origem: o.value } : {}) } }}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              (origem === o.value || (!o.value && !origem && !vendorId)) && !vendorId
                ? "bg-purple-700 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            {o.label}
          </Link>
        ))}
      </div>

      {/* Filtro por vendedor específico */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="text-xs text-gray-400">Vendedor:</span>
        <Link
          href={{ pathname: "/admin/pedidos", query: { ...(status ? { status } : {}) } }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            !vendorId ? "bg-gray-800 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
          }`}
        >
          Todos
        </Link>
        {vendors.map((v) => (
          <Link
            key={v.id}
            href={{ pathname: "/admin/pedidos", query: { ...(status ? { status } : {}), vendorId: v.id } }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              vendorId === v.id ? "bg-gray-800 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            {v.user.name}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pedido</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Cliente</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Origem</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Data</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-900 font-mono text-sm">#{order.id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400">{order.items.length} {order.items.length === 1 ? "item" : "itens"}</p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="text-sm font-medium text-gray-900">{order.user.name}</p>
                      <p className="text-xs text-gray-400">{order.user.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      {order.reseller ? (
                        <>
                          <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-lg block w-fit">Revendedor</span>
                          <p className="text-xs text-gray-400 mt-0.5">{order.reseller.user.name}</p>
                        </>
                      ) : order.vendor ? (
                        <>
                          <span className="text-xs bg-brand-50 text-brand-700 border border-brand-100 px-2 py-0.5 rounded-lg block w-fit">Vendedor</span>
                          <p className="text-xs text-gray-400 mt-0.5">{order.vendor.user.name}</p>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">Site (direto)</span>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <p className="text-sm text-gray-700">{formatDateTime(order.createdAt)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge text-xs ${ORDER_STATUS_COLORS[order.status]}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-900 text-sm">{formatCurrency(order.total)}</p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/admin/pedidos/${order.id}`} className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline font-medium">
                        Detalhes <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
