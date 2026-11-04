"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

// Miniatura do item do pedido: clicou, abre a foto grande por cima da tela (fecha clicando fora, no X ou com Esc).
export function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative w-full h-full cursor-zoom-in"
        aria-label={`Ampliar foto: ${alt}`}
      >
        <Image src={src} alt={alt} fill className="object-cover" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-zoom-out"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 rounded-full bg-white/90 p-2 text-gray-900 hover:bg-white"
            aria-label="Fechar"
          >
            <X size={22} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="max-h-[90vh] max-w-[95vw] rounded-xl object-contain shadow-2xl" />
        </div>
      )}
    </>
  );
}
