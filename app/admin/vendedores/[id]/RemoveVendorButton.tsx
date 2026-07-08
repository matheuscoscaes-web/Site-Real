"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

export function RemoveVendorButton({ vendorId, name }: { vendorId: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRemove() {
    if (!confirm(`Tem certeza que deseja remover o vendedor "${name}"?\n\nEsta ação não pode ser desfeita.`)) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/vendedores/${vendorId}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Erro ao remover vendedor.");
      return;
    }
    router.push("/admin/vendedores");
    router.refresh();
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-2">{error}</div>
      )}
      <button
        onClick={handleRemove}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={15} />}
        Remover vendedor
      </button>
    </div>
  );
}
