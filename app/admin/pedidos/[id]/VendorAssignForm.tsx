"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type VendorOption = { id: string; name: string };

export function VendorAssignForm({
  orderId,
  vendors,
  currentVendorId,
  currentVendorName,
  commissionValue,
}: {
  orderId: string;
  vendors: VendorOption[];
  currentVendorId: string | null;
  currentVendorName: string | null;
  commissionValue: number | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(currentVendorId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/pedidos/${orderId}/vendedor`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId: selected || null }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.error || "Erro ao atribuir vendedor");
    }
  }

  const changed = selected !== (currentVendorId ?? "");

  return (
    <div>
      {currentVendorName && (
        <div className="mb-3 text-sm">
          <p className="text-gray-700">
            Atribuído a <span className="font-semibold">{currentVendorName}</span>
          </p>
          {commissionValue !== null && (
            <p className="text-xs text-gray-400 mt-0.5">Comissão: {formatCurrency(commissionValue)}</p>
          )}
        </div>
      )}

      {error && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</div>
      )}

      <div className="flex gap-2">
        <select
          className="input-field text-sm flex-1"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Nenhum vendedor</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        {changed && (
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary text-sm py-2 px-3 flex-shrink-0"
            title="Salvar"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          </button>
        )}
      </div>

      {!currentVendorName && !selected && (
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <X size={12} /> Nenhum vendedor recebendo comissão por esta venda
        </p>
      )}
    </div>
  );
}
