import Link from "next/link";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/products/ProductCard";
import { Truck, Shield, RefreshCw, Headphones, ArrowRight, Instagram } from "lucide-react";
import { sortOutOfStockLast, toCardProduct } from "@/lib/utils";

const getFeaturedProducts = unstable_cache(
  async () => {
    const featured = await prisma.product.findMany({
      where: { featured: true, active: true },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { variants: true },
    });

    if (featured.length > 0) return featured;

    // fallback: produtos mais recentes se não houver destaques
    return prisma.product.findMany({
      where: { active: true },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { variants: true },
    });
  },
  ["home-featured-products"],
  { revalidate: 60, tags: ["products"] }
);

const DEFAULT_HERO_IMAGES: Record<number, string> = {
  1: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
  2: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80",
  3: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
  4: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80",
};

const getHeroImages = unstable_cache(
  async () => {
    const images = await prisma.heroImage.findMany({ orderBy: { position: "asc" } });
    const byPosition = new Map(images.map((i) => [i.position, i.url]));
    return [1, 2, 3, 4].map((pos) => byPosition.get(pos) || DEFAULT_HERO_IMAGES[pos]);
  },
  ["home-hero-images"],
  { revalidate: 60, tags: ["hero-images"] }
);

const getCategories = unstable_cache(
  async () => {
    const homeCategories = await prisma.homeCategory.findMany({ orderBy: { position: "asc" } });

    return Promise.all(
      homeCategories.map(async (cat) => {
        const count = await prisma.product.count({ where: { active: true, categories: { has: cat.name } } });
        return {
          name: cat.name,
          href: `/produtos?categoria=${encodeURIComponent(cat.name)}`,
          image: cat.image,
          count: `${count} produto${count !== 1 ? "s" : ""}`,
        };
      })
    );
  },
  ["home-categories"],
  { revalidate: 60, tags: ["products", "categories"] }
);

const benefits = [
  { icon: Truck, title: "Entrega para todo o Brasil", short: "Envio via SEDEX e PAC" },
  { icon: Shield, title: "Compra segura", short: "Parcele sem juros no cartão" },
  { icon: RefreshCw, title: "Troca fácil", short: "30 dias, sem burocracia" },
  { icon: Headphones, title: "Atendimento VIP", short: "Fale com a gente no WhatsApp" },
];

