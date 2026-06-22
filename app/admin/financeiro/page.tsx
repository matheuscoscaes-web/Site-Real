import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FinanceiroCharts } from "./FinanceiroCharts";
import { TrendingUp, ShoppingCart, Users, Package, Download } from "lucide-react";

async function getFinanceiroData() {
  const orders = await prisma.order.findMany({
    include: { items: { include: { product: true } }, user: true },
    orderBy: { createdAt: "asc" },
  });

  const paidOrders = orders.filter((o) => !["CANCELLED", "PENDING"].includes(o.status));

  const totalRevenue = paidOrders.reduce((s, o) => s + o.total, 0);
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
      revenue: monthOrders.reduce((s, o) => s + o.total, 0),
      orders: monthOrders.length,
    };
  });

  // Produtos mais vendidos
  const productSales: Record<string, { name: string; category: string; qty: number; revenue: number }> = {};
  for (const order of paidOrders) {
    for (const item of order.items) {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          name: item.product.name,
          category: item.product.category,
          qty: 0,
          revenue: 0,
        };
      }
      productSales[item.productId].qty += item.quantity;
      productSales[item.productId].revenue += item.price * item.quantity;
    }
  }
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Vendas por categoria
  const categorySales: Record<string, number> = {};
  for (const p of Object.values(productSales)) {
    categorySales[p.category] = (categorySales[p.category] || 0) + p.revenue;
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
    topProducts,
    categoryData,
    statusData,
  };
}

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
      <FinanceiroCharts monthlyData={data.monthlyData} categoryData={data.categoryData} />

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
                    <span className="badge bg-gray-100 text-gray-600 text-xs">{p.category}</span>
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
