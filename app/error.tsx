"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro na aplicação:", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: "Playfair Display, serif" }}>
          Ops, algo deu errado
        </h1>
        <p className="text-gray-500 mb-8">
          Tivemos um problema inesperado ao carregar esta página. Tente novamente ou volte para a página inicial.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => reset()} className="btn-primary">
            <RefreshCw size={18} /> Tentar novamente
          </button>
          <Link href="/" className="btn-outline">
            <Home size={18} /> Página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
