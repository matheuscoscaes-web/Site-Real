"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useCartStore } from "@/store/cartStore";
import {
  ShoppingBag, Search, User, Menu, X, Heart, ChevronDown, LogOut, Package, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Bolsas", href: "/produtos?categoria=Bolsas" },
  { label: "Vestuário", href: "/produtos?categoria=Vestuário" },
  { label: "Acessórios", href: "/produtos?categoria=Acessórios" },
  { label: "Novidades", href: "/produtos?novidades=true" },
  { label: "Sale", href: "/produtos?sale=true", className: "text-brand-600 font-bold" },
];

export function Header() {
  const { data: session } = useSession();
  const totalItems = useCartStore((s) => s.totalItems);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cartCount = totalItems();

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-white shadow-md" : "bg-white/95 backdrop-blur-sm"
      )}
    >

      <div className="container-main">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="flex flex-col items-start">
              <span className="text-xl md:text-2xl font-bold text-brand-700 leading-none tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>
                Hearts Couro
              </span>
              <span className="text-[9px] tracking-[0.35em] text-gray-400 uppercase">Bolsas &amp; Acessórios</span>
            </div>
          </Link>

          {/* Nav Desktop */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium text-gray-700 hover:text-brand-700 transition-colors relative group",
                  link.className
                )}
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-600 group-hover:w-full transition-all duration-200" />
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Busca */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-gray-600 hover:text-brand-700 transition-colors"
              aria-label="Buscar"
            >
              <Search size={20} />
            </button>

            {/* Favoritos */}
            <button className="p-2 text-gray-600 hover:text-brand-700 transition-colors hidden md:flex" aria-label="Favoritos">
              <Heart size={20} />
            </button>

            {/* Usuário */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="p-2 text-gray-600 hover:text-brand-700 transition-colors flex items-center gap-1"
                aria-label="Minha conta"
              >
                <User size={20} />
                {session && <ChevronDown size={14} />}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                  {session ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{session.user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                      </div>
                      <Link href="/conta" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <Package size={16} /> Meus Pedidos
                      </Link>
                      <Link href="/conta" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <User size={16} /> Minha Conta
                      </Link>
                      {session.user.role === "ADMIN" && (
                        <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-700 font-semibold hover:bg-brand-50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                          <Settings size={16} /> Painel Admin
                        </Link>
                      )}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={() => { signOut({ callbackUrl: "/" }); setUserMenuOpen(false); }}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                        >
                          <LogOut size={16} /> Sair
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 font-medium transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <User size={16} /> Entrar
                      </Link>
                      <Link href="/cadastro" className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-700 font-semibold hover:bg-brand-50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                        Criar conta
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Carrinho */}
            <Link href="/carrinho" className="relative p-2 text-gray-600 hover:text-brand-700 transition-colors" aria-label="Carrinho">
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-700 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* Menu mobile */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-brand-700 transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="py-3 border-t border-gray-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  window.location.href = `/produtos?busca=${encodeURIComponent(searchQuery)}`;
                }
              }}
              className="relative"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produtos, categorias..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 text-sm"
              />
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <nav className="container-main py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn("block px-4 py-3 text-sm font-medium rounded-xl hover:bg-brand-50 hover:text-brand-700 transition-colors", link.className)}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-gray-100 mt-4 space-y-1">
              {session ? (
                <>
                  <Link href="/conta" className="block px-4 py-3 text-sm font-medium rounded-xl hover:bg-brand-50 hover:text-brand-700 transition-colors" onClick={() => setMobileOpen(false)}>
                    Minha Conta
                  </Link>
                  {session.user.role === "ADMIN" && (
                    <Link href="/admin" className="block px-4 py-3 text-sm font-semibold text-brand-700 rounded-xl hover:bg-brand-50 transition-colors" onClick={() => setMobileOpen(false)}>
                      Painel Admin
                    </Link>
                  )}
                  <button onClick={() => signOut({ callbackUrl: "/" })} className="block w-full text-left px-4 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors">
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block px-4 py-3 text-sm font-medium rounded-xl hover:bg-brand-50 hover:text-brand-700 transition-colors" onClick={() => setMobileOpen(false)}>
                    Entrar
                  </Link>
                  <Link href="/cadastro" className="block px-4 py-3 text-sm font-semibold text-brand-700 rounded-xl hover:bg-brand-50 transition-colors" onClick={() => setMobileOpen(false)}>
                    Criar conta
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
