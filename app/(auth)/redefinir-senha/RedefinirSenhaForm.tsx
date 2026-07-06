"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Check, CheckCircle } from "lucide-react";

export function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const passwordReqs = [
    { ok: password.length >= 6, label: "Mínimo 6 caracteres" },
    { ok: /[A-Z]/.test(password), label: "Letra maiúscula" },
    { ok: /[0-9]/.test(password), label: "Um número" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Link inválido. Solicite a recuperação de senha novamente.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/redefinir-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao redefinir senha.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Erro ao redefinir senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
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
          {done ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Senha redefinida!</h2>
              <p className="text-sm text-gray-500 mb-6">Redirecionando para o login...</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
                Definir nova senha
              </h1>
              <p className="text-sm text-gray-500 mb-6">Escolha uma nova senha para sua conta</p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nova senha *</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pr-12"
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {password && (
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
                  <label className="label">Confirmar nova senha *</label>
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`input-field ${confirmPassword && confirmPassword !== password ? "border-red-300" : ""}`}
                    placeholder="Repita a senha"
                  />
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
                  )}
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
                  {loading ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> : "Redefinir senha"}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link href="/login" className="text-brand-700 font-semibold hover:underline">
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
