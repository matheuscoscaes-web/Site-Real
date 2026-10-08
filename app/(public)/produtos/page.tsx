import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "./ProductGrid";
import { sortOutOfStockLast, toCardProduct } from "@/lib/utils";
import { getProductCategoryTree } from "@/lib/product-categories";
import { COLOR_FAMILIES, productColorFamilies, colorFamiliesOf } from "@/lib/colorFamilies";
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
  cor?: string;
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

  // A cor e filtrada aqui (e nao no banco): o nome da cor e texto livre e o
  // agrupamento em familias acontece no codigo. Fica fora da chave do cache.
  const { cor: corParam, ...queryParams } = params;
  // Cor desconhecida (link velho, digitado errado, ?cor= repetido) e ignorada
  const cor = COLOR_FAMILIES.some((f) => f.slug === corParam) ? corParam : undefined;
  const allProducts = await getProducts(
    queryParams,
    activeParent && activeParent.name === params.categoria ? activeParent.children.map((c) => c.name) : []
  );
  const familiesByProduct = new Map(allProducts.map((p) => [p.id, productColorFamilies(p.variants)]));
  // So oferece as cores que existem no resultado atual (categoria/preco/busca)
  const availableFamilies = COLOR_FAMILIES.filter((f) => f.slug === cor ||
    allProducts.some((p) => familiesByProduct.get(p.id)!.has(f.slug))
  );
  const products = sortOutOfStockLast(
    cor ? allProducts.filter((p) => familiesByProduct.get(p.id)!.has(cor)) : allProducts
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
    <div className="container-main pt-6 pb-16 md:pt-10">
      {/* Breadcrumb + título */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-3">
        <Link href="/" className="hover:text-brand-700 transition-colors">Home</Link>
        <span>/</span>
        <span className="text-gray-600">{title}</span>
      </nav>
      <div className="flex items-end justify-between gap-4 mb-6 md:mb-10">
        <div className="min-w-0">
          <h1 className="text-[1.75rem] md:text-5xl font-bold text-gray-900 leading-tight break-words">{title}</h1>
          <p className="text-sm text-gray-500 mt-1.5">
            {products.length} produto{products.length !== 1 ? "s" : ""}
            {cor && COLOR_FAMILIES.find((f) => f.slug === cor) && ` · cor ${COLOR_FAMILIES.find((f) => f.slug === cor)!.label}`}
          </p>
        </div>
        <SortSelect currentValue={params.ordem} />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
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
          colors={availableFamilies.map((f) => ({
            label: f.label,
            swatch: f.swatch,
            // Clicar na cor ja escolhida desmarca
            href: buildUrl({ cor: cor === f.slug ? undefined : f.slug }),
            active: cor === f.slug,
          }))}
          clearHref={(params.categoria || params.preco_min || params.busca || cor) ? "/produtos" : null}
        />

        {/* Lista de produtos */}
        <div className="flex-1 min-w-0">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <Filter size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-500 mb-6">Tente ajustar os filtros ou buscar por outro termo.</p>
              <Link href="/produtos" className="btn-primary">Ver todos os produtos</Link>
            </div>
          ) : (
            <ProductGrid products={products.map((p) => toCardProduct(p, cor ? (c) => colorFamiliesOf(c).includes(cor) : undefined))} />
          )}
        </div>
      </div>
    </div>
  );
}
