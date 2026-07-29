"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Truck } from "lucide-react";

export function MarcarEnviadoButton({ orderId, hasTrackingCode }: { orderId: string; hasTrackingCode: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!hasTrackingCode) {
      const confirmar = confirm("Esse pedido ainda não tem código de rastreio. Marcar como enviado mesmo assim?");
      if (!confirmar) return;
    }
    setLoading(true);
    try {
      await fetch(`/api/pedidos/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SHIPPED" }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <Truck size={13} />}
      {loading ? "Enviando..." : "Marcar enviado"}
    </button>
  );
}
