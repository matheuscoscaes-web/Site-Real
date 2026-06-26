"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string };
}

interface ReviewData {
  reviews: Review[];
  count: number;
  average: number;
  hasEnough: boolean;
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
        />
      ))}
    </div>
  );
}

export function AvaliacoesSection({ productId }: { productId: string }) {
  const [data, setData] = useState<ReviewData | null>(null);

  useEffect(() => {
    fetch(`/api/avaliacoes/${productId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [productId]);

  if (!data || !data.hasEnough) return null;

  const { reviews, count, average } = data;
  const fullStars = Math.round(average);

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <section className="mt-16 border-t border-gray-100 pt-12">
      <h2
        className="text-2xl font-bold text-gray-900 mb-8"
        style={{ fontFamily: "Playfair Display, serif" }}
      >
        Avaliações dos clientes
      </h2>

      {/* Resumo */}
      <div className="flex flex-col sm:flex-row gap-8 mb-10 p-6 bg-gray-50 rounded-2xl">
        <div className="text-center sm:text-left">
          <p className="text-6xl font-bold text-gray-900">{average.toFixed(1)}</p>
          <StarRow rating={fullStars} size={20} />
          <p className="text-sm text-gray-500 mt-1">{count} avaliações</p>
        </div>

        <div className="flex-1 space-y-2">
          {distribution.map(({ star, count: c }) => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-3">{star}</span>
              <Star size={12} className="fill-amber-400 text-amber-400 flex-shrink-0" />
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: count > 0 ? `${(c / count) * 100}%` : "0%" }}
                />
              </div>
              <span className="text-xs text-gray-400 w-4 text-right">{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de avaliações */}
      <div className="space-y-5">
        {reviews.map((review) => (
          <div key={review.id} className="border border-gray-100 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{review.user.name}</p>
                <StarRow rating={review.rating} size={13} />
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {formatDate(review.createdAt)}
              </span>
            </div>
            {review.comment && (
              <p className="text-sm text-gray-600 leading-relaxed mt-2">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function AvaliacoesBadge({ productId }: { productId: string }) {
  const [data, setData] = useState<ReviewData | null>(null);

  useEffect(() => {
    fetch(`/api/avaliacoes/${productId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [productId]);

  if (!data || !data.hasEnough) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={14}
            className={s <= Math.round(data.average) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
          />
        ))}
      </div>
      <span className="text-sm text-gray-500">
        {data.average.toFixed(1)} ({data.count} avaliações)
      </span>
    </div>
  );
}
