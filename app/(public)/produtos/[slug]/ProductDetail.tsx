"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { formatCurrency, parseProductImages, isCupomElegivel, getMaxInstallments } from "@/lib/utils";
import { ShoppingBag, Truck, Shield, RefreshCw, Star, Minus, Plus, Heart, Share2, Check, PlayCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Product, ProductVariant } from "@/types";
import { AvaliacoesBadge } from "./AvaliacoesSection";

interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

export function ProductDetail({ product }: { product: ProductWithVariants }) {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const liked = useWishlistStore((s) => s.items.some((i) => i.productId === product.id));

  const images = parseProductImages(product.images);

  const colorStockMap = new Map<string, number>();
  for (const v of product.variants) {
    if (!v.color) continue;
    colorStockMap.set(v.color, (colorStockMap.get(v.color) ?? 0) + v.stock);
  }
  // Cores esgotadas vão pro final da lista (sort é estável, preserva a ordem entre elas)
  const colors = [...new Set(product.variants.map((v) => v.color).filter(Boolean) as string[])].sort(
    (a, b) => Number(colorStockMap.get(a) === 0) - Number(colorStockMap.get(b) === 0)
  );
  const sizes = [...new Set(product.variants.map((v) => v.size).filter(Boolean) as string[])];

  const [selectedImage, setSelectedImage] = useState<number | "video">(0);
  const [selectedColor, setSelectedColor] = useState(colors[0] || "");
  const [selectedSize, setSelectedSize] = useState(sizes[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Fotos da cor escolhida (frente, verso etc.) — se não tiver cor, mostra todas
  const colorImages = selectedColor ? images.filter((img) => img.color === selectedColor) : images;
  const displayImages = colorImages.length > 0 ? colorImages : images;

  function handleColorSelect(color: string) {
    setSelectedColor(color);
    setSelectedImage(0);
    setQuantity(1);
  }

  function handleSizeSelect(size: string) {
    setSelectedSize(size);
    setQuantity(1);
  }

  function nextImage() {
    setSelectedImage((i) => (i === "video" ? 0 : (i + 1) % displayImages.length));
  }
  function prevImage() {
    setSelectedImage((i) => (i === "video" ? 0 : (i - 1 + displayImages.length) % displayImages.length));
  }

  const touchStartX = useRef<number | null>(null);
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || displayImages.length <= 1) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      if (delta < 0) nextImage(); else prevImage();
    }
    touchStartX.current = null;
  }

  function handleAddToCart() {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: images[0]?.url || "",
      quantity,
      color: selectedColor || undefined,
      size: selectedSize || undefined,
      slug: product.slug,
      cupomElegivel: isCupomElegivel(product.categories, product.permiteCupom),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  }

  const maxInstallments = getMaxInstallments(product.price);
  const installment = product.price / maxInstallments;

  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);

  const colorStock = selectedColor
    ? product.variants.filter((v) => v.color === selectedColor).reduce((s, v) => s + v.stock, 0)
    : totalStock;

  // Estoque exato da combinação cor+tamanho escolhida — é o que de fato pode
  // ser comprado (o colorStock acima soma todos os tamanhos daquela cor).
  const selectedVariants = product.variants.filter(
    (v) => (!selectedColor || v.color === selectedColor) && (!selectedSize || v.size === selectedSize)
  );
  const availableStock = colors.length === 0 && sizes.length === 0
    ? totalStock
    : selectedVariants.reduce((s, v) => s + v.stock, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
      {/* Galeria */}
      <div className="space-y-3">
        <div
          className="relative overflow-hidden rounded-2xl bg-gray-50 aspect-square touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {selectedImage === "video" && product.video ? (
            <video src={product.video} controls autoPlay className="w-full h-full object-cover" />
          ) : (
            <Image
              src={displayImages[selectedImage as number]?.url || images[0]?.url || ""}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          )}
          <button
            onClick={() => toggleWishlist({ productId: product.id, slug: product.slug, name: product.name, price: product.price, image: images[0]?.url || "" })}
            className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <Heart size={18} className={liked ? "fill-brand-700 text-brand-700" : "text-gray-400"} />
          </button>
          {selectedImage !== "video" && displayImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                aria-label="Foto anterior"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
              >
                <ChevronLeft size={20} className="text-gray-700" />
              </button>
              <button
                onClick={nextImage}
                aria-label="Próxima foto"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
              >
                <ChevronRight size={20} className="text-gray-700" />
              </button>
              <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5">
                {displayImages.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      selectedImage === i ? "w-4 bg-white" : "w-1.5 bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        {(displayImages.length > 1 || product.video) && (
          <div className="grid grid-cols-4 gap-2">
            {displayImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                  selectedImage === i ? "border-brand-600" : "border-transparent hover:border-gray-300"
                }`}
              >
                <Image src={img.url} alt={img.color || `${product.name} ${i + 1}`} fill sizes="100px" className="object-cover" />
                {img.color && (
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center py-0.5 truncate px-0.5">
                    {img.color}
                  </span>
                )}
              </button>
            ))}
            {product.video && (
              <button
                onClick={() => setSelectedImage("video")}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all bg-black ${
                  selectedImage === "video" ? "border-brand-600" : "border-transparent hover:border-gray-300"
                }`}
              >
                <video src={product.video} className="w-full h-full object-cover opacity-70" muted />
                <PlayCircle size={28} className="absolute inset-0 m-auto text-white drop-shadow" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <span className="text-xs text-brand-600 font-semibold uppercase tracking-wider">{product.categories.join(" · ")}</span>
        <h1 className="text-3xl font-bold text-gray-900 mt-1 mb-3" style={{ fontFamily: "Playfair Display, serif" }}>
          {product.name}
        </h1>

        {/* Rating */}
        <div className="mb-4">
          <AvaliacoesBadge productId={product.id} />
        </div>

        {/* Preço */}
        <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">{formatCurrency(product.price)}</span>
            <span className="text-lg text-gray-400 line-through">{formatCurrency(product.price * 1.2)}</span>
            <span className="text-sm bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">17% off</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            ou <strong>{maxInstallments}x de {formatCurrency(installment)}</strong> sem juros no cartão
          </p>
          <p className="text-sm text-brand-700 font-medium mt-1">
            5% de desconto no PIX: {formatCurrency(product.price * 0.95)}
          </p>
        </div>

        {/* Cores */}
        {colors.length > 0 && (
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Cor: <span className="font-normal text-gray-600">{selectedColor}</span>
              {selectedColor && (
                <span className={`text-xs ml-2 ${colorStock > 0 ? "text-gray-400" : "text-red-500"}`}>
                  ({colorStock > 0 ? `${colorStock} disponíveis` : "Esgotado"})
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => {
                const outOfStock = colorStockMap.get(color) === 0;
                return (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={`px-4 py-2 rounded-full text-sm border-2 transition-all ${
                      selectedColor === color
                        ? "border-brand-600 bg-brand-50 text-brand-700 font-semibold"
                        : outOfStock
                        ? "border-gray-100 text-gray-300"
                        : "border-gray-200 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {color}{outOfStock && " (esgotado)"}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tamanhos */}
        {sizes.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">
                Tamanho: <span className="font-normal text-gray-600">{selectedSize}</span>
              </p>
              <button className="text-xs text-brand-600 underline">Guia de tamanhos</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeSelect(size)}
                  className={`w-12 h-12 rounded-xl text-sm border-2 transition-all font-medium ${
                    selectedSize === size
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantidade */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-2">Quantidade</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-3 hover:bg-gray-50 transition-colors text-gray-600"
              >
                <Minus size={16} />
              </button>
              <span className="px-5 py-3 font-semibold text-gray-900 min-w-[50px] text-center border-x border-gray-200">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                className="px-4 py-3 hover:bg-gray-50 transition-colors text-gray-600"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-3 mb-8">
          <button
            onClick={handleAddToCart}
            disabled={availableStock === 0}
            className={`btn-primary w-full text-sm sm:text-base py-4 ${added ? "bg-green-600 hover:bg-green-700" : ""}`}
          >
            {added ? (
              <><Check size={20} /> Adicionado ao carrinho!</>
            ) : availableStock === 0 ? (
              "Produto esgotado"
            ) : (
              <><ShoppingBag size={18} className="shrink-0" /> Adicionar ao carrinho — {formatCurrency(product.price * quantity)}</>
            )}
          </button>
          <a href="/carrinho" className="btn-outline w-full text-sm sm:text-base py-4">
            Ir para o carrinho
          </a>
        </div>

        {/* Garantias */}
        <div className="space-y-2 mb-6 p-4 bg-gray-50 rounded-2xl">
          {[
            { icon: Truck, text: "Frete grátis acima de R$ 299,90" },
            { icon: Shield, text: "Compra 100% segura e protegida" },
            { icon: RefreshCw, text: "Troca ou devolução em 30 dias" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-sm text-gray-600">
              <Icon size={16} className="text-brand-700 flex-shrink-0" />
              {text}
            </div>
          ))}
        </div>

        {/* Descrição */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3">Descrição do produto</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
        </div>

        {/* Share */}
        <button
          onClick={async () => {
            const url = window.location.href;
            if (navigator.share) {
              await navigator.share({ title: product.name, url });
            } else {
              await navigator.clipboard.writeText(url);
              alert("Link copiado!");
            }
          }}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-brand-700 transition-colors mt-4"
        >
          <Share2 size={16} /> Compartilhar
        </button>
      </div>
    </div>
  );
}
