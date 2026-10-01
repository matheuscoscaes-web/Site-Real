"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

export function SortSelect({ currentValue }: { currentValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("ordem", value);
    } else {
      params.delete("ordem");
    }
    router.push(`/produtos?${params.toString()}`);
  }

  return (
    <div className="relative flex-shrink-0">
      <select
        aria-label="Ordenar produtos"
        className="appearance-none bg-white border border-gray-200 rounded-full pl-4 pr-9 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-300 cursor-pointer"
        defaultValue={currentValue || ""}
        onChange={(e) => handleChange(e.target.value)}
      >
        <option value="">Mais recentes</option>
        <option value="preco_asc">Menor preço</option>
        <option value="preco_desc">Maior preço</option>
        <option value="nome">Nome A–Z</option>
      </select>
      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
    </div>
  );
}
