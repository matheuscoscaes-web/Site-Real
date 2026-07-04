"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro crítico na aplicação:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", padding: "1rem" }}>
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.75rem" }}>
              Ops, algo deu errado
            </h1>
            <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
              Tivemos um problema inesperado. Tente novamente em instantes.
            </p>
            <button
              onClick={() => reset()}
              style={{ background: "#be185d", color: "#fff", fontWeight: 600, padding: "0.75rem 1.5rem", borderRadius: "9999px", border: "none", cursor: "pointer" }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
