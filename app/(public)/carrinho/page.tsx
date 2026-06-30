"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";
import { type FreteOption } from "@/lib/frete";
import { Trash2, Plus, Minus, ShoppingBag, Truck, ArrowRight, Tag, X, Loader2 } from "lucide-react";

export default function CarrinhoPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, subtotal } = useCartStore();
  const [cep, setCep] = useState("");
  const [freteOptions, setFreteOptions] = useState<FreteOption[]>([]);
  const [selectedFrete, setSelectedFrete] = useState<FreteOption | null>(null);
  const [loadingFrete, setLoadingFrete] = useState(false);
  const [freteError, setFreteError] = useState("");
  const [cupomInput, setCupomInput] = useState("");
  const [cupomLoading, setCupomLoading] = useState(false);
  const [cupomAplicado, setCupomAplicado] = useState<{ code: string; discount: number; ownerName: string } | null>(null);
  const [cupomError, setCupomError] = useState("");

  const sub = subtotal();
  const freteTotal = selectedFrete?.price ?? 0;
  const desconto = cupomAplicado ? sub * cupomAplicado.discount / 100 : 0;
  const total = sub - desconto + freteTotal;

  async function handleCalcularFrete() {
    if (cep.replace(/\D/g, "").length !== 8) {
      setFreteError("CEP inválido. Digite os 8 dígitos.");
      return;
    }
    setLoadingFrete(true);
    setFreteError("");
    setFreteOptions([]);
    setSelectedFrete(null);
    try {
      const res = await fetch("/api/frete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep, totalItems: items.reduce((s, i) => s + i.quantity, 0) }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error(data.error ?? "Erro");
      setFreteOptions(data);
      setSelectedFrete(data[0] ?? null);
    } catch {
      setFreteError("Não foi possível calcular o frete. Verifique o CEP.");
    } finally {
      setLoadingFrete(false);
    }
  }

  async function handleCupom() {
    if (!cupomInput.trim()) return;
    setCupomLoading(true);
    setCupomError("");
    const res = await fetch(`/api/cupom?code=${encodeURIComponent(cupomInput.trim())}`);
    const data = await res.json();
    setCupomLoading(false);
    if (data.valid) {
      setCupomAplicado({ code: cupomInput.trim().toUpperCase(), discount: data.discount, ownerName: data.ownerName });
      setCupomInput("");
    } else {
      setCupomError(data.error || "Cupom inválido ou expirado.");
    }
  }

  function handleCheckout() {
    const url = cupomAplicado ? `/checkout?cupom=${encodeURIComponent(cupomAplicado.code)}` : "/checkout";
    router.push(url);
  }

  if (items.length === 0) {
    return (
      <div className="container-main py-20 text-center">
        <ShoppingBag size={64} className="text-gray-200 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: "Playfair Display, serif" }}>
          Seu carrinho está vazio
        </h2>
        <p className="text-gray-500 mb-8">Adicione produtos incríveis e volte aqui para finalizar sua compra.</p>
        <Link href="/produtos" className="btn-primary">
          Explorar produtos <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="container-main py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8" style={{ fontFamily: "Playfair Display, serif" }}>
        Meu Carrinho
        <span className="text-base font-normal text-gray-400 ml-3">({items.length} {items.length === 1 ? "item" : "itens"})</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Itens */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 shadow-sm">
              <Link href={`/produtos/${item.slug}`} className="flex-shrink-0">
                <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden bg-gray-50">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/produtos/${item.slug}`} className="font-semibold text-gray-900 hover:text-brand-700 transition-colors text-sm md:text-base line-clamp-2">
                    {item.name}
                  </Link>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 p-1"
                    aria-label="Remover"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {(item.color || item.size) && (
                  <p className="text-xs text-gray-400 mt-1">
                    {item.color && `Cor: ${item.color}`}
                    {item.color && item.size && " • "}
                    {item.size && `Tamanho: ${item.size}`}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-3 py-2 hover:bg-gray-50 transition-colors text-gray-600"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-4 py-2 font-semibold text-gray-900 text-sm border-x border-gray-200">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-2 hover:bg-gray-50 transition-colors text-gray-600"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-gray-400">{formatCurrency(item.price)} cada</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Link href="/produtos" className="btn-ghost text-brand-700 w-fit">
            ← Continuar comprando
          </Link>
        </div>

        {/* Resumo */}
        <div className="space-y-4">
          {/* Cupom */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Tag size={18} className="text-brand-700" /> Cupom de desconto
            </h3>
            {cupomAplicado ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div>
                  <p className="font-mono font-bold text-green-700 text-sm">{cupomAplicado.code}</p>
                  <p className="text-xs text-green-600">{cupomAplicado.discount}% de desconto — economia de {formatCurrency(desconto)}</p>
                </div>
                <button onClick={() => setCupomAplicado(null)} className="text-gray-400 hover:text-red-500 ml-3">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cupomInput}
                    onChange={(e) => { setCupomInput(e.target.value.toUpperCase()); setCupomError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleCupom()}
                    placeholder="Digite o cupom"
                    className="input-field flex-1 text-sm py-2.5 font-mono uppercase"
                  />
                  <button onClick={handleCupom} disabled={cupomLoading} className="btn-primary text-sm px-4 py-2.5 min-w-[90px]">
                    {cupomLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Aplicar"}
                  </button>
                </div>
                {cupomError && <p className="text-xs mt-2 font-medium text-red-500">{cupomError}</p>}
              </>
            )}
          </div>

          {/* Frete */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Truck size={18} className="text-brand-700" /> Calcular frete
            </h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={cep}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                  setCep(v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v);
                }}
                placeholder="00000-000"
                className="input-field flex-1 text-sm py-2.5"
                maxLength={9}
              />
              <button
                onClick={handleCalcularFrete}
                disabled={loadingFrete}
                className="btn-primary text-sm px-4 py-2.5 min-w-[90px]"
              >
                {loadingFrete ? "..." : "Calcular"}
              </button>
            </div>
            {freteError && <p className="text-xs text-red-500 mb-2">{freteError}</p>}
            {freteOptions.length > 0 && (
              <div className="space-y-2">
                {freteOptions.map((opt) => (
                  <label key={opt.id} className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedFrete?.id === opt.id ? "border-brand-600 bg-brand-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="frete"
                        checked={selectedFrete?.id === opt.id}
                        onChange={() => setSelectedFrete(opt)}
                        className="accent-brand-700"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{opt.company} — {opt.name}</p>
                        <p className="text-xs text-gray-500">{opt.days} dias úteis</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {opt.price === 0 ? "Grátis" : formatCurrency(opt.price)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Resumo do pedido</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} itens)</span>
                <span>{formatCurrency(sub)}</span>
              </div>
              {desconto > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Desconto (cupom)</span>
                  <span>-{formatCurrency(desconto)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Frete</span>
                <span>{selectedFrete ? (selectedFrete.price === 0 ? "Grátis" : formatCurrency(selectedFrete.price)) : "Calculando..."}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 mt-2">
                <div className="flex justify-between font-bold text-gray-900 text-base">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">
                  ou 12x de {formatCurrency(total / 12)} sem juros
                </p>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="btn-primary w-full mt-5 text-base py-4"
            >
              Finalizar compra <ArrowRight size={18} />
            </button>

            <p className="text-xs text-center text-gray-400 mt-3 flex items-center justify-center gap-1">
              🔒 Compra 100% segura
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
