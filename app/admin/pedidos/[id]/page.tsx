import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_LABELS } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UpdateStatusButton } from "./UpdateStatusButton";

const STATUS_OPTIONS = ["PENDING", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"];

export default async function AdminPedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { include: { orders: true } },
      address: true,
      items: { include: { product: true } },
    },
  });

  if (!order) notFound();

  const images = (slug: string) =>
    JSON.parse(prisma.product.findUnique({ where: { slug } }) as unknown as string || "[]");

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/pedidos" className="btn-ghost text-sm py-2">
          <ArrowLeft size={18} /> Voltar
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedido #{order.id.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
        </div>
        <div className="ml-auto">
          <span className={`badge text-sm px-4 py-1.5 ${ORDER_STATUS_COLORS[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Principal */}
        <div className="lg:col-span-2 space-y-5">
          {/* Itens */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Itens do Pedido</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => {
                const imgs = JSON.parse(item.product.images) as string[];
                return (
                  <div key={item.id} className="flex items-center gap-4 p-4">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                      <Image src={imgs[0]} alt={item.product.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/produtos/${item.product.slug}`} target="_blank" className="font-semibold text-gray-900 hover:text-brand-700 transition-colors text-sm truncate block">
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Qtd: {item.quantity}
                        {item.color && ` • Cor: ${item.color}`}
                        {item.size && ` • Tam: ${item.size}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-sm">{formatCurrency(item.price * item.quantity)}</p>
                      <p className="text-xs text-gray-400">{formatCurrency(item.price)} und.</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-5 bg-gray-50 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Frete</span><span>{order.shipping === 0 ? "Grátis" : formatCurrency(order.shipping)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2">
                <span>Total</span><span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Alterar status */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4">Alterar Status do Pedido</h2>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <UpdateStatusButton key={s} orderId={order.id} status={s} currentStatus={order.status} label={ORDER_STATUS_LABELS[s]} />
              ))}
            </div>
          </div>
        </div>

        {/* Lateral */}
        <div className="space-y-5">
          {/* Cliente */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4">Cliente</h2>
            <p className="font-semibold text-gray-900">{order.user.name}</p>
            <p className="text-sm text-gray-500 mt-0.5">{order.user.email}</p>
            {order.user.phone && <p className="text-sm text-gray-500">{order.user.phone}</p>}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">{order.user.orders.length} pedido{order.user.orders.length !== 1 ? "s" : ""} no total</p>
              <p className="text-xs text-gray-400">Total gasto: {formatCurrency(order.user.orders.reduce((s, o) => s + o.total, 0))}</p>
            </div>
            <Link href={`/admin/clientes/${order.user.id}`} className="text-xs text-brand-600 hover:underline mt-2 inline-block">
              Ver perfil do cliente →
            </Link>
          </div>

          {/* Endereço */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-3">Endereço de entrega</h2>
            <p className="text-sm text-gray-700">
              {order.address.street}, {order.address.number}
              {order.address.complement && `, ${order.address.complement}`}
              <br />{order.address.district}
              <br />{order.address.city} / {order.address.state}
              <br />CEP {order.address.zipCode}
            </p>
          </div>

          {/* Pagamento */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-3">Pagamento</h2>
            <p className="text-sm text-gray-700">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
