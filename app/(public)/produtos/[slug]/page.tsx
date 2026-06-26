import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductDetail } from "./ProductDetail";
import { ProductCard } from "@/components/products/ProductCard";
import { AvaliacoesSection } from "./AvaliacoesSection";

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

async function getRelated(category: string, id: string) {
  return prisma.product.findMany({
    where: { category, active: true, id: { not: id } },
    take: 4,
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

  const related = await getRelated(product.category, product.id);

  return (
    <div className="container-main py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <a href="/" className="hover:text-brand-700">Home</a>
        <span>/</span>
        <a href="/produtos" className="hover:text-brand-700">Produtos</a>
        <span>/</span>
        <a href={`/produtos?categoria=${product.category}`} className="hover:text-brand-700">{product.category}</a>
        <span>/</span>
        <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
      </nav>

      <ProductDetail product={product} />

      <AvaliacoesSection productId={product.id} />

      {/* Produtos relacionados */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: "Playfair Display, serif" }}>
            Você também pode gostar
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
