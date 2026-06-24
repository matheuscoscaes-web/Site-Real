import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/products/ProductCard";
import {
  Truck, Shield, RefreshCw, Headphones, Star, ChevronRight, ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

async function getFeaturedProducts() {
  const featured = await prisma.product.findMany({
    where: { featured: true, active: true },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  if (featured.length > 0) return featured;

  // fallback: produtos mais recentes se não houver destaques
  return prisma.product.findMany({
    where: { active: true },
    take: 8,
    orderBy: { createdAt: "desc" },
  });
}

async function getCategories() {
  const [bolsas, vestuario, acessorios] = await Promise.all([
    prisma.product.count({ where: { active: true, OR: [{ category: "Bolsas" }, { name: { startsWith: "Bolsa", mode: "insensitive" } }] } }),
    prisma.product.count({ where: { active: true, category: "Vestuário" } }),
    prisma.product.count({ where: { active: true, category: "Acessórios" } }),
  ]);

  return [
    {
      name: "Bolsas",
      href: "/produtos?categoria=Bolsas",
      image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600",
      count: `${bolsas} produto${bolsas !== 1 ? "s" : ""}`,
      gradient: "from-brand-900/70",
    },
    {
      name: "Vestuário",
      href: "/produtos?categoria=Vestuário",
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600",
      count: `${vestuario} produto${vestuario !== 1 ? "s" : ""}`,
      gradient: "from-purple-900/70",
    },
    {
      name: "Acessórios",
      href: "/produtos?categoria=Acessórios",
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600",
      count: `${acessorios} produto${acessorios !== 1 ? "s" : ""}`,
      gradient: "from-amber-900/70",
    },
  ];
}

const benefits = [
  { icon: Truck, title: "Entrega Rápida", desc: "Envio para todo o Brasil via SEDEX e PAC. Frete grátis acima de R$ 299,90." },
  { icon: Shield, title: "Compra Segura", desc: "Site 100% seguro com SSL e proteção de dados. Parcele sem juros." },
  { icon: RefreshCw, title: "Troca Fácil", desc: "30 dias para troca ou devolução, sem burocracia e sem custo." },
  { icon: Headphones, title: "Atendimento VIP", desc: "Equipe dedicada via WhatsApp, e-mail e chat para te ajudar." },
];

const testimonials = [
  {
    name: "Ana Paula F.",
    city: "São Paulo, SP",
    text: "Amei demais! A bolsa chegou super rápido, embalagem linda e qualidade incrível. Com certeza comprarei mais vezes.",
    stars: 5,
    product: "Bolsa de Couro Premium",
  },
  {
    name: "Juliana M.",
    city: "Rio de Janeiro, RJ",
    text: "Já é a terceira compra nessa loja. O vestido floral é exatamente como nas fotos, levou 3 dias pra chegar. Recomendo!",
    stars: 5,
    product: "Vestido Floral Midi",
  },
  {
    name: "Camila R.",
    city: "Belo Horizonte, MG",
    text: "Atendimento sensacional! Precisei trocar o tamanho do blazer e resolveram em 2 dias. Loja séria e confiável.",
    stars: 5,
    product: "Blazer Off-White",
  },
  {
    name: "Fernanda C.",
    city: "Curitiba, PR",
    text: "Os acessórios são maravilhosos! O colar dourado é ainda mais lindo pessoalmente. Preços justos e qualidade premium.",
    stars: 4,
    product: "Colar Dourado Delicado",
  },
];

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);
  const hasFeatured = featuredProducts.some((p) => p.featured);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-white min-h-[80vh] flex items-center border-b border-gray-100">
        {/* Faixa lateral decorativa */}
        <div className="absolute right-0 top-0 w-1/2 h-full bg-cream-50 hidden lg:block" />
        <div className="absolute right-0 top-0 w-px h-full bg-brand-200 hidden lg:block" />

        <div className="relative container-main py-20 grid lg:grid-cols-2 gap-12 items-center z-10">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-bold px-4 py-2 rounded-full mb-6 border border-brand-200">
              <span className="w-2 h-2 rounded-full bg-brand-700 inline-block" />
              Nova Coleção Disponível
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-gray-900" style={{ fontFamily: "Playfair Display, serif" }}>
              Couro que conta<br />
              <span className="italic text-brand-700">sua história</span>
            </h1>
            <p className="text-lg text-gray-500 mb-8 max-w-md leading-relaxed">
              Bolsas e acessórios em couro legítimo, feitos com cuidado e qualidade premium. Peças que duram e se tornam parte de você.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/produtos" className="btn-primary shadow-md">
                Ver Coleção
                <ArrowRight size={18} />
              </Link>
              <Link href="/produtos?categoria=Bolsas" className="btn-outline">
                Explorar Bolsas
              </Link>
            </div>

            <div className="flex gap-10 mt-12 pt-8 border-t border-gray-100">
              {[
                { num: "5.000+", label: "Clientes felizes" },
                { num: "200+", label: "Produtos" },
                { num: "4.9★", label: "Avaliação média" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-brand-700">{stat.num}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-4">
            <div className="space-y-4 pt-8">
              <div className="relative rounded-3xl overflow-hidden h-64 shadow-xl ring-1 ring-brand-100">
                <Image src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80" alt="Bolsa" fill sizes="300px" className="object-cover" loading="eager" />
              </div>
              <div className="relative rounded-3xl overflow-hidden h-40 shadow-xl ring-1 ring-brand-100">
                <Image src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80" alt="Acessório" fill sizes="300px" className="object-cover" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="relative rounded-3xl overflow-hidden h-40 shadow-xl ring-1 ring-brand-100">
                <Image src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80" alt="Couro" fill sizes="300px" className="object-cover" />
              </div>
              <div className="relative rounded-3xl overflow-hidden h-64 shadow-xl ring-1 ring-brand-100">
                <Image src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80" alt="Bolsa couro" fill sizes="300px" className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="py-16 bg-white">
        <div className="container-main">
          <div className="text-center mb-10">
            <h2 className="section-title mb-3">Explore por Categoria</h2>
            <p className="text-gray-500">Couro legítimo e acessórios para cada momento</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link key={cat.name} href={cat.href} className="group relative overflow-hidden rounded-3xl h-72 shadow-md hover:shadow-xl transition-shadow">
                <Image src={cat.image} alt={cat.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.gradient} to-transparent`} />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <p className="text-xs uppercase tracking-wider text-white/70 mb-1">{cat.count}</p>
                  <h3 className="text-2xl font-bold" style={{ fontFamily: "Playfair Display, serif" }}>{cat.name}</h3>
                  <span className="inline-flex items-center gap-2 text-sm font-medium mt-2 group-hover:gap-3 transition-all">
                    Ver tudo <ChevronRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUTOS EM DESTAQUE */}
      <section className="py-16">
        <div className="container-main">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-title mb-2">{hasFeatured ? "Produtos em Destaque" : "Nossos Produtos"}</h2>
              <p className="text-gray-500">{hasFeatured ? "Peças selecionadas especialmente para você" : "Conheça nossa coleção"}</p>
            </div>
            <Link href="/produtos" className="btn-ghost text-brand-700 hidden md:flex">
              Ver todos <ChevronRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center mt-8 md:hidden">
            <Link href="/produtos" className="btn-outline">Ver todos os produtos</Link>
          </div>
        </div>
      </section>

      {/* BANNER PROMO */}
      <section className="py-8">
        <div className="container-main">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-800 to-brand-600 p-8 md:p-12">
            <div className="absolute right-0 top-0 w-96 h-full opacity-10">
              <Image
                src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=60"
                alt="Promo"
                fill
                sizes="384px"
                className="object-cover"
              />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-white text-center md:text-left">
                <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
                  Oferta Especial
                </span>
                <h3 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "Playfair Display, serif" }}>
                  Primeira compra<br />com 40% off + frete grátis
                </h3>
                <p className="text-white/80">Desconto aplicado automaticamente no primeiro pedido</p>
              </div>
              <Link href="/cadastro" className="btn-primary bg-white text-brand-800 hover:bg-cream-100 shadow-lg flex-shrink-0">
                Criar conta e aproveitar
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="py-16 bg-gray-50">
        <div className="container-main">
          <div className="text-center mb-10">
            <h2 className="section-title mb-3">Por que comprar aqui?</h2>
            <p className="text-gray-500">Experiência de compra pensada para você</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <b.icon size={22} className="text-brand-700" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">{b.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-16">
        <div className="container-main">
          <div className="text-center mb-10">
            <h2 className="section-title mb-3">O que nossas clientes dizem</h2>
            <p className="text-gray-500">Mais de 5.000 clientes satisfeitas em todo o Brasil</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} className={s <= t.stars ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"} />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.city}</p>
                  <p className="text-xs text-brand-600 mt-1">Comprou: {t.product}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INSTAGRAM CTA */}
      <section className="py-12 bg-cream-50 border-t border-cream-100">
        <div className="container-main text-center">
          <h2 className="section-title mb-3">Siga no Instagram</h2>
          <p className="text-gray-500 mb-6">@heartscouro • Novidades, looks e bastidores da marca</p>
          <a href="#" className="btn-primary">
            Seguir no Instagram ✨
          </a>
        </div>
      </section>
    </>
  );
}
