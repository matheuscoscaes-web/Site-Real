"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Package, Printer, RefreshCw, Copy, CheckCheck } from "lucide-react";

export function MelhorEnvioButton({
  orderId,
  melhorEnvioId,
  trackingCode,
}: {
  orderId: string;
  melhorEnvioId: string | null;
  trackingCode: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [printUrl, setPrintUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    if (!trackingCode) return;
    await navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAtualizarRastreio() {
    setRefreshing(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/pedidos/${orderId}/rastreio`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao buscar rastreio");
      } else if (!data.trackingCode) {
        setError("Rastreio ainda não disponível — tente novamente mais tarde.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setRefreshing(false);
    }
  }

  if (melhorEnvioId && !printUrl) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-gray-500">
          Etiqueta já gerada (ID: <span className="font-mono">{melhorEnvioId}</span>)
        </p>
        {trackingCode ? (
          <div className="flex items-center justify-between bg-brand-50 border border-brand-200 rounded-xl px-3 py-2">
            <span className="font-mono font-semibold text-brand-700 text-sm">{trackingCode}</span>
            <button onClick={copyCode} className="text-xs text-brand-700 hover:text-brand-800 inline-flex items-center gap-1">
              {copied ? <><CheckCheck size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
            </button>
          </div>
        ) : (
          <button
            onClick={handleAtualizarRastreio}
            disabled={refreshing}
            className="btn-outline text-xs gap-2 inline-flex items-center py-1.5 px-3"
          >
            {refreshing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {refreshing ? "Buscando..." : "Buscar código de rastreio"}
          </button>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
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
