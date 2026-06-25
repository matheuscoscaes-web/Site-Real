"use client";

import { useState } from "react";

export function WhatsappLeadForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  function formatPhone(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const res = await fetch("/api/whatsapp-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    if (res.ok) {
      setStatus("success");
      setName("");
      setPhone("");
    } else {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="max-w-md mx-auto text-center bg-white/10 rounded-2xl px-6 py-5">
        <p className="text-2xl mb-2">🎉</p>
        <p className="font-bold text-white text-lg">Você entrou na lista!</p>
        <p className="text-brand-100 text-sm mt-1">Entraremos em contato pelo WhatsApp em breve para te adicionar ao grupo.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
      <input
        type="text"
        placeholder="Seu nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="flex-1 px-5 py-3 rounded-full text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white"
      />
      <input
        type="tel"
        placeholder="WhatsApp (DDD + número)"
        value={phone}
        onChange={(e) => setPhone(formatPhone(e.target.value))}
        required
        className="flex-1 px-5 py-3 rounded-full text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-white text-brand-700 font-bold px-6 py-3 rounded-full hover:bg-brand-50 transition-colors text-sm whitespace-nowrap disabled:opacity-60"
      >
        {status === "loading" ? "Enviando..." : "Quero entrar!"}
      </button>
      {status === "error" && (
        <p className="text-red-200 text-xs text-center w-full">Algo deu errado. Tente novamente.</p>
      )}
    </form>
  );
}
