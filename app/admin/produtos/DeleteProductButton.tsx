"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [requesting, setLoading] = useState(false);
  // Mantém o botão travado/girando até a página terminar de atualizar (evita cliques repetidos)
  const [refreshing, startTransition] = useTransition();
  const loading = requesting || refreshing;

  async function handleDelete() {
    if (!confirm(`Tem certeza que deseja EXCLUIR "${name}"?\n\nEsta ação não pode ser desfeita.`)) return;
    setLoading(true);
    await fetch(`/api/produtos/${id}`, { method: "DELETE" });
    setLoading(false);
    startTransition(() => router.refresh());
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
      title="Excluir produto"
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
    </button>
  );
}
