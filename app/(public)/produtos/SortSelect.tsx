"use client";

import { useRouter, useSearchParams } from "next/navigation";

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
    <select
      className="input-field w-full sm:w-auto text-sm py-2"
      defaultValue={currentValue || ""}
      onChange={(e) => handleChange(e.target.value)}
    >
      <option value="">Mais recentes</option>
      <option value="preco_asc">Menor preço</option>
      <option value="preco_desc">Maior preço</option>
      <option value="nome">Nome A–Z</option>
    </select>
  );
}
