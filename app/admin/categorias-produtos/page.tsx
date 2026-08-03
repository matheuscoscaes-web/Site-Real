import { prisma } from "@/lib/prisma";
import { CategoriasProdutoForm } from "./CategoriasProdutoForm";

export default async function AdminCategoriasProdutoPage() {
  const categorias = await prisma.productCategory.findMany({ orderBy: { position: "asc" } });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categorias de Produto</h1>
        <p className="text-sm text-gray-500 mt-1">
          Categorias usadas no cadastro de produtos, no menu do site e nos filtros da página de produtos.
        </p>
      </div>

      <CategoriasProdutoForm initialCategorias={categorias} />
    </div>
  );
}
