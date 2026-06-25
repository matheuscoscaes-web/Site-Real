"use client";

import { useState } from "react";
import { Loader2, Plus, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";

function gerarCupom(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 8);
}

export function ResellerForm({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", couponCode: "", discount: "10",
  });

  const commission = Math.max(0, 50 - Number(form.discount || 0));

  function handleNameChange(name: string) {
    setForm((p) => ({ ...p, name, couponCode: p.couponCode || gerarCupom(name) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/revendedores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, vendorId }),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      setForm({ name: "", email: "", password: "", phone: "", couponCode: "", discount: "10" });
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.error || "Erro ao cadastrar");
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
        <Plus size={16} /> Novo Revendedor
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">Novo Revendedor</h2>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
          )}
          <div>
            <label className="label">Nome completo *</label>
            <input className="input-field" value={form.name} onChange={(e) => handleNameChange(e.target.value)} required placeholder="Ex: Maria Costa" />
          </div>
          <div>
            <label className="label">E-mail *</label>
            <input className="input-field" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required placeholder="maria@email.com" />
          </div>
          <div>
            <label className="label">Senha inicial *</label>
            <input className="input-field" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required minLength={6} placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label className="label">Telefone / WhatsApp</label>
            <input className="input-field" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-9999" />
          </div>
          <div>
            <label className="label">Código do cupom *</label>
            <input className="input-field uppercase font-mono" value={form.couponCode} onChange={(e) => setForm((p) => ({ ...p, couponCode: e.target.value.toUpperCase() }))} required placeholder="MARIA10" />
          </div>
          <div>
            <label className="label">Desconto do cupom ao cliente (0–50%)</label>
            <input
              className="input-field"
              type="number"
              min="0"
              max="50"
              step="1"
              value={form.discount}
              onChange={(e) => setForm((p) => ({ ...p, discount: e.target.value }))}
              placeholder="10"
            />
            <div className="mt-2 flex items-center justify-between text-xs rounded-xl bg-gray-50 border border-gray-100 px-4 py-2.5">
              <span className="text-gray-500">Cliente economiza <strong>{form.discount || 0}%</strong></span>
              <span className={`font-bold ${commission > 0 ? "text-green-600" : "text-gray-400"}`}>
                Vendedor ganha <strong>{commission}%</strong>
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">O vendedor recebe a comissão sobre as vendas feitas com o cupom deste revendedor.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Cadastrando...</> : <><Check size={16} /> Cadastrar</>}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
