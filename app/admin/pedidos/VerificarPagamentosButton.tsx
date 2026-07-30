"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, SearchCheck } from "lucide-react";

export function VerificarPagamentosButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/pedidos/verificar-pagamentos", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Erro ao verificar pagamentos.");
        return;
      }
      const recovered = data.recovered ?? 0;
      const naoConferidos = data.naoConferidos ?? 0;

      const partes = [
        recovered > 0
          ? `${recovered} pagamento${recovered !== 1 ? "s" : ""} recuperado${recovered !== 1 ? "s" : ""}!`
          : "Nenhum pagamento recuperado.",
      ];
      if (naoConferidos > 0) {
        partes.push(
          naoConferidos === 1
            ? "1 pedido não pôde ser conferido (sem pagamento vinculado ou erro na consulta)."
            : `${naoConferidos} pedidos não puderam ser conferidos (sem pagamento vinculado ou erro na consulta).`
        );
      }
      alert(partes.join("\n"));

      if (recovered > 0) router.refresh();
    } catch {
      alert("Erro ao verificar pagamentos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="btn-outline gap-2 text-sm py-2.5"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <SearchCheck size={16} />}
      {loading ? "Verificando..." : "Buscar pagamentos"}
    </button>
  );
}
