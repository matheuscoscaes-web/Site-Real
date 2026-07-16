"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const CONVERSION_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL;

export function ConversionTracker({ orderId, value }: { orderId: string; value: number }) {
  useEffect(() => {
    if (!GOOGLE_ADS_ID || !CONVERSION_LABEL || !window.gtag) return;

    const alreadySent = sessionStorage.getItem(`ads_conversion_${orderId}`);
    if (alreadySent) return;

    window.gtag("event", "conversion", {
      send_to: `${GOOGLE_ADS_ID}/${CONVERSION_LABEL}`,
      value,
      currency: "BRL",
      transaction_id: orderId,
    });

    sessionStorage.setItem(`ads_conversion_${orderId}`, "1");
  }, [orderId, value]);

  return null;
}
