"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";
import { buscarEnderecoPorCEP } from "@/lib/frete";
import { CreditCard, QrCode, FileText, Lock, ChevronDown, ChevronUp, Check, Loader2 } from "lucide-react";

interface Address {
  name: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
}

type PaymentMethod = "PIX" | "CARTAO_CREDITO" | "BOLETO";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();

  const [step, setStep] = useState(1);
  const [address, setAddress] = useState<Address>({
    name: "Casa",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [loadingCep, setLoadingCep] = useState(false);
  const [shipping] = useState(18.90);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [cardData, setCardData] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [processing, setProcessing] = useState(false);
  const [orderSummaryOpen, setOrderSummaryOpen] = useState(false);

  const sub = subtotal();
  const total = sub + shipping;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/checkout");
    }
    if (items.length === 0 && status === "authenticated") {
      router.push("/carrinho");
    }
  }, [status, items.length, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-700" size={40} />
      </div>
    );
  }

  async function handleCepBlur() {
    const cepNum = address.zipCode.replace(/\D/g, "");
    if (cepNum.length !== 8) return;
    setLoadingCep(true);
    try {
      const data = await buscarEnderecoPorCEP(address.zipCode);
      setAddress((prev) => ({
        ...prev,
        street: data.street || prev.street,
        district: data.district || prev.district,
        city: data.city || prev.city,
        state: data.state || prev.state,
      }));
    } catch {
      /* mantém como está se falhar */
    } finally {
      setLoadingCep(false);
    }
  }

  async function handleFinishOrder() {
    if (!session) return;
    setProcessing(true);

    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          paymentMethod,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
            color: i.color,
            size: i.size,
          })),
          subtotal: sub,
          shipping,
          total,
        }),
      });

      if (!res.ok) throw new Error("Falha ao criar pedido");
      const order = await res.json();
      clearCart();
      router.push(`/checkout/sucesso?pedido=${order.id}`);
    } catch {
      alert("Ocorreu um erro. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  }

  const steps = [
    { n: 1, label: "Endereço" },
    { n: 2, label: "Pagamento" },
    { n: 3, label: "Revisão" },
  ];

  const paymentOptions = [
    { id: "PIX" as PaymentMethod, label: "PIX", sub: "5% de desconto", icon: QrCode },
    { id: "CARTAO_CREDITO" as PaymentMethod, label: "Cartão de Crédito", sub: "Até 12x sem juros", icon: CreditCard },
    { id: "BOLETO" as PaymentMethod, label: "Boleto Bancário", sub: "Vence em 3 dias úteis", icon: FileText },
  ];

  return (
    <div className="container-main py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="text-xl font-bold text-brand-700 tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>
          Hearts Couro
        </Link>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Lock size={12} /> Compra Segura
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step > s.n ? "bg-green-500 text-white" : step === s.n ? "bg-brand-700 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {step > s.n ? <Check size={16} /> : s.n}
              </div>
              <span className={`text-xs mt-1 ${step === s.n ? "text-brand-700 font-semibold" : "text-gray-400"}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-16 md:w-24 h-0.5 mx-2 mb-4 transition-all ${step > s.n ? "bg-green-500" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          {/* Passo 1: Endereço */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-5">Endereço de entrega</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">CEP *</label>
                  <div className="relative">
                    <input
                      className="input-field pr-10"
                      value={address.zipCode}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                        setAddress((p) => ({ ...p, zipCode: v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v }));
                      }}
                      onBlur={handleCepBlur}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {loadingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" size={16} />}
                  </div>
                </div>

                <div>
                  <label className="label">Identificação do endereço</label>
                  <input className="input-field" value={address.name} onChange={(e) => setAddress((p) => ({ ...p, name: e.target.value }))} placeholder="Casa, Trabalho..." />
                </div>

                <div className="md:col-span-2">
                  <label className="label">Rua / Logradouro *</label>
                  <input className="input-field" value={address.street} onChange={(e) => setAddress((p) => ({ ...p, street: e.target.value }))} placeholder="Rua das Flores" />
                </div>

                <div>
                  <label className="label">Número *</label>
                  <input className="input-field" value={address.number} onChange={(e) => setAddress((p) => ({ ...p, number: e.target.value }))} placeholder="123" />
                </div>

                <div>
                  <label className="label">Complemento</label>
                  <input className="input-field" value={address.complement} onChange={(e) => setAddress((p) => ({ ...p, complement: e.target.value }))} placeholder="Apto 45, Bloco B..." />
                </div>

                <div>
                  <label className="label">Bairro *</label>
                  <input className="input-field" value={address.district} onChange={(e) => setAddress((p) => ({ ...p, district: e.target.value }))} placeholder="Centro" />
                </div>

                <div>
                  <label className="label">Cidade *</label>
                  <input className="input-field" value={address.city} onChange={(e) => setAddress((p) => ({ ...p, city: e.target.value }))} placeholder="São Paulo" />
                </div>

                <div>
                  <label className="label">Estado *</label>
                  <select className="input-field" value={address.state} onChange={(e) => setAddress((p) => ({ ...p, state: e.target.value }))}>
                    <option value="">Selecione...</option>
                    {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!address.street || !address.number || !address.city || !address.state || !address.zipCode) {
                    alert("Preencha todos os campos obrigatórios.");
                    return;
                  }
                  setStep(2);
                }}
                className="btn-primary w-full mt-6"
              >
                Continuar para pagamento
              </button>
            </div>
          )}

          {/* Passo 2: Pagamento */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-5">Forma de pagamento</h2>

              <div className="space-y-3 mb-6">
                {paymentOptions.map(({ id, label, sub: subLabel, icon: Icon }) => (
                  <label key={id} className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === id ? "border-brand-600 bg-brand-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="payment" value={id} checked={paymentMethod === id} onChange={() => setPaymentMethod(id)} className="accent-brand-700" />
                    <Icon size={20} className={paymentMethod === id ? "text-brand-700" : "text-gray-400"} />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{label}</p>
                      <p className="text-xs text-gray-500">{subLabel}</p>
                    </div>
                  </label>
                ))}
              </div>

              {paymentMethod === "PIX" && (
                <div className="bg-green-50 rounded-2xl p-5 text-center mb-6 border border-green-200">
                  <QrCode size={64} className="text-green-600 mx-auto mb-3" />
                  <p className="font-bold text-green-800 text-lg">{formatCurrency(total * 0.95)}</p>
                  <p className="text-sm text-green-700 mt-1">5% de desconto aplicado via PIX</p>
                  <p className="text-xs text-green-600 mt-3">O QR Code será gerado após confirmação do pedido</p>
                </div>
              )}

              {paymentMethod === "CARTAO_CREDITO" && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="label">Número do cartão</label>
                    <input
                      className="input-field"
                      placeholder="0000 0000 0000 0000"
                      value={cardData.number}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                        const formatted = v.replace(/(.{4})/g, "$1 ").trim();
                        setCardData((p) => ({ ...p, number: formatted }));
                      }}
                      maxLength={19}
                    />
                  </div>
                  <div>
                    <label className="label">Nome no cartão</label>
                    <input className="input-field" placeholder="NOME COMPLETO" value={cardData.name} onChange={(e) => setCardData((p) => ({ ...p, name: e.target.value.toUpperCase() }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Validade</label>
                      <input className="input-field" placeholder="MM/AA" value={cardData.expiry} maxLength={5} onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setCardData((p) => ({ ...p, expiry: v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v }));
                      }} />
                    </div>
                    <div>
                      <label className="label">CVV</label>
                      <input className="input-field" placeholder="123" maxLength={4} value={cardData.cvv} onChange={(e) => setCardData((p) => ({ ...p, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Parcelas</label>
                    <select className="input-field">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}x de {formatCurrency(total / n)} {n === 1 ? "" : "sem juros"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {paymentMethod === "BOLETO" && (
                <div className="bg-yellow-50 rounded-2xl p-5 text-center mb-6 border border-yellow-200">
                  <FileText size={48} className="text-yellow-600 mx-auto mb-3" />
                  <p className="font-semibold text-yellow-800">{formatCurrency(total)}</p>
                  <p className="text-sm text-yellow-700 mt-2">O boleto vence em 3 dias úteis</p>
                  <p className="text-xs text-yellow-600 mt-1">O código de barras será enviado por e-mail</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-outline flex-1">Voltar</button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1">Revisar pedido</button>
              </div>
            </div>
          )}

          {/* Passo 3: Revisão */}
          {step === 3 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-5">Revisão do pedido</h2>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Endereço de entrega</p>
                  <p className="text-sm text-gray-700">
                    {address.street}, {address.number}
                    {address.complement && `, ${address.complement}`} — {address.district}
                    <br />{address.city}/{address.state} — CEP {address.zipCode}
                  </p>
                  <button onClick={() => setStep(1)} className="text-xs text-brand-600 underline mt-1">Alterar</button>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pagamento</p>
                  <p className="text-sm text-gray-700">
                    {paymentMethod === "PIX" && "PIX (5% de desconto)"}
                    {paymentMethod === "CARTAO_CREDITO" && `Cartão de crédito terminado em ${cardData.number.slice(-4) || "****"}`}
                    {paymentMethod === "BOLETO" && "Boleto bancário"}
                  </p>
                  <button onClick={() => setStep(2)} className="text-xs text-brand-600 underline mt-1">Alterar</button>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-100">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">Qtd: {item.quantity}{item.color ? ` • ${item.color}` : ""}{item.size ? ` • ${item.size}` : ""}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-outline flex-1">Voltar</button>
                <button
                  onClick={handleFinishOrder}
                  disabled={processing}
                  className="btn-primary flex-1 py-4"
                >
                  {processing ? <><Loader2 size={18} className="animate-spin" /> Processando...</> : <><Lock size={18} /> Confirmar pedido</>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Resumo lateral */}
        <div>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden sticky top-24">
            <button
              className="w-full flex items-center justify-between p-4 font-bold text-gray-900 lg:cursor-default"
              onClick={() => setOrderSummaryOpen(!orderSummaryOpen)}
            >
              <span>Resumo do pedido ({items.length} {items.length === 1 ? "item" : "itens"})</span>
              <span className="lg:hidden">{orderSummaryOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
            </button>

            <div className={`${orderSummaryOpen ? "block" : "hidden"} lg:block`}>
              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                      <span className="absolute -top-1 -right-1 bg-brand-700 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 line-clamp-2">{item.name}</p>
                      {item.color && <p className="text-[10px] text-gray-400">{item.color}</p>}
                    </div>
                    <p className="text-xs font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span><span>{formatCurrency(sub)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Frete</span><span>{formatCurrency(shipping)}</span>
                </div>
                {paymentMethod === "PIX" && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Desconto PIX</span><span>-{formatCurrency(total * 0.05)}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900 text-base">
                  <span>Total</span>
                  <span>{formatCurrency(paymentMethod === "PIX" ? total * 0.95 : total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
