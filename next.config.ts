import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  images: {
    // As fotos já saem em WebP redimensionado do upload (app/api/upload/route.ts);
    // reprocessar de novo no servidor a cada visita (sharp, sob demanda) só soma
    // picos de memória numa instância de 512MB sem ganho real de tamanho.
    unoptimized: true,
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
