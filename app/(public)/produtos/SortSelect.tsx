"use client";

export function SortSelect({ currentValue }: { currentValue?: string }) {
  return (
    <select
      className="input-field w-auto text-sm py-2"
      defaultValue={currentValue || ""}
      onChange={(e) => {
        const url = new URL(window.location.href);
        if (e.target.value) {
          url.searchParams.set("ordem", e.target.value);
        } else {
          url.searchParams.delete("ordem");
        }
        window.location.href = url.toString();
      }}
    >
      <option value="">Mais recentes</option>
      <option value="preco_asc">Menor preço</option>
      <option value="preco_desc">Maior preço</option>
      <option value="nome">Nome A–Z</option>
    </select>
  );
}
