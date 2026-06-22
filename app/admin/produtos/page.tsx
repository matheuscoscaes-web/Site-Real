import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { Plus, Edit, AlertTriangle } from "lucide-react";
import { DeleteProductButton } from "./DeleteProductButton";
import { ToggleActiveButton } from "./ToggleActiveButton";

export default async function AdminProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; busca?: string }>;
}) {
  const params = await searchParams;

  const where: Record<string, unknown> = {};
  if (params.categoria) where.category = params.categoria;
  if (params.busca) where.name = { contains: params.busca };

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orderItems: true } },
      variants: true,
    },
  });

  const totalActive = products.filter((p) => p.active).length;
  const totalInactive = products.filter((p) => !p.active).length;
  const totalLowStock = products.filter((p) => p.stock <= 5 && p.active).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {products.length} produto{products.length !== 1 ? "s" : ""} •{" "}
            <span className="text-green-600">{totalActive} ativos</span>
            {totalInactive > 0 && <span className="text-gray-400"> • {totalInactive} inativos</span>}
            {totalLowStock > 0 && <span className="text-orange-600"> • {totalLowStock} com estoque baixo</span>}
          </p>
        </div>
        <Link href="/admin/produtos/novo" className="btn-primary">
          <Plus size={18} /> Novo produto
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <form method="GET" className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="label text-xs">Buscar por nome</label>
            <input
              name="busca"
              defaultValue={params.busca}
              className="input-field py-2 text-sm"
              placeholder="Nome do produto..."
            />
          </div>
          <div className="w-40">
            <label className="label text-xs">Categoria</label>
            <select name="categoria" defaultValue={params.categoria} className="input-field py-2 text-sm">
              <option value="">Todas</option>
              <option value="Bolsas">Bolsas</option>
              <option value="Vestuário">Vestuário</option>
              <option value="Acessórios">Acessórios</option>
            </select>
          </div>
          <button type="submit" className="btn-primary py-2.5 text-sm">Filtrar</button>
          {(params.busca || params.categoria) && (
            <Link href="/admin/produtos" className="btn-outline py-2.5 text-sm">Limpar</Link>
          )}
        </form>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[280px]">Produto</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Categoria</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Preço</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Estoque</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Variações</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Vendas</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-gray-400 text-sm">
                    Nenhum produto encontrado.
                    <Link href="/admin/produtos/novo" className="text-brand-600 underline ml-2">Criar agora</Link>
                  </td>
                </tr>
              ) : products.map((product) => {
                const imgs = JSON.parse(product.images) as string[];
                const isLowStock = product.stock <= 5 && product.active;
                const colors = [...new Set(product.variants.map((v) => v.color).filter(Boolean))];
                const sizes = [...new Set(product.variants.map((v) => v.size).filter(Boolean))];

                return (
                  <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${!product.active ? "opacity-60" : ""}`}>
                    {/* Nome + Foto */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                          {imgs[0] && (
                            <Image src={imgs[0]} alt={product.name} fill sizes="56px" className="object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 max-w-[180px]">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 font-mono truncate max-w-[180px]">{product.slug}</p>
                          {product.featured && (
                            <span className="inline-block mt-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">★ Destaque</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Categoria */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="badge bg-gray-100 text-gray-600 text-xs">{product.category}</span>
                    </td>

                    {/* Preço */}
                    <td className="px-4 py-4">
                      <span className="font-bold text-gray-900 text-sm">{formatCurrency(product.price)}</span>
                    </td>

                    {/* Estoque */}
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        {isLowStock && <AlertTriangle size={13} className="text-orange-500 flex-shrink-0" />}
                        <span className={`text-sm font-bold ${
                          product.stock === 0 ? "text-red-600" :
                          product.stock <= 5 ? "text-orange-600" :
                          "text-green-700"
                        }`}>
                          {product.stock}
                        </span>
                      </div>
                    </td>

                    {/* Variações */}
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="space-y-1">
                        {colors.length > 0 && (
                          <p className="text-xs text-gray-500 leading-none">
                            <span className="font-medium">Cores:</span> {colors.slice(0, 3).join(", ")}{colors.length > 3 ? "..." : ""}
                          </p>
                        )}
                        {sizes.length > 0 && (
                          <p className="text-xs text-gray-500 leading-none">
                            <span className="font-medium">Tams:</span> {sizes.join(", ")}
                          </p>
                        )}
                        {colors.length === 0 && sizes.length === 0 && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>

                    {/* Vendas */}
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-600 font-medium">{product._count.orderItems}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <ToggleActiveButton id={product.id} active={product.active} />
                    </td>

                    {/* Ações */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/produtos/${product.id}/editar`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-xs font-semibold transition-colors"
                          title="Editar produto"
                        >
                          <Edit size={13} /> Editar
                        </Link>
                        <DeleteProductButton id={product.id} name={product.name} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
