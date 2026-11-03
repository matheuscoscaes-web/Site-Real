"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { activateCoupon } from "@/components/layout/ActiveCoupon";
import type { CartItem } from "@/types";

/**
 * Link de recuperação de carrinho (mandado pelo WhatsApp quando o pedido
 * expira sem pagamento): coloca no carrinho tudo que estava no pedido, ativa
 * o mesmo cupom e leva pro carrinho.
 */
export default function RecuperarCarrinhoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const started = useRef(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (started.current || !id) return;
    started.current = true;

    (async () => {
      try {
        const res = await fetch(`/api/carrinho/recuperar/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error("not-found");
        const data: { items: Omit<CartItem, "id">[]; esgotados: string[]; couponCode: string | null } = await res.json();
        if (data.items.length === 0) {
          setErro(
            data.esgotados.length
              ? `Poxa, ${data.esgotados.join(", ")} esgotou 😢 Dá uma olhada nas outras opções da loja!`
              : "Não encontramos os produtos desse pedido."
          );
          return;
        }

        // Já está no carrinho (mesmo produto/cor/tamanho)? Não soma de novo.
        const cart = useCartStore.getState();
        for (const item of data.items) {
          const itemId = `${item.productId}-${item.color || ""}-${item.size || ""}`;
          if (!cart.items.some((i) => i.id === itemId)) cart.addItem(item);
        }
        if (data.couponCode) await activateCoupon(data.couponCode);
        router.replace("/carrinho");
      } catch {
        setErro("Não encontramos esse pedido. Que tal dar uma olhada na loja?");
      }
    })();
  }, [id, router]);

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      {erro ? (
        <>
          <p className="text-gray-700 mb-6">{erro}</p>
          <Link href="/produtos" className="inline-block bg-black text-white px-6 py-3 rounded-full text-sm">
            Ver produtos
          </Link>
        </>
      ) : (
        <>
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-500" />
          <p className="text-gray-600">Montando seu carrinho…</p>
        </>
      )}
    </div>
  );
}
