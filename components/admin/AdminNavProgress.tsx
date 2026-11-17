"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Barra fina no topo que aparece assim que um link interno é clicado (ou um
 * filtro GET é enviado) e some quando a nova página chega. Sem isso, o clique
 * parecia "não pegar" enquanto o servidor montava a página, e a pessoa clicava
 * de novo várias vezes.
 */
export function AdminNavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);

  // Nova rota chegou: esconde a barra
  useEffect(() => {
    setActive(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    function sameOriginTarget(url: URL) {
      if (url.origin !== window.location.origin) return false;
      const here = window.location.pathname + window.location.search;
      return url.pathname + url.search !== here;
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a || !a.href || a.target === "_blank" || a.hasAttribute("download")) return;
      if (sameOriginTarget(new URL(a.href))) setActive(true);
    }

    function onSubmit(e: SubmitEvent) {
      const form = e.target as HTMLFormElement | null;
      if (form && (form.method || "get").toLowerCase() === "get") setActive(true);
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  // Segurança: nunca fica presa na tela
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setActive(false), 15000);
    return () => clearTimeout(t);
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[60] overflow-hidden bg-brand-100/60 pointer-events-none">
      <div className="h-full w-1/3 bg-brand-600 animate-[admin-nav-progress_1s_ease-in-out_infinite]" />
      <style>{`@keyframes admin-nav-progress{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
    </div>
  );
}
