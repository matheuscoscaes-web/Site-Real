import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronRight, Users, Tag, Percent, UserCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { VendorForm } from "./VendorForm";

export default async function AdminVendedoresPage() {
  const vendors = await prisma.vendor.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
      resellers: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const totalResellers = vendors.reduce((sum, v) => sum + v.resellers.length, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendedores & Revendedores</h1>
          <p className="text-sm text-gray-500 mt-1">{vendors.length} vendedores · {totalResellers} revendedores</p>
        </div>
        <VendorForm />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Vendedores", value: vendors.length, icon: UserCheck, color: "text-brand-600 bg-brand-50" },
          { label: "Revendedores", value: totalResellers, icon: Users, color: "text-purple-600 bg-purple-50" },
          { label: "Cupons ativos", value: vendors.filter((v) => v.active).length, icon: Tag, color: "text-green-600 bg-green-50" },
          { label: "Comissão média", value: vendors.length ? `${(vendors.reduce((s, v) => s + (50 - (v.discount ?? 0)), 0) / vendors.length).toFixed(1)}%` : "—", icon: Percent, color: "text-orange-600 bg-orange-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Lista de vendedores */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendedor</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Cupom</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Comissão</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Revendedores</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Cadastro</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Users size={40} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Nenhum vendedor cadastrado ainda.</p>
                  </td>
                </tr>
              ) : vendors.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-900 text-sm">{v.user.name}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{v.user.email}</p>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    {v.couponCode
                      ? <span className="font-mono text-sm bg-gray-100 text-gray-800 px-2 py-0.5 rounded-lg">{v.couponCode}</span>
                      : <span className="text-xs text-amber-500 italic">não configurado</span>
                    }
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    {v.discount !== null
                      ? <><p className="text-xs text-gray-400">desconto {v.discount}%</p><p className="text-sm font-bold text-green-600">ganha {50 - v.discount}%</p></>
                      : <span className="text-xs text-gray-400">—</span>
                    }
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-sm text-gray-600">{v.resellers.length}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <p className="text-sm text-gray-600">{formatDate(v.user.createdAt)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge text-xs ${v.active ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                      {v.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/admin/vendedores/${v.id}`} className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline font-medium">
                      Ver <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
