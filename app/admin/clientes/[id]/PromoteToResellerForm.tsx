"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserCheck, X, Check } from "lucide-react";

type Vendor = { id: string; couponCode: string | null; user: { name: string } };

export function PromoteToResellerForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && vendors.length === 0) {
      fetch("/api/admin/vendedores").then((r) => r.json()).then(setVendors);
    }
  }, [open, vendors.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/revendedores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, vendorId }),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.error || "Erro ao converter cliente");
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-ghost text-sm w-full justify-center">
        <UserCheck size={15} /> Tornar revendedor
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-lg">Tornar revendedor</h2>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>}
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
              A conta deste cliente será convertida em revendedor, vinculada ao vendedor escolhido. Login e senha continuam os mesmos.
            </div>
            <div>
              <label className="label">Vincular ao vendedor *</label>
              <select className="input-field" value={vendorId} onChange={(e) => setVendorId(e.target.value)} required>
                <option value="">Selecione o vendedor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.user.name}{v.couponCode ? ` (${v.couponCode})` : " (sem cupom)"}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">Cancelar</button>
              <button type="submit" disabled={loading || !vendorId} className="btn-primary flex-1">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Convertendo...</> : <><Check size={16} /> Confirmar</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
