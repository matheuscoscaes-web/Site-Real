"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";
import { buscarEnderecoPorCEP, FreteOption } from "@/lib/frete";
import {
  Lock, ChevronDown, ChevronUp, Check, Loader2, Tag, X, AlertCircle, Copy, CheckCheck, Truck,
} from "lucide-react";

const MercadoPagoBrick = dynamic(
  () => import("./MercadoPagoBrick").then((m) => m.MercadoPagoBrick),
  { ssr: false, loading: () => <div className="py-8 text-center text-gray-400 text-sm">Carregando checkout seguro...</div> }
);

interface Address {
  name: string; street: string; number: string; complement: string;
  district: string; city: string; state: string; zipCode: string;
}

interface PixData {
  orderId: string;
  qrCode: string;
  qrCodeBase64: string;
}

interface BoletoData {
  orderId: string;
  url: string;
  code: string;
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();

  const [step, setStep] = useState(1);
  const [coupon, setCoupon] = useState({ code: "", input: "", discount: 0, loading: false, error: "", applied: false });
  const [address, setAddress] = useState<Address>({ name: "Casa", street: "", number: "", complement: "", district: "", city: "", state: "", zipCode: "" });
  const [loadingCep, setLoadingCep] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<FreteOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<FreteOption | null>(null);
  const [loadingFrete, setLoadingFrete] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [orderSummaryOpen, setOrderSummaryOpen] = useState(false);
  const [isFirstPurchase, setIsFirstPurchase] = useState(false);
  const [erro, setErro] = useState("");
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [boletoData, setBoletoData] = useState<BoletoData | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const sub = subtotal();
  const firstDiscount = isFirstPurchase ? sub * 0.4 : 0;
  const couponAmount = !isFirstPurchase ? (sub * coupon.discount) / 100 : 0;
  const effectiveShipping = isFirstPurchase ? 0 : (selectedShipping?.price ?? 0);
  const total = sub - firstDiscount - couponAmount + effectiveShipping;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?redirect=/checkout");
    if (items.length === 0 && status === "authenticated") router.push("/carrinho");
  }, [status, items.length, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/pedidos/primeiro-desconto")
      .then((r) => r.json())
      .then((d: { isFirstPurchase: boolean }) => setIsFirstPurchase(d.isFirstPurchase))
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("cupom");
    if (!code) return;
    fetch(`/api/cupom?code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setCoupon((p) => ({ ...p, applied: true, code: code.toUpperCase(), discount: data.discount, error: "" }));
        }
      })
      .catch(() => {});
  }, []);

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
      setAddress((p) => ({ ...p, street: data.street || p.street, district: data.district || p.district, city: data.city || p.city, state: data.state || p.state }));
    } catch { /* mantém */ } finally { setLoadingCep(false); }

    if (!isFirstPurchase) {
      setLoadingFrete(true);
      setShippingOptions([]);
      setSelectedShipping(null);
      try {
        const res = await fetch("/api/frete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cep: address.zipCode, totalItems: items.reduce((s, i) => s + i.quantity, 0) }),
        });
        const data = await res.json();
        if (Array.isArray(data)) setShippingOptions(data);
      } catch { /* ignora */ } finally { setLoadingFrete(false); }
    }
  }

  async function applyCoupon() {
    if (!coupon.input.trim()) return;
    setCoupon((p) => ({ ...p, loading: true, error: "" }));
    const res = await fetch(`/api/cupom?code=${encodeURIComponent(coupon.input.trim())}`);
    const data = await res.json();
    if (data.valid) {
      setCoupon((p) => ({ ...p, loading: false, applied: true, code: coupon.input.trim().toUpperCase(), discount: data.discount, error: "" }));
    } else {
      setCoupon((p) => ({ ...p, loading: false, error: data.error || "Cupom inválido", applied: false, discount: 0 }));
    }
  }

  async function handleGoToPayment() {
    if (!address.street || !address.number || !address.city || !address.state || !address.zipCode) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    if (!isFirstPurchase && !selectedShipping) {
      alert("Selecione uma opção de frete.");
      return;
    }
    if (!session) return;

    setProcessing(true);
    setErro("");

    try {
      const orderRes = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          paymentMethod: "MERCADOPAGO",
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.price, color: i.color, size: i.size })),
          subtotal: sub,
          shipping: effectiveShipping,
          total,
          couponCode: coupon.applied ? coupon.code : null,
          shippingServiceId: selectedShipping?.id ?? null,
          shippingService: selectedShipping?.name ?? null,
          shippingCarrier: selectedShipping?.company ?? null,
        }),
      });

      if (!orderRes.ok) throw new Error();
      const order = await orderRes.json();
      setCurrentOrderId(order.id);
      setStep(2);
    } catch {
      setErro("Erro ao registrar pedido. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  }

  async function handlePaymentSubmit(formData: Record<string, unknown>) {
    if (!currentOrderId || !session) return;
    setErro("");

    try {
      const res = await fetch("/api/mercadopago/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, orderId: currentOrderId, total }),
      });

      const data = await res.json();

      if (data.status === "approved") {
        clearCart();
        router.push(`/checkout/sucesso?pedido=${currentOrderId}`);
      } else if (data.status === "pending" && data.qrCode) {
        clearCart();
        setPixData({ orderId: currentOrderId, qrCode: data.qrCode, qrCodeBase64: data.qrCodeBase64 });
        setStep(3);
      } else if (data.status === "pending" && data.boletoUrl) {
        clearCart();
        setBoletoData({ orderId: currentOrderId, url: data.boletoUrl, code: data.boletoCode ?? "" });
        setStep(3);
      } else if (data.status === "in_process") {
        clearCart();
        router.push(`/checkout/sucesso?pedido=${currentOrderId}`);
      } else {
        setErro("Pagamento não aprovado. Verifique os dados e tente com outro cartão ou método.");
      }
    } catch {
      setErro("Erro ao processar pagamento. Tente novamente.");
    }
  }

  async function copyPix(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  const steps = [
    { n: 1, label: "Endereço" },
    { n: 2, label: "Pagamento" },
    { n: 3, label: "Confirmação" },
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
              <span className={`text-xs mt-1 ${step === s.n ? "text-brand-700 font-semibold" : "text-gray-400"}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-16 md:w-24 h-0.5 mx-2 mb-4 transition-all ${step > s.n ? "bg-green-500" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {isFirstPurchase && step === 1 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-bold text-green-800 text-sm">Desconto de primeira compra aplicado!</p>
            <p className="text-xs text-green-700 mt-0.5">40% de desconto + frete grátis neste pedido.</p>
          </div>
        </div>
      )}

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{erro}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">

          {/* Passo 1: Endereço + Cupom */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-5">Endereço de entrega</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                  <label className="label">Identificação</label>
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
                  <input className="input-field" value={address.complement} onChange={(e) => setAddress((p) => ({ ...p, complement: e.target.value }))} placeholder="Apto 45..." />
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

              {/* Frete */}
              {!isFirstPurchase && (
                <div className="mb-6 border-t border-gray-100 pt-5">
                  <p className="label mb-3 flex items-center gap-2">
                    <Truck size={15} className="text-brand-700" /> Opções de frete
                  </p>

                  {loadingFrete && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Loader2 size={15} className="animate-spin" /> Calculando frete...
                    </div>
                  )}

                  {!loadingFrete && shippingOptions.length === 0 && address.zipCode.replace(/\D/g, "").length === 8 && (
                    <p className="text-sm text-red-500">Nenhuma opção de frete disponível para este CEP.</p>
                  )}

                  {!loadingFrete && shippingOptions.length === 0 && address.zipCode.replace(/\D/g, "").length < 8 && (
                    <p className="text-sm text-gray-400">Digite o CEP acima para ver as opções de frete.</p>
                  )}

                  {!loadingFrete && shippingOptions.length > 0 && (
                    <div className="space-y-2">
                      {shippingOptions.map((opt) => (
                        <label
                          key={opt.id}
                          className={`flex items-center justify-between gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer transition-all ${
                            selectedShipping?.id === opt.id
                              ? "border-brand-700 bg-brand-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="frete"
                              checked={selectedShipping?.id === opt.id}
                              onChange={() => setSelectedShipping(opt)}
                              className="accent-brand-700"
                            />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{opt.company} — {opt.name}</p>
                              <p className="text-xs text-gray-400">Prazo: até {opt.days} {opt.days === 1 ? "dia útil" : "dias úteis"}</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-gray-900 flex-shrink-0">{formatCurrency(opt.price)}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Cupom */}
              {!isFirstPurchase && (
                <div className="mb-6 border-t border-gray-100 pt-5">
                  <p className="label mb-1.5">Cupom de desconto</p>
                  {coupon.applied ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-green-600" />
                        <span className="font-mono font-bold text-green-700">{coupon.code}</span>
                        <span className="text-sm text-green-600">— {coupon.discount}% de desconto</span>
                      </div>
                      <button onClick={() => setCoupon({ code: "", input: "", discount: 0, loading: false, error: "", applied: false })} className="text-gray-400 hover:text-red-500">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        className="input-field flex-1 uppercase font-mono"
                        placeholder="Ex: JOAO10"
                        value={coupon.input}
                        onChange={(e) => setCoupon((p) => ({ ...p, input: e.target.value.toUpperCase(), error: "" }))}
                        onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                      />
                      <button onClick={applyCoupon} disabled={coupon.loading} className="btn-outline px-4 flex-shrink-0">
                        {coupon.loading ? <Loader2 size={16} className="animate-spin" /> : "Aplicar"}
                      </button>
                    </div>
                  )}
                  {coupon.error && <p className="text-xs text-red-600 mt-1.5">{coupon.error}</p>}
                </div>
              )}

              <button
                onClick={handleGoToPayment}
                disabled={processing}
                className="btn-primary w-full"
              >
                {processing ? <><Loader2 size={16} className="animate-spin" /> Aguarde...</> : "Ir para pagamento"}
              </button>
            </div>
          )}

          {/* Passo 2: Brick de pagamento */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Forma de pagamento</h2>
              <p className="text-sm text-gray-500 mb-5">PIX, cartão de crédito ou boleto — tudo aqui mesmo.</p>

              <div className="p-4 bg-gray-50 rounded-xl mb-5 text-sm text-gray-700">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Endereço de entrega</p>
                {address.street}, {address.number}{address.complement && `, ${address.complement}`} — {address.district}
                <br />{address.city}/{address.state} — CEP {address.zipCode}
                <button onClick={() => setStep(1)} className="block text-xs text-brand-600 underline mt-1">Alterar</button>
              </div>

              <MercadoPagoBrick
                amount={total}
                onSubmit={handlePaymentSubmit}
                onError={() => setErro("Erro no componente de pagamento. Tente recarregar a página.")}
              />
            </div>
          )}

          {/* Passo 3: PIX ou Boleto pendente */}
          {step === 3 && pixData && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
                Pedido registrado!
              </h2>
              <p className="text-gray-500 text-sm mb-6">Pague o PIX abaixo para confirmar sua compra.</p>

              {pixData.qrCodeBase64 && (
                <div className="flex justify-center mb-4">
                  <img
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 border-4 border-gray-100 rounded-2xl"
                  />
                </div>
              )}

              <p className="text-xs text-gray-500 mb-2">Ou copie o código PIX:</p>
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs font-mono text-gray-700 break-all mb-3">
                {pixData.qrCode}
              </div>
              <button
                onClick={() => copyPix(pixData.qrCode)}
                className="btn-primary gap-2 mb-6"
              >
                {copied ? <><CheckCheck size={16} /> Copiado!</> : <><Copy size={16} /> Copiar código PIX</>}
              </button>

              <p className="text-xs text-gray-400 mb-4">O pagamento é confirmado automaticamente após o PIX ser pago.</p>

              <Link href={`/conta/pedidos`} className="btn-outline w-full justify-center">
                Acompanhar pedido
              </Link>
            </div>
          )}

          {step === 3 && boletoData && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
                Boleto gerado!
              </h2>
              <p className="text-gray-500 text-sm mb-6">Pague o boleto até o vencimento para confirmar sua compra.</p>

              {boletoData.code && (
                <>
                  <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs font-mono text-gray-700 break-all mb-3">
                    {boletoData.code}
                  </div>
                  <button onClick={() => copyPix(boletoData.code)} className="btn-outline gap-2 mb-4">
                    {copied ? <><CheckCheck size={16} /> Copiado!</> : <><Copy size={16} /> Copiar código</>}
                  </button>
                </>
              )}

              {boletoData.url && (
                <a href={boletoData.url} target="_blank" rel="noopener noreferrer" className="btn-primary w-full justify-center mb-4">
                  Abrir boleto para imprimir
                </a>
              )}

              <Link href="/conta/pedidos" className="btn-outline w-full justify-center">
                Acompanhar pedido
              </Link>
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
              <span>Resumo ({items.length} {items.length === 1 ? "item" : "itens"})</span>
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
                {isFirstPurchase && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Desconto 1ª compra (40%)</span>
                    <span>-{formatCurrency(firstDiscount)}</span>
                  </div>
                )}
                {coupon.applied && !isFirstPurchase && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Cupom {coupon.code} ({coupon.discount}%)</span>
                    <span>-{formatCurrency(couponAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Frete{selectedShipping ? ` (${selectedShipping.company} ${selectedShipping.name})` : ""}</span>
                  <span className={isFirstPurchase ? "text-green-600 font-medium" : ""}>
                    {isFirstPurchase
                      ? "Grátis"
                      : selectedShipping
                      ? formatCurrency(selectedShipping.price)
                      : "—"}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900 text-base">
                  <span>Total</span><span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
