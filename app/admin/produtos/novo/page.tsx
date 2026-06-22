import { ProductForm } from "@/components/admin/ProductForm";

export default function NovoProdutoPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Novo Produto</h1>
        <p className="text-sm text-gray-500 mt-1">Preencha as informações do novo produto</p>
      </div>
      <ProductForm />
    </div>
  );
}
