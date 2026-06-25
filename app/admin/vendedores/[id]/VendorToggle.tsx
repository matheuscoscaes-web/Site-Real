"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function VendorToggle({ vendorId, active }: { vendorId: string; active: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(active);

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/admin/vendedores/${vendorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !current }),
    });
    setLoading(false);
    if (res.ok) {
      setCurrent((v) => !v);
      router.refresh();
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
        current
          ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
          : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
      }`}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : null}
      {current ? "Desativar vendedor" : "Ativar vendedor"}
    </button>
  );
}
