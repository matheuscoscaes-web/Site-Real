"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Package, Printer, RefreshCw, Copy, CheckCheck, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { caixaPadrao } from "@/lib/caixa";

type Opcao = { id: number; name: string; company: string; price: number; days: number | null };

export function MelhorEnvioButton({
  orderId,
  melhorEnvioId,
  trackingCode,
  zipCode,
  totalItems,
  orderTotal,
  shippingServiceId,
  shippingLabel,
}: {
  orderId: string;
  melhorEnvioId: string | null;
  trackingCode: string | null;
  zipCode: string;
  totalItems: number;
  orderTotal: number;
  shippingServiceId: number | null;
  shippingLabel: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [requesting, setRefreshing] = useState(false);
  const [pageRefreshing, startTransition] = useTransition();
  const refreshing = requesting || pageRefreshing;
  const [printUrl, setPrintUrl] = useState<string | null>(null);
  const [newTrackingCode, setNewTrackingCode] = useState<string | null>(null);
  const code = trackingCode ?? newTrackingCode;
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Caixa (texto pra aceitar vírgula) + seguro
  const padrao = caixaPadrao(totalItems);
  const [altura, setAltura] = useState(String(padrao.height));
  const [largura, setLargura] = useState(String(padrao.width));
  const [comprimento, setComprimento] = useState(String(padrao.length));
  const [peso, setPeso] = useState(String(padrao.weight));
  const [seguro, setSeguro] = useState(false);
  const [opcoes, setOpcoes] = useState<Opcao[] | null>(null);
  const [cotando, setCotando] = useState(false);
  const [selecionado, setSelecionado] = useState<{ id: number; label: string; price?: number } | null>(
    shippingServiceId ? { id: shippingServiceId, label: shippingLabel ?? "Serviço escolhido" } : null
  );
  const [salvando, setSalvando] = useState(false);

  const caixa = () => ({
    height: altura,
    width: largura,
    length: comprimento,
    weight: peso,
    insuranceValue: seguro ? orderTotal : 0,
  });

  async function copyCode() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
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
        startTransition(() => router.refresh());
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setRefreshing(false);
    }
  }

  const codeBox = code ? (
    <div className="flex items-center justify-between bg-brand-50 border border-brand-200 rounded-xl px-3 py-2">
      <div>
        <p className="text-[11px] uppercase tracking-wide text-brand-700/70 mb-0.5">Código de rastreio</p>
        <span className="font-mono font-semibold text-brand-700 text-sm">{code}</span>
      </div>
      <button onClick={copyCode} className="text-xs text-brand-700 hover:text-brand-800 inline-flex items-center gap-1">
        {copied ? <><CheckCheck size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
      </button>
    </div>
  ) : null;

  if (melhorEnvioId && !printUrl) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-gray-500">
          Etiqueta já gerada (ID: <span className="font-mono">{melhorEnvioId}</span>)
        </p>
        {code ? (
          codeBox
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
      <div className="space-y-2">
        <a
          href={printUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary gap-2 inline-flex items-center"
        >
          <Printer size={16} /> Imprimir etiqueta
        </a>
        {code ? (
          codeBox
        ) : (
          <p className="text-xs text-gray-500">
            O código de rastreio ainda está sendo criado pelo Melhor Envio — ele aparece aqui e pro cliente automaticamente em alguns minutos.
          </p>
        )}
      </div>
    );
  }

  async function handleCotar() {
    setCotando(true);
    setError("");
    try {
      const res = await fetch("/api/admin/frete/cotacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep: zipCode, caixa: caixa() }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error(data?.error ?? "Erro ao cotar");
      setOpcoes(data);
      // Atualiza o preço do serviço já escolhido com a caixa nova
      setSelecionado((s) => {
        if (!s) return s;
        const o = (data as Opcao[]).find((x) => x.id === s.id);
        return o ? { ...s, price: o.price } : s;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao cotar");
    } finally {
      setCotando(false);
    }
  }

  async function handleEscolher(o: Opcao) {
    setSalvando(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/pedidos/${orderId}/frete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingServiceId: o.id, shippingService: o.name, shippingCarrier: o.company }),
      });
      if (!res.ok) throw new Error();
      setSelecionado({ id: o.id, label: `${o.company} — ${o.name}`, price: o.price });
    } catch {
      setError("Não foi possível salvar a transportadora.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleGerar() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/melhorenvio/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caixa: caixa() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar etiqueta");
      } else {
        setPrintUrl(data.url);
        setNewTrackingCode(data.trackingCode ?? null);
        // Atualiza o resto da página (status "Em Separação")
        startTransition(() => router.refresh());
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  // Mexeu na caixa → a cotação anterior não vale mais
  const campo = (label: string, value: string, set: (v: string) => void, unit: string) => (
    <label className="block">
      <span className="text-[11px] text-gray-500">{label}</span>
      <div className="flex items-center gap-1">
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => { set(e.target.value); setOpcoes(null); }}
          className="input-field py-1.5 px-2 text-sm w-full"
        />
        <span className="text-[11px] text-gray-400">{unit}</span>
      </div>
    </label>
  );

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-1.5">Caixa</p>
        <div className="grid grid-cols-2 gap-2">
          {campo("Altura", altura, setAltura, "cm")}
          {campo("Largura", largura, setLargura, "cm")}
          {campo("Comprimento", comprimento, setComprimento, "cm")}
          {campo("Peso", peso, setPeso, "kg")}
        </div>
        <label className="flex items-center gap-2 mt-2 text-xs text-gray-600">
          <input type="checkbox" checked={seguro} onChange={(e) => { setSeguro(e.target.checked); setOpcoes(null); }} />
          Declarar valor do pedido ({formatCurrency(orderTotal)}) — seguro, deixa o frete mais caro
        </label>
      </div>

      <button onClick={handleCotar} disabled={cotando} className="btn-outline text-sm gap-2 inline-flex items-center">
        {cotando ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        {cotando ? "Cotando..." : "Cotar frete (preço real)"}
      </button>

      {opcoes && opcoes.length === 0 && (
        <p className="text-sm text-gray-400">Nenhuma transportadora disponível pra esse CEP/caixa.</p>
      )}
      {opcoes && opcoes.length > 0 && (
        <div className="space-y-1.5">
          {opcoes.map((o) => {
            const ativo = selecionado?.id === o.id;
            return (
              <button
                key={o.id}
                disabled={salvando}
                onClick={() => handleEscolher(o)}
                className={`w-full flex items-center justify-between gap-3 border-2 rounded-xl px-3 py-2 text-left transition-colors disabled:opacity-50 ${ativo ? "border-brand-600 bg-brand-50" : "border-gray-200 hover:border-brand-600"}`}
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{o.company} — {o.name}</p>
                  {o.days != null && <p className="text-xs text-gray-400">até {o.days} dias úteis</p>}
                </div>
                <span className="text-sm font-bold text-gray-900 flex-shrink-0">{formatCurrency(o.price)}</span>
              </button>
            );
          })}
        </div>
      )}

      {selecionado ? (
        <>
          <p className="text-xs text-gray-600">
            Envio por <strong>{selecionado.label}</strong>
            {selecionado.price != null && <> — <strong>{formatCurrency(selecionado.price)}</strong></>}
          </p>
          <button onClick={handleGerar} disabled={loading || salvando} className="btn-primary gap-2 inline-flex items-center">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
            {loading ? "Gerando etiqueta..." : "Gerar etiqueta Melhor Envio"}
          </button>
        </>
      ) : (
        <p className="text-xs text-amber-600">Cote e escolha uma transportadora pra gerar a etiqueta.</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
