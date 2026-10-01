import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { FinanceiroCharts } from "./FinanceiroCharts";
import { TrendingUp, ShoppingCart, Users, Package, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { WELCOME_COUPON_CODE } from "@/lib/coupons";

const WELCOME_COUPON_FLAT_DEDUCTION = 15;
const NET_FACTOR = 0.75; // receita líquida estimada: 25% de custos

// ---------------------------------------------------------------------------
// Datas sempre no fuso de São Paulo: o servidor roda em UTC e um pedido feito
// às 23h do dia 15 não pode cair na quinzena (ou mês) seguinte.
// ---------------------------------------------------------------------------
function spDate(d: Date) {
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
}
// Chaves numéricas sequenciais: mês = y*12+(m-1); quinzena = y*24+(m-1)*2+(0|1)
const monthKeyOf = (d: Date) => { const { y, m } = spDate(d); return y * 12 + (m - 1); };
const fortnightKeyOf = (d: Date) => { const { y, m, day } = spDate(d); return y * 24 + (m - 1) * 2 + (day > 15 ? 1 : 0); };

const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
// "Setembro de 2026" (long) ou "set/26" (short)
const monthName = (y: number, m: number, style: "long" | "short" = "long") =>
  style === "long"
    ? `${MONTHS[m - 1].charAt(0).toUpperCase()}${MONTHS[m - 1].slice(1)} de ${y}`
    : `${MONTHS[m - 1].slice(0, 3)}/${String(y).slice(2)}`;
const monthInfo = (key: number) => {
  const y = Math.floor(key / 12);
  const m = (key % 12) + 1;
  const mm = String(m).padStart(2, "0");
  return { y, m, label: monthName(y, m), short: monthName(y, m, "short"), range: `01/${mm} a ${new Date(y, m, 0).getDate()}/${mm}`, param: `m-${y}-${mm}` };
};
const fortnightInfo = (key: number) => {
  const y = Math.floor(key / 24);
  const m = Math.floor((key % 24) / 2) + 1;
  const half = key % 2;
  const mm = String(m).padStart(2, "0");
  const n = half === 0 ? "1ª" : "2ª";
  return {
    y, m, half,
    label: `${n} quinzena de ${monthName(y, m).toLowerCase()}`,
    short: `${n} ${monthName(y, m, "short")}`,
    range: half === 0 ? `01/${mm} a 15/${mm}` : `16/${mm} a ${new Date(y, m, 0).getDate()}/${mm}`,
    param: `q-${y}-${mm}-${half + 1}`,
  };
};

// ---------------------------------------------------------------------------
// Dados brutos (cache de 5 min). O unstable_cache serializa em JSON, então as
// datas voltam como string — por isso guardamos ISO e convertemos na hora.
// ---------------------------------------------------------------------------
const getRawData = unstable_cache(
  async () => {
    const orders = await prisma.order.findMany({
      where: { status: { notIn: ["CANCELLED", "PENDING"] } },
      orderBy: { createdAt: "asc" },
      select: {
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
    const customers = await prisma.user.findMany({ where: { role: "CUSTOMER" }, select: { createdAt: true } });

    return {
      orders: orders.map((o) => ({
        // Pedidos com o cupom de boas-vindas contam receita com dedução fixa de R$15
        // em vez do total real, a pedido do usuário (2026-07-31).
        revenue: o.couponCode === WELCOME_COUPON_CODE ? Math.max(0, o.total - WELCOME_COUPON_FLAT_DEDUCTION) : o.total,
        shipping: o.shipping,
        createdAt: o.createdAt.toISOString(),
        items: o.items,
      })),
      customerDates: customers.map((c) => c.createdAt.toISOString()),
    };
  },
  ["financeiro-raw"],
  { revalidate: 300, tags: ["orders"] }
);

type Order = Awaited<ReturnType<typeof getRawData>>["orders"][number];

function summarize(list: Order[]) {
  const revenue = list.reduce((s, o) => s + o.revenue, 0);
  return {
    revenue,
    net: revenue * NET_FACTOR,
    shipping: list.reduce((s, o) => s + o.shipping, 0),
    orders: list.length,
    avgTicket: list.length > 0 ? revenue / list.length : 0,
  };
}

// ---------------------------------------------------------------------------
// Período escolhido na URL: ?periodo=m-2026-09 (mês) ou q-2026-09-1 (quinzena)
// ---------------------------------------------------------------------------
type Period =
  | { kind: "all" }
  | { kind: "month"; key: number }
  | { kind: "fortnight"; key: number };

function parsePeriod(raw: string | undefined): Period {
  const m = raw?.match(/^m-(\d{4})-(\d{2})$/);
  if (m) return { kind: "month", key: +m[1] * 12 + (+m[2] - 1) };
  const q = raw?.match(/^q-(\d{4})-(\d{2})-([12])$/);
  if (q) return { kind: "fortnight", key: +q[1] * 24 + (+q[2] - 1) * 2 + (+q[3] - 1) };
  return { kind: "all" };
}

const hrefFor = (p: Period) =>
  p.kind === "all" ? "/admin/financeiro" : `/admin/financeiro?periodo=${(p.kind === "month" ? monthInfo(p.key) : fortnightInfo(p.key)).param}`;

function Delta({ now, before, label }: { now: number; before: number; label: string }) {
  if (before <= 0) return <p className="text-xs text-gray-400 mt-1">sem base no período anterior</p>;
  const pct = ((now - before) / before) * 100;
  if (Math.abs(pct) < 0.5) return <p className="text-xs mt-1 text-gray-400"><span className="font-semibold">= igual</span> a {label}</p>;
  return (
    <p className="text-xs mt-1">
      <span className={pct >= 0 ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
        {pct >= 0 ? "▲ +" : "▼ "}
        {pct.toFixed(0)}%
      </span>{" "}
      <span className="text-gray-400">vs {label}</span>
    </p>
  );
}

export default async function FinanceiroPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const { periodo } = await searchParams;
  const { orders, customerDates } = await getRawData();
  const now = new Date();
  const currentMonth = monthKeyOf(now);
  const currentFortnight = fortnightKeyOf(now);

  // Período no futuro não faz sentido: volta pro atual
  const parsed = parsePeriod(periodo);
  const period: Period =
    parsed.kind === "month" && parsed.key > currentMonth ? { kind: "month", key: currentMonth }
    : parsed.kind === "fortnight" && parsed.key > currentFortnight ? { kind: "fortnight", key: currentFortnight }
    : parsed;

  // Pré-calcula as chaves de cada pedido uma vez só
  const keyed = orders.map((o) => {
    const d = new Date(o.createdAt);
    return { o, month: monthKeyOf(d), fortnight: fortnightKeyOf(d) };
  });
  const ordersIn = (p: Period) =>
    p.kind === "all"
      ? orders
      : keyed.filter((k) => (p.kind === "month" ? k.month : k.fortnight) === p.key).map((k) => k.o);

  const selected = ordersIn(period);
  const prevPeriod = period.kind === "all" ? null : { ...period, key: period.key - 1 };
  const prevSummary = prevPeriod ? summarize(ordersIn(prevPeriod)) : null;
  const summary = summarize(selected);

  const info = period.kind === "month" ? monthInfo(period.key) : period.kind === "fortnight" ? fortnightInfo(period.key) : null;
  const prevInfo = prevPeriod
    ? (prevPeriod.kind === "month" ? monthInfo(prevPeriod.key) : fortnightInfo(prevPeriod.key))
    : null;
  const isCurrent =
    (period.kind === "month" && period.key === currentMonth) || (period.kind === "fortnight" && period.key === currentFortnight);

  const newCustomers =
    period.kind === "all"
      ? customerDates.length
      : customerDates.filter((iso) => {
          const d = new Date(iso);
          return (period.kind === "month" ? monthKeyOf(d) : fortnightKeyOf(d)) === period.key;
        }).length;

  // Produtos mais rentáveis e vendas por categoria — do período escolhido
  const productSales: Record<string, { name: string; categories: string[]; qty: number; revenue: number }> = {};
  for (const order of selected) {
    for (const item of order.items) {
      if (!item.productId || !item.product) continue; // item avulso, sem produto do catálogo pra contabilizar
      const ps = (productSales[item.productId] ??= { name: item.product.name, categories: item.product.categories, qty: 0, revenue: 0 });
      ps.qty += item.quantity;
      ps.revenue += item.price * item.quantity;
    }
  }
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const categorySales: Record<string, number> = {};
  for (const p of Object.values(productSales)) {
    for (const cat of p.categories) categorySales[cat] = (categorySales[cat] || 0) + p.revenue;
  }
  const categoryData = Object.entries(categorySales).map(([name, value]) => ({ name, value }));

  // Tabelas/gráficos de histórico: últimos 12 meses e últimas 12 quinzenas
  const byMonth = new Map<number, Order[]>();
  const byFortnight = new Map<number, Order[]>();
  for (const k of keyed) {
    if (!byMonth.has(k.month)) byMonth.set(k.month, []);
    byMonth.get(k.month)!.push(k.o);
    if (!byFortnight.has(k.fortnight)) byFortnight.set(k.fortnight, []);
    byFortnight.get(k.fortnight)!.push(k.o);
  }
  const monthRows = Array.from({ length: 12 }, (_, i) => {
    const key = currentMonth - 11 + i;
    return { key, ...monthInfo(key), current: key === currentMonth, ...summarize(byMonth.get(key) ?? []) };
  });
  const fortnightRows = Array.from({ length: 12 }, (_, i) => {
    const key = currentFortnight - 11 + i;
    return { key, ...fortnightInfo(key), current: key === currentFortnight, ...summarize(byFortnight.get(key) ?? []) };
  });

  const scope = info ? (isCurrent ? `${info.range} · em andamento` : info.range) : "todo o histórico";
  const stats = [
    { label: "Receita Bruta", value: formatCurrency(summary.revenue), icon: TrendingUp, color: "bg-green-500", sub: "pedidos pagos", delta: prevSummary && [summary.revenue, prevSummary.revenue] },
    { label: "Receita Líquida (est.)", value: formatCurrency(summary.net), icon: TrendingUp, color: "bg-emerald-500", sub: "após custos estimados (25%)", delta: prevSummary && [summary.net, prevSummary.net] },
    { label: "Pedidos", value: summary.orders, icon: ShoppingCart, color: "bg-blue-500", sub: "pedidos pagos", delta: prevSummary && [summary.orders, prevSummary.orders] },
    { label: "Ticket Médio", value: formatCurrency(summary.avgTicket), icon: Package, color: "bg-purple-500", sub: "por pedido", delta: prevSummary && [summary.avgTicket, prevSummary.avgTicket] },
    { label: period.kind === "all" ? "Clientes" : "Novos clientes", value: newCustomers, icon: Users, color: "bg-brand-600", sub: period.kind === "all" ? "cadastrados" : "cadastros no período", delta: null },
    { label: "Receita de Frete", value: formatCurrency(summary.shipping), icon: Package, color: "bg-orange-500", sub: "frete cobrado", delta: prevSummary && [summary.shipping, prevSummary.shipping] },
  ];

  const tab = (active: boolean) =>
    `px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`;
  const arrow = "w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-brand-300 hover:text-brand-700 transition-colors";

  const th = "text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider";
  const historyTable = (
    title: string,
    subtitle: string,
    rows: (typeof monthRows[number] | typeof fortnightRows[number])[],
    kind: "month" | "fortnight"
  ) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6">
      <div className="p-5 border-b border-gray-100">
        <h2 className="font-bold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className={th}>{kind === "month" ? "Mês" : "Quinzena"}</th>
              <th className={th}>Pedidos</th>
              <th className={th}>Receita Bruta</th>
              <th className={`${th} hidden sm:table-cell`}>Líquida (est.)</th>
              <th className={`${th} hidden md:table-cell`}>Ticket Médio</th>
              <th className={`${th} hidden md:table-cell`}>Frete</th>
              <th className={th}>vs anterior</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[...rows].reverse().map((r, i, arr) => {
              const prev = arr[i + 1];
              const diff = prev && prev.revenue > 0 ? ((r.revenue - prev.revenue) / prev.revenue) * 100 : null;
              const selectedRow = period.kind === kind && period.key === r.key;
              return (
                <tr key={r.key} className={selectedRow ? "bg-brand-50" : "hover:bg-gray-50 transition-colors"}>
                  <td className="px-5 py-3">
                    <Link href={hrefFor({ kind, key: r.key })} className="block group" title="Ver este período no painel">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-brand-700 group-hover:underline">
                        {kind === "month" ? r.label : r.short}
                        {r.current && <span className="ml-2 badge bg-brand-100 text-brand-700 text-xs no-underline">em andamento</span>}
                      </p>
                      <p className="text-xs text-gray-400">{r.range}</p>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold text-gray-900">{r.orders}</td>
                  <td className="px-5 py-3 text-sm font-bold text-gray-900">{formatCurrency(r.revenue)}</td>
                  <td className="px-5 py-3 text-sm text-gray-700 hidden sm:table-cell">{formatCurrency(r.net)}</td>
                  <td className="px-5 py-3 text-sm text-gray-700 hidden md:table-cell">{formatCurrency(r.avgTicket)}</td>
                  <td className="px-5 py-3 text-sm text-gray-700 hidden md:table-cell">{formatCurrency(r.shipping)}</td>
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
  );

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

      {/* Seletor de período */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
        <div className="inline-flex bg-gray-100 rounded-xl p-1 self-start">
          <Link href={hrefFor({ kind: "all" })} className={tab(period.kind === "all")}>Tudo</Link>
          <Link href={hrefFor({ kind: "month", key: currentMonth })} className={tab(period.kind === "month")}>Por mês</Link>
          <Link href={hrefFor({ kind: "fortnight", key: currentFortnight })} className={tab(period.kind === "fortnight")}>Por quinzena</Link>
        </div>

        {period.kind === "all" ? (
          <p className="text-sm text-gray-500">Mostrando <span className="font-semibold text-gray-900">todo o histórico</span> de vendas pagas</p>
        ) : (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Link href={hrefFor({ ...period, key: period.key - 1 })} className={arrow} aria-label="Período anterior">
              <ChevronLeft size={18} />
            </Link>
            <div className="text-center flex-1 sm:flex-none sm:min-w-[190px] px-2">
              <p className="font-bold text-gray-900 leading-tight">{info!.label}</p>
              <p className="text-xs text-gray-400">{scope}</p>
            </div>
            {isCurrent ? (
              <span className={`${arrow} opacity-30 pointer-events-none`} aria-hidden><ChevronRight size={18} /></span>
            ) : (
              <Link href={hrefFor({ ...period, key: period.key + 1 })} className={arrow} aria-label="Próximo período">
                <ChevronRight size={18} />
              </Link>
            )}
            {!isCurrent && (
              <Link
                href={hrefFor({ ...period, key: period.kind === "month" ? currentMonth : currentFortnight })}
                className="hidden sm:inline text-xs font-semibold text-brand-700 hover:underline ml-1"
              >
                Ir para o atual
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Stats do período */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-9 h-9 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon size={18} className="text-white" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">{stat.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
            {stat.delta && prevInfo && (
              <Delta now={stat.delta[0]} before={stat.delta[1]} label={prevInfo.short} />
            )}
          </div>
        ))}
      </div>

      {/* Gráficos (histórico) */}
      <FinanceiroCharts
        monthlyData={monthRows.slice(-6).map((r) => ({ label: r.short, revenue: r.revenue, orders: r.orders }))}
        fortnightData={fortnightRows.map((r) => ({ label: r.short, revenue: r.revenue, orders: r.orders }))}
        categoryData={categoryData}
        categoryTitle={info ? `Vendas por categoria · ${info.short}` : "Vendas por categoria"}
      />

      {historyTable("Resultado por mês", "Últimos 12 meses · clique num mês para ver os detalhes dele no painel", monthRows, "month")}
      {historyTable("Resultado por quinzena", "1ª quinzena: dia 1 a 15 · 2ª quinzena: dia 16 ao fim do mês · clique para ver os detalhes", fortnightRows, "fortnight")}

      {/* Top produtos do período */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Produtos mais rentáveis</h2>
          <span className="text-xs text-gray-400">{info ? info.label : "todo o histórico"}</span>
        </div>
        {topProducts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Nenhuma venda paga neste período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className={th}>#</th>
                  <th className={th}>Produto</th>
                  <th className={`${th} hidden sm:table-cell`}>Categoria</th>
                  <th className={th}>Qtd vendida</th>
                  <th className={th}>Receita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topProducts.map((p, i) => (
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
        )}
      </div>
    </div>
  );
}
