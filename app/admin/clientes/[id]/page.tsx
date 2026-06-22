import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, ShoppingBag } from "lucide-react";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import { NotesForm } from "./NotesForm";

export default async function AdminClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: { include: { product: true } }, address: true },
      },
      addresses: true,
    },
  });

  if (!user) notFound();

  const totalSpent = user.orders.reduce((sum, o) => sum + o.total, 0);
  const avgTicket = user.orders.length > 0 ? totalSpent / user.orders.length : 0;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/clientes" className="btn-ghost text-sm py-2">
          <ArrowLeft size={18} /> Voltar
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-2xl font-bold mb-4">
              {user.name[0].toUpperCase()}
            </div>
            <h2 className="font-bold text-gray-900 text-lg">{user.name}</h2>
            <p className="text-sm text-gray-500 mt-1">Membro desde {formatDate(user.createdAt)}</p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail size={15} className="text-brand-600 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone size={15} className="text-brand-600 flex-shrink-0" />
                  {user.phone}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3">Resumo</h3>
            <div className="space-y-3">
              {[
                { label: "Total de pedidos", value: user.orders.length },
                { label: "Total gasto", value: formatCurrency(totalSpent) },
                { label: "Ticket médio", value: formatCurrency(avgTicket) },
              ].map((s) => (
                <div key={s.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{s.label}</span>
                  <span className="font-bold text-gray-900">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Endereços */}
          {user.addresses.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-3">Endereços</h3>
              {user.addresses.map((addr) => (
                <div key={addr.id} className="text-sm text-gray-600 mb-2 pb-2 border-b border-gray-100 last:border-0">
                  <p className="font-medium text-gray-800">{addr.name}</p>
                  <p className="flex items-start gap-2 mt-1">
                    <MapPin size={13} className="text-brand-600 mt-0.5 flex-shrink-0" />
                    {addr.street}, {addr.number} — {addr.city}/{addr.state}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Notas internas */}
          <NotesForm userId={user.id} currentNotes={user.notes || ""} />
        </div>

        {/* Pedidos */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <ShoppingBag size={18} className="text-brand-600" />
              <h2 className="font-bold text-gray-900">Histórico de compras</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {user.orders.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Nenhum pedido realizado.</p>
              ) : user.orders.map((order) => (
                <Link key={order.id} href={`/admin/pedidos/${order.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
                  <div>
                    <p className="font-bold text-gray-900 text-sm font-mono">#{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)} • {order.items.length} {order.items.length === 1 ? "item" : "itens"}</p>
                    <span className={`badge mt-1 text-xs ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{order.address.city}/{order.address.state}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
