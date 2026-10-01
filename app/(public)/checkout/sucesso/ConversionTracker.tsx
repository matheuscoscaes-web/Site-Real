"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const CONVERSION_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL;

export function ConversionTracker({ orderId, value }: { orderId: string; value: number }) {
  useEffect(() => {
    if (!GOOGLE_ADS_ID || !CONVERSION_LABEL) return;

    // O gtag.js carrega tarde (lazyOnload, app/layout.tsx). Se ainda nao chegou,
    // enfileira no dataLayer — o gtag.js processa a fila quando carregar.
    if (!window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer!.push(arguments);
      };
      window.gtag("js", new Date());
      window.gtag("config", GOOGLE_ADS_ID);
    }

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
