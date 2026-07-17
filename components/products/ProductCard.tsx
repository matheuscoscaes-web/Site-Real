"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Heart, ShoppingBag, Star } from "lucide-react";
import { formatCurrency, parseProductImages, isCupomElegivel, getMaxInstallments } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const liked = useWishlistStore((s) => s.items.some((i) => i.productId === product.id));
  const [added, setAdded] = useState(false);

  const imageUrls = parseProductImages(product.images).map((img) => img.url);
  const mainImage = imageUrls[0];
  const hoverImage = imageUrls[1];
  const colorCount = new Set((product.variants ?? []).map((v) => v.color).filter(Boolean)).size;
  const hasMultipleColors = colorCount > 1;
  const totalStock = (product.variants ?? []).reduce((s, v) => s + v.stock, 0);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: mainImage,
      quantity: 1,
      slug: product.slug,
      cupomElegivel: isCupomElegivel(product.categories, product.permiteCupom),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="group relative">
      <Link href={`/produtos/${product.slug}`} className="block">
        {/* Imagem */}
        <div className="relative overflow-hidden rounded-2xl bg-gray-50 aspect-[3/4]">
          <Image
            src={mainImage}
            alt={product.name}
            fill
            priority={priority}
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Overlay esgotado */}
          {totalStock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <span className="bg-white text-gray-800 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest shadow">
                Esgotado
              </span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-20">
            {product.featured && totalStock > 0 && (
              <span className="bg-brand-700 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                Destaque
              </span>
            )}
          </div>

          {/* Favorito */}
          <button
            onClick={(e) => { e.preventDefault(); toggleWishlist({ productId: product.id, slug: product.slug, name: product.name, price: product.price, image: mainImage }); }}
            className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
            aria-label="Favoritar"
          >
            <Heart size={15} className={liked ? "fill-brand-700 text-brand-700" : "text-gray-400"} />
          </button>

          {/* Add to cart overlay */}
          {totalStock > 0 && (
            hasMultipleColors ? (
              <span
                className="absolute bottom-3 left-3 right-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 bg-white text-brand-700 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-brand-700 hover:text-white"
              >
                <ShoppingBag size={15} />
                Ver cores disponíveis
              </span>
            ) : (
              <button
                onClick={handleAddToCart}
                className={`absolute bottom-3 left-3 right-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  added
                    ? "bg-green-500 text-white translate-y-0 opacity-100"
                    : "bg-white text-brand-700 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-brand-700 hover:text-white"
                }`}
              >
                <ShoppingBag size={15} />
                {added ? "Adicionado!" : "Adicionar ao carrinho"}
              </button>
            )
          )}
        </div>

        {/* Info */}
        <div className="mt-3 px-1">
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">{product.categories.join(" · ")}</p>
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-700 transition-colors line-clamp-2 leading-tight mb-2">
            {product.name}
          </h3>

          {/* Rating simulado */}
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={11} className={s <= 4 ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"} />
            ))}
            <span className="text-xs text-gray-400 ml-1">(24)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900">{formatCurrency(product.price)}</span>
            <span className="text-xs text-gray-400">
              ou {getMaxInstallments(product.price)}x de {formatCurrency(product.price / getMaxInstallments(product.price))}
            </span>
          </div>
          {product.price >= 299.9 && (
            <p className="text-[11px] text-green-600 font-medium mt-0.5">Frete grátis</p>
          )}
        </div>
      </Link>
    </div>
  );
}
