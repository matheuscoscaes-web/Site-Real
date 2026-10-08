"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { useMounted } from "@/lib/useMounted";
import { useWishlistStore } from "@/store/wishlistStore";
import { useCouponStore, couponUnitPrice } from "@/store/couponStore";
import { formatCurrency, parseProductImages, isCupomElegivel, getMaxInstallments, sortSizes } from "@/lib/utils";
import { ShoppingBag, Truck, Shield, RefreshCw, Minus, Plus, Heart, Share2, Check, PlayCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Product, ProductVariant } from "@/types";
import { AvaliacoesBadge } from "./AvaliacoesSection";

interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

export function ProductDetail({ product }: { product: ProductWithVariants }) {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const mounted = useMounted();
  const liked = useWishlistStore((s) => s.items.some((i) => i.productId === product.id)) && mounted;

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
  // Numeração/tamanhos de cada cor, com o estoque de cada um. Cada cor pode ter
  // uma grade diferente (ex: o preto vai do 33 ao 40 e o caramelo só até o 38).
  const sizesFor = (color: string) => {
    const vs = product.variants.filter((v) => v.size && (!color || v.color === color));
    return sortSizes([...new Set(vs.map((v) => v.size as string))]).map((size) => ({
      size,
      stock: vs.filter((v) => v.size === size).reduce((s, v) => s + v.stock, 0),
    }));
  };
  const firstAvailableSize = (color: string) => {
    const list = sizesFor(color);
    return (list.find((s) => s.stock > 0) ?? list[0])?.size ?? "";
  };
  const isNumbered = product.variants.some((v) => v.size && /^\d/.test(v.size));
  const sizeLabel = isNumbered ? "Numeração" : "Tamanho";

  const [selectedImage, setSelectedImage] = useState<number | "video">(0);
  const [selectedColor, setSelectedColor] = useState(colors[0] || "");
  const [selectedSize, setSelectedSize] = useState(() => firstAvailableSize(colors[0] || ""));
  const sizes = sizesFor(selectedColor);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Fotos da cor escolhida (frente, verso etc.) — se não tiver cor, mostra todas
  const colorImages = selectedColor ? images.filter((img) => img.color === selectedColor) : images;
  const displayImages = colorImages.length > 0 ? colorImages : images;

  function handleColorSelect(color: string) {
    setSelectedColor(color);
    setSelectedImage(0);
    setQuantity(1);
    // Mantém o número escolhido se a nova cor tiver ele em estoque; senão pula pro primeiro disponível
    const keep = sizesFor(color).find((s) => s.size === selectedSize && s.stock > 0);
    if (!keep) setSelectedSize(firstAvailableSize(color));
  }

  function handleSizeSelect(size: string) {
    setSelectedSize(size);
    setQuantity(1);
  }

  // Galeria: faixa com rolagem horizontal e encaixe nativo, a foto acompanha o
  // dedo. O video (se houver) e o ultimo slide.
  const slideCount = displayImages.length + (product.video ? 1 : 0);
  const videoIndex = product.video ? displayImages.length : -1;
  const activeIndex = selectedImage === "video" ? videoIndex : selectedImage;
  const scrollerRef = useRef<HTMLDivElement>(null);

  function goTo(i: number) {
    const el = scrollerRef.current;
    if (!el) return;
    const target = (i + slideCount) % slideCount;
    el.scrollTo({ left: target * el.clientWidth, behavior: "smooth" });
  }

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    const next = i === videoIndex ? "video" : i;
    if (next !== selectedImage) setSelectedImage(next);
  }

  // Trocou de cor: volta pra primeira foto sem animacao
  useEffect(() => {
    scrollerRef.current?.scrollTo({ left: 0 });
  }, [selectedColor]);

  // Barra de compra fixa no mobile quando o botao principal sai da tela
  const ctaRef = useRef<HTMLDivElement>(null);
  const [ctaVisible, setCtaVisible] = useState(true);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setCtaVisible(entry.isIntersecting || entry.boundingClientRect.top > window.innerHeight));
    io.observe(el);
    return () => io.disconnect();
  }, []);

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

  // Cupom ativado no menu: mostra o preco ja com o desconto
  const coupon = useCouponStore((s) => s.coupon);
  const couponPrice = mounted ? couponUnitPrice(coupon, product.price, isCupomElegivel(product.categories, product.permiteCupom)) : null;
  const finalPrice = couponPrice ?? product.price;

  const maxInstallments = getMaxInstallments(finalPrice);
  const installment = finalPrice / maxInstallments;

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16">
      {/* Galeria */}
      <div className="space-y-3 -mx-4 sm:mx-0">
        <div className="relative group/gallery sm:rounded-3xl overflow-hidden bg-cream-50 aspect-square">
          <div ref={scrollerRef} onScroll={handleScroll} className="snap-row h-full w-full">
            {displayImages.map((img, i) => (
              <div key={img.url + i} className="relative w-full h-full">
                <Image
                  src={img.url}
                  alt={`${product.name}${img.color ? ` - ${img.color}` : ""} ${i + 1}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority={i === 0}
                />
              </div>
            ))}
            {product.video && (
              <div className="relative w-full h-full bg-black">
                {selectedImage === "video" ? (
                  <video src={product.video} controls autoPlay playsInline className="w-full h-full object-contain" />
                ) : (
                  <button onClick={() => setSelectedImage("video")} className="w-full h-full flex items-center justify-center" aria-label="Ver vídeo">
                    <PlayCircle size={56} className="text-white/90" strokeWidth={1.25} />
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => toggleWishlist({ productId: product.id, slug: product.slug, name: product.name, price: product.price, image: images[0]?.url || "" })}
            aria-label={liked ? "Remover dos favoritos" : "Favoritar"}
            className="absolute top-4 right-4 w-11 h-11 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md active:scale-90 hover:scale-110 transition-transform"
          >
            <Heart size={19} className={liked ? "fill-brand-700 text-brand-700" : "text-gray-500"} />
          </button>
          {slideCount > 1 && (
            <>
              <button
                onClick={() => goTo(activeIndex - 1)}
                aria-label="Foto anterior"
                className="hidden [@media(hover:hover)]:flex absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/90 backdrop-blur rounded-full items-center justify-center shadow-md opacity-0 group-hover/gallery:opacity-100 transition-opacity"
              >
                <ChevronLeft size={20} className="text-gray-800" />
              </button>
              <button
                onClick={() => goTo(activeIndex + 1)}
                aria-label="Próxima foto"
                className="hidden [@media(hover:hover)]:flex absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/90 backdrop-blur rounded-full items-center justify-center shadow-md opacity-0 group-hover/gallery:opacity-100 transition-opacity"
              >
                <ChevronRight size={20} className="text-gray-800" />
              </button>
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-none">
                {Array.from({ length: slideCount }, (_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full shadow-sm transition-all duration-300 ${
                      activeIndex === i ? "w-5 bg-white" : "w-1.5 bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        {slideCount > 1 && (
          <div className="snap-row gap-2 px-4 py-1 scroll-px-4 sm:px-1 sm:scroll-px-1">
            {displayImages.map((img, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Ver foto ${i + 1}`}
                className={`relative w-[18%] sm:w-[calc(20%-0.4rem)] aspect-square rounded-xl overflow-hidden ring-2 ring-offset-2 transition-all ${
                  activeIndex === i ? "ring-brand-600" : "ring-transparent opacity-70 hover:opacity-100"
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
                onClick={() => goTo(videoIndex)}
                aria-label="Ver vídeo"
                className={`relative w-[18%] sm:w-[calc(20%-0.4rem)] aspect-square rounded-xl overflow-hidden ring-2 ring-offset-2 transition-all bg-black ${
                  selectedImage === "video" ? "ring-brand-600" : "ring-transparent opacity-70 hover:opacity-100"
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
      <div className="lg:sticky lg:top-28 lg:self-start">
        <span className="eyebrow">{product.categories.join(" · ")}</span>
        <h1 className="text-[1.9rem] md:text-4xl leading-tight font-bold text-gray-900 mt-2 mb-3">
          {product.name}
        </h1>

        {/* Rating */}
        <div className="mb-4">
          <AvaliacoesBadge productId={product.id} />
        </div>

        {/* Preço */}
        <div className="mb-6 p-5 bg-cream-50 rounded-2xl">
          {couponPrice !== null ? (
            <>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-3xl font-bold text-brand-700">{formatCurrency(couponPrice)}</span>
                <span className="text-lg text-gray-400 line-through">{formatCurrency(product.price)}</span>
                <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full whitespace-nowrap self-center">-{coupon!.discountValue}%</span>
              </div>
              <p className="text-xs text-green-700 font-medium mt-1">
                Preço com o cupom <span className="font-mono font-bold">{coupon!.code}</span>
              </p>
            </>
          ) : (
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-3xl font-bold text-gray-900">{formatCurrency(product.price)}</span>
              <span className="text-lg text-gray-400 line-through">{formatCurrency(product.price * 1.2)}</span>
              <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full whitespace-nowrap self-center">17% off</span>
            </div>
          )}
          <p className="text-sm text-gray-500 mt-1">
            ou <strong>{maxInstallments}x de {formatCurrency(installment)}</strong> sem juros no cartão
          </p>
          <p className="text-sm text-brand-700 font-medium mt-1">
            5% de desconto no PIX: {formatCurrency(finalPrice * 0.95)}
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
                    className={`px-4 py-2.5 rounded-full text-sm border-2 transition-all active:scale-95 ${
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

        {/* Numeração / tamanhos da cor escolhida */}
        {sizes.length > 0 && (
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              {sizeLabel}: <span className="font-normal text-gray-600">{selectedSize || "escolha"}</span>
              {selectedSize && availableStock > 0 && availableStock <= 3 && (
                <span className="text-xs ml-2 text-orange-600 font-medium">
                  {availableStock === 1 ? "última unidade!" : `últimas ${availableStock} unidades`}
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {sizes.map(({ size, stock }) => (
                <button
                  key={size}
                  onClick={() => stock > 0 && handleSizeSelect(size)}
                  disabled={stock === 0}
                  aria-pressed={selectedSize === size}
                  aria-label={stock === 0 ? `${size} esgotado` : size}
                  title={stock === 0 ? "Esgotado" : undefined}
                  className={`min-w-[3rem] h-12 px-3 rounded-xl text-sm border-2 transition-all font-semibold active:scale-95 ${
                    selectedSize === size
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : stock === 0
                      ? "border-gray-100 text-gray-300 line-through cursor-not-allowed"
                      : "border-gray-200 text-gray-700 hover:border-gray-400"
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
            <div className="flex items-center border border-gray-200 rounded-full overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Diminuir quantidade"
                className="px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-600"
              >
                <Minus size={16} />
              </button>
              <span className="px-3 py-3 font-semibold text-gray-900 min-w-[44px] text-center tabular-nums">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                aria-label="Aumentar quantidade"
                className="px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-600"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div ref={ctaRef} className="space-y-3 mb-8">
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
              <><ShoppingBag size={18} className="shrink-0" /> Adicionar ao carrinho — {formatCurrency(finalPrice * quantity)}</>
            )}
          </button>
          <Link href="/carrinho" className="btn-outline w-full text-sm sm:text-base py-4">
            Ir para o carrinho
          </Link>
        </div>

        {/* Barra de compra fixa (mobile), aparece depois que o botao principal sai da tela */}
        <div
          className={`lg:hidden fixed inset-x-0 bottom-0 z-[55] bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.2)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-300 ${
            ctaVisible ? "translate-y-full" : "translate-y-0"
          }`}
          aria-hidden={ctaVisible}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 truncate">
                {product.name}{selectedColor ? ` · ${selectedColor}` : ""}
              </p>
              <p className={`text-base font-bold ${couponPrice !== null ? "text-brand-700" : "text-gray-900"}`}>{formatCurrency(finalPrice)}</p>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={availableStock === 0}
              tabIndex={ctaVisible ? -1 : 0}
              className={`btn-primary py-3 px-5 text-sm flex-shrink-0 ${added ? "bg-green-600 hover:bg-green-700" : ""}`}
            >
              {added ? <><Check size={18} /> Adicionado</> : availableStock === 0 ? "Esgotado" : <><ShoppingBag size={17} /> Comprar</>}
            </button>
          </div>
        </div>

        {/* Garantias */}
        <div className="space-y-2.5 mb-6 p-5 border border-gray-100 rounded-2xl">
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
