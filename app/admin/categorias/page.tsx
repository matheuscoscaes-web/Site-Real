import { prisma } from "@/lib/prisma";
import { CategoriasForm } from "./CategoriasForm";

export default async function AdminCategoriasPage() {
  const categorias = await prisma.homeCategory.findMany({ orderBy: { position: "asc" } });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categorias da Home</h1>
        <p className="text-sm text-gray-500 mt-1">
          Categorias exibidas na seção &quot;Explore por Categoria&quot; da página inicial. O nome precisa bater com a categoria cadastrada nos produtos.
        </p>
      </div>

      <CategoriasForm initialCategorias={categorias} />
    </div>
  );
}
