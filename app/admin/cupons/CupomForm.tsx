"use client";

import { useState } from "react";
import { Loader2, Plus, X, Check, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

const initialForm = {
  code: "",
  discountType: "PERCENT" as "PERCENT" | "FIXED",
  discountValue: "",
  freeShipping: false,
  minPurchase: "",
  maxUses: "",
  expiresAt: "",
};

export type EditableCoupon = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  freeShipping: boolean;
  minPurchase: number | null;
  maxUses: number | null;
  expiresAt: Date | null;
};

function formFromCoupon(c: EditableCoupon): typeof initialForm {
  return {
    code: c.code,
    discountType: c.discountType === "FIXED" ? "FIXED" : "PERCENT",
    discountValue: String(c.discountValue),
    freeShipping: c.freeShipping,
    minPurchase: c.minPurchase !== null ? String(c.minPurchase) : "",
    maxUses: c.maxUses !== null ? String(c.maxUses) : "",
    // A validade é salva a partir de "AAAA-MM-DD" (meia-noite UTC), então volta igual
    expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 10) : "",
  };
}

// Sem `coupon` cria um cupom novo; com `coupon` edita esse cupom (o código não muda)
export function CupomForm({ coupon }: { coupon?: EditableCoupon }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);

  function openForm() {
    setError("");
    setForm(coupon ? formFromCoupon(coupon) : initialForm);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch(coupon ? `/api/admin/cupons/${coupon.id}` : "/api/admin/cupons", {
      method: coupon ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        discountType: form.discountType,
        discountValue: form.discountValue,
        freeShipping: form.freeShipping,
        minPurchase: form.minPurchase || null,
        maxUses: form.maxUses || null,
        expiresAt: form.expiresAt || null,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      setForm(initialForm);
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.error || (coupon ? "Erro ao salvar cupom" : "Erro ao criar cupom"));
    }
  }

  if (!open && coupon) {
    return (
      <button onClick={openForm} title="Editar" className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
        <Pencil size={16} />
      </button>
    );
  }

  if (!open) {
    return (
      <button onClick={openForm} className="btn-primary flex items-center gap-2">
        <Plus size={18} /> Novo Cupom
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto text-left">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-lg">{coupon ? `Editar cupom ${coupon.code}` : "Novo Cupom"}</h2>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
            )}

            <div>
              <label className="label">Código *</label>
              <input
                className="input-field uppercase font-mono disabled:bg-gray-50 disabled:text-gray-500"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                required
                disabled={!!coupon}
                placeholder="Ex: VERAO15"
              />
              {coupon && <p className="text-xs text-gray-400 mt-1">O código não pode ser alterado.</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Tipo de desconto *</label>
                <select
                  className="input-field"
                  value={form.discountType}
                  onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value as "PERCENT" | "FIXED" }))}
                >
                  <option value="PERCENT">Porcentagem (%)</option>
                  <option value="FIXED">Valor fixo (R$)</option>
                </select>
              </div>
              <div>
                <label className="label">Valor *</label>
                <input
                  className="input-field"
                  type="number" min={0} step={form.discountType === "PERCENT" ? 1 : 0.01}
                  value={form.discountValue}
                  onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))}
                  required
                  placeholder={form.discountType === "PERCENT" ? "Ex: 15" : "Ex: 30.00"}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={form.freeShipping}
                onChange={(e) => setForm((p) => ({ ...p, freeShipping: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Também dar frete grátis</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Compra mínima (opcional)</label>
                <input
                  className="input-field"
                  type="number" min={0} step="0.01"
                  value={form.minPurchase}
                  onChange={(e) => setForm((p) => ({ ...p, minPurchase: e.target.value }))}
                  placeholder="Ex: 200.00"
                />
              </div>
              <div>
                <label className="label">Limite de usos (opcional)</label>
                <input
                  className="input-field"
                  type="number" min={1} step={1}
                  value={form.maxUses}
                  onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))}
                  placeholder="Ilimitado"
                />
              </div>
            </div>

            <div>
              <label className="label">Validade (opcional)</label>
              <input
                className="input-field"
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">Cancelar</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> {coupon ? "Salvando..." : "Criando..."}</>
                  : <><Check size={16} /> {coupon ? "Salvar" : "Criar cupom"}</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
