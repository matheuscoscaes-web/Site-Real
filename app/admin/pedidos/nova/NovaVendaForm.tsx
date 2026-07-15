"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Search, Check } from "lucide-react";
import { formatCurrency, MANUAL_PAYMENT_METHODS, PAYMENT_LABELS, ORDER_STATUS_LABELS } from "@/lib/utils";
import { buscarEnderecoPorCEP } from "@/lib/frete";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const STATUS_OPTIONS = ["PAID", "PREPARING", "SHIPPED", "DELIVERED"];

interface Customer { id: string; name: string; email: string; phone: string | null }
interface Variant { id: string; color: string | null; size: string | null; stock: number }
interface Product { id: string; name: string; price: number; variants: Variant[] }
interface Vendor { id: string; user: { name: string } }

interface CartItem {
  key: string;
  productId: string | null;
  productName: string;
  color: string | null;
  size: string | null;
  quantity: number;
  price: number;
  skipStock: boolean;
}

export function NovaVendaForm({ customers, products, vendors }: { customers: Customer[]; products: Product[]; vendors: Vendor[] }) {
  const router = useRouter();

  const [customerMode, setCustomerMode] = useState<"existing" | "novo">("existing");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "" });

  const [delivery, setDelivery] = useState<"RETIRADA" | "ENTREGA">("RETIRADA");
  const [address, setAddress] = useState({ cpf: "", street: "", number: "", complement: "", district: "", city: "", state: "", zipCode: "" });
  const [loadingCep, setLoadingCep] = useState(false);
  const [shipping, setShipping] = useState(0);

  const [itemMode, setItemMode] = useState<"catalogo" | "novo">("catalogo");
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [skipStock, setSkipStock] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState(0);
  const [items, setItems] = useState<CartItem[]>([]);

  const [paymentMethod, setPaymentMethod] = useState("DINHEIRO");
  const [status, setStatus] = useState("PAID");
  const [vendorId, setVendorId] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filteredCustomers = useMemo(() => {
    const term = customerSearch.trim().toLowerCase();
    if (!term) return customers.slice(0, 20);
    return customers.filter((c) =>
      c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term) || (c.phone ?? "").includes(term)
    ).slice(0, 20);
  }, [customers, customerSearch]);

  const selectedProduct = products.find((p) => p.id === productId);
  const availableVariants = selectedProduct?.variants.filter((v) => skipStock || v.stock > 0) ?? [];

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal + (delivery === "ENTREGA" ? shipping : 0);

  async function handleCepBlur() {
    const cepNum = address.zipCode.replace(/\D/g, "");
    if (cepNum.length !== 8) return;
    setLoadingCep(true);
    try {
      const data = await buscarEnderecoPorCEP(address.zipCode);
      setAddress((p) => ({ ...p, street: data.street || p.street, district: data.district || p.district, city: data.city || p.city, state: data.state || p.state }));
    } catch { /* mantém o que foi digitado */ } finally { setLoadingCep(false); }
  }

  function handleAddItem() {
    if (itemMode === "novo") {
      const name = customName.trim();
      if (!name) return;
      const key = `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setItems((prev) => [...prev, {
        key,
        productId: null,
        productName: name,
        color: null,
        size: null,
        quantity,
        price: customPrice,
        skipStock: true,
      }]);
      setCustomName("");
      setCustomPrice(0);
      setQuantity(1);
      return;
    }

    if (!selectedProduct) return;
    const variant = availableVariants.find((v) => v.id === variantId) ?? availableVariants[0] ?? null;
    if (availableVariants.length > 0 && !variant) return;

    const key = `${selectedProduct.id}-${variant?.color ?? ""}-${variant?.size ?? ""}-${skipStock}`;
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...prev, {
        key,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        color: variant?.color ?? null,
        size: variant?.size ?? null,
        quantity,
        price: selectedProduct.price,
        skipStock,
      }];
    });
    setProductId("");
    setVariantId("");
    setQuantity(1);
    setSkipStock(false);
  }

  function updateItem(key: string, patch: Partial<CartItem>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (customerMode === "existing" && !selectedCustomerId) {
      setError("Selecione um cliente.");
      return;
    }
    if (customerMode === "novo" && !newCustomer.name.trim()) {
      setError("Informe o nome do cliente.");
      return;
    }
    if (items.length === 0) {
      setError("Adicione ao menos um item à venda.");
      return;
    }
    if (delivery === "ENTREGA" && (!address.street || !address.number || !address.district || !address.city || !address.state || !address.zipCode)) {
      setError("Preencha o endereço de entrega.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/pedidos/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerMode === "existing" ? selectedCustomerId : undefined,
          newCustomer: customerMode === "novo" ? newCustomer : undefined,
          delivery,
          address: delivery === "ENTREGA" ? address : undefined,
          items: items.map((i) => ({
            productId: i.productId ?? undefined,
            customName: i.productId ? undefined : i.productName,
            quantity: i.quantity,
            price: i.price,
            color: i.color,
            size: i.size,
            skipStock: i.skipStock,
          })),
          shipping,
          paymentMethod,
          status,
          vendorId: vendorId || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registrar venda");
      router.push(`/admin/pedidos/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar venda");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>}

      {/* Cliente */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-900 mb-3">Cliente</h2>
        <div className="flex gap-2 mb-4">
          <button type="button" onClick={() => setCustomerMode("existing")} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${customerMode === "existing" ? "bg-brand-700 text-white" : "bg-gray-100 text-gray-600"}`}>
            Cliente já cadastrado
          </button>
          <button type="button" onClick={() => setCustomerMode("novo")} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${customerMode === "novo" ? "bg-brand-700 text-white" : "bg-gray-100 text-gray-600"}`}>
            Novo cliente
          </button>
        </div>

        {customerMode === "existing" ? (
          <div>
            <div className="relative mb-2">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input-field pl-9"
                placeholder="Buscar por nome, e-mail ou telefone..."
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setSelectedCustomerId(null); }}
              />
            </div>
            <div className="max-h-52 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-100">
              {filteredCustomers.length === 0 && (
                <p className="text-sm text-gray-400 px-4 py-3">Nenhum cliente encontrado.</p>
              )}
              {filteredCustomers.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-50 ${selectedCustomerId === c.id ? "bg-brand-50" : ""}`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.email}{c.phone ? ` • ${c.phone}` : ""}</p>
                  </div>
                  {selectedCustomerId === c.id && <Check size={16} className="text-brand-700 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="label">Nome *</label>
              <input className="input-field" value={newCustomer.name} onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))} required={customerMode === "novo"} />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input-field" value={newCustomer.phone} onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))} placeholder="(21) 99999-9999" />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input className="input-field" type="email" value={newCustomer.email} onChange={(e) => setNewCustomer((p) => ({ ...p, email: e.target.value }))} placeholder="opcional" />
            </div>
          </div>
        )}
      </div>

      {/* Entrega */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-900 mb-3">Entrega</h2>
        <div className="flex gap-2 mb-4">
          <button type="button" onClick={() => setDelivery("RETIRADA")} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${delivery === "RETIRADA" ? "bg-brand-700 text-white" : "bg-gray-100 text-gray-600"}`}>
            Retirada na loja
          </button>
          <button type="button" onClick={() => setDelivery("ENTREGA")} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${delivery === "ENTREGA" ? "bg-brand-700 text-white" : "bg-gray-100 text-gray-600"}`}>
            Endereço de entrega
          </button>
        </div>

        {delivery === "ENTREGA" && (
          <div className="grid sm:grid-cols-6 gap-3">
            <div className="sm:col-span-2">
              <label className="label">CEP *</label>
              <input className="input-field" value={address.zipCode} onChange={(e) => setAddress((p) => ({ ...p, zipCode: e.target.value }))} onBlur={handleCepBlur} placeholder="00000-000" />
              {loadingCep && <p className="text-xs text-gray-400 mt-1">Buscando endereço...</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="label">CPF do destinatário</label>
              <input className="input-field" value={address.cpf} onChange={(e) => setAddress((p) => ({ ...p, cpf: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Frete (R$)</label>
              <input className="input-field" type="number" step="0.01" min={0} value={shipping} onChange={(e) => setShipping(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="sm:col-span-4">
              <label className="label">Rua *</label>
              <input className="input-field" value={address.street} onChange={(e) => setAddress((p) => ({ ...p, street: e.target.value }))} required={delivery === "ENTREGA"} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Número *</label>
              <input className="input-field" value={address.number} onChange={(e) => setAddress((p) => ({ ...p, number: e.target.value }))} required={delivery === "ENTREGA"} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Complemento</label>
              <input className="input-field" value={address.complement} onChange={(e) => setAddress((p) => ({ ...p, complement: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Bairro *</label>
              <input className="input-field" value={address.district} onChange={(e) => setAddress((p) => ({ ...p, district: e.target.value }))} required={delivery === "ENTREGA"} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Cidade *</label>
              <input className="input-field" value={address.city} onChange={(e) => setAddress((p) => ({ ...p, city: e.target.value }))} required={delivery === "ENTREGA"} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">UF *</label>
              <select className="input-field" value={address.state} onChange={(e) => setAddress((p) => ({ ...p, state: e.target.value }))} required={delivery === "ENTREGA"}>
                <option value="">Selecione</option>
                {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Itens */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-900 mb-3">Itens</h2>

        <div className="flex gap-2 mb-4">
          <button type="button" onClick={() => setItemMode("catalogo")} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${itemMode === "catalogo" ? "bg-brand-700 text-white" : "bg-gray-100 text-gray-600"}`}>
            Produto do catálogo
          </button>
          <button type="button" onClick={() => setItemMode("novo")} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${itemMode === "novo" ? "bg-brand-700 text-white" : "bg-gray-100 text-gray-600"}`}>
            Bolsa nova (ainda não cadastrada)
          </button>
        </div>

        {itemMode === "catalogo" ? (
          <>
            <div className="grid sm:grid-cols-12 gap-3 mb-4 items-end">
              <div className="sm:col-span-5">
                <label className="label">Produto</label>
                <select className="input-field" value={productId} onChange={(e) => { setProductId(e.target.value); setVariantId(""); }}>
                  <option value="">Selecione um produto</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}</option>)}
                </select>
              </div>
              <div className="sm:col-span-4">
                <label className="label">Variante</label>
                <select className="input-field" value={variantId} onChange={(e) => setVariantId(e.target.value)} disabled={availableVariants.length === 0}>
                  {availableVariants.length === 0 && <option>{selectedProduct ? "Sem estoque" : "—"}</option>}
                  {availableVariants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {[v.color, v.size].filter(Boolean).join(" / ") || "Única"} (estoque: {v.stock})
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-1">
                <label className="label">Qtd</label>
                <input className="input-field" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
              </div>
              <div className="sm:col-span-2">
                <button type="button" onClick={handleAddItem} disabled={!productId} className="btn-outline w-full gap-2">
                  <Plus size={16} /> Adicionar
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 mb-4 -mt-1 cursor-pointer w-fit">
              <input type="checkbox" checked={skipStock} onChange={(e) => setSkipStock(e.target.checked)} className="rounded" />
              <span className="text-xs text-gray-500">Não descontar do estoque (bolsa feita à parte, amostra, encomenda extra)</span>
            </label>
          </>
        ) : (
          <div className="grid sm:grid-cols-12 gap-3 mb-4 items-end">
            <div className="sm:col-span-5">
              <label className="label">Nome da bolsa</label>
              <input
                className="input-field"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ex: Bolsa Valentina (sob encomenda)"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="label">Preço unitário (R$)</label>
              <input className="input-field" type="number" min={0} step="0.01" value={customPrice} onChange={(e) => setCustomPrice(Math.max(0, parseFloat(e.target.value) || 0))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Qtd</label>
              <input className="input-field" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
            </div>
            <div className="sm:col-span-2">
              <button type="button" onClick={handleAddItem} disabled={!customName.trim()} className="btn-outline w-full gap-2">
                <Plus size={16} /> Adicionar
              </button>
            </div>
            <p className="sm:col-span-12 text-xs text-gray-400 -mt-2">
              Essa bolsa ainda não está cadastrada no site — a venda é registrada normalmente, mas sem descontar estoque de nenhum produto.
            </p>
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum item adicionado ainda.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.key} className="flex items-center gap-3 border border-gray-100 rounded-xl px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.productName}</p>
                  {(item.color || item.size) && (
                    <p className="text-xs text-gray-400">{[item.color, item.size].filter(Boolean).join(" / ")}</p>
                  )}
                  {!item.productId ? (
                    <span className="inline-block text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 mt-1">
                      Bolsa nova (fora do catálogo)
                    </span>
                  ) : item.skipStock && (
                    <span className="inline-block text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 mt-1">
                      Não desconta estoque
                    </span>
                  )}
                </div>
                <input
                  type="number" min={1} value={item.quantity}
                  onChange={(e) => updateItem(item.key, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="input-field w-16 py-1.5 text-sm text-center"
                />
                <input
                  type="number" min={0} step="0.01" value={item.price}
                  onChange={(e) => updateItem(item.key, { price: Math.max(0, parseFloat(e.target.value) || 0) })}
                  className="input-field w-28 py-1.5 text-sm text-right"
                />
                <p className="text-sm font-bold text-gray-900 w-24 text-right flex-shrink-0">{formatCurrency(item.price * item.quantity)}</p>
                <button type="button" onClick={() => removeItem(item.key)} className="text-gray-400 hover:text-red-600 flex-shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagamento e detalhes */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-900 mb-3">Pagamento e status</h2>
        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="label">Forma de pagamento</label>
            <select className="input-field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {MANUAL_PAYMENT_METHODS.map((m) => <option key={m} value={m}>{PAYMENT_LABELS[m]}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Vendedor responsável (opcional)</label>
            <select className="input-field" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
              <option value="">Nenhum</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.user.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Observações</label>
          <textarea className="input-field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: venda feita presencialmente na loja" />
        </div>
      </div>

      {/* Totais */}
      <div className="card p-5 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Frete</span><span>{delivery === "ENTREGA" ? formatCurrency(shipping) : "Grátis"}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-100 pt-2">
          <span>Total</span><span>{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.push("/admin/pedidos")} className="btn-ghost">Cancelar</button>
        <button type="submit" disabled={saving} className="btn-primary gap-2">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {saving ? "Registrando..." : "Registrar venda"}
        </button>
      </div>
    </form>
  );
}
