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
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-6">
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 text-lg">Como você avalia sua compra?</h3>
        <p className="text-sm text-gray-500 mt-1">
          Sua opinião ajuda outras clientes a escolherem melhor.
        </p>
      </div>

      {allSubmitted ? (
        <div className="p-8 text-center">
          <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
          <p className="font-semibold text-gray-900">Obrigada pelas suas avaliações!</p>
          <p className="text-sm text-gray-500 mt-1">Suas opiniões nos ajudam muito.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((item) => {
            const currentRating = ratings[item.productId] || 0;
            const currentHovered = hovered[item.productId] || 0;
            const active = currentHovered || currentRating;

            if (submitted[item.productId]) {
              return (
                <div key={item.productId} className="p-5 flex items-center gap-3 bg-green-50">
                  <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">{item.productName}</p>
                    <p className="text-xs text-green-600">Avaliação enviada!</p>
                  </div>
                </div>
              );
            }

            return (
              <div key={item.productId} className="p-5">
                <p className="text-sm font-semibold text-gray-800 mb-3">{item.productName}</p>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-1">
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
                          size={30}
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
                    <span className="text-sm font-medium text-amber-600">{LABELS[active]}</span>
                  )}
                </div>

                {currentRating > 0 && (
                  <textarea
                    placeholder="Deixe um comentário (opcional)..."
                    value={comments[item.productId] || ""}
                    onChange={(e) =>
                      setComments((prev) => ({ ...prev, [item.productId]: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-brand-600 mb-3"
                    rows={3}
                  />
                )}

                {errors[item.productId] && (
                  <p className="text-xs text-red-500 mb-2">{errors[item.productId]}</p>
                )}

                <button
                  onClick={() => handleSubmit(item)}
                  disabled={!currentRating || loading[item.productId]}
                  className="btn-primary text-sm py-2 px-5 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={14} />
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
