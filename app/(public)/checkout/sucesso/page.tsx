import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight, Mail } from "lucide-react";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, PAYMENT_LABELS } from "@/lib/utils";
import { AvaliarCompra } from "./AvaliarCompra";

export default async function SucessoPage({
  searchParams,
}: {
  searchParams: Promise<{ pedido?: string }>;
}) {
  const { pedido } = await searchParams;
  const session = await getServerSession(authOptions);

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

      {/* Confirmação por e-mail simulada */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <Mail size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Confirmação enviada!</p>
          <p className="text-sm text-blue-600">
            Um e-mail de confirmação foi enviado para <strong>{order.user.email}</strong> com todos os detalhes do seu pedido.
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
            <p className="font-semibold text-gray-700 text-sm mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</span>
            <span className="badge bg-yellow-100 text-yellow-800 font-bold">
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
                  <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
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

      {/* PIX simulado */}
      {order.paymentMethod === "PIX" && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-6">
          <p className="font-bold text-green-800 text-lg mb-2">Pague via PIX</p>
          <div className="w-40 h-40 bg-white border-2 border-green-300 rounded-xl mx-auto flex items-center justify-center mb-3">
            <div className="text-center">
              <Package size={32} className="text-green-400 mx-auto mb-1" />
              <p className="text-xs text-gray-400">QR Code</p>
              <p className="text-xs text-gray-400">Simulado</p>
            </div>
          </div>
          <p className="text-sm text-green-700 font-mono bg-green-100 px-3 py-1.5 rounded-lg">
            00020126580014BR.GOV.BCB.PIX0136...{order.id.slice(-8)}
          </p>
          <p className="text-xs text-green-600 mt-2">Válido por 30 minutos</p>
        </div>
      )}

      {/* Avaliação de produtos (só para usuários logados) */}
      {session && session.user.id === order.userId && (
        <AvaliarCompra
          orderId={order.id}
          items={order.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
          }))}
        />
      )}

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
