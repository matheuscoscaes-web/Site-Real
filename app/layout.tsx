import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
