"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Tag, X, Loader2, Check } from "lucide-react";
import { useCouponStore, toActiveCoupon, describeCoupon } from "@/store/couponStore";
import { useMounted } from "@/lib/useMounted";
import { cn, formatCurrency } from "@/lib/utils";

/** Valida o codigo em /api/cupom e, se valer, ativa no site todo. */
export async function activateCoupon(code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, error: "Digite o cupom." };
  try {
    const res = await fetch(`/api/cupom?code=${encodeURIComponent(normalized)}`);
    const data = await res.json();
    if (!data.valid) return { ok: false, error: data.error || "Cupom inválido ou expirado." };
    useCouponStore.getState().setCoupon(toActiveCoupon(normalized, data));
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível validar o cupom. Tente de novo." };
  }
}

/**
 * Botao de cupom no cabecalho: a cliente digita o codigo uma vez e a vitrine
 * inteira passa a mostrar os precos com desconto.
 */
export function CouponMenuButton({ className }: { className?: string }) {
  const mounted = useMounted();
  const coupon = useCouponStore((s) => s.coupon);
  const clearCoupon = useCouponStore((s) => s.clearCoupon);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const active = mounted ? coupon : null;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await activateCoupon(input);
    setLoading(false);
    if (result.ok) {
      setInput("");
      setOpen(false);
    } else {
      setError(result.error);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={className}
        aria-label={active ? `Cupom ${active.code} ativo` : "Tenho um cupom"}
        aria-expanded={open}
      >
        <Tag size={20} className={active ? "text-brand-700" : ""} />
        {active && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="animate-fade-in absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-xl ring-1 ring-black/5 p-4 z-50">
          {active ? (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cupom ativo</p>
              <div className="flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                <div className="min-w-0">
                  <p className="font-mono font-bold text-green-700 text-sm">{active.code}</p>
                  <p className="text-xs text-green-700">{describeCoupon(active, formatCurrency)}</p>
                </div>
                <button
                  onClick={() => clearCoupon()}
                  className="text-gray-400 hover:text-red-500 flex-shrink-0"
                  aria-label="Remover cupom"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3">Quer trocar? Digite outro cupom:</p>
            </>
          ) : (
            <>
              <p className="font-bold text-gray-900 text-sm">Tem um cupom?</p>
              <p className="text-xs text-gray-500 mt-0.5 mb-3">Digite aqui e veja todos os preços do site já com desconto.</p>
            </>
          )}
          <form onSubmit={submit} className="flex gap-2 mt-2">
            <input
              autoFocus
              value={input}
              onChange={(e) => { setInput(e.target.value.toUpperCase()); setError(""); }}
              placeholder="Digite o cupom"
              enterKeyHint="go"
              className="input-field flex-1 min-w-0 uppercase font-mono text-sm py-2.5"
            />
            <button type="submit" disabled={loading} className="btn-primary text-sm px-4 py-2.5 min-w-[84px]">
              {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Aplicar"}
            </button>
          </form>
          {error && <p className="text-xs mt-2 font-medium text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}

/**
 * Faixa no topo das paginas mostrando o cupom ativo. Tambem cuida do link com
 * cupom (?cupom=CODIGO) e revalida o cupom salvo a cada visita, pra derrubar
 * cupom que venceu, esgotou ou foi desativado.
 */
export function ActiveCouponBar() {
  const mounted = useMounted();
  const pathname = usePathname();
  const coupon = useCouponStore((s) => s.coupon);
  const clearCoupon = useCouponStore((s) => s.clearCoupon);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromLink = params.get("cupom");

    if (fromLink) {
      // O checkout le o ?cupom= por conta propria; nas outras paginas limpa a
      // URL pra nao reaplicar (nem vazar o codigo) ao compartilhar o link.
      if (!window.location.pathname.startsWith("/checkout")) {
        params.delete("cupom");
        const qs = params.toString();
        window.history.replaceState(window.history.state, "", window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash);
      }
      activateCoupon(fromLink).then((result) => {
        setFlash(result.ok
          ? { ok: true, text: `Cupom ${fromLink.toUpperCase()} ativado! Os preços já estão com desconto.` }
          : { ok: false, text: `Cupom ${fromLink.toUpperCase()}: ${result.error}` });
      });
      return;
    }

    const saved = useCouponStore.getState().coupon;
    if (saved) {
      activateCoupon(saved.code).then((result) => {
        if (!result.ok) {
          clearCoupon();
          setFlash({ ok: false, text: `O cupom ${saved.code} não é mais válido e foi removido.` });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 6000);
    return () => clearTimeout(t);
  }, [flash]);

  if (!mounted) return null;

  // Carrinho e checkout ja mostram o cupom no resumo do pedido
  const hideBar = pathname?.startsWith("/carrinho") || pathname?.startsWith("/checkout");

  return (
    <>
      {flash && (
        <div
          role="status"
          className={cn(
            "animate-fade-in fixed left-1/2 -translate-x-1/2 top-20 md:top-24 z-[70] w-[min(28rem,calc(100vw-2rem))] rounded-2xl px-4 py-3 shadow-xl text-sm font-medium flex items-start gap-2",
            flash.ok ? "bg-green-600 text-white" : "bg-gray-900 text-white"
          )}
        >
          {flash.ok ? <Check size={18} className="flex-shrink-0 mt-px" /> : <Tag size={18} className="flex-shrink-0 mt-px" />}
          <span className="flex-1">{flash.text}</span>
          <button onClick={() => setFlash(null)} aria-label="Fechar aviso" className="opacity-70 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}

      {coupon && !hideBar && (
        <div className="bg-brand-700 text-white">
          <div className="container-main flex items-center justify-center gap-2 py-2 text-[13px] text-center">
            <Tag size={14} className="flex-shrink-0" />
            <p className="min-w-0">
              Cupom <span className="font-mono font-bold">{coupon.code}</span> ativo: {describeCoupon(coupon, formatCurrency)}
              {coupon.discountType === "PERCENT" && !coupon.minPurchase && coupon.discountValue > 0 && (
                <span className="hidden sm:inline"> · preços já com desconto</span>
              )}
            </p>
            <button
              onClick={() => clearCoupon()}
              className="flex-shrink-0 ml-1 underline underline-offset-2 opacity-80 hover:opacity-100 text-xs"
            >
              remover
            </button>
          </div>
        </div>
      )}
    </>
  );
}
