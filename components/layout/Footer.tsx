"use client";

import Link from "next/link";
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300">
      {/* Newsletter */}
      <div className="bg-brand-700 py-12">
        <div className="container-main text-center">
          <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
            Receba novidades e ofertas exclusivas
          </h3>
          <p className="text-brand-100 mb-6 text-sm">Cadastre seu e-mail e ganhe 40% de desconto + frete grátis na primeira compra</p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Seu melhor e-mail"
              className="flex-1 px-5 py-3 rounded-full text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button type="submit" className="bg-white text-brand-700 font-bold px-8 py-3 rounded-full hover:bg-brand-50 transition-colors text-sm whitespace-nowrap">
              Quero desconto!
            </button>
          </form>
        </div>
      </div>

      {/* Main footer */}
      <div className="container-main py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
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
              <a href="#" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-700 transition-colors" aria-label="Facebook">
                <Facebook size={16} />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-700 transition-colors" aria-label="Youtube">
                <Youtube size={16} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Loja</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Bolsas", href: "/produtos?categoria=Bolsas" },
                { label: "Mochilas Feminino", href: "/produtos?categoria=Mochilas" },
                { label: "Bolsa Tira-Colo", href: "/produtos?categoria=Bolsa Tira-Colo" },
                { label: "Novidades", href: "/produtos?novidades=true" },
                { label: "Sale", href: "/produtos?sale=true" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-brand-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ajuda */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Ajuda</h4>
            <ul className="space-y-2 text-sm">
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
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contato</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Phone size={15} className="text-brand-400 mt-0.5 flex-shrink-0" />
                <span>(21) 96666-8724<br /><span className="text-xs text-gray-500">WhatsApp disponível</span></span>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={15} className="text-brand-400 mt-0.5 flex-shrink-0" />
                <span>contato@heartscouro.com.br</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-brand-400 mt-0.5 flex-shrink-0" />
                <span>Rua Desembargador Omar Dutra, 60<br />Rio de Janeiro, RJ</span>
              </li>
            </ul>

            <div className="mt-5 p-3 bg-gray-900 rounded-xl">
              <p className="text-xs text-gray-400 mb-1 font-medium">Atendimento</p>
              <p className="text-xs text-gray-500">Seg–Sex: 9h às 18h</p>
              <p className="text-xs text-gray-500">Sáb: 9h às 13h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-800">
        <div className="container-main py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p>© 2026 Hearts Couro. Todos os direitos reservados. CNPJ: 18.921.382/0001-51</p>
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
