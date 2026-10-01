"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Heart, ShoppingBag, Check } from "lucide-react";
import { formatCurrency, parseProductImages, isCupomElegivel, getMaxInstallments, type CardProduct } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useMounted } from "@/lib/useMounted";
import { useWishlistStore } from "@/store/wishlistStore";

interface ProductCardProps {
  product: CardProduct;
  priority?: boolean;
  sizes?: string;
}

export function ProductCard({
  product,
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
}: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const mounted = useMounted();
  const liked = useWishlistStore((s) => s.items.some((i) => i.productId === product.id)) && mounted;
  const [added, setAdded] = useState(false);

  const imageUrls = parseProductImages(product.images).map((img) => img.url);
  const mainImage = imageUrls[0];
  const hoverImage = imageUrls[1];
  const colorCount = new Set((product.variants ?? []).map((v) => v.color).filter(Boolean)).size;
  const hasMultipleColors = colorCount > 1;
  // Com numeração/tamanho a pessoa precisa escolher na página do produto: sem isso
  // a compra rápida jogaria no carrinho um sapato sem número.
  const sizeCount = new Set((product.variants ?? []).map((v) => v.size).filter(Boolean)).size;
  const needsChoice = hasMultipleColors || sizeCount > 0;
  const totalStock = (product.variants ?? []).reduce((s, v) => s + v.stock, 0);
  const installments = getMaxInstallments(product.price);

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
        <div className="relative overflow-hidden rounded-2xl bg-cream-50 aspect-[3/4]">
          <Image
            src={mainImage}
            alt={product.name}
            fill
            priority={priority}
            className="object-cover transition-transform duration-700 ease-out [@media(hover:hover)]:group-hover:scale-[1.04]"
            sizes={sizes}
          />
          {/* Segunda foto aparece no hover (so desktop) */}
          {hoverImage && (
            <Image
              src={hoverImage}
              alt=""
              aria-hidden
              fill
              loading="lazy"
              className="object-cover opacity-0 transition-opacity duration-500 hidden [@media(hover:hover)]:block group-hover:opacity-100"
              sizes={sizes}
            />
          )}

          {/* Overlay esgotado */}
          {totalStock === 0 && (
            <div className="absolute inset-0 bg-white/50 backdrop-grayscale flex items-center justify-center z-10">
              <span className="bg-gray-900/85 text-white text-[10px] font-semibold px-4 py-2 rounded-full uppercase tracking-[0.2em]">
                Esgotado
              </span>
            </div>
          )}

          {/* Badges */}
          {product.featured && totalStock > 0 && (
            <span className="absolute top-3 left-3 z-20 bg-white/90 backdrop-blur text-brand-800 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Destaque
            </span>
          )}

          {/* Favorito */}
          <button
            onClick={(e) => { e.preventDefault(); toggleWishlist({ productId: product.id, slug: product.slug, name: product.name, price: product.price, image: mainImage }); }}
            className="absolute top-2.5 right-2.5 z-20 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm active:scale-90 [@media(hover:hover)]:hover:scale-110 transition-transform"
            aria-label={liked ? "Remover dos favoritos" : "Favoritar"}
          >
            <Heart size={16} className={liked ? "fill-brand-700 text-brand-700" : "text-gray-500"} />
          </button>

          {/* Compra rápida */}
          {totalStock > 0 && (
            needsChoice ? (
              <span className="absolute bottom-3 inset-x-3 z-20 py-2.5 rounded-full text-[13px] font-semibold items-center justify-center gap-2 bg-white/95 backdrop-blur text-gray-900 shadow-sm transition-all duration-300 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 hidden [@media(hover:hover)]:flex">
                {sizeCount > 0 ? "Escolher tamanho" : `Ver ${colorCount} cores`}
              </span>
            ) : (
              <button
                onClick={handleAddToCart}
                aria-label="Adicionar ao carrinho"
                className={`absolute z-20 flex items-center justify-center gap-2 font-semibold shadow-sm transition-all duration-300
                  bottom-2.5 right-2.5 w-10 h-10 rounded-full
                  [@media(hover:hover)]:bottom-3 [@media(hover:hover)]:inset-x-3 [@media(hover:hover)]:right-3 [@media(hover:hover)]:w-auto [@media(hover:hover)]:h-auto [@media(hover:hover)]:py-2.5 [@media(hover:hover)]:text-[13px]
                  ${added
                    ? "bg-green-600 text-white"
                    : "bg-white/95 backdrop-blur text-gray-900 active:scale-90 [@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-brand-700 hover:text-white"
                  }`}
              >
                {added ? <Check size={16} /> : <ShoppingBag size={16} />}
                <span className="hidden [@media(hover:hover)]:inline">{added ? "Adicionado!" : "Adicionar ao carrinho"}</span>
              </button>
            )
          )}
        </div>

        {/* Info */}
        <div className="mt-3 px-0.5">
          <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-[0.15em] truncate">{product.categories.join(" · ")}</p>
          <h3 className="text-sm font-medium text-gray-900 group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug mb-1.5">
            {product.name}
          </h3>
          <p className="text-[15px] font-bold text-gray-900">{formatCurrency(product.price)}</p>
          <p className="text-[11px] text-gray-500">
            {installments}x de {formatCurrency(product.price / installments)} sem juros
          </p>
          {product.price >= 299.9 && (
            <p className="text-[11px] text-green-700 font-medium mt-0.5">Frete grátis</p>
          )}
          {hasMultipleColors && (
            <p className="text-[11px] text-gray-400 mt-0.5 [@media(hover:hover)]:hidden">{colorCount} cores</p>
          )}
        </div>
      </Link>
    </div>
  );
}
