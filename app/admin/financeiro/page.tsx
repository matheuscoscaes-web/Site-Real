import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FinanceiroCharts } from "./FinanceiroCharts";
import { TrendingUp, ShoppingCart, Users, Package, Download } from "lucide-react";
import { WELCOME_COUPON_CODE } from "@/lib/coupons";

const WELCOME_COUPON_FLAT_DEDUCTION = 15;

const getFinanceiroData = unstable_cache(
  async () => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      status: true,
      total: true,
      shipping: true,
      couponCode: true,
      createdAt: true,
      items: {
        select: {
          productId: true,
          price: true,
          quantity: true,
          product: { select: { name: true, categories: true } },
        },
      },
    },
  });

  const paidOrders = orders.filter((o) => !["CANCELLED", "PENDING"].includes(o.status));

  // Pedidos com o cupom de boas-vindas contam receita com deducao fixa de R$15
  // em vez do total real, a pedido do usuario (2026-07-31).
  const revenueOf = (o: { total: number; couponCode: string | null }) =>
    o.couponCode === WELCOME_COUPON_CODE ? Math.max(0, o.total - WELCOME_COUPON_FLAT_DEDUCTION) : o.total;

  const totalRevenue = paidOrders.reduce((s, o) => s + revenueOf(o), 0);
  const totalShipping = paidOrders.reduce((s, o) => s + o.shipping, 0);
  const estimatedNet = totalRevenue * 0.75; // estimativa com 25% de custos
  const avgTicket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
  const totalOrders = paidOrders.length;
  const totalCustomers = await prisma.user.count({ where: { role: "CUSTOMER" } });

  // Vendas por mês (últimos 6 meses)
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    const monthOrders = paidOrders.filter((o) => {
      const od = new Date(o.createdAt);
      return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
    });
    return {
      label,
      revenue: monthOrders.reduce((s, o) => s + revenueOf(o), 0),
      orders: monthOrders.length,
    };
  });

  // Faturamento por quinzena (ultimas 12 = ~6 meses). Dia 1-15 = 1a quinzena,
  // 16-fim do mes = 2a. Datas no fuso de Sao Paulo pra pedido feito perto da
  // meia-noite nao cair na quinzena errada (servidor roda em UTC).
  const spDate = (d: Date) => {
    const [y, m, day] = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .format(d)
      .split("-")
      .map(Number);
    return { y, m, day };
  };
  const fortnightKey = (d: Date) => {
    const { y, m, day } = spDate(d);
    return y * 24 + (m - 1) * 2 + (day > 15 ? 1 : 0);
  };
  const currentFortnight = fortnightKey(now);
  const fortnightBuckets = new Map<number, typeof paidOrders>();
  for (const o of paidOrders) {
    const key = fortnightKey(new Date(o.createdAt));
    if (key < currentFortnight - 11) continue;
    if (!fortnightBuckets.has(key)) fortnightBuckets.set(key, []);
    fortnightBuckets.get(key)!.push(o);
  }
  const fortnightData = Array.from({ length: 12 }, (_, i) => {
    const key = currentFortnight - 11 + i;
    const y = Math.floor(key / 24);
    const m = Math.floor((key % 24) / 2) + 1;
    const half = key % 2;
    const lastDay = new Date(y, m, 0).getDate();
    const mm = String(m).padStart(2, "0");
    const monthLabel = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    const list = fortnightBuckets.get(key) ?? [];
    const revenue = list.reduce((s, o) => s + revenueOf(o), 0);
    return {
      label: `${half === 0 ? "1ª" : "2ª"} ${monthLabel}`,
      range: half === 0 ? `01/${mm} a 15/${mm}` : `16/${mm} a ${lastDay}/${mm}`,
      current: key === currentFortnight,
      revenue,
      net: revenue * 0.75,
      shipping: list.reduce((s, o) => s + o.shipping, 0),
      orders: list.length,
      avgTicket: list.length > 0 ? revenue / list.length : 0,
    };
  });

  // Produtos mais vendidos
  const productSales: Record<string, { name: string; categories: string[]; qty: number; revenue: number }> = {};
  for (const order of paidOrders) {
    for (const item of order.items) {
      if (!item.productId || !item.product) continue; // item avulso, sem produto do catalogo pra contabilizar

      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          name: item.product.name,
          categories: item.product.categories,
          qty: 0,
          revenue: 0,
        };
      }
      productSales[item.productId].qty += item.quantity;
      productSales[item.productId].revenue += item.price * item.quantity;
    }
  }
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Vendas por categoria (produto com mais de uma categoria conta em cada uma)
  const categorySales: Record<string, number> = {};
  for (const p of Object.values(productSales)) {
    for (const cat of p.categories) {
      categorySales[cat] = (categorySales[cat] || 0) + p.revenue;
    }
  }
  const categoryData = Object.entries(categorySales).map(([name, value]) => ({ name, value }));

  // Status dos pedidos (todos)
  const statusData: Record<string, number> = {};
  for (const o of orders) {
    statusData[o.status] = (statusData[o.status] || 0) + 1;
  }

  return {
    totalRevenue,
    totalShipping,
    estimatedNet,
    avgTicket,
    totalOrders,
    totalCustomers,
    monthlyData,
    fortnightData,
    topProducts,
    categoryData,
    statusData,
  };
  },
  ["financeiro-dashboard"],
  { revalidate: 300, tags: ["orders"] }
);

