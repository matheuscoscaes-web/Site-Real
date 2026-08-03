import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { getProductCategoryTree } from "@/lib/product-categories";

export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categoryTree] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { variants: true } }),
    getProductCategoryTree(),
  ]);

  if (!product) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar Produto</h1>
        <p className="text-sm text-gray-500 mt-1 truncate">{product.name}</p>
      </div>
      <ProductForm product={product} categoryTree={categoryTree} />
    </div>
  );
}