export default async function HomePage() {
  const [featuredProductsRaw, categories, heroImages] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
    getHeroImages(),
  ]);
  const featuredProducts = sortOutOfStockLast(featuredProductsRaw);
  const hasFeatured = featuredProducts.some((p) => p.featured);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Mobile: foto em destaque com o texto por cima */}
        <div className="lg:hidden relative h-[calc(100svh-4rem)] min-h-[520px] max-h-[760px] bg-cream-100">
          <Image src={heroImages[0]} alt="Coleção Hearts Couro" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 pb-10 text-white animate-fade-in-up">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-200 mb-3">Nova coleção</p>
            <h1 className="text-[2.6rem] leading-[1.05] font-bold mb-4">
              Couro que conta <span className="italic text-brand-200">sua história</span>
            </h1>
            <p className="text-white/80 text-[15px] leading-relaxed mb-7 max-w-sm">
              Bolsas e acessórios em couro legítimo, feitos para durar.
            </p>
            <div className="flex gap-3">
              <Link href="/produtos" className="btn-primary flex-1 py-3.5 bg-white text-gray-900 hover:bg-cream-100">
                Ver coleção <ArrowRight size={18} />
              </Link>
              <Link
                href="/produtos?categoria=Bolsas"
                className="flex-1 inline-flex items-center justify-center rounded-full border border-white/60 text-white font-semibold py-3.5 backdrop-blur-sm active:scale-[0.97] transition-transform"
              >
                Bolsas
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop: texto + mosaico de fotos */}
        <div className="hidden lg:block">
          <div className="absolute right-0 top-0 w-[46%] h-full bg-cream-50" />
          <div className="relative container-main min-h-[calc(100vh-5rem)] grid grid-cols-2 gap-16 items-center py-16">
            <div className="animate-fade-in-up">
              <p className="eyebrow mb-6 flex items-center gap-3">
                <span className="w-10 h-px bg-brand-600" /> Nova coleção disponível
              </p>
              <h1 className="text-6xl xl:text-7xl font-bold leading-[1.02] mb-7 text-gray-900">
                Couro que conta<br />
                <span className="italic text-brand-700">sua história</span>
              </h1>
              <p className="text-lg text-gray-500 mb-10 max-w-md leading-relaxed">
                Bolsas e acessórios em couro legítimo, feitos com cuidado e qualidade premium. Peças que duram e se tornam parte de você.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/produtos" className="btn-primary px-8 py-4">
                  Ver coleção <ArrowRight size={18} />
                </Link>
                <Link href="/produtos?categoria=Bolsas" className="btn-outline px-8 py-4">
                  Explorar bolsas
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-[560px] ml-auto w-full animate-fade-in-up [animation-delay:120ms]">
              <div className="space-y-4 pt-12">
                <div className="relative rounded-[28px] overflow-hidden aspect-[4/5] shadow-2xl shadow-brand-900/10">
                  <Image src={heroImages[0]} alt="Bolsa" fill sizes="280px" className="object-cover" priority />
                </div>
                <div className="relative rounded-[28px] overflow-hidden aspect-square shadow-xl shadow-brand-900/10">
                  <Image src={heroImages[1]} alt="Acessório" fill sizes="280px" className="object-cover" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="relative rounded-[28px] overflow-hidden aspect-square shadow-xl shadow-brand-900/10">
                  <Image src={heroImages[2]} alt="Couro" fill sizes="280px" className="object-cover" />
                </div>
                <div className="relative rounded-[28px] overflow-hidden aspect-[4/5] shadow-2xl shadow-brand-900/10">
                  <Image src={heroImages[3]} alt="Bolsa couro" fill sizes="280px" className="object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS (faixa que arrasta no mobile) */}
      <section className="border-y border-gray-100 bg-white">
        <div className="container-main">
          <div className="snap-row -mx-4 px-4 scroll-px-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:divide-x lg:divide-gray-100">
            {benefits.map((b) => (
              <div key={b.title} className="w-[72%] sm:w-1/2 lg:w-auto flex items-center gap-3 py-5 pr-6 lg:px-6 lg:first:pl-0">
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <b.icon size={18} className="text-brand-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{b.title}</p>
                  <p className="text-xs text-gray-500 leading-snug">{b.short}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      {categories.length > 0 && (
        <section className="py-14 md:py-20">
          <div className="container-main">
            <div className="mb-8 reveal">
              <p className="eyebrow mb-2">Categorias</p>
              <h2 className="section-title">Explore a coleção</h2>
            </div>
            <div className="snap-row gap-3 -mx-4 px-4 scroll-px-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-3 md:gap-6">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className="reveal group relative overflow-hidden rounded-3xl bg-cream-100 w-[78%] sm:w-[45%] md:w-auto aspect-[4/5]"
                >
                  <Image src={cat.image} alt={cat.name} fill sizes="(max-width: 768px) 78vw, 33vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-6 text-white">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/70 mb-1">{cat.count}</p>
                    <div className="flex items-end justify-between gap-3">
                      <h3 className="text-2xl md:text-3xl font-bold">{cat.name}</h3>
                      <span className="w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0 transition-colors duration-300 group-hover:bg-white group-hover:text-gray-900">
                        <ArrowRight size={18} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PRODUTOS EM DESTAQUE */}
      <section className="pb-16 md:pb-24">
        <div className="container-main">
          <div className="flex items-end justify-between mb-8 reveal">
            <div>
              <p className="eyebrow mb-2">{hasFeatured ? "Seleção especial" : "Coleção"}</p>
              <h2 className="section-title">{hasFeatured ? "Em destaque" : "Nossos produtos"}</h2>
            </div>
            <Link href="/produtos" className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-brand-700 transition-colors group">
              Ver todos
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8 md:gap-x-6 md:gap-y-10">
            {featuredProducts.map((product) => (
              <div key={product.id} className="reveal">
                <ProductCard product={toCardProduct(product)} />
              </div>
            ))}
          </div>

          <div className="mt-10 md:hidden">
            <Link href="/produtos" className="btn-outline w-full">Ver todos os produtos</Link>
          </div>
        </div>
      </section>

      {/* BANNER PROMO */}
      <section className="pb-16 md:pb-24">
        <div className="container-main">
          <div className="reveal relative overflow-hidden rounded-[32px] bg-brand-950 px-6 py-12 md:p-16">
            <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-brand-700/40 blur-3xl" />
            <div className="absolute -left-20 -bottom-28 w-72 h-72 rounded-full bg-brand-500/20 blur-3xl" />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div className="text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-300 mb-4">Oferta de boas-vindas</p>
                <h3 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
                  Primeira compra com<br className="hidden md:block" /> <span className="italic text-brand-200">40% off</span> + frete grátis
                </h3>
                <p className="text-white/70">
                  Use o cupom{" "}
                  <span className="font-mono font-bold text-white bg-white/10 border border-white/20 px-2 py-0.5 rounded-md tracking-wider">BEMVINDO</span>{" "}
                  no seu primeiro pedido
                </p>
              </div>
              <Link href="/cadastro" className="btn-primary bg-white text-brand-900 hover:bg-cream-100 px-8 py-4 flex-shrink-0 w-full md:w-auto">
                Criar conta e aproveitar <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* INSTAGRAM CTA */}
      <section className="py-16 md:py-20 bg-cream-50">
        <div className="container-main text-center reveal">
          <Instagram size={28} className="mx-auto text-brand-700 mb-4" strokeWidth={1.5} />
          <h2 className="section-title mb-3">@heartscouro</h2>
          <p className="text-gray-500 mb-8">Novidades, looks e bastidores da marca</p>
          <a href="https://www.instagram.com/heartscouro" target="_blank" rel="noopener noreferrer" className="btn-outline px-8">
            Seguir no Instagram
          </a>
        </div>
      </section>
    </>
  );
}
