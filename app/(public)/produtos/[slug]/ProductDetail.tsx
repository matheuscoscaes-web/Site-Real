"use client";

import { useState } from "react";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag, Truck, Shield, RefreshCw, Star, Minus, Plus, Heart, Share2, Check } from "lucide-react";
import { Product, ProductImage, ProductVariant } from "@/types";

interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

function parseImages(raw: string): ProductImage[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) =>
      typeof item === "string" ? { url: item } : { url: item.url || "", color: item.color || null }
    );
  } catch { return []; }
}

export function ProductDetail({ product }: { product: ProductWithVariants }) {
  const addItem = useCartStore((s) => s.addItem);

  const images = parseImages(product.images);
  const colors = [...new Set(product.variants.map((v) => v.color).filter(Boolean) as string[])];
  const sizes = [...new Set(product.variants.map((v) => v.size).filter(Boolean) as string[])];

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(colors[0] || "");
  const [selectedSize, setSelectedSize] = useState(sizes[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [liked, setLiked] = useState(false);

  function handleColorSelect(color: string) {
    setSelectedColor(color);
    const colorImgIdx = images.findIndex((img) => img.color === color);
    if (colorImgIdx !== -1) setSelectedImage(colorImgIdx);
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
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  }

  const installment = product.price / 6;

  const colorStock = selectedColor
    ? product.variants.filter((v) => v.color === selectedColor).reduce((s, v) => s + v.stock, 0)
    : product.stock;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
      {/* Galeria */}
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-2xl bg-gray-50 aspect-square">
          <Image
            src={images[selectedImage]?.url || images[0]?.url || ""}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
          <button
            onClick={() => setLiked(!liked)}
            className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <Heart size={18} className={liked ? "fill-brand-700 text-brand-700" : "text-gray-400"} />
          </button>
        </div>
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {images.map((img, i) => (
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
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <span className="text-xs text-brand-600 font-semibold uppercase tracking-wider">{product.category}</span>
        <h1 className="text-3xl font-bold text-gray-900 mt-1 mb-3" style={{ fontFamily: "Playfair Display, serif" }}>
          {product.name}
        </h1>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={14} className={s <= 4 ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"} />
            ))}
          </div>
          <span className="text-sm text-gray-500">4.8 (47 avaliações)</span>
        </div>

        {/* Preço */}
        <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">{formatCurrency(product.price)}</span>
            <span className="text-lg text-gray-400 line-through">{formatCurrency(product.price * 1.2)}</span>
            <span className="text-sm bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">17% off</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            ou <strong>6x de {formatCurrency(installment)}</strong> sem juros no cartão
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
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={`px-4 py-2 rounded-full text-sm border-2 transition-all ${
                    selectedColor === color
                      ? "border-brand-600 bg-brand-50 text-brand-700 font-semibold"
                      : "border-gray-200 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {color}
                </button>
              ))}
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
                  onClick={() => setSelectedSize(size)}
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
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
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
            disabled={product.stock === 0}
            className={`btn-primary w-full text-base py-4 ${added ? "bg-green-600 hover:bg-green-700" : ""}`}
          >
            {added ? (
              <><Check size={20} /> Adicionado ao carrinho!</>
            ) : product.stock === 0 ? (
              "Produto esgotado"
            ) : (
              <><ShoppingBag size={20} /> Adicionar ao carrinho — {formatCurrency(product.price * quantity)}</>
            )}
          </button>
          <a href="/carrinho" className="btn-outline w-full text-base py-4">
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
        <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-brand-700 transition-colors mt-4">
          <Share2 size={16} /> Compartilhar
        </button>
      </div>
    </div>
  );
}
