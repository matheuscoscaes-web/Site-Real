"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Power, Trash2 } from "lucide-react";

export function CupomRowActions({ couponId, code, active }: { couponId: string; code: string; active: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"toggle" | "delete" | null>(null);

  async function toggle() {
    setLoading("toggle");
    await fetch(`/api/admin/cupons/${couponId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setLoading(null);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Remover o cupom "${code}"?\n\nEsta ação não pode ser desfeita.`)) return;
    setLoading("delete");
    await fetch(`/api/admin/cupons/${couponId}`, { method: "DELETE" });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={toggle}
        disabled={loading !== null}
        title={active ? "Desativar" : "Ativar"}
        className={`p-2 rounded-lg transition-colors ${active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
      >
        {loading === "toggle" ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
      </button>
      <button
        onClick={remove}
        disabled={loading !== null}
        title="Remover"
        className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
      >
        {loading === "delete" ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
      </button>
    </div>
  );
}
