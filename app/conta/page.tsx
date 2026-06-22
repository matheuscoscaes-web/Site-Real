import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Package, MapPin, Settings, ChevronRight, ShoppingBag } from "lucide-react";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";

export default async function ContaPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { items: { include: { product: true } } },
      },
    },
  });

  if (!user) return null;

  const totalSpent = user.orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pedidos", value: user.orders.length, icon: Package },
          { label: "Total gasto", value: formatCurrency(totalSpent), icon: ShoppingBag },
          { label: "Endereços", value: "—", icon: MapPin },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <stat.icon size={20} className="text-brand-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Últimos pedidos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Últimos pedidos</h2>
          <Link href="/conta/pedidos" className="text-sm text-brand-600 hover:underline flex items-center gap-1">
            Ver todos <ChevronRight size={16} />
          </Link>
        </div>

        {user.orders.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingBag size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-4">Você ainda não fez nenhum pedido.</p>
            <Link href="/produtos" className="btn-primary text-sm">Explorar produtos</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {user.orders.map((order) => (
              <Link key={order.id} href={`/conta/pedidos/${order.id}`} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors group">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Pedido #{order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDate(order.createdAt)} • {order.items.length} {order.items.length === 1 ? "item" : "itens"}</p>
                  <span className={`badge mt-2 ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-500 transition-colors ml-auto mt-2" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Links rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { href: "/conta/pedidos", icon: Package, title: "Meus Pedidos", desc: "Acompanhe o status das suas compras" },
          { href: "/conta/dados", icon: Settings, title: "Dados Pessoais", desc: "Atualize seu perfil e senha" },
        ].map((card) => (
          <Link key={card.href} href={card.href} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
            <card.icon size={22} className="text-brand-600 mb-3" />
            <h3 className="font-bold text-gray-900 group-hover:text-brand-700 transition-colors">{card.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
