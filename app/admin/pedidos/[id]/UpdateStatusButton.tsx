"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn, ORDER_STATUS_COLORS } from "@/lib/utils";

export function UpdateStatusButton({
  orderId,
  status,
  currentStatus,
  label,
}: {
  orderId: string;
  status: string;
  currentStatus: string;
  label: string;
}) {
  const router = useRouter();
  const [requesting, setRequesting] = useState(false);
  // Segura o "carregando" até a página atualizar, pra não parecer que o clique não pegou
  const [refreshing, startTransition] = useTransition();
  const loading = requesting || refreshing;
  const isActive = status === currentStatus;

  async function handleUpdate() {
    if (isActive || loading) return;
    setRequesting(true);
    try {
      const res = await fetch(`/api/pedidos/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        alert("Não foi possível atualizar o status. Tente de novo.");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      alert("Erro de conexão ao atualizar o status.");
    } finally {
      setRequesting(false);
    }
  }

  return (
    <button
      onClick={handleUpdate}
      disabled={isActive || loading}
      className={cn(
        "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all border-2 disabled:cursor-default",
        isActive
          ? `${ORDER_STATUS_COLORS[status]} border-transparent`
          : "bg-white border-gray-200 text-gray-600 hover:border-gray-400",
        loading && "opacity-70"
      )}
    >
      {loading && <Loader2 size={12} className="animate-spin" />}
      {label}
    </button>
  );
}
