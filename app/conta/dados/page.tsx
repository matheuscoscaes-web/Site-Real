"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Check, Eye, EyeOff } from "lucide-react";

export default function DadosPessoaisPage() {
  const { data: session } = useSession();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [msgPass, setMsgPass] = useState({ type: "", text: "" });

  useEffect(() => {
    if (session) {
      setForm({
        name: session.user.name || "",
        email: session.user.email || "",
        phone: "",
      });
      // Buscar dados completos
      fetch("/api/clientes/me")
        .then((r) => r.json())
        .then((data) => {
          if (data) setForm({ name: data.name, email: data.email, phone: data.phone || "" });
        });
    }
  }, [session]);

  async function handleSaveDados(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: "", text: "" });
    const res = await fetch("/api/clientes/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, phone: form.phone }),
    });
    setLoading(false);
    if (res.ok) {
      setMsg({ type: "success", text: "Dados atualizados com sucesso!" });
    } else {
      setMsg({ type: "error", text: "Erro ao atualizar dados." });
    }
  }

  async function handleSavePass(e: React.FormEvent) {
    e.preventDefault();
    setMsgPass({ type: "", text: "" });
    if (passwords.new !== passwords.confirm) {
      setMsgPass({ type: "error", text: "As senhas não coincidem." });
      return;
    }
    if (passwords.new.length < 6) {
      setMsgPass({ type: "error", text: "A nova senha deve ter pelo menos 6 caracteres." });
      return;
    }
    setLoadingPass(true);
    const res = await fetch("/api/clientes/me/senha", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new }),
    });
    setLoadingPass(false);
    const data = await res.json();
    if (res.ok) {
      setMsgPass({ type: "success", text: "Senha alterada com sucesso!" });
      setPasswords({ current: "", new: "", confirm: "" });
    } else {
      setMsgPass({ type: "error", text: data.error || "Erro ao alterar senha." });
    }
  }

  return (
    <div className="space-y-6">
      {/* Dados pessoais */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Dados Pessoais</h2>

        {msg.text && (
          <div className={`text-sm rounded-xl px-4 py-3 mb-4 ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSaveDados} className="space-y-4">
          <div>
            <label className="label">Nome completo</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input className="input-field bg-gray-50" value={form.email} disabled />
            <p className="text-xs text-gray-400 mt-1">O e-mail não pode ser alterado.</p>
          </div>
          <div>
            <label className="label">Telefone / WhatsApp</label>
            <input
              className="input-field"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="(11) 99999-9999"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> : <><Check size={18} /> Salvar dados</>}
          </button>
        </form>
      </div>

      {/* Alterar senha */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Alterar Senha</h2>

        {msgPass.text && (
          <div className={`text-sm rounded-xl px-4 py-3 mb-4 ${msgPass.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {msgPass.text}
          </div>
        )}

        <form onSubmit={handleSavePass} className="space-y-4">
          <div>
            <label className="label">Senha atual</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={passwords.current}
                onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                className="input-field pr-12"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Nova senha</label>
            <input type={showPass ? "text" : "password"} value={passwords.new} onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))} className="input-field" placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label className="label">Confirmar nova senha</label>
            <input type={showPass ? "text" : "password"} value={passwords.confirm} onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} className="input-field" placeholder="Repita a nova senha" />
          </div>
          <button type="submit" disabled={loadingPass} className="btn-primary">
            {loadingPass ? <><Loader2 size={18} className="animate-spin" /> Alterando...</> : "Alterar senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
