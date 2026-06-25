"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Tag, Users, Plus, X, Loader2, Check, Copy, CheckCheck, TrendingUp, Pencil, ChevronDown, ChevronUp, DollarSign } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

function gerarCupom(nome: string) {
  return nome.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 8);
}

type OrderSummary = { id: string; total: number; commissionValue: number | null; createdAt: string; status: string; couponCode?: string };

type Reseller = {
  id: string; couponCode: string; discount: number; active: boolean; createdAt: string;
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
  | { role: "RESELLER"; reseller: { couponCode: string; discount: number; vendor: { user: { name: string; email: string } }; orders: OrderSummary[] } };

export default function MinhaRedePage() {
  const { data: session } = useSession();
  const [data, setData] = useState<RedeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", couponCode: "", discount: "10" });
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

  function handleNameChange(name: string) {
    setForm((p) => ({ ...p, name, couponCode: p.couponCode || gerarCupom(name) }));
  }

  async function handleSubmitReseller(e: React.FormEvent) {
    e.preventDefault(); setFormError(""); setSubmitting(true);
    const body = session?.user.role === "ADMIN" ? { ...form, vendorId: selectedVendorId } : form;
    const res = await fetch("/api/conta/rede/revendedores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSubmitting(false);
    if (res.ok) { setShowForm(false); setForm({ name: "", email: "", password: "", phone: "", couponCode: "", discount: "10" }); await loadData(); }
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
    const totalVendas = reseller.orders.reduce((s, o) => s + o.total, 0);
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Minha Conta de Revendedor</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-100 p-4 flex items-center gap-3">
              <Tag size={16} className="text-gray-500 flex-shrink-0" />
              <div><p className="text-xs text-gray-400">Seu cupom</p><p className="font-mono font-bold text-gray-900">{reseller.couponCode}</p></div>
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
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Minhas Vendas ({reseller.orders.length})</h3>
          <p className="text-sm text-gray-400 mb-4">Total movimentado: <strong className="text-gray-900">{formatCurrency(totalVendas)}</strong></p>
          {reseller.orders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhuma venda ainda com seu cupom.</p>
          ) : reseller.orders.map((o) => (
            <div key={o.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-mono font-bold text-gray-800">#{o.id.slice(-6).toUpperCase()}</p>
                <p className="text-xs text-gray-400">{formatDate(o.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 text-sm">{formatCurrency(o.total)}</p>
                <span className={`text-xs badge ${o.status === "PAID" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>{o.status === "PAID" ? "Pago" : "Pendente"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── VENDOR ────────────────────────────────────────────────────
  if (data.role === "VENDOR") {
    const { vendor } = data;
    const configured = !!vendor.couponCode;
    const myCommission = configured ? 50 - (vendor.discount ?? 0) : null;

    const directSalesCommission = vendor.orders.reduce((s, o) => s + (o.commissionValue ?? 0), 0);
    const resellerCommission = vendor.resellers.reduce((s, r) => s + r.orders.reduce((ss, o) => ss + (o.commissionValue ?? 0), 0), 0);
    const totalCommission = directSalesCommission + resellerCommission;
    const totalResellerSales = vendor.resellers.reduce((s, r) => s + r.orders.reduce((ss, o) => ss + o.total, 0), 0);

    return (
      <div className="space-y-5">
        {/* Configuração do cupom */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Meu Cupom</h2>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Tag size={16} className="text-gray-600" /></div>
                <div className="flex-1 min-w-0"><p className="text-xs text-gray-400">Código do cupom</p><p className="font-mono font-bold text-gray-900">{vendor.couponCode}</p></div>
                <button onClick={() => copyCoupon(vendor.couponCode!)} className="text-gray-400 hover:text-brand-600">
                  {copied ? <CheckCheck size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 mb-1">Desconto ao cliente</p>
                <p className="text-lg font-bold text-gray-700">{vendor.discount}%</p>
              </div>
              <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                <p className="text-xs text-green-600 mb-1">Sua comissão por venda</p>
                <p className="text-lg font-bold text-green-700">{myCommission}%</p>
              </div>
            </div>
          )}
        </div>

        {/* Resumo financeiro */}
        {configured && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-green-500" />
                <p className="text-xs text-gray-500 font-medium">Comissão total</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCommission)}</p>
              <p className="text-xs text-gray-400 mt-1">vendas diretas + revendedores</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-brand-600" />
                <p className="text-xs text-gray-500 font-medium">Suas vendas diretas</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{vendor.orders.length}</p>
              <p className="text-xs text-green-600 font-medium mt-1">{formatCurrency(directSalesCommission)} de comissão</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-purple-600" />
                <p className="text-xs text-gray-500 font-medium">Vendas dos revendedores</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalResellerSales)}</p>
              <p className="text-xs text-green-600 font-medium mt-1">{formatCurrency(resellerCommission)} de comissão para você</p>
            </div>
          </div>
        )}

        {/* Revendedores */}
        {configured && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-purple-600" />
                <h2 className="font-bold text-gray-900">Meus Revendedores ({vendor.resellers.length})</h2>
              </div>
              <button onClick={() => setShowForm(true)} className="btn-primary text-sm flex items-center gap-2 py-2">
                <Plus size={16} /> Novo Revendedor
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
                    <div className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{r.user.name}</p>
                        <p className="text-xs text-gray-400">{r.user.email}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">{r.couponCode}</span>
                          <span className="text-xs text-gray-400">{r.discount}% desconto</span>
                          <span className="text-xs text-green-600 font-bold">+{50 - r.discount}% para você</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{r.orders.length} {r.orders.length === 1 ? "venda" : "vendas"}</p>
                        <p className="text-xs text-green-600 font-bold">{formatCurrency(rCommission)} comissão</p>
                        <button
                          onClick={() => setExpandedReseller(isExpanded ? null : r.id)}
                          className="text-xs text-brand-600 hover:underline flex items-center gap-0.5 mt-1 ml-auto"
                        >
                          {isExpanded ? <><ChevronUp size={12} /> Fechar</> : <><ChevronDown size={12} /> Ver vendas</>}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="bg-gray-50 border-t border-gray-100 px-5 pb-4 pt-3">
                        {r.orders.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4">Nenhuma venda com o cupom <strong>{r.couponCode}</strong> ainda.</p>
                        ) : (
                          <div className="space-y-2">
                            <div className="grid grid-cols-4 text-xs font-semibold text-gray-400 uppercase tracking-wide pb-1 border-b border-gray-200">
                              <span>Pedido</span><span>Data</span><span className="text-right">Valor</span><span className="text-right">Comissão</span>
                            </div>
                            {r.orders.map((o) => (
                              <div key={o.id} className="grid grid-cols-4 text-sm py-1.5 border-b border-gray-100 last:border-0">
                                <span className="font-mono text-xs text-gray-700">#{o.id.slice(-6).toUpperCase()}</span>
                                <span className="text-xs text-gray-500">{formatDate(o.createdAt)}</span>
                                <span className="text-right font-medium text-gray-900">{formatCurrency(o.total)}</span>
                                <span className="text-right font-bold text-green-600">{formatCurrency(o.commissionValue ?? 0)}</span>
                              </div>
                            ))}
                            <div className="grid grid-cols-4 text-sm pt-2 font-bold border-t border-gray-200">
                              <span className="col-span-2 text-gray-600">Total</span>
                              <span className="text-right text-gray-900">{formatCurrency(rSalesTotal)}</span>
                              <span className="text-right text-green-600">{formatCurrency(rCommission)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showForm && (
          <ResellerModal form={form} setForm={setForm} onNameChange={handleNameChange} onSubmit={handleSubmitReseller} onClose={() => setShowForm(false)} submitting={submitting} error={formError} />
        )}
      </div>
    );
  }

  // ── ADMIN ─────────────────────────────────────────────────────
  if (data.role === "ADMIN") {
    const { vendors } = data;
    const totalCommission = vendors.reduce((s, v) => s + [...v.orders, ...v.resellers.flatMap((r) => r.orders)].reduce((ss, o) => ss + (o.commissionValue ?? 0), 0), 0);
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Rede de Vendedores</h2>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm flex items-center gap-2 py-2"><Plus size={16} /> Novo Revendedor</button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-100 p-4"><p className="text-xs text-gray-400">Vendedores</p><p className="font-bold text-gray-900 text-xl">{vendors.length}</p></div>
            <div className="rounded-xl border border-gray-100 p-4"><p className="text-xs text-gray-400">Total revendedores</p><p className="font-bold text-gray-900 text-xl">{vendors.reduce((s, v) => s + v.resellers.length, 0)}</p></div>
            <div className="rounded-xl border border-green-100 bg-green-50 p-4"><p className="text-xs text-green-600">Comissões geradas</p><p className="font-bold text-green-700 text-xl">{formatCurrency(totalCommission)}</p></div>
          </div>
        </div>

        {vendors.map((v) => {
          const vCommission = [...v.orders, ...v.resellers.flatMap((r) => r.orders)].reduce((s, o) => s + (o.commissionValue ?? 0), 0);
          return (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm">{v.user.name[0]}</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{v.user.name}</p>
                    {v.couponCode ? (
                      <p className="text-xs text-gray-400">Cupom: <span className="font-mono font-bold">{v.couponCode}</span> · {v.discount}% desconto → <span className="text-green-600 font-bold">{50 - (v.discount ?? 0)}% comissão</span></p>
                    ) : (
                      <p className="text-xs text-amber-500">Aguardando configurar cupom</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Comissão total</p>
                  <p className="font-bold text-green-600">{formatCurrency(vCommission)}</p>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {v.resellers.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Nenhum revendedor ainda.</p>
                ) : v.resellers.map((r) => {
                  const rCommission = r.orders.reduce((s, o) => s + (o.commissionValue ?? 0), 0);
                  return (
                    <div key={r.id} className="flex items-center justify-between px-5 py-3">
                      <div><p className="font-medium text-gray-900 text-sm">{r.user.name}</p><p className="text-xs text-gray-400">{r.user.email}</p></div>
                      <div className="text-right">
                        <p className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-lg inline-block">{r.couponCode}</p>
                        <p className="text-xs text-gray-500">{r.orders.length} vendas</p>
                        <p className="text-xs text-green-600 font-bold">{formatCurrency(rCommission)} → {v.user.name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {showForm && (
          <ResellerModal form={form} setForm={setForm} onNameChange={handleNameChange} onSubmit={handleSubmitReseller} onClose={() => setShowForm(false)} submitting={submitting} error={formError}
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
          {loading ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : <><Check size={16} /> Salvar cupom</>}
        </button>
      </div>
    </form>
  );
}

function ResellerModal({ form, setForm, onNameChange, onSubmit, onClose, submitting, error, vendorSelector }: {
  form: { name: string; email: string; password: string; phone: string; couponCode: string; discount: string };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  onNameChange: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  submitting: boolean;
  error: string;
  vendorSelector?: React.ReactNode;
}) {
  const commission = Math.max(0, 50 - Number(form.discount || 0));
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
            {vendorSelector}
            <div><label className="label">Nome completo *</label><input className="input-field" value={form.name} onChange={(e) => onNameChange(e.target.value)} required placeholder="Ex: Maria Costa" /></div>
            <div><label className="label">E-mail *</label><input className="input-field" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required placeholder="maria@email.com" /></div>
            <div><label className="label">Senha inicial *</label><input className="input-field" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required minLength={6} placeholder="Mínimo 6 caracteres" /></div>
            <div><label className="label">Telefone / WhatsApp</label><input className="input-field" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-9999" /></div>
            <div><label className="label">Cupom do revendedor *</label><input className="input-field uppercase font-mono" value={form.couponCode} onChange={(e) => setForm((p) => ({ ...p, couponCode: e.target.value.toUpperCase() }))} required placeholder="MARIA10" /></div>
            <div>
              <label className="label">Desconto ao cliente (10–50%)</label>
              <input className="input-field" type="number" min="10" max="50" step="1" value={form.discount} onChange={(e) => setForm((p) => ({ ...p, discount: e.target.value }))} placeholder="10" />
              <div className="mt-2 flex items-center justify-between text-xs rounded-xl bg-gray-50 border border-gray-100 px-4 py-2.5">
                <span className="text-gray-500">Cliente economiza <strong>{form.discount || 0}%</strong></span>
                <span className={`font-bold ${commission > 0 ? "text-green-600" : "text-gray-400"}`}>Você ganha <strong>{commission}%</strong></span>
              </div>
            </div>
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
