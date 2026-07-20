"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, Loader2, Check } from "lucide-react";

type Slot = { position: number; url: string };

const LABELS: Record<number, string> = {
  1: "Imagem 1 (grande, canto superior esquerdo)",
  2: "Imagem 2 (pequena, canto inferior esquerdo)",
  3: "Imagem 3 (pequena, canto superior direito)",
  4: "Imagem 4 (grande, canto inferior direito)",
};

export function HeroImagesForm({ slots }: { slots: Slot[] }) {
  const [urls, setUrls] = useState<Record<number, string>>(
    Object.fromEntries(slots.map((s) => [s.position, s.url]))
  );
  const [savingPos, setSavingPos] = useState<number | null>(null);
  const [savedPos, setSavedPos] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function saveUrl(position: number, url: string) {
    setSavingPos(position);
    setError("");
    setSavedPos(null);
    try {
      const res = await fetch("/api/admin/hero-images", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position, url }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Erro ao salvar imagem");
        return;
      }
      setSavedPos(position);
      setTimeout(() => setSavedPos((p) => (p === position ? null : p)), 2000);
    } finally {
      setSavingPos(null);
    }
  }

  async function handleFileChange(position: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setSavingPos(position);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro no upload");
        return;
      }
      setUrls((p) => ({ ...p, [position]: data.url }));
      await saveUrl(position, data.url);
    } finally {
      setSavingPos((p) => (p === position ? null : p));
    }
  }

  return (
    <div>
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {slots.map((slot) => (
          <div key={slot.position} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">{LABELS[slot.position]}</p>
            <label className="group relative block rounded-xl overflow-hidden h-48 bg-gray-100 cursor-pointer ring-1 ring-gray-200">
              <Image
                src={urls[slot.position]}
                alt={LABELS[slot.position]}
                fill
                sizes="300px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                {savingPos === slot.position ? (
                  <Loader2 size={22} className="text-white animate-spin" />
                ) : savedPos === slot.position ? (
                  <span className="flex items-center gap-1.5 text-white text-sm font-medium bg-green-600/90 px-3 py-1.5 rounded-full">
                    <Check size={14} /> Salvo
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload size={16} /> Trocar imagem
                  </span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(slot.position, e)}
                disabled={savingPos !== null}
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
