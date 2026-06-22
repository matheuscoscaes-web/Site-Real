import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";

export default async function PedidosPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: true } },
      address: true,
    },
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h2 className="font-bold text-gray-900 text-xl">Meus Pedidos</h2>
        <p className="text-sm text-gray-500 mt-1">{orders.length} pedido{orders.length !== 1 ? "s" : ""} no total</p>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center">
          <ShoppingBag size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 mb-5">Você ainda não realizou nenhum pedido.</p>
          <Link href="/produtos" className="btn-primary">Começar a comprar</Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {orders.map((order) => (
            <div key={order.id} className="p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-bold text-gray-900">Pedido #{order.id.slice(-8).toUpperCase()}</p>
                    <span className={`badge ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                  <p className="text-xs text-gray-400">{order.items.length} {order.items.length === 1 ? "item" : "itens"}</p>
                </div>
              </div>

              {/* Produtos do pedido */}
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    <Link href={`/produtos/${item.product.slug}`} className="flex items-center gap-2 hover:text-brand-700 transition-colors flex-1 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                      <span className="truncate">{item.product.name}</span>
                      <span className="text-gray-400 flex-shrink-0">×{item.quantity}</span>
                    </Link>
                    <span className="text-gray-600 font-medium flex-shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Endereço */}
              <p className="text-xs text-gray-400 mt-3">
                Entrega: {order.address.city}/{order.address.state}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
