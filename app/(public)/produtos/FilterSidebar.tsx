"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp, X } from "lucide-react";

interface FilterLink {
  label: string;
  href: string;
  active: boolean;
}

interface FilterSidebarProps {
  categories: FilterLink[];
  priceRanges: FilterLink[];
  clearHref: string | null;
}

export function FilterSidebar({ categories, priceRanges, clearHref }: FilterSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <aside className="lg:w-60 flex-shrink-0">
      {/* Botão toggle — só aparece no mobile */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-5 py-3.5 font-semibold text-gray-800 shadow-sm"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={17} className="text-brand-700" />
          Filtros
          {clearHref && (
            <span className="bg-brand-100 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Ativo</span>
          )}
        </span>
        {open ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </button>

      {/* Conteúdo — oculto no mobile quando fechado, sempre visível no desktop */}
      <div className={`mt-2 lg:mt-0 bg-white rounded-2xl border border-gray-100 p-5 lg:sticky lg:top-24 ${open ? "block" : "hidden lg:block"}`}>
        <h3 className="font-bold text-gray-900 mb-4 items-center gap-2 hidden lg:flex">
          <SlidersHorizontal size={18} className="text-brand-700" /> Filtros
        </h3>

        {/* Categorias */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Categoria</p>
          <div className="space-y-1">
            {categories.map((cat) => (
              <a
                key={cat.href}
                href={cat.href}
                className={`block text-sm px-3 py-2 rounded-lg transition-colors ${
                  cat.active ? "bg-brand-50 text-brand-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {cat.label}
              </a>
            ))}
          </div>
        </div>

        {/* Faixa de Preço */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Faixa de Preço</p>
          <div className="space-y-1">
            {priceRanges.map((range) => (
              <a
                key={range.label}
                href={range.href}
                className={`block text-sm px-3 py-2 rounded-lg transition-colors ${
                  range.active ? "bg-brand-50 text-brand-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {range.label}
              </a>
            ))}
          </div>
        </div>

        {/* Limpar filtros */}
        {clearHref && (
          <a href={clearHref} className="flex items-center justify-center gap-1 text-sm text-brand-700 font-medium hover:underline">
            <X size={14} /> Limpar filtros
          </a>
        )}
      </div>
    </aside>
  );
}
