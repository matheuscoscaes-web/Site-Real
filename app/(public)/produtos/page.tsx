import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/products/ProductCard";
import { sortOutOfStockLast } from "@/lib/utils";
import { getProductCategoryTree } from "@/lib/product-categories";
import { Filter } from "lucide-react";
import { SortSelect } from "./SortSelect";
import { FilterSidebar } from "./FilterSidebar";

interface SearchParams {
  categoria?: string;
  busca?: string;
  preco_min?: string;
  preco_max?: string;
  ordem?: string;
  novidades?: string;
}

const getProducts = unstable_cache(
  async (params: SearchParams, subcategoryNames: string[]) => {
    const where: Record<string, unknown> = { active: true };

    if (params.categoria === "Bolsas") {
      where.AND = [
        { active: true },
        {
          OR: [
            { categories: { has: "Bolsas" } },
            { name: { startsWith: "Bolsa", mode: "insensitive" } },
          ],
        },
      ];
      delete where.active;
    } else if (params.categoria && subcategoryNames.length > 0) {
      // Categoria com seções (ex: Acessórios): inclui produtos marcados na categoria pai OU em alguma de suas seções.
      where.categories = { hasSome: [params.categoria, ...subcategoryNames] };
    } else if (params.categoria) {
      where.categories = { has: params.categoria };
    }
    if (params.busca) {
      where.OR = [
        { name: { contains: params.busca } },
        { description: { contains: params.busca } },
      ];
    }
    if (params.preco_min || params.preco_max) {
      where.price = {};
      if (params.preco_min) (where.price as Record<string, number>).gte = parseFloat(params.preco_min);
      if (params.preco_max) (where.price as Record<string, number>).lte = parseFloat(params.preco_max);
    }

    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (params.ordem === "preco_asc") orderBy = { price: "asc" };
    if (params.ordem === "preco_desc") orderBy = { price: "desc" };
    if (params.ordem === "nome") orderBy = { name: "asc" };

    return prisma.product.findMany({ where, orderBy, include: { variants: true } });
  },
  ["products-list"],
  { revalidate: 60, tags: ["products"] }
);

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const categoryTree = await getProductCategoryTree();

  // Categoria pai ativa, mesmo quando o filtro atual é uma de suas seções (ex: "Carteira Feminina" -> "Acessórios")
  const activeParent = params.categoria
    ? categoryTree.find(
        (p) => p.name === params.categoria || p.children.some((c) => c.name === params.categoria)
      )
    : undefined;

  const products = sortOutOfStockLast(
    await getProducts(
      params,
      activeParent && activeParent.name === params.categoria ? activeParent.children.map((c) => c.name) : []
    )
  );

  const title = params.categoria
    ? params.categoria
    : params.busca
    ? `Busca: "${params.busca}"`
    : "Todos os Produtos";

  const priceRanges = [
    { label: "Até R$ 100", min: "0", max: "100" },
    { label: "R$ 100 – R$ 200", min: "100", max: "200" },
    { label: "R$ 200 – R$ 300", min: "200", max: "300" },
    { label: "Acima de R$ 300", min: "300", max: "9999" },
  ];

  function buildUrl(overrides: Partial<SearchParams>) {
    const p = { ...params, ...overrides };
    const query = Object.entries(p)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
      .join("&");
    return `/produtos${query ? "?" + query : ""}`;
  }

  return (
    <div className="container-main py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <a href="/" className="hover:text-brand-700">Home</a>
        <span>/</span>
        <span className="text-gray-900 font-medium">{title}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        <FilterSidebar
          categories={[
            { label: "Todos", href: buildUrl({ categoria: undefined }), active: !params.categoria },
            ...categoryTree.map((cat) => ({
              label: cat.name,
              href: buildUrl({ categoria: cat.name }),
              active: params.categoria === cat.name || activeParent?.name === cat.name,
            })),
          ]}
          subcategories={
            activeParent && activeParent.children.length > 0
              ? activeParent.children.map((sub) => ({
                  label: sub.name,
                  href: buildUrl({ categoria: sub.name }),
                  active: params.categoria === sub.name,
                }))
              : undefined
          }
          priceRanges={priceRanges.map((range) => ({
            label: range.label,
            href: buildUrl({ preco_min: range.min, preco_max: range.max }),
            active: params.preco_min === range.min && params.preco_max === range.max,
          }))}
          clearHref={(params.categoria || params.preco_min || params.busca) ? "/produtos" : null}
        />

        {/* Lista de produtos */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: "Playfair Display, serif" }}>
                {title}
              </h1>
              <p className="text-sm text-gray-500 mt-1">{products.length} produto{products.length !== 1 ? "s" : ""} encontrado{products.length !== 1 ? "s" : ""}</p>
            </div>

            {/* Ordenação */}
            <SortSelect currentValue={params.ordem} />
          </div>

          {products.length === 0 ? (
            <div className="text-center py-20">
              <Filter size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-500 mb-6">Tente ajustar os filtros ou buscar por outro termo.</p>
              <a href="/produtos" className="btn-primary">Ver todos os produtos</a>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i < 4} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
