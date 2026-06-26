"use client";

import { useState } from "react";
import { Star, CheckCircle2, Send } from "lucide-react";

interface Item {
  productId: string;
  productName: string;
}

const LABELS = ["", "Terrível", "Ruim", "Regular", "Bom", "Excelente!"];

export function AvaliarCompra({ orderId, items }: { orderId: string; items: Item[] }) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [hovered, setHovered] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(item: Item) {
    const rating = ratings[item.productId];
    if (!rating) return;

    setLoading((prev) => ({ ...prev, [item.productId]: true }));
    setErrors((prev) => ({ ...prev, [item.productId]: "" }));

    try {
      const res = await fetch("/api/avaliacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.productId,
          orderId,
          rating,
          comment: comments[item.productId] || null,
        }),
      });

      if (res.ok || res.status === 409) {
        setSubmitted((prev) => ({ ...prev, [item.productId]: true }));
      } else {
        const data = await res.json();
        setErrors((prev) => ({ ...prev, [item.productId]: data.error || "Erro ao enviar" }));
      }
    } catch {
      setErrors((prev) => ({ ...prev, [item.productId]: "Erro de conexão" }));
    } finally {
      setLoading((prev) => ({ ...prev, [item.productId]: false }));
    }
  }

  const allSubmitted = items.length > 0 && items.every((item) => submitted[item.productId]);

  return (
    <div className="mt-4 border border-amber-100 bg-amber-50 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-amber-100 flex items-center gap-2">
        <Star size={16} className="fill-amber-400 text-amber-400" />
        <p className="text-sm font-semibold text-amber-900">Avalie os produtos deste pedido</p>
      </div>

      {allSubmitted ? (
        <div className="px-4 py-5 text-center">
          <CheckCircle2 size={28} className="text-green-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-800">Obrigada pelas suas avaliações!</p>
          <p className="text-xs text-gray-500 mt-0.5">Suas opiniões nos ajudam muito.</p>
        </div>
      ) : (
        <div className="divide-y divide-amber-100">
          {items.map((item) => {
            const currentRating = ratings[item.productId] || 0;
            const currentHovered = hovered[item.productId] || 0;
            const active = currentHovered || currentRating;

            if (submitted[item.productId]) {
              return (
                <div key={item.productId} className="px-4 py-3 flex items-center gap-2 bg-green-50">
                  <CheckCircle2 size={15} className="text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-800 font-medium">{item.productName} — avaliado!</p>
                </div>
              );
            }

            return (
              <div key={item.productId} className="px-4 py-4">
                <p className="text-sm font-semibold text-gray-800 mb-2">{item.productName}</p>

                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setRatings((prev) => ({ ...prev, [item.productId]: star }))
                        }
                        onMouseEnter={() =>
                          setHovered((prev) => ({ ...prev, [item.productId]: star }))
                        }
                        onMouseLeave={() =>
                          setHovered((prev) => ({ ...prev, [item.productId]: 0 }))
                        }
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          size={26}
                          className={`transition-colors ${
                            star <= active
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-200 fill-gray-100"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {active > 0 && (
                    <span className="text-xs font-medium text-amber-700">{LABELS[active]}</span>
                  )}
                </div>

                {currentRating > 0 && (
                  <textarea
                    placeholder="Comentário (opcional)..."
                    value={comments[item.productId] || ""}
                    onChange={(e) =>
                      setComments((prev) => ({ ...prev, [item.productId]: e.target.value }))
                    }
                    className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-brand-600 mb-2"
                    rows={2}
                  />
                )}

                {errors[item.productId] && (
                  <p className="text-xs text-red-500 mb-2">{errors[item.productId]}</p>
                )}

                <button
                  onClick={() => handleSubmit(item)}
                  disabled={!currentRating || loading[item.productId]}
                  className="btn-primary text-xs py-1.5 px-4 gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={12} />
                  {loading[item.productId] ? "Enviando..." : "Enviar avaliação"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
