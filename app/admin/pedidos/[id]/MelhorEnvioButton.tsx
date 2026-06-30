"use client";

import { useState } from "react";
import { Loader2, Package, Printer } from "lucide-react";

export function MelhorEnvioButton({ orderId, melhorEnvioId }: { orderId: string; melhorEnvioId: string | null }) {
  const [loading, setLoading] = useState(false);
  const [printUrl, setPrintUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (melhorEnvioId && !printUrl) {
    return (
      <p className="text-xs text-gray-500">
        Etiqueta já gerada (ID: <span className="font-mono">{melhorEnvioId}</span>)
      </p>
    );
  }

  if (printUrl) {
    return (
      <a
        href={printUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary gap-2 inline-flex items-center"
      >
        <Printer size={16} /> Imprimir etiqueta
      </a>
    );
  }

  async function handleGerar() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/melhorenvio/${orderId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar etiqueta");
      } else {
        setPrintUrl(data.url);
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleGerar}
        disabled={loading}
        className="btn-primary gap-2 inline-flex items-center"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
        {loading ? "Gerando etiqueta..." : "Gerar etiqueta Melhor Envio"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
