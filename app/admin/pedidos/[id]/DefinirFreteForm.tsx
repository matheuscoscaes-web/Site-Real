"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { type FreteOption } from "@/lib/frete";

export function DefinirFreteForm({ orderId, zipCode, totalItems }: { orderId: string; zipCode: string; totalItems: number }) {
  const router = useRouter();
  const [options, setOptions] = useState<FreteOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleBuscar() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/frete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep: zipCode, totalItems }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error(data.error ?? "Erro");
      setOptions(data);
    } catch {
      setError("Não foi possível calcular o frete para este CEP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelecionar(opt: FreteOption) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/pedidos/${orderId}/frete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingServiceId: opt.id, shippingService: opt.name, shippingCarrier: opt.company }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError("Não foi possível salvar a opção de frete.");
      setSaving(false);
    }
  }

  return (
    <div className="mb-4 pb-4 border-b border-gray-100">
      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
        Este pedido ainda não tem transportadora definida. Selecione uma opção abaixo para poder gerar a etiqueta.
      </p>

      {!options && (
        <button onClick={handleBuscar} disabled={loading} className="btn-outline text-sm gap-2 inline-flex items-center">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          {loading ? "Buscando..." : "Buscar opções de frete"}
        </button>
      )}

      {options && options.length === 0 && (
        <p className="text-sm text-gray-400">Nenhuma opção de frete disponível para este CEP.</p>
      )}

      {options && options.length > 0 && (
        <div className="space-y-2">
          {options.map((opt) => (
            <button
              key={opt.id}
              disabled={saving}
              onClick={() => handleSelecionar(opt)}
              className="w-full flex items-center justify-between gap-3 border-2 border-gray-200 hover:border-brand-600 rounded-xl px-4 py-2.5 text-left transition-colors disabled:opacity-50"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">{opt.company} — {opt.name}</p>
                <p className="text-xs text-gray-400">até {opt.days} dias úteis</p>
              </div>
              <span className="text-sm font-bold text-gray-900 flex-shrink-0">{formatCurrency(opt.price)}</span>
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
