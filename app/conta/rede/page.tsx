"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Tag, Users, Plus, X, Loader2, Check, Copy, CheckCheck,
  TrendingUp, Pencil, ChevronDown, ChevronUp, DollarSign,
  BarChart2, ShoppingBag, Calendar, Award
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

type OrderSummary = {
  id: string; total: number; subtotal?: number; shipping?: number;
  commissionValue: number | null; couponCode?: string | null;
  couponDiscount?: number | null; paymentMethod?: string;
  createdAt: string; status: string;
};

type Reseller = {
  id: string; couponCode: string | null; discount: number | null;
  active: boolean; createdAt: string;
  user: { id: string; name: string; email: string; phone?: string };
  orders: OrderSummary[];
};

type VendorData = {
  id: string; couponCode: string | null; discount: number | null; active: boolean;
  resellers: Reseller[];
  orders: OrderSummary[];
  user: { name: string; email: string };
};

type RedeData =
  | { role: "VENDOR"; vendor: VendorData }
  | { role: "ADMIN"; vendors: VendorData[] }
  | {
      role: "RESELLER";
      reseller: {
        couponCode: string | null; discount: number | null;
        vendor: { user: { name: string; email: string } };
        orders: OrderSummary[];
      };
    };

function getMonthlyBreakdown(orders: OrderSummary[]) {
  const map: Record<string, { label: string; count: number; revenue: number; commission: number }> = {};
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    if (!map[key]) map[key] = { label, count: 0, revenue: 0, commission: 0 };
    map[key].count++;
    map[key].revenue += o.total;
    map[key].commission += o.commissionValue ?? 0;
  });
  return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6).map(([, v]) => v);
}

