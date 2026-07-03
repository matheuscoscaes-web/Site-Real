"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";

export function VerificarPagamentoButton({ orderId, hasPaymentId }: { orderId: string; hasPaymentId: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleCheck() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/pedidos/${orderId}/verificar-pagamento`, { method: "POST" });
      const data = await res.json();
      if (!data.checked) {
        setMsg(data.error ?? "Nenhum pagamento do Mercado Pago vinculado a este pedido ainda.");
      } else {
        setMsg(`Status atual no Mercado Pago: ${data.status}`);
        router.refresh();
      }
    } catch {
      setMsg("Erro ao consultar o Mercado Pago.");
    } finally {
      setLoading(false);
    }
  }

  if (!hasPaymentId) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <button
        onClick={handleCheck}
        disabled={loading}
        className="btn-outline text-xs py-2 w-full gap-2"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        Verificar pagamento no Mercado Pago
      </button>
      {msg && <p className="text-xs text-gray-500 mt-2 text-center">{msg}</p>}
    </div>
  );
}
