import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseProductImages, sortOutOfStockLast, toCardProduct } from "@/lib/utils";
import { ProductDetail } from "./ProductDetail";
import { ProductCard } from "@/components/products/ProductCard";
import { AvaliacoesSection } from "./AvaliacoesSection";

export const revalidate = 60;
export const dynamicParams = true;

const SITE_URL = process.env.NEXT_PUBLIC_URL ?? "https://heartscouro.com.br";

export async function generateStaticParams() {
  const products = await prisma.product.findMany({ select: { slug: true } });
  return products.map((p) => ({ slug: p.slug }));
}

async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, active: true },
    include: { variants: true },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) return {};

  const images = parseProductImages(product.images);
  const imageUrl = images[0]?.url;
  const url = `${SITE_URL}/produtos/${product.slug}`;

  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: product.name,
      description: product.description,
      images: imageUrl
        ? [{ url: imageUrl, width: 1200, height: 1200, alt: product.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

async function getRelated(categories: string[], id: string) {
  return prisma.product.findMany({
    where: { categories: { hasSome: categories }, active: true, id: { not: id } },
    take: 4,
    include: { variants: true },
  });
}

export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const related = sortOutOfStockLast(await getRelated(product.categories, product.id));

  return (
    <div className="container-main pt-0 sm:pt-6 pb-16">
      {/* Breadcrumb */}
      <nav className="hidden sm:flex items-center gap-2 text-xs text-gray-400 mb-6 min-w-0">
        <Link href="/" className="hover:text-brand-700 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/produtos" className="hover:text-brand-700 transition-colors">Produtos</Link>
        <span>/</span>
        {product.categories.map((c) => (
          <span key={c} className="flex items-center gap-2">
            <Link href={`/produtos?categoria=${encodeURIComponent(c)}`} className="hover:text-brand-700 transition-colors">{c}</Link>
            <span>/</span>
          </span>
        ))}
        <span className="text-gray-600 truncate">{product.name}</span>
      </nav>

      <ProductDetail product={product} />

      <AvaliacoesSection productId={product.id} />

      {/* Produtos relacionados */}
      {related.length > 0 && (
        <section className="mt-16 md:mt-24">
          <h2 className="section-title mb-8">
            Você também pode gostar
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-8 md:gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={toCardProduct(p)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
