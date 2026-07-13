"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";

export function ConfirmarPedidoButton({
  orderId,
  status,
  confirmed,
}: {
  orderId: string;
  status: string;
  confirmed: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/pedidos/${orderId}/confirmar`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao confirmar pedido.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Erro ao confirmar pedido.");
    } finally {
      setLoading(false);
    }
  }

  if (confirmed) {
    return (
      <p className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
        <CheckCircle2 size={16} /> Pedido confirmado — cliente recebeu o e-mail de pagamento.
      </p>
    );
  }

  if (status === "PENDING" || status === "CANCELLED") {
    return (
      <p className="text-sm text-gray-400">
        Aguardando pagamento para poder aceitar o pedido e notificar o cliente.
      </p>
    );
  }

  return (
    <div>
      <button onClick={handleConfirm} disabled={loading} className="btn-primary text-sm py-2.5 w-full gap-2">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
        Aceitar pedido e enviar e-mail ao cliente
      </button>
      <p className="text-xs text-gray-400 mt-2">
        O pagamento já foi aprovado, mas o cliente só recebe o e-mail de confirmação quando você aceitar o pedido aqui.
      </p>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
