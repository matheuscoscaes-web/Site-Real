"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { BLACK_END, BLACK_FRIDAY, FLASH_SALE_END, FLASH_SALE_PERCENT, NO_DISCOUNT } from "@/lib/black";
import { useCouponStore } from "@/store/couponStore";

const BlackModeContext = createContext({ active: false, flashSale: false });

export function BlackModeProvider({ active, flashSale, children }: { active: boolean; flashSale: boolean; children: React.ReactNode }) {
  // Na oferta relampago os cupons ficam pausados: tira o cupom salvo no
  // navegador pra vitrine nao mostrar preco "com cupom" que nao vai valer.
  useEffect(() => {
    if (flashSale) useCouponStore.getState().clearCoupon();
  }, [flashSale]);

  return (
    <BlackModeContext.Provider value={{ active, flashSale }}>
      <div className={active ? "black-mode" : undefined}>{children}</div>
    </BlackModeContext.Provider>
  );
}

/** Tema Black ligado? */
export function useBlackMode() {
  return useContext(BlackModeContext).active;
}

/** Oferta relampago (site inteiro com desconto, cupons pausados) valendo? */
export function useFlashSale() {
  return useContext(BlackModeContext).flashSale;
}

function splitTime(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Ate a Black Friday conta pra ela; depois, conta pro fim da campanha. */
function useCountdown(flashSale: boolean) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return null;
  if (flashSale && FLASH_SALE_END && now < FLASH_SALE_END.getTime()) return { label: `${FLASH_SALE_PERCENT}% off acaba em`, ...splitTime(FLASH_SALE_END.getTime() - now) };
  if (now < BLACK_FRIDAY.getTime()) return { label: "A Black Friday começa em", ...splitTime(BLACK_FRIDAY.getTime() - now) };
  if (now < BLACK_END.getTime()) return { label: "Últimas horas: acaba em", ...splitTime(BLACK_END.getTime() - now) };
  return { label: "", d: 0, h: 0, m: 0, s: 0, ended: true };
}

const MARQUEE_ITEMS = ["Black November", "Ofertas em couro legítimo", "Black November", "Parcele sem juros", "Black November", NO_DISCOUNT ? "Couro legítimo" : "5% off no PIX"];
const FLASH_MARQUEE_ITEMS = [`Site inteiro ${FLASH_SALE_PERCENT}% off`, "Black November", `Site inteiro ${FLASH_SALE_PERCENT}% off`, "Parcele sem juros", `Site inteiro ${FLASH_SALE_PERCENT}% off`, "Black November"];

/** Faixa animada + contagem regressiva no topo do site. */
export function BlackBar() {
  const { active, flashSale } = useContext(BlackModeContext);
  const t = useCountdown(flashSale);
  if (!active && !flashSale) return null;

  // Duplica a lista pra rolagem continua (a animacao anda 50% e recomeca)
  const base = flashSale ? FLASH_MARQUEE_ITEMS : MARQUEE_ITEMS;
  const items = [...base, ...base];
  const showTimer = t && !("ended" in t);

  return (
    <div className="black-bar" role="region" aria-label="Black November">
      <div className="black-marquee" aria-hidden>
        <div className="black-marquee-track">
          {items.map((txt, i) => (
            <span key={i} className="black-marquee-item">
              {txt} <span className="black-marquee-dot">✦</span>
            </span>
          ))}
        </div>
      </div>
      {showTimer && (
        <div className="black-countdown">
          <span className="black-countdown-label">{t.label}</span>
          <span className="black-countdown-digits" suppressHydrationWarning>
            {t.d > 0 && <><b>{t.d}</b><small>d</small></>}
            <b>{pad(t.h)}</b><small>h</small>
            <b>{pad(t.m)}</b><small>m</small>
            <b>{pad(t.s)}</b><small>s</small>
          </span>
        </div>
      )}
    </div>
  );
}

/** Selo "BLACK -30%" (ou so "-30%" fora da campanha) pra por em cima da foto. */
export function DiscountBadge({ percent, className = "" }: { percent: number; className?: string }) {
  const active = useBlackMode();
  return active ? (
    <span className={`black-badge ${className}`}>
      <span className="black-badge-tag">BLACK</span>
      <span>-{percent}%</span>
    </span>
  ) : (
    <span className={`bg-brand-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider ${className}`}>
      -{percent}%
    </span>
  );
}
