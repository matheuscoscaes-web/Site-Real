import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight, Mail } from "lucide-react";
import { formatCurrency, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_LABELS } from "@/lib/utils";
import { ConversionTracker } from "./ConversionTracker";

export default async function SucessoPage({
  searchParams,
}: {
  searchParams: Promise<{ pedido?: string }>;
}) {
  const { pedido } = await searchParams;

  const order = pedido
    ? await prisma.order.findUnique({
        where: { id: pedido },
        include: {
          items: { include: { product: true } },
          address: true,
          user: true,
        },
      })
    : null;

  if (!order) {
    return (
      <div className="container-main py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Pedido não encontrado</h1>
        <Link href="/" className="btn-primary mt-6 inline-flex">Ir para a loja</Link>
      </div>
    );
  }

  return (
    <div className="container-main py-12 max-w-2xl">
      <ConversionTracker orderId={order.id} value={order.total} />
      {/* Sucesso */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="text-green-600" size={40} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
          Pedido realizado com sucesso! 🎉
        </h1>
        <p className="text-gray-500">
          Obrigada pela sua compra, <strong>{order.user.name.split(" ")[0]}</strong>! Veja abaixo os detalhes.
        </p>
      </div>

      {/* Confirmação e próximos passos */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <Mail size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Compra atualizada!</p>
          <p className="text-sm text-blue-600">
            {order.status === "PAID"
              ? <>Seu pagamento foi confirmado e enviamos um e-mail para <strong>{order.user.email}</strong> com os detalhes.</>
              : <>Assim que o pagamento for confirmado, você recebe um e-mail em <strong>{order.user.email}</strong>.</>
            } Quando o pedido for postado, avisamos por e-mail de novo — mas você também pode acompanhar tudo a qualquer momento pelo site, em "Meus Pedidos".
          </p>
        </div>
      </div>

      {/* Detalhes do pedido */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Número do pedido</p>
            <p className="font-bold text-gray-900 font-mono text-sm mt-0.5">#{order.id.slice(-8).toUpperCase()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Data</p>
            <p className="font-semibold text-gray-700 text-sm mt-0.5">{formatDateTime(order.createdAt)}</p>
          </div>
        </div>

        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</span>
            <span className={`badge font-bold ${ORDER_STATUS_COLORS[order.status]}`}>
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pagamento</span>
            <span className="text-sm font-semibold text-gray-700">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</span>
          </div>
        </div>

        {/* Itens */}
        <div className="p-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Itens do pedido</p>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.product?.name ?? item.customName ?? "Item"}</p>
                  <p className="text-xs text-gray-400">Qtd: {item.quantity}{item.color ? ` • ${item.color}` : ""}{item.size ? ` • ${item.size}` : ""}</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Endereço */}
        <div className="p-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Endereço de entrega</p>
          <p className="text-sm text-gray-700">
            {order.address.street}, {order.address.number}
            {order.address.complement && `, ${order.address.complement}`}
            <br />{order.address.district} — {order.address.city}/{order.address.state}
            <br />CEP {order.address.zipCode}
          </p>
        </div>

        {/* Totais */}
        <div className="p-5 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Frete</span><span>{order.shipping === 0 ? "Grátis" : formatCurrency(order.shipping)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-100 pt-2">
            <span>Total</span><span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/conta/pedidos" className="btn-outline flex-1 justify-center">
          <Package size={18} /> Acompanhar pedido
        </Link>
        <Link href="/produtos" className="btn-primary flex-1 justify-center">
          Continuar comprando <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
