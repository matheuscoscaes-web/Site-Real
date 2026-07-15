import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Hearts Couro | Bolsas e Acessórios em Couro",
    template: "%s | Hearts Couro",
  },
  description:
    "Bolsas, vestuário feminino e acessórios em couro legítimo. Qualidade premium com entrega para todo o Brasil.",
  keywords: ["bolsas de couro", "couro legítimo", "acessórios femininos", "moda feminina", "loja online"],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://heartscouro.com.br",
    siteName: "Hearts Couro",
    images: [
      {
        url: "https://axulxikhcpxvvngeskgb.supabase.co/storage/v1/object/public/produtos/1784123962938-madg9g3h1yr.webp",
        width: 1200,
        height: 1200,
        alt: "Bolsa Júlia | Hearts Couro",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://axulxikhcpxvvngeskgb.supabase.co/storage/v1/object/public/produtos/1784123962938-madg9g3h1yr.webp"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        {GOOGLE_ADS_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-ads-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GOOGLE_ADS_ID}');
              `}
            </Script>
          </>
        )}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
