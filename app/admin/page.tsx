import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import {
  TrendingUp, ShoppingCart, Users, Package, AlertTriangle,
  Plus, ArrowUpRight, Eye, Clock,
} from "lucide-react";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";

async function getDashboardData() {
  const [orders, users, products, lowStock] = await Promise.all([
    prisma.order.findMany({
      include: { user: true, items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count({ where: { active: true } }),
    prisma.product.findMany({
      where: { active: true, stock: { lte: 5 } },
      orderBy: { stock: "asc" },
      take: 6,
    }),
  ]);

  const paid = orders.filter((o) => !["CANCELLED", "PENDING"].includes(o.status));
  const totalRevenue = paid.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status === "PENDING").length;
  const todayOrders = orders.filter((o) => {
    const d = new Date(o.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayRevenue = todayOrders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + o.total, 0);

  return {
    totalRevenue, pending, users, products,
    recentOrders: orders.slice(0, 8),
    lowStock,
    todayOrders: todayOrders.length,
    todayRevenue,
    totalOrders: paid.length,
  };
}

export default async function AdminHome() {
  const session = await getServerSession(authOptions);
  const d = await getDashboardData();

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-brand-700 to-brand-800 rounded-2xl p-6 text-white">
        <p className="text-brand-200 text-sm mb-1">{saudacao}, {session?.user.name.split(" ")[0]} 👋</p>
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
        <p className="text-brand-200 text-sm mt-1">Hearts Couro — visão geral do seu negócio</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Receita Total",
            value: formatCurrency(d.totalRevenue),
            sub: `Hoje: ${formatCurrency(d.todayRevenue)}`,
            icon: TrendingUp,
            color: "bg-green-500",
            href: "/admin/financeiro",
          },
          {
            label: "Pedidos",
            value: d.totalOrders,
            sub: `${d.pending} aguardando`,
            icon: ShoppingCart,
            color: "bg-blue-500",
            href: "/admin/pedidos",
          },
          {
            label: "Clientes",
            value: d.users,
            sub: "cadastrados",
            icon: Users,
            color: "bg-purple-500",
            href: "/admin/clientes",
          },
          {
            label: "Produtos",
            value: d.products,
            sub: `${d.lowStock.length} com estoque baixo`,
            icon: Package,
            color: "bg-brand-600",
            href: "/admin/produtos",
          },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon size={20} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">{stat.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
            <div className="flex items-center gap-1 text-brand-600 text-xs font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              Ver detalhes <ArrowUpRight size={12} />
            </div>
          </Link>
        ))}
      </div>

      {/* Ações rápidas */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/admin/produtos/novo", icon: Plus, label: "Novo Produto", color: "bg-brand-50 text-brand-700 hover:bg-brand-100 border-brand-200" },
            { href: "/admin/pedidos?status=PENDING", icon: Clock, label: "Ver Pendentes", color: "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200" },
            { href: "/admin/produtos", icon: Package, label: "Meus Produtos", color: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200" },
            { href: "/admin/clientes", icon: Users, label: "Clientes", color: "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200" },
          ].map((a) => (
            <Link key={a.href} href={a.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-semibold text-sm transition-colors ${a.color}`}>
              <a.icon size={18} /> {a.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pedidos recentes */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Pedidos Recentes</h2>
            <Link href="/admin/pedidos" className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">
              Ver todos <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {d.recentOrders.map((order) => (
              <Link key={order.id} href={`/admin/pedidos/${order.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm font-mono">#{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{order.user.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`badge text-xs hidden sm:inline-flex ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                  </div>
                  <Eye size={16} className="text-gray-300 group-hover:text-brand-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Estoque baixo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" /> Estoque Baixo
            </h2>
            <Link href="/admin/produtos" className="text-sm text-brand-600 font-medium hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {d.lowStock.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Estoque OK em todos os produtos</p>
            ) : d.lowStock.map((p) => (
              <Link key={p.id} href={`/admin/produtos/${p.id}/editar`} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{p.name}</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.stock === 0 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                  {p.stock === 0 ? "Esgotado" : `${p.stock} restantes`}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
