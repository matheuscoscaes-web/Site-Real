import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  images: {
    // Nada de sharp sob demanda no servidor (picos de memória numa instância de
    // 512MB). O loader custom pede a foto já redimensionada ao Supabase, que
    // processa do lado dele, então o celular baixa só a largura que vai mostrar.
    loader: "custom",
    loaderFile: "./lib/imageLoader.ts",
    deviceSizes: [640, 828, 1080, 1200],
    imageSizes: [96, 256, 384],
    formats: ["image/webp"],
    minimumCacheTTL: 2592000,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "axulxikhcpxvvngeskgb.supabase.co" },
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "ibb.co" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  sourcemaps: { disable: true },
  telemetry: false,
});
