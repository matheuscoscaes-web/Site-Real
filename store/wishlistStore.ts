"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
}

interface WishlistStore {
  items: WishlistItem[];
  toggle: (item: WishlistItem) => void;
  isLiked: (productId: string) => boolean;
  total: () => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (item) => {
        set((state) => {
          const exists = state.items.some((i) => i.productId === item.productId);
          return {
            items: exists
              ? state.items.filter((i) => i.productId !== item.productId)
              : [...state.items, item],
          };
        });
      },

      isLiked: (productId) => get().items.some((i) => i.productId === productId),

      total: () => get().items.length,
    }),
    { name: "hearts-wishlist" }
  )
);
