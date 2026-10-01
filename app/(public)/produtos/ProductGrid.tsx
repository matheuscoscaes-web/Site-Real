"use client";

import { useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/products/ProductCard";
import type { CardProduct } from "@/lib/utils";

const PAGE = 24;

// Monta os cards aos poucos: os primeiros 24 na hora e o resto conforme a pessoa
// rola. Montar os ~70 de uma vez travava o celular por quase 1s ao abrir a lista.
export function ProductGrid({ products }: { products: CardProduct[] }) {
  const [visible, setVisible] = useState(PAGE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Trocou o filtro/ordem: volta pro comeco
  useEffect(() => setVisible(PAGE), [products]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || visible >= products.length) return;
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible((v) => v + PAGE),
      { rootMargin: "800px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, products.length]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-8 md:gap-x-6 md:gap-y-10">
        {products.slice(0, visible).map((product, i) => (
          <ProductCard key={product.id} product={product} priority={i < 4} />
        ))}
      </div>
      {visible < products.length && <div ref={sentinelRef} className="h-px" aria-hidden />}
    </>
  );
}
