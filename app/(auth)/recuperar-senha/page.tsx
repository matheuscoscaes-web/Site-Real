"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, CheckCircle } from "lucide-react";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simulação — para integração real, chamar API de envio de e-mail
    await new Promise((r) => setTimeout(r, 1500));
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-cream-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-3xl font-bold text-brand-700 tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>
              Hearts Couro
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">E-mail enviado!</h2>
              <p className="text-sm text-gray-500 mb-6">
                Se existe uma conta com <strong>{email}</strong>, você receberá as instruções em breve.
              </p>
              <Link href="/login" className="btn-primary w-full">
                Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                <Mail size={22} className="text-brand-700" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
                Recuperar senha
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Digite seu e-mail e enviaremos instruções para redefinir sua senha.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">E-mail cadastrado</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="seu@email.com"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <><Loader2 size={18} className="animate-spin" /> Enviando...</> : "Enviar instruções"}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Lembrou?{" "}
                <Link href="/login" className="text-brand-700 font-semibold hover:underline">
                  Voltar para o login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
