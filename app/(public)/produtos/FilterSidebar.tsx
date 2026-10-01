"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";

interface FilterLink {
  label: string;
  href: string;
  active: boolean;
}

interface FilterSidebarProps {
  categories: FilterLink[];
  subcategories?: FilterLink[];
  priceRanges: FilterLink[];
  clearHref: string | null;
}

function FilterGroup({ title, links, indent }: { title: string; links: FilterLink[]; indent?: boolean }) {
  return (
    <div className="mb-6">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">{title}</p>
      <div className="space-y-0.5">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center justify-between text-sm px-3 py-2.5 rounded-xl transition-colors ${indent ? "pl-5" : ""} ${
              l.active ? "bg-brand-50 text-brand-800 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            {l.label}
            {l.active && <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function FilterSidebar({ categories, subcategories, priceRanges, clearHref }: FilterSidebarProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const groups = (
    <>
      {subcategories && subcategories.length > 0 && <FilterGroup title="Seções" links={subcategories} indent />}
      <FilterGroup title="Faixa de preço" links={priceRanges} />
    </>
  );

  return (
    <aside className="lg:w-60 flex-shrink-0">
      {/* Mobile: categorias em faixa de arrastar + botao de filtros */}
      <div className="lg:hidden flex items-center gap-2 -mx-4">
        <div className="snap-row gap-2 flex-1 min-w-0 pl-4 scroll-pl-4 py-1">
          {[...categories, ...(subcategories ?? [])].map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-colors ${
                cat.active ? "bg-gray-900 border-gray-900 text-white font-medium" : "bg-white border-gray-200 text-gray-700 active:bg-gray-50"
              }`}
            >
              {cat.label}
            </Link>
          ))}
          <span className="w-2" aria-hidden />
        </div>
        <button
          onClick={() => setOpen(true)}
          className="relative mr-4 w-10 h-10 flex-shrink-0 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-800 active:bg-gray-50"
          aria-label="Abrir filtros"
        >
          <SlidersHorizontal size={17} />
          {clearHref && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-600 ring-2 ring-white" />}
        </button>
      </div>

      {/* Mobile: gaveta de filtros */}
      <div className={`lg:hidden fixed inset-0 z-[60] ${open ? "visible" : "invisible pointer-events-none"}`} aria-hidden={!open}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <div
          onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
          className={`absolute inset-x-0 bottom-0 max-h-[85vh] bg-white rounded-t-3xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="flex-shrink-0 pt-3 pb-2 px-5">
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-3" />
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Filtros</h3>
              <button onClick={() => setOpen(false)} className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-gray-600 active:bg-gray-100" aria-label="Fechar filtros">
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto overscroll-contain px-5 pt-2">
            <FilterGroup title="Categoria" links={categories} />
            {groups}
          </div>
          {clearHref && (
            <div className="flex-shrink-0 p-4 border-t border-gray-100 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Link href={clearHref} className="btn-outline w-full py-3 text-sm">
                Limpar filtros
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Desktop: barra lateral fixa */}
      <div className="hidden lg:block lg:sticky lg:top-28">
        <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-lg">
          <SlidersHorizontal size={17} className="text-brand-700" /> Filtros
        </h3>
        <FilterGroup title="Categoria" links={categories} />
        {groups}
        {clearHref && (
          <Link href={clearHref} className="flex items-center gap-1.5 text-sm text-brand-700 font-medium hover:underline px-3">
            <X size={14} /> Limpar filtros
          </Link>
        )}
      </div>
    </aside>
  );
}
