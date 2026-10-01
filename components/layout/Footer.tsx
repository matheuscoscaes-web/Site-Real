"use client";

import Link from "next/link";
import { Instagram, Mail, Phone, MapPin, Heart } from "lucide-react";
import { WhatsappLeadForm } from "@/components/layout/WhatsappLeadForm";
import type { ProductCategoryNode } from "@/lib/product-categories";

export function Footer({ categories }: { categories: ProductCategoryNode[] }) {
  const lojaLinks = [
    ...categories.flatMap((c) => [
      { label: c.name, href: `/produtos?categoria=${encodeURIComponent(c.name)}` },
      ...c.children.map((sub) => ({ label: sub.name, href: `/produtos?categoria=${encodeURIComponent(sub.name)}` })),
    ]),
    { label: "Novidades", href: "/produtos?novidades=true" },
    { label: "Sale", href: "/produtos?sale=true" },
  ];

  return (
    <footer className="bg-gray-950 text-gray-300">
      {/* Grupo VIP WhatsApp */}
      <div className="bg-brand-700 py-12 md:py-14">
        <div className="container-main grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] items-center gap-8 lg:gap-12">
          {/* Grupo VIP */}
          <div className="text-center lg:text-left min-w-0">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Entre no nosso Grupo VIP do WhatsApp
            </h3>
            <p className="text-brand-100 mb-6 text-sm">Promoções exclusivas, lançamentos em primeira mão e ofertas especiais só para membros VIP</p>
            <WhatsappLeadForm />
          </div>

          {/* Revendedor */}
          <div className="rounded-3xl bg-white/10 ring-1 ring-white/15 p-6 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-200 mb-2">Revenda</p>
            <p className="text-white font-semibold mb-1">Quer vender nossos produtos?</p>
            <p className="text-brand-100 text-sm mb-5">Fale com a gente e receba as condições para revendedores.</p>
            <a
              href="https://wa.me/5521974961669?text=Ol%C3%A1!%20Quero%20virar%20revendedor%20Hearts%20Couro."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center bg-white text-brand-700 font-bold px-6 py-3 rounded-full hover:bg-brand-50 active:scale-[0.97] transition-all text-sm whitespace-nowrap"
            >
              Quero virar revendedor
            </a>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container-main py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="mb-6 md:mb-0">
            <div className="mb-4">
              <span className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>
                Hearts Couro
              </span>
              <span className="block text-[9px] tracking-[0.35em] text-gray-500 uppercase">Bolsas &amp; Bolsa Tira-Colo</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Bolsas e acessórios em couro legítimo com sofisticação e durabilidade. Peças únicas para mulheres que valorizam qualidade.
            </p>
            <div className="flex gap-3">
              <a href="https://www.instagram.com/heartscouro" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-700 transition-colors" aria-label="Instagram">
                <Instagram size={16} />
              </a>
            </div>
          </div>

          {/* Loja + Ajuda + Contato sempre lado a lado */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-10 md:col-span-3">
            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-[0.2em]">Loja</h4>
              <ul className="space-y-2.5 text-sm">
                {lojaLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-brand-400 transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ajuda */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-[0.2em]">Ajuda</h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: "Minha Conta", href: "/conta" },
                  { label: "Meus Pedidos", href: "/conta/pedidos" },
                  { label: "Política de Trocas", href: "/politicas" },
                  { label: "Política de Privacidade", href: "/privacidade" },
                  { label: "Como Comprar", href: "/como-comprar" },
                  { label: "Frete e Prazo", href: "/frete" },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-brand-400 transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contato */}
            <div className="col-span-2 sm:col-span-1">
              <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-[0.2em]">Contato</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Phone size={13} className="text-brand-400 mt-0.5 flex-shrink-0" />
                  <a
                    href="https://wa.me/5521974961669"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-words hover:text-brand-400 transition-colors"
                  >
                    (21) 97496-1669<br /><span className="text-xs text-gray-500">WhatsApp</span>
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <Mail size={13} className="text-brand-400 mt-0.5 flex-shrink-0" />
                  <a
                    href="mailto:contato@heartscouro.com.br"
                    className="break-all hover:text-brand-400 transition-colors"
                  >
                    contato@heartscouro.com.br
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin size={13} className="text-brand-400 mt-0.5 flex-shrink-0" />
                  <a
                    href="https://www.google.com/maps/search/Rua+Des.+Omar+Dutra,+60,+Rio+de+Janeiro,+RJ"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-words hover:text-brand-400 transition-colors"
                  >
                    Rua Des. Omar Dutra, 60<br />Rio de Janeiro, RJ
                  </a>
                </li>
              </ul>
              <div className="mt-5 p-3 bg-gray-900 rounded-xl">
                <p className="text-xs text-gray-400 mb-1 font-medium">Atendimento</p>
                <p className="text-xs text-gray-500">Seg–Sex: 9h às 18h</p>
                <p className="text-xs text-gray-500">Sáb: 9h às 16h</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-800">
        <div className="container-main py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600 text-center md:text-left">
          <p>© 2026 Hearts Couro. Todos os direitos reservados.<br className="sm:hidden" /> CNPJ: 18.921.382/0001-51</p>
          <p className="flex items-center gap-1">
            Feito com <Heart size={12} className="text-brand-600" /> no Rio de Janeiro, Brasil
          </p>
          <div className="flex gap-4">
            <span className="bg-gray-800 px-2 py-1 rounded text-gray-400">PIX</span>
            <span className="bg-gray-800 px-2 py-1 rounded text-gray-400">Visa</span>
            <span className="bg-gray-800 px-2 py-1 rounded text-gray-400">Master</span>
            <span className="bg-gray-800 px-2 py-1 rounded text-gray-400">Boleto</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
