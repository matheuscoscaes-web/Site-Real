"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { X, Copy, CheckCheck, Gift } from "lucide-react";

const COUPON_CODE = "BEMVINDO";
const DISMISS_KEY = "welcomeCouponDismissed";
const GUEST_DELAY_MS = 2000;

export function WelcomeCouponPopup() {
  const { status } = useSession();
  const [show, setShow] = useState(false);
  const [variant, setVariant] = useState<"customer" | "guest">("customer");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    if (status === "unauthenticated") {
      const timer = setTimeout(() => {
        setVariant("guest");
        setShow(true);
      }, GUEST_DELAY_MS);
      return () => clearTimeout(timer);
    }

    fetch("/api/pedidos/primeiro-desconto")
      .then((r) => r.json())
      .then((d: { isFirstPurchase: boolean }) => {
        if (d.isFirstPurchase) { setVariant("customer"); setShow(true); }
      })
      .catch(() => {});
  }, [status]);

  function dismiss() {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  async function copyCode() {
    await navigator.clipboard.writeText(COUPON_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
      onClick={dismiss}
    >
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-6 text-center relative shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Gift size={28} className="text-brand-700" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
          {variant === "guest" ? "Ainda não é cliente?" : "Bem-vindo(a) à Hearts Couro!"}
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          {variant === "guest"
            ? "Crie sua conta e use o cupom abaixo na primeira compra: 40% de desconto + frete grátis."
            : "Use o cupom abaixo na sua primeira compra e ganhe 40% de desconto + frete grátis."}
        </p>

        <div className="flex items-center justify-between bg-brand-50 border-2 border-dashed border-brand-300 rounded-2xl px-4 py-3 mb-5">
          <span className="font-mono font-bold text-brand-700 text-lg tracking-wide">{COUPON_CODE}</span>
          <button onClick={copyCode} className="btn-primary text-xs px-3 py-2 gap-1.5">
            {copied ? <><CheckCheck size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
          </button>
        </div>

        {variant === "guest" ? (
          <div className="flex flex-col gap-2">
            <Link href="/cadastro" onClick={dismiss} className="btn-primary w-full justify-center">
              Criar minha conta
            </Link>
            <button onClick={dismiss} className="text-xs text-gray-400 hover:text-gray-600">
              Continuar navegando
            </button>
          </div>
        ) : (
          <button onClick={dismiss} className="text-xs text-gray-400 hover:text-gray-600">
            Continuar navegando
          </button>
        )}
      </div>
    </div>
  );
}
