"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (form.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erro ao criar conta. Tente novamente.");
      setLoading(false);
      return;
    }

    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    router.push("/conta");
    router.refresh();
  }

  const passwordReqs = [
    { ok: form.password.length >= 6, label: "Mínimo 6 caracteres" },
    { ok: /[A-Z]/.test(form.password), label: "Letra maiúscula" },
    { ok: /[0-9]/.test(form.password), label: "Um número" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-cream-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-3xl font-bold text-brand-700 tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>
              Hearts Couro
            </span>
            <span className="block text-[9px] tracking-[0.35em] text-gray-400 uppercase">Bolsas &amp; Acessórios</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
            Criar conta
          </h1>
          <p className="text-sm text-gray-500 mb-6">Rápido, grátis e sem complicação</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nome completo *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="input-field"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label className="label">E-mail *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="input-field"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="label">Telefone / WhatsApp</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="input-field"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="label">Senha *</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  className="input-field pr-12"
                  placeholder="Mínimo 6 caracteres"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 space-y-1">
                  {passwordReqs.map((req) => (
                    <div key={req.label} className={`flex items-center gap-2 text-xs ${req.ok ? "text-green-600" : "text-gray-400"}`}>
                      <Check size={12} className={req.ok ? "text-green-600" : "text-gray-300"} /> {req.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="label">Confirmar senha *</label>
              <input
                type={showPass ? "text" : "password"}
                required
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                className={`input-field ${form.confirmPassword && form.confirmPassword !== form.password ? "border-red-300" : ""}`}
                placeholder="Repita a senha"
              />
              {form.confirmPassword && form.confirmPassword !== form.password && (
                <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
              )}
            </div>

            <p className="text-xs text-gray-400">
              Ao criar sua conta, você concorda com nossa{" "}
              <Link href="/privacidade" className="text-brand-600 underline">Política de Privacidade</Link>.
            </p>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Criando conta...</> : "Criar conta grátis"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Já tem conta?{" "}
            <Link href="/login" className="text-brand-700 font-semibold hover:underline">
              Entrar
            </Link>
          </p>
        </div>

        <Link href="/" className="block text-center text-sm text-gray-400 hover:text-gray-600 mt-6">
          ← Voltar para a loja
        </Link>
      </div>
    </div>
  );
}
