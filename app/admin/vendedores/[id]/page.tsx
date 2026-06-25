import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Tag, Percent, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ResellerForm } from "./ResellerForm";
import { VendorToggle } from "./VendorToggle";

export default async function AdminVendedorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
      resellers: {
        include: { user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!vendor) notFound();

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/vendedores" className="btn-ghost text-sm py-2">
          <ArrowLeft size={18} /> Voltar
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{vendor.user.name}</h1>
        <span className={`badge text-xs ${vendor.active ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
          {vendor.active ? "Ativo" : "Inativo"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Perfil */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-2xl font-bold mb-4">
              {vendor.user.name[0].toUpperCase()}
            </div>
            <h2 className="font-bold text-gray-900 text-lg">{vendor.user.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Vendedor desde {formatDate(vendor.user.createdAt)}</p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail size={15} className="text-brand-600 flex-shrink-0" />
                <span className="truncate">{vendor.user.email}</span>
              </div>
              {vendor.user.phone && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone size={15} className="text-brand-600 flex-shrink-0" />
                  {vendor.user.phone}
                </div>
              )}
            </div>
          </div>

          {/* Cupom e comissão */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4">Dados de Venda</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Tag size={15} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Código do cupom</p>
                  {vendor.couponCode
                    ? <p className="font-mono font-bold text-gray-900">{vendor.couponCode}</p>
                    : <p className="text-xs text-amber-500 italic">Não configurado</p>
                  }
                </div>
              </div>
              {vendor.discount !== null ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <Percent size={15} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Desconto do cupom ao cliente</p>
                    <p className="font-bold text-gray-700">{vendor.discount}%</p>
                    <p className="text-xs text-green-600 font-semibold mt-0.5">Vendedor ganha {50 - vendor.discount}%</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-amber-500 italic">Aguardando vendedor configurar cupom</p>
              )}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Users size={15} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Revendedores</p>
                  <p className="font-bold text-gray-900">{vendor.resellers.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ativar/Desativar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3">Ações</h3>
            <VendorToggle vendorId={vendor.id} active={vendor.active} />
          </div>
        </div>

        {/* Revendedores */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-purple-600" />
                <h2 className="font-bold text-gray-900">Revendedores ({vendor.resellers.length})</h2>
              </div>
              <ResellerForm vendorId={vendor.id} />
            </div>
            <div className="divide-y divide-gray-100">
              {vendor.resellers.length === 0 ? (
                <div className="py-12 text-center">
                  <Users size={36} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Nenhum revendedor ainda.</p>
                  <p className="text-xs text-gray-300 mt-1">Clique em "Novo Revendedor" para adicionar.</p>
                </div>
              ) : vendor.resellers.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{r.user.name}</p>
                    <p className="text-xs text-gray-400">{r.user.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Cadastrado em {formatDate(r.createdAt)}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-mono text-sm bg-gray-100 text-gray-800 px-2 py-0.5 rounded-lg inline-block">{r.couponCode}</p>
                    <p className="text-xs text-gray-400">desconto {r.discount}%</p>
                    <p className="text-xs text-green-600 font-bold">vendedor ganha {50 - r.discount}%</p>
                    <span className={`badge text-xs block ${r.active ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                      {r.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
