"use client";

import { useState } from "react";
import { Link2, CheckCheck } from "lucide-react";

/** Link do site que ja abre com o cupom ativado (ex: https://site.com/?cupom=MARIA10). */
export function couponLink(code: string) {
  return `${window.location.origin}/?cupom=${encodeURIComponent(code)}`;
}

/**
 * Copia o link com o cupom embutido: quem clica entra no site com o cupom ja
 * ativo e ve todos os precos com desconto, sem digitar nada.
 */
export function CopyCouponLinkButton({ code, label = "Copiar link", className }: { code: string; label?: string | null; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(couponLink(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie o link do cupom:", couponLink(code));
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Copiar link do site com o cupom já aplicado"
      className={className ?? "inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:text-brand-800"}
    >
      {copied ? <CheckCheck size={14} className="text-green-500" /> : <Link2 size={14} />}
      {label !== null && <span>{copied ? "Link copiado!" : label}</span>}
    </button>
  );
}
