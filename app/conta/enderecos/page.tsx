"use client";

import { useState, useEffect, useCallback } from "react";
import { MapPin, Plus, Trash2, Loader2, X } from "lucide-react";
import { buscarEnderecoPorCEP } from "@/lib/frete";

interface Address {
  id: string;
  name: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

const EMPTY_FORM = {
  name: "Casa",
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
};

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function EnderecosPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loadingCep, setLoadingCep] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchAddresses = useCallback(async () => {
    const res = await fetch("/api/clientes/me/enderecos");
    const data = await res.json();
    setAddresses(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  async function handleCepBlur() {
    const cep = form.zipCode.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setLoadingCep(true);
    try {
      const data = await buscarEnderecoPorCEP(form.zipCode);
      setForm((p) => ({
        ...p,
        street: data.street || p.street,
        district: data.district || p.district,
        city: data.city || p.city,
        state: data.state || p.state,
      }));
    } catch {
      /* mantém como está */
    } finally {
      setLoadingCep(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.street || !form.number || !form.city || !form.state || !form.zipCode) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/clientes/me/enderecos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) { setError("Erro ao salvar endereço."); return; }
    setForm(EMPTY_FORM);
    setShowForm(false);
    fetchAddresses();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este endereço?")) return;
    setDeletingId(id);
    await fetch(`/api/clientes/me/enderecos?id=${id}`, { method: "DELETE" });
    setDeletingId(null);
    fetchAddresses();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Meus Endereços</h2>
        <button onClick={() => { setShowForm(!showForm); setError(""); }} className="btn-primary text-sm py-2">
          {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Adicionar</>}
        </button>
      </div>

      {/* Formulário de novo endereço */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-brand-200 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">Novo endereço</h3>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Identificação *</label>
              <input className="input-field" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Casa, Trabalho..." />
            </div>

            <div>
              <label className="label">CEP *</label>
              <div className="relative">
                <input
                  className="input-field pr-10"
                  value={form.zipCode}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                    setForm((p) => ({ ...p, zipCode: v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v }));
                  }}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  maxLength={9}
                />
                {loadingCep && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="label">Rua / Logradouro *</label>
              <input className="input-field" value={form.street} onChange={(e) => setForm((p) => ({ ...p, street: e.target.value }))} placeholder="Rua das Flores" />
            </div>

            <div>
              <label className="label">Número *</label>
              <input className="input-field" value={form.number} onChange={(e) => setForm((p) => ({ ...p, number: e.target.value }))} placeholder="123" />
            </div>

            <div>
              <label className="label">Complemento</label>
              <input className="input-field" value={form.complement} onChange={(e) => setForm((p) => ({ ...p, complement: e.target.value }))} placeholder="Apto 45..." />
            </div>

            <div>
              <label className="label">Bairro *</label>
              <input className="input-field" value={form.district} onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))} placeholder="Centro" />
            </div>

            <div>
              <label className="label">Cidade *</label>
              <input className="input-field" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="São Paulo" />
            </div>

            <div>
              <label className="label">Estado *</label>
              <select className="input-field" value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}>
                <option value="">Selecione...</option>
                {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : "Salvar endereço"}
          </button>
        </form>
      )}

      {/* Lista de endereços */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-brand-600" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <MapPin size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Você ainda não tem endereços salvos.</p>
          <p className="text-gray-400 text-xs mt-1">Clique em "Adicionar" para cadastrar um endereço.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={16} className="text-brand-600" />
                    <span className="font-semibold text-gray-900">{addr.name}</span>
                    {addr.isDefault && (
                      <span className="badge bg-green-100 text-green-700 text-xs">Padrão</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {addr.street}, {addr.number}
                    {addr.complement && `, ${addr.complement}`}
                    <br />{addr.district} — {addr.city}/{addr.state}
                    <br />CEP {addr.zipCode}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(addr.id)}
                  disabled={deletingId === addr.id}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                  aria-label="Remover endereço"
                >
                  {deletingId === addr.id
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Trash2 size={16} />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
