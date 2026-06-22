import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

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
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