export default async function FinanceiroPage() {
  const data = await getFinanceiroData();

  const stats = [
    { label: "Receita Bruta", value: formatCurrency(data.totalRevenue), icon: TrendingUp, color: "bg-green-500", sub: "pedidos pagos e entregues" },
    { label: "Receita Líquida (est.)", value: formatCurrency(data.estimatedNet), icon: TrendingUp, color: "bg-emerald-500", sub: "após custos estimados (25%)" },
    { label: "Pedidos", value: data.totalOrders, icon: ShoppingCart, color: "bg-blue-500", sub: "pedidos confirmados" },
    { label: "Ticket Médio", value: formatCurrency(data.avgTicket), icon: Package, color: "bg-purple-500", sub: "por pedido" },
    { label: "Clientes", value: data.totalCustomers, icon: Users, color: "bg-brand-600", sub: "cadastrados" },
    { label: "Receita de Frete", value: formatCurrency(data.totalShipping), icon: Package, color: "bg-orange-500", sub: "frete cobrado total" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h1>
          <p className="text-sm text-gray-500 mt-1">Visão completa das vendas e receitas</p>
        </div>
        <button className="btn-outline text-sm py-2.5 flex items-center gap-2">
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-9 h-9 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon size={18} className="text-white" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">{stat.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <FinanceiroCharts monthlyData={data.monthlyData} fortnightData={data.fortnightData} categoryData={data.categoryData} />

      {/* Resultado por quinzena */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Resultado por quinzena</h2>
          <p className="text-xs text-gray-400 mt-0.5">1ª quinzena: dia 1 a 15 · 2ª quinzena: dia 16 ao fim do mês</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quinzena</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pedidos</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Receita Bruta</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Líquida (est.)</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Ticket Médio</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Frete</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">vs anterior</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...data.fortnightData].reverse().map((f, i, arr) => {
                const prev = arr[i + 1];
                const diff = prev && prev.revenue > 0 ? ((f.revenue - prev.revenue) / prev.revenue) * 100 : null;
                return (
                  <tr key={f.label} className={f.current ? "bg-brand-50/50" : "hover:bg-gray-50 transition-colors"}>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-900">
                        {f.label}
                        {f.current && <span className="ml-2 badge bg-brand-100 text-brand-700 text-xs">em andamento</span>}
                      </p>
                      <p className="text-xs text-gray-400">{f.range}</p>
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-900">{f.orders}</td>
                    <td className="px-5 py-3 text-sm font-bold text-gray-900">{formatCurrency(f.revenue)}</td>
                    <td className="px-5 py-3 text-sm text-gray-700 hidden sm:table-cell">{formatCurrency(f.net)}</td>
                    <td className="px-5 py-3 text-sm text-gray-700 hidden md:table-cell">{formatCurrency(f.avgTicket)}</td>
                    <td className="px-5 py-3 text-sm text-gray-700 hidden md:table-cell">{formatCurrency(f.shipping)}</td>
                    <td className="px-5 py-3 text-sm font-semibold">
                      {diff === null ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <span className={diff >= 0 ? "text-green-600" : "text-red-500"}>
                          {diff >= 0 ? "+" : ""}
                          {diff.toFixed(0)}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top produtos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Produtos mais rentáveis</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Produto</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Categoria</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Qtd vendida</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Receita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.topProducts.map((p, i) => (
                <tr key={p.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-gray-900 max-w-[200px] truncate">{p.name}</p>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <span className="badge bg-gray-100 text-gray-600 text-xs">{p.categories.join(", ")}</span>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-semibold text-gray-900">{p.qty}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(p.revenue)}</p>
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
