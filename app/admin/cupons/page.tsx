import { prisma } from "@/lib/prisma";
import { Tag, Percent, CheckCircle2, Ban } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CupomForm } from "./CupomForm";
import { CupomRowActions } from "./CupomRowActions";

export default async function AdminCuponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  const activeCount = coupons.filter((c) => c.active).length;
  const totalUses = coupons.reduce((sum, c) => sum + c.usedCount, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cupons</h1>
          <p className="text-sm text-gray-500 mt-1">{coupons.length} cupons cadastrados</p>
        </div>
        <CupomForm />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Cupons cadastrados", value: coupons.length, icon: Tag, color: "text-brand-600 bg-brand-50" },
          { label: "Ativos", value: activeCount, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
          { label: "Usos no total", value: totalUses, icon: Percent, color: "text-purple-600 bg-purple-50" },
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Desconto</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Mínimo</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Usos</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Expira</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Tag size={40} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Nenhum cupom cadastrado ainda.</p>
                  </td>
                </tr>
              ) : coupons.map((c) => {
                const expired = c.expiresAt ? c.expiresAt < new Date() : false;
                const exhausted = c.maxUses !== null && c.usedCount >= c.maxUses;
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm bg-gray-100 text-gray-800 px-2 py-0.5 rounded-lg">{c.code}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-gray-900">
                        {c.discountType === "FIXED" ? formatCurrency(c.discountValue) : `${c.discountValue}%`}
                      </p>
                      {c.freeShipping && <p className="text-xs text-green-600">+ frete grátis</p>}
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-600">{c.minPurchase ? formatCurrency(c.minPurchase) : "—"}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600">{c.usedCount}{c.maxUses !== null ? ` / ${c.maxUses}` : ""}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className={`text-sm ${expired ? "text-red-500" : "text-gray-600"}`}>{c.expiresAt ? formatDate(c.expiresAt) : "—"}</span>
                    </td>
                    <td className="px-5 py-4">
                      {!c.active ? (
                        <span className="badge text-xs bg-gray-100 text-gray-500 border border-gray-200">Inativo</span>
                      ) : expired ? (
                        <span className="badge text-xs bg-red-50 text-red-600 border border-red-200">Expirado</span>
                      ) : exhausted ? (
                        <span className="badge text-xs bg-red-50 text-red-600 border border-red-200">Esgotado</span>
                      ) : (
                        <span className="badge text-xs bg-green-50 text-green-700 border border-green-200">Ativo</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <CupomRowActions couponId={c.id} code={c.code} active={c.active} />
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