export default function MinhaRedePage() {
  const { data: session } = useSession();
  const [data, setData] = useState<RedeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"rede" | "crm">("rede");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [showConfig, setShowConfig] = useState(false);
  const [configForm, setConfigForm] = useState({ couponCode: "", discount: "10" });
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState("");
  const [copied, setCopied] = useState(false);
  const [expandedReseller, setExpandedReseller] = useState<string | null>(null);

  async function loadData() {
    const d = await fetch("/api/conta/rede").then((r) => r.json());
    setData(d); setLoading(false);
  }
  useEffect(() => { loadData(); }, []);

  async function handleSubmitReseller(e: React.FormEvent) {
    e.preventDefault(); setFormError(""); setSubmitting(true);
    const body = session?.user.role === "ADMIN" ? { ...form, vendorId: selectedVendorId } : form;
    const res = await fetch("/api/conta/rede/revendedores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSubmitting(false);
    if (res.ok) { setShowForm(false); setForm({ name: "", email: "", password: "", phone: "" }); await loadData(); }
    else { const d = await res.json(); setFormError(d.error || "Erro ao cadastrar"); }
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault(); setConfigError(""); setConfigLoading(true);
    const res = await fetch("/api/conta/rede/configurar", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(configForm) });
    setConfigLoading(false);
    if (res.ok) { setShowConfig(false); await loadData(); }
    else { const d = await res.json(); setConfigError(d.error || "Erro ao salvar"); }
  }

  function copyCoupon(code: string) { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-brand-600" /></div>;
  if (!data) return null;

  // ── REVENDEDOR ────────────────────────────────────────────────
  if (data.role === "RESELLER") {
    const { reseller } = data;
    const configured = !!reseller.couponCode;
    const allOrders = reseller.orders;
    const totalRevenue = allOrders.reduce((s, o) => s + o.total, 0);
    const totalCount = allOrders.length;
    const lastOrder = allOrders[0];
    const monthly = getMonthlyBreakdown(allOrders);

    return (
      <div className="space-y-5">
        {/* Aviso pagamento de comissão */}
        <div className="rounded-2xl bg-green-50 border border-green-200 px-5 py-4 flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">💰</span>
          <div>
            <p className="font-bold text-green-800 text-sm">Pagamento de comissão semanal</p>
            <p className="text-sm text-green-700 mt-0.5">
              Suas comissões são pagas <strong>toda sexta-feira às 18h</strong>. Acompanhe suas vendas aqui e receba semanalmente.
            </p>
          </div>
        </div>

        {/* Cupom */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Meu Cupom</h2>
            {configured && !showConfig && (
              <button onClick={() => { setConfigForm({ couponCode: reseller.couponCode!, discount: String(reseller.discount) }); setShowConfig(true); setConfigError(""); }}
                className="flex items-center gap-1.5 text-sm text-brand-600 hover:underline">
                <Pencil size={14} /> Editar
              </button>
            )}
          </div>
          {!configured ? (
            <div>
              <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700 mb-4">
                Configure seu cupom para começar a vender. Você escolhe o desconto que vai oferecer aos clientes.
              </div>
              {!showConfig
                ? <button onClick={() => setShowConfig(true)} className="btn-primary flex items-center gap-2"><Tag size={16} /> Configurar meu cupom</button>
                : <ConfigForm form={configForm} setForm={setConfigForm} onSubmit={handleSaveConfig} onCancel={() => setShowConfig(false)} loading={configLoading} error={configError} />
              }
            </div>
          ) : showConfig ? (
            <ConfigForm form={configForm} setForm={setConfigForm} onSubmit={handleSaveConfig} onCancel={() => setShowConfig(false)} loading={configLoading} error={configError} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Tag size={16} className="text-gray-600" /></div>
                <div className="flex-1 min-w-0"><p className="text-xs text-gray-400">Seu cupom</p><p className="font-mono font-bold text-gray-900">{reseller.couponCode}</p></div>
                <button onClick={() => copyCoupon(reseller.couponCode!)} className="text-gray-400 hover:text-brand-600 flex-shrink-0">
                  {copied ? <CheckCheck size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 mb-1">Desconto ao cliente</p>
                <p className="text-lg font-bold text-gray-700">{reseller.discount}%</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 mb-1">Vendedor responsável</p>
                <p className="font-semibold text-gray-900 text-sm">{reseller.vendor.user.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* CRM */}
        {configured && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard icon={ShoppingBag} color="brand" label="Total de vendas" value={String(totalCount)} sub="com seu cupom" />
              <StatCard icon={DollarSign} color="green" label="Volume gerado" value={formatCurrency(totalRevenue)} sub="valor total das vendas" />
              <div className="col-span-2 sm:col-span-1">
                <StatCard icon={Calendar} color="purple" label="Última venda" value={lastOrder ? formatDate(lastOrder.createdAt) : "—"} sub={lastOrder ? formatCurrency(lastOrder.total) : "nenhuma venda ainda"} />
              </div>
            </div>

            {/* Quebra mensal */}
            {monthly.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 size={18} className="text-brand-600" />
                  <h3 className="font-bold text-gray-900">Vendas por mês</h3>
                </div>
                <div className="space-y-2">
                  {monthly.map((m) => {
                    const pct = Math.round((m.revenue / (monthly[0]?.revenue || 1)) * 100);
                    return (
                      <div key={m.label}>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span className="capitalize font-medium">{m.label}</span>
                          <span>{m.count} venda{m.count !== 1 ? "s" : ""} · <strong className="text-gray-800">{formatCurrency(m.revenue)}</strong></span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Vendas recentes */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <TrendingUp size={16} className="text-green-500" />
                <h3 className="font-bold text-gray-900">Vendas recentes</h3>
              </div>
              {allOrders.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Nenhuma venda com seu cupom ainda.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {allOrders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-mono font-bold text-gray-800">#{o.id.slice(-6).toUpperCase()}</p>
                        <p className="text-xs text-gray-400">{formatDate(o.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-sm">{formatCurrency(o.total)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.status === "PAID" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                          {o.status === "PAID" ? "Pago" : "Pendente"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── VENDOR ────────────────────────────────────────────────────
  if (data.role === "VENDOR") {
    const { vendor } = data;
    const configured = !!vendor.couponCode;
    const myCommission = configured ? 50 - (vendor.discount ?? 0) : null;

    const directOrders = vendor.orders;
    const allResellerOrders = vendor.resellers.flatMap((r) => r.orders);
    const allOrders = [...directOrders, ...allResellerOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const directCommission = directOrders.reduce((s, o) => s + (o.commissionValue ?? 0), 0);
    const resellerCommission = allResellerOrders.reduce((s, o) => s + (o.commissionValue ?? 0), 0);
    const totalCommission = directCommission + resellerCommission;

    const monthlyDirect = getMonthlyBreakdown(directOrders);
    const monthlyReseller = getMonthlyBreakdown(allResellerOrders);
    const monthlyAll = getMonthlyBreakdown(allOrders);

    const topResellers = [...vendor.resellers]
      .sort((a, b) => b.orders.reduce((s, o) => s + (o.commissionValue ?? 0), 0) - a.orders.reduce((s, o) => s + (o.commissionValue ?? 0), 0))
      .slice(0, 5);

    return (
      <div className="space-y-5">
        {/* Tabs */}
        {configured && (
          <div className="flex gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5">
            <button onClick={() => setTab("rede")} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab === "rede" ? "bg-brand-600 text-white shadow" : "text-gray-500 hover:text-gray-800"}`}>
              <Users size={16} /> Minha Rede
            </button>
            <button onClick={() => setTab("crm")} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab === "crm" ? "bg-brand-600 text-white shadow" : "text-gray-500 hover:text-gray-800"}`}>
              <BarChart2 size={16} /> CRM
            </button>
          </div>
        )}

        {/* ── ABA REDE ── */}
        {(tab === "rede" || !configured) && (
          <>
            {/* Config cupom */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Meu Cupom</h2>
                {configured && !showConfig && (
                  <button onClick={() => { setConfigForm({ couponCode: vendor.couponCode!, discount: String(vendor.discount) }); setShowConfig(true); setConfigError(""); }}
                    className="flex items-center gap-1.5 text-sm text-brand-600 hover:underline">
                    <Pencil size={14} /> Editar
                  </button>
                )}
              </div>
              {!configured ? (
                <div>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700 mb-4">
                    Configure seu cupom para começar a vender e cadastrar revendedores.
                  </div>
                  {!showConfig
                    ? <button onClick={() => setShowConfig(true)} className="btn-primary flex items-center gap-2"><Tag size={16} /> Configurar meu cupom</button>
                    : <ConfigForm form={configForm} setForm={setConfigForm} onSubmit={handleSaveConfig} onCancel={() => setShowConfig(false)} loading={configLoading} error={configError} />
                  }
                </div>
              ) : showConfig ? (
                <ConfigForm form={configForm} setForm={setConfigForm} onSubmit={handleSaveConfig} onCancel={() => setShowConfig(false)} loading={configLoading} error={configError} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Tag size={16} className="text-gray-600" /></div>
                    <div className="flex-1 min-w-0"><p className="text-xs text-gray-400">Código do cupom</p><p className="font-mono font-bold text-gray-900">{vendor.couponCode}</p></div>
                    <button onClick={() => copyCoupon(vendor.couponCode!)} className="text-gray-400 hover:text-brand-600 flex-shrink-0">
                      {copied ? <CheckCheck size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-400 mb-1">Desconto ao cliente</p>
                    <p className="text-lg font-bold text-gray-700">{vendor.discount}%</p>
                  </div>
                  <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                    <p className="text-xs text-green-600 mb-1">Sua comissão (vendas diretas)</p>
                    <p className="text-lg font-bold text-green-700">{myCommission}%</p>
                  </div>
                </div>
              )}
            </div>

            {/* Revendedores */}
            {configured && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-purple-600" />
                    <h2 className="font-bold text-gray-900">Revendedores ({vendor.resellers.length})</h2>
                  </div>
                  <button onClick={() => setShowForm(true)} className="btn-primary text-sm flex items-center gap-2 py-2">
                    <Plus size={15} /> Novo
                  </button>
                </div>
                <div className="divide-y divide-gray-100">
                  {vendor.resellers.length === 0 ? (
                    <div className="py-10 text-center">
                      <Users size={36} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Nenhum revendedor ainda.</p>
                    </div>
                  ) : vendor.resellers.map((r) => {
                    const rSalesTotal = r.orders.reduce((s, o) => s + o.total, 0);
                    const rCommission = r.orders.reduce((s, o) => s + (o.commissionValue ?? 0), 0);
                    const isExpanded = expandedReseller === r.id;
                    return (
                      <div key={r.id}>
                        <div className="flex items-start justify-between p-4 gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{r.user.name}</p>
                            <p className="text-xs text-gray-400 truncate">{r.user.email}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              {r.couponCode
                                ? <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">{r.couponCode}</span>
                                : <span className="text-xs text-amber-500">Aguardando configurar cupom</span>
                              }
                              {r.discount !== null && <span className="text-xs text-gray-400">{r.discount}% desc.</span>}
                              <span className="text-xs text-green-600 font-bold">+5% p/ você</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-gray-900">{r.orders.length} {r.orders.length === 1 ? "venda" : "vendas"}</p>
                            <p className="text-xs text-green-600 font-bold">{formatCurrency(rCommission)}</p>
                            <button onClick={() => setExpandedReseller(isExpanded ? null : r.id)} className="text-xs text-brand-600 hover:underline flex items-center gap-0.5 mt-1 ml-auto">
                              {isExpanded ? <><ChevronUp size={12} /> Fechar</> : <><ChevronDown size={12} /> Vendas</>}
                            </button>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="bg-gray-50 border-t border-gray-100 px-4 pb-4 pt-3">
                            {r.orders.length === 0 ? (
                              <p className="text-sm text-gray-400 text-center py-4">Nenhuma venda ainda.</p>
                            ) : (
                              <>
                                <div className="space-y-2">
                                  {r.orders.map((o) => (
                                    <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                      <div>
                                        <p className="font-mono text-xs text-gray-700 font-bold">#{o.id.slice(-6).toUpperCase()}</p>
                                        <p className="text-xs text-gray-400">{formatDate(o.createdAt)}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-medium text-gray-900 text-sm">{formatCurrency(o.total)}</p>
                                        <p className="text-xs text-green-600 font-bold">{formatCurrency(o.commissionValue ?? 0)} p/ você</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex justify-between pt-2 mt-1 border-t border-gray-200 font-bold text-sm">
                                  <span className="text-gray-600">Total</span>
                                  <div className="text-right">
                                    <span className="text-gray-900 mr-3">{formatCurrency(rSalesTotal)}</span>
                                    <span className="text-green-600">{formatCurrency(rCommission)}</span>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── ABA CRM ── */}
        {tab === "crm" && configured && (
          <>
            {/* Stats principais */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={DollarSign} color="green" label="Comissão total" value={formatCurrency(totalCommission)} sub="diretas + revendedores" />
              <StatCard icon={ShoppingBag} color="brand" label="Vendas totais" value={String(allOrders.length)} sub={`${directOrders.length} diretas · ${allResellerOrders.length} via rede`} />
              <StatCard icon={TrendingUp} color="purple" label="Vendas diretas" value={formatCurrency(directCommission)} sub={`${directOrders.length} pedidos · ${vendor.discount}% desc.`} />
              <StatCard icon={Users} color="orange" label="Via revendedores" value={formatCurrency(resellerCommission)} sub={`${vendor.resellers.length} revendedores · 5% p/ venda`} />
            </div>

            {/* Gráfico de barras mensal */}
            {monthlyAll.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart2 size={18} className="text-brand-600" />
                  <h3 className="font-bold text-gray-900">Comissão por mês</h3>
                </div>
                <div className="space-y-3">
                  {monthlyAll.map((m) => {
                    const maxC = Math.max(...monthlyAll.map(x => x.commission), 1);
                    const pct = Math.round((m.commission / maxC) * 100);
                    return (
                      <div key={m.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="capitalize font-medium text-gray-600">{m.label}</span>
                          <span className="text-gray-500">{m.count} venda{m.count !== 1 ? "s" : ""} · <strong className="text-green-600">{formatCurrency(m.commission)}</strong></span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Top revendedores */}
            {topResellers.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Award size={16} className="text-yellow-500" />
                  <h3 className="font-bold text-gray-900">Top revendedores</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {topResellers.map((r, i) => {
                    const rC = r.orders.reduce((s, o) => s + (o.commissionValue ?? 0), 0);
                    const rV = r.orders.reduce((s, o) => s + o.total, 0);
                    return (
                      <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-600" : "bg-orange-50 text-orange-600"}`}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{r.user.name}</p>
                          <p className="text-xs text-gray-400">{r.orders.length} venda{r.orders.length !== 1 ? "s" : ""} · {formatCurrency(rV)} gerado</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-green-600 text-sm">{formatCurrency(rC)}</p>
                          <p className="text-xs text-gray-400">p/ você</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Breakdown diretas vs rede */}
            {(monthlyDirect.length > 0 || monthlyReseller.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MiniMonthly title="Vendas diretas" color="brand" monthly={monthlyDirect} />
                <MiniMonthly title="Via revendedores" color="purple" monthly={monthlyReseller} />
              </div>
            )}

            {/* Feed de vendas recentes */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <TrendingUp size={16} className="text-green-500" />
                <h3 className="font-bold text-gray-900">Últimas vendas</h3>
              </div>
              {allOrders.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Nenhuma venda ainda.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {allOrders.slice(0, 20).map((o) => (
                    <div key={o.id} className="flex items-center justify-between px-5 py-3 gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-mono font-bold text-gray-800">#{o.id.slice(-6).toUpperCase()}</p>
                        <p className="text-xs text-gray-400">{formatDate(o.createdAt)}</p>
                        {o.couponCode && <p className="text-xs text-gray-400 font-mono">{o.couponCode}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-gray-900 text-sm">{formatCurrency(o.total)}</p>
                        <p className="text-xs text-green-600 font-bold">{formatCurrency(o.commissionValue ?? 0)} p/ você</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.status === "PAID" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                          {o.status === "PAID" ? "Pago" : "Pendente"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {showForm && (
          <ResellerModal form={form} setForm={setForm} onSubmit={handleSubmitReseller} onClose={() => setShowForm(false)} submitting={submitting} error={formError} />
        )}
      </div>
    );
  }

  // ── ADMIN ─────────────────────────────────────────────────────
  if (data.role === "ADMIN") {
    const { vendors } = data;

    const allVendorOrders = vendors.flatMap((v) =>
      v.orders.map((o) => ({ ...o, vendorName: v.user.name, resellerName: null as string | null, couponOwner: o.couponCode ?? "—", type: "direct" as const }))
    );
    const allResellerOrders = vendors.flatMap((v) =>
      v.resellers.flatMap((r) =>
        r.orders.map((o) => ({ ...o, vendorName: v.user.name, resellerName: r.user.name, couponOwner: o.couponCode ?? "—", type: "reseller" as const }))
      )
    );
    const allOrders = [...allVendorOrders, ...allResellerOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalRevenue = allOrders.reduce((s, o) => s + o.total, 0);
    const totalCommission = allOrders.reduce((s, o) => s + (o.commissionValue ?? 0), 0);
    const totalResellers = vendors.reduce((s, v) => s + v.resellers.length, 0);
    const totalCouponUses = allOrders.filter((o) => o.couponCode).length;
    const monthlyAll = getMonthlyBreakdown(allOrders);

    const topResellers = vendors
      .flatMap((v) => v.resellers.map((r) => ({ ...r, vendorName: v.user.name })))
      .sort((a, b) => b.orders.length - a.orders.length)
      .slice(0, 5);

    const paymentLabel: Record<string, string> = { PIX: "PIX", CARTAO_CREDITO: "Cartão", BOLETO: "Boleto" };

    return (
      <div className="space-y-5">
        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5">
          <button onClick={() => setTab("rede")} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab !== "crm" ? "bg-brand-600 text-white shadow" : "text-gray-500 hover:text-gray-800"}`}>
            <Users size={16} /> Rede
          </button>
          <button onClick={() => setTab("crm")} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab === "crm" ? "bg-brand-600 text-white shadow" : "text-gray-500 hover:text-gray-800"}`}>
            <BarChart2 size={16} /> CRM Completo
          </button>
        </div>

        {/* ── ABA REDE ── */}
        {tab !== "crm" && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-900">Rede de Vendedores</h2>
                <button onClick={() => setShowForm(true)} className="btn-primary text-sm flex items-center gap-2 py-2"><Plus size={16} /> Novo Revendedor</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-gray-100 p-4"><p className="text-xs text-gray-400">Vendedores</p><p className="font-bold text-gray-900 text-xl">{vendors.length}</p></div>
                <div className="rounded-xl border border-gray-100 p-4"><p className="text-xs text-gray-400">Total revendedores</p><p className="font-bold text-gray-900 text-xl">{totalResellers}</p></div>
                <div className="rounded-xl border border-green-100 bg-green-50 p-4"><p className="text-xs text-green-600">Comissões geradas</p><p className="font-bold text-green-700 text-xl">{formatCurrency(totalCommission)}</p></div>
              </div>
            </div>

            {vendors.map((v) => {
              const vCommission = [...v.orders, ...v.resellers.flatMap((r) => r.orders)].reduce((s, o) => s + (o.commissionValue ?? 0), 0);
              return (
                <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm flex-shrink-0">{v.user.name[0]}</div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{v.user.name}</p>
                        {v.couponCode
                          ? <p className="text-xs text-gray-400">Cupom: <span className="font-mono font-bold">{v.couponCode}</span> · {v.discount}% desc → <span className="text-green-600 font-bold">{50 - (v.discount ?? 0)}% comissão</span></p>
                          : <p className="text-xs text-amber-500">Sem cupom configurado</p>
                        }
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400">Comissão total</p>
                      <p className="font-bold text-green-600">{formatCurrency(vCommission)}</p>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {v.resellers.length === 0
                      ? <p className="text-sm text-gray-400 text-center py-6">Nenhum revendedor ainda.</p>
                      : v.resellers.map((r) => {
                        const rC = r.orders.reduce((s, o) => s + (o.commissionValue ?? 0), 0);
                        return (
                          <div key={r.id} className="flex items-center justify-between px-5 py-3 gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">{r.user.name}</p>
                              <p className="text-xs text-gray-400 truncate">{r.user.email}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              {r.couponCode ? <p className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded-lg">{r.couponCode}{r.discount !== null ? ` · ${r.discount}%` : ""}</p> : <p className="text-xs text-amber-500">Sem cupom</p>}
                              <p className="text-xs text-gray-500">{r.orders.length} vendas</p>
                              <p className="text-xs text-green-600 font-bold">{formatCurrency(rC)} → {v.user.name}</p>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ── ABA CRM COMPLETO ── */}
        {tab === "crm" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={DollarSign} color="green" label="Receita total" value={formatCurrency(totalRevenue)} sub={`${allOrders.length} pedidos com cupom`} />
              <StatCard icon={TrendingUp} color="brand" label="Comissões pagas" value={formatCurrency(totalCommission)} sub="para vendedores e revendedores" />
              <StatCard icon={Users} color="purple" label="Revendedores" value={String(totalResellers)} sub={`em ${vendors.length} vendedor${vendors.length !== 1 ? "es" : ""}`} />
              <StatCard icon={Tag} color="orange" label="Cupons usados" value={String(totalCouponUses)} sub={`de ${allOrders.length} pedidos totais`} />
            </div>

            {monthlyAll.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4"><BarChart2 size={16} className="text-brand-600" /><h3 className="font-bold text-gray-900">Receita + comissões por mês</h3></div>
                <div className="space-y-3">
                  {monthlyAll.map((m) => {
                    const maxR = Math.max(...monthlyAll.map(x => x.revenue), 1);
                    return (
                      <div key={m.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="capitalize font-medium text-gray-600">{m.label} <span className="text-gray-400">({m.count} pedidos)</span></span>
                          <span><strong className="text-gray-900">{formatCurrency(m.revenue)}</strong> · comissão: <strong className="text-green-600">{formatCurrency(m.commission)}</strong></span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.round((m.revenue / maxR) * 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {topResellers.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Award size={16} className="text-yellow-500" /><h3 className="font-bold text-gray-900">Ranking de revendedores</h3>
                </div>
                {topResellers.map((r, i) => {
                  const rV = r.orders.reduce((s, o) => s + o.total, 0);
                  const rC = r.orders.reduce((s, o) => s + (o.commissionValue ?? 0), 0);
                  return (
                    <div key={r.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 last:border-0">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-600" : "bg-orange-50 text-orange-600"}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{r.user.name}</p>
                        <p className="text-xs text-gray-400">Vendedor: {r.vendorName} · {r.couponCode ?? "sem cupom"}{r.discount !== null ? ` · ${r.discount}% desc.` : ""}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-gray-900 text-sm">{r.orders.length} vendas</p>
                        <p className="text-xs text-gray-500">{formatCurrency(rV)} gerado</p>
                        <p className="text-xs text-green-600 font-bold">{formatCurrency(rC)} comissão</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Feed completo de todas as vendas */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <ShoppingBag size={16} className="text-brand-600" />
                <h3 className="font-bold text-gray-900">Todas as vendas com cupom ({allOrders.length})</h3>
              </div>
              {allOrders.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">Nenhuma venda com cupom ainda.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {allOrders.map((o, idx) => (
                    <div key={o.id + idx} className="px-4 py-3 sm:px-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-gray-800">#{o.id.slice(-6).toUpperCase()}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.status === "PAID" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>{o.status === "PAID" ? "Pago" : "Pendente"}</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{paymentLabel[o.paymentMethod ?? ""] ?? (o.paymentMethod ?? "—")}</span>
                            {o.type === "reseller"
                              ? <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">Revendedor</span>
                              : <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">Direto</span>
                            }
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(o.createdAt)}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-gray-500">
                            {o.couponOwner !== "—" && <span>Cupom: <strong className="font-mono text-gray-700">{o.couponOwner}</strong></span>}
                            {o.couponDiscount !== null && o.couponDiscount !== undefined && <span>Desconto dado: <strong className="text-red-500">{o.couponDiscount}%</strong></span>}
                            <span>Vendedor: <strong className="text-gray-700">{o.vendorName}</strong></span>
                            {o.resellerName && <span>Revendedor: <strong className="text-purple-700">{o.resellerName}</strong></span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-gray-900 text-sm">{formatCurrency(o.total)}</p>
                          {o.subtotal !== undefined && o.subtotal !== o.total && <p className="text-xs text-gray-400 line-through">{formatCurrency(o.subtotal)}</p>}
                          <p className="text-xs text-green-600 font-bold">{formatCurrency(o.commissionValue ?? 0)} comissão</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Por vendedor — breakdown */}
            {vendors.map((v) => {
              const vOrders = v.orders.length + v.resellers.reduce((s, r) => s + r.orders.length, 0);
              if (vOrders === 0) return null;
              const vDirectC = v.orders.reduce((s, o) => s + (o.commissionValue ?? 0), 0);
              const vResellerC = v.resellers.flatMap(r => r.orders).reduce((s, o) => s + (o.commissionValue ?? 0), 0);
              return (
                <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm flex-shrink-0">{v.user.name[0]}</div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{v.user.name}</p>
                        <p className="text-xs text-gray-400">{vOrders} vendas · {v.resellers.length} revendedores</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400">Comissão total</p>
                      <p className="font-bold text-green-600">{formatCurrency(vDirectC + vResellerC)}</p>
                    </div>
                  </div>
                  <div className="px-5 py-3 grid grid-cols-2 gap-3 bg-gray-50 border-b border-gray-100">
                    <div><p className="text-xs text-gray-400">Diretas</p><p className="font-semibold text-sm">{v.orders.length} · {formatCurrency(vDirectC)}</p></div>
                    <div><p className="text-xs text-gray-400">Via revendedores</p><p className="font-semibold text-sm">{v.resellers.reduce((s, r) => s + r.orders.length, 0)} · {formatCurrency(vResellerC)}</p></div>
                  </div>
                  {v.resellers.filter(r => r.orders.length > 0).map((r) => {
                    const rC = r.orders.reduce((s, o) => s + (o.commissionValue ?? 0), 0);
                    const rV = r.orders.reduce((s, o) => s + o.total, 0);
                    return (
                      <div key={r.id} className="px-5 py-3 border-b border-gray-100 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{r.user.name}</p>
                            <p className="text-xs text-gray-400">{r.couponCode ?? "sem cupom"}{r.discount !== null ? ` · ${r.discount}% desc.` : ""}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">{formatCurrency(rV)}</p>
                            <p className="text-xs text-green-600 font-bold">{formatCurrency(rC)} p/ {v.user.name}</p>
                          </div>
                        </div>
                        {r.orders.slice(0, 3).map((o) => (
                          <div key={o.id} className="flex justify-between text-xs text-gray-500 py-1 border-t border-gray-100">
                            <span className="font-mono">#{o.id.slice(-6).toUpperCase()} · {formatDate(o.createdAt)}{o.couponDiscount ? ` · ${o.couponDiscount}% desc.` : ""}</span>
                            <span>{formatCurrency(o.total)} · <span className="text-green-600">{formatCurrency(o.commissionValue ?? 0)}</span></span>
                          </div>
                        ))}
                        {r.orders.length > 3 && <p className="text-xs text-gray-400 pt-1">+{r.orders.length - 3} mais</p>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        )}

        {showForm && (
          <ResellerModal form={form} setForm={setForm} onSubmit={handleSubmitReseller} onClose={() => setShowForm(false)} submitting={submitting} error={formError}
            vendorSelector={
              <div>
                <label className="label">Vincular ao vendedor *</label>
                <select className="input-field" value={selectedVendorId} onChange={(e) => setSelectedVendorId(e.target.value)} required>
                  <option value="">Selecione o vendedor</option>
                  {vendors.map((v) => <option key={v.id} value={v.id}>{v.user.name}{v.couponCode ? ` (${v.couponCode})` : " (sem cupom)"}</option>)}
                </select>
              </div>
            }
          />
        )}
      </div>
    );
  }

  return null;
}

// ── Componentes auxiliares ────────────────────────────────────

function StatCard({ icon: Icon, color, label, value, sub }: { icon: React.ElementType; color: string; label: string; value: string; sub: string }) {
  const colors: Record<string, string> = {
    green: "bg-green-50 text-green-600",
    brand: "bg-brand-50 text-brand-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}><Icon size={18} /></div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function MiniMonthly({ title, color, monthly }: { title: string; color: string; monthly: { label: string; count: number; revenue: number; commission: number }[] }) {
  const barColor = color === "brand" ? "bg-brand-500" : "bg-purple-500";
  if (monthly.length === 0) return null;
  const maxC = Math.max(...monthly.map(x => x.commission), 1);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h4 className="font-bold text-gray-900 text-sm mb-4">{title}</h4>
      <div className="space-y-2">
        {monthly.map((m) => (
          <div key={m.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="capitalize text-gray-500">{m.label}</span>
              <span className="text-gray-700 font-medium">{formatCurrency(m.commission)}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full ${barColor} rounded-full`} style={{ width: `${Math.round((m.commission / maxC) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfigForm({ form, setForm, onSubmit, onCancel, loading, error }: {
  form: { couponCode: string; discount: string };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  const commission = Math.max(0, 50 - Number(form.discount || 0));
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>}
      <div>
        <label className="label">Código do cupom *</label>
        <input className="input-field uppercase font-mono" value={form.couponCode} onChange={(e) => setForm((p) => ({ ...p, couponCode: e.target.value.toUpperCase() }))} required placeholder="Ex: JOAO10" />
      </div>
      <div>
        <label className="label">Desconto ao cliente (10%–50%)</label>
        <input className="input-field" type="number" min="10" max="50" step="1" value={form.discount} onChange={(e) => setForm((p) => ({ ...p, discount: e.target.value }))} required />
        <div className="mt-2 flex items-center justify-between text-xs rounded-xl bg-gray-50 border border-gray-100 px-4 py-2.5">
          <span className="text-gray-500">Cliente economiza <strong>{form.discount || 0}%</strong></span>
          <span className={`font-bold ${commission > 0 ? "text-green-600" : "text-gray-400"}`}>Você ganha <strong>{commission}%</strong></span>
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">Cancelar</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : <><Check size={16} /> Salvar</>}
        </button>
      </div>
    </form>
  );
}

function ResellerModal({ form, setForm, onSubmit, onClose, submitting, error, vendorSelector }: {
  form: { name: string; email: string; password: string; phone: string };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  submitting: boolean;
  error: string;
  vendorSelector?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-lg">Novo Revendedor</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <form onSubmit={onSubmit} className="p-6 space-y-4">
            {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>}
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
              O revendedor irá configurar o próprio cupom e desconto ao fazer login.
            </div>
            {vendorSelector}
            <div><label className="label">Nome completo *</label><input className="input-field" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required placeholder="Ex: Maria Costa" /></div>
            <div><label className="label">E-mail *</label><input className="input-field" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required placeholder="maria@email.com" /></div>
            <div><label className="label">Senha inicial *</label><input className="input-field" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required minLength={6} placeholder="Mínimo 6 caracteres" /></div>
            <div><label className="label">Telefone / WhatsApp</label><input className="input-field" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-9999" /></div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Cadastrando...</> : <><Check size={16} /> Cadastrar</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
