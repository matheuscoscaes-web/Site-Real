"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import {
  ShoppingBag, Search, User, Menu, X, Heart, ChevronDown, ChevronRight, LogOut, Package, Settings, ArrowRight,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useMounted } from "@/lib/useMounted";
import type { ProductCategoryNode } from "@/lib/product-categories";

type NavLink = { label: string; href: string; className?: string; children?: { label: string; href: string }[] };

// Fecha um dropdown ao clicar/tocar fora dele ou apertar Esc
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

export function Header({ categories }: { categories: ProductCategoryNode[] }) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const navLinks: NavLink[] = [
    ...categories.map((c) => ({
      label: c.name,
      href: `/produtos?categoria=${encodeURIComponent(c.name)}`,
      children: c.children.length > 0
        ? c.children.map((sub) => ({ label: sub.name, href: `/produtos?categoria=${encodeURIComponent(sub.name)}` }))
        : undefined,
    })),
    { label: "Novidades", href: "/produtos?novidades=true" },
    { label: "Sale", href: "/produtos?sale=true", className: "text-brand-600 font-bold" },
  ];
  const totalItems = useCartStore((s) => s.totalItems);
  const wishlist = useWishlistStore((s) => s.items);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const userRef = useDismiss(userMenuOpen, () => setUserMenuOpen(false));
  const wishlistRef = useDismiss(wishlistOpen, () => setWishlistOpen(false));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Trocou de pagina: fecha tudo que estiver aberto
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setUserMenuOpen(false);
    setWishlistOpen(false);
  }, [pathname]);

  // Clicou num link dentro de menu/dropdown: fecha (cobre troca so de ?query,
  // que nao muda o pathname)
  const closeOnLink = (close: () => void) => (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) close();
  };

  // Menu lateral / busca abertos: trava a rolagem do fundo e fecha com Esc
  useEffect(() => {
    if (!mobileOpen && !searchOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen, searchOpen]);

  const mounted = useMounted();
  const cartCount = mounted ? totalItems() : 0;
  const wishlistCount = mounted ? wishlist.length : 0;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    router.push(`/produtos?busca=${encodeURIComponent(q)}`);
  }

  const iconBtn = "relative w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:text-brand-700 hover:bg-brand-50 transition-colors";
  const counter = "absolute top-0.5 right-0.5 bg-brand-700 text-white text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-white";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-[background-color,box-shadow,border-color] duration-300 border-b",
          scrolled
            ? "bg-white/90 backdrop-blur-md shadow-[0_1px_20px_-8px_rgba(0,0,0,0.15)] border-transparent"
            : "bg-white border-gray-100"
        )}
      >
        <div className="container-main">
          <div className="flex items-center justify-between h-16 md:h-20 gap-4">
            {/* Menu mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              className={cn(iconBtn, "xl:hidden -ml-2")}
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-3 absolute left-1/2 -translate-x-1/2 xl:static xl:translate-x-0">
              <Image
                src="/imagens/logo.png"
                alt="Hearts Couro"
                width={64}
                height={62}
                priority
                className="h-10 w-auto md:h-14 object-contain"
              />
              <span className="hidden 2xl:block text-[9px] tracking-[0.35em] text-gray-400 uppercase leading-relaxed">
                Bolsas &amp;<br />Bolsa Tira-Colo
              </span>
            </Link>

            {/* Nav Desktop */}
            <nav className="hidden xl:flex items-center gap-5 min-w-0">
              {navLinks.map((link) => (
                <div key={link.href} className="relative group">
                  <Link
                    href={link.href}
                    className={cn(
                      "py-2 text-[13.5px] font-medium whitespace-nowrap text-gray-700 hover:text-brand-700 transition-colors relative flex items-center gap-1",
                      link.className
                    )}
                  >
                    {link.label}
                    {link.children && <ChevronDown size={13} className="transition-transform duration-200 group-hover:rotate-180" />}
                    <span className="absolute bottom-0 left-0 h-px w-full bg-brand-600 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  </Link>

                  {link.children && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50">
                      <div className="w-56 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 p-2">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-4 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-brand-50 hover:text-brand-700 transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Ações */}
            <div className="flex items-center gap-0.5 md:gap-1 -mr-2">
              <button onClick={() => setSearchOpen(true)} className={iconBtn} aria-label="Buscar">
                <Search size={20} />
              </button>

              {/* Favoritos */}
              <div ref={wishlistRef} className="relative hidden md:block" onClick={closeOnLink(() => setWishlistOpen(false))}>
                <button
                  onClick={() => { setWishlistOpen((v) => !v); setUserMenuOpen(false); }}
                  className={iconBtn}
                  aria-label="Favoritos"
                  aria-expanded={wishlistOpen}
                >
                  <Heart size={20} className={wishlistCount > 0 ? "fill-brand-700 text-brand-700" : ""} />
                  {wishlistCount > 0 && (
                    <span className={counter}>{wishlistCount > 9 ? "9+" : wishlistCount}</span>
                  )}
                </button>

                {wishlistOpen && (
                  <div className="animate-fade-in absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 py-3 z-50">
                    <p className="px-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">Favoritos</p>
                    {wishlist.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-gray-400 text-center">Nenhum favorito ainda.</p>
                    ) : (
                      <div className="max-h-80 overflow-y-auto overscroll-contain divide-y divide-gray-50">
                        {wishlist.map((item) => (
                          <Link
                            key={item.productId}
                            href={`/produtos/${item.slug}`}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-brand-50 transition-colors"
                          >
                            <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                              <p className="text-xs text-brand-700 font-bold">{formatCurrency(item.price)}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Usuário (desktop; no mobile fica dentro do menu lateral) */}
              <div ref={userRef} className="relative hidden xl:block" onClick={closeOnLink(() => setUserMenuOpen(false))}>
                <button
                  onClick={() => { setUserMenuOpen((v) => !v); setWishlistOpen(false); }}
                  className={iconBtn}
                  aria-label="Minha conta"
                  aria-expanded={userMenuOpen}
                >
                  <User size={20} />
                </button>

                {userMenuOpen && (
                  <div className="animate-fade-in absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 p-2 z-50">
                    {session ? (
                      <>
                        <div className="px-3 py-3 mb-1 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900 truncate">{session.user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                        </div>
                        <Link href="/conta/pedidos" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-brand-50 hover:text-brand-700 transition-colors">
                          <Package size={16} /> Meus Pedidos
                        </Link>
                        <Link href="/conta" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-brand-50 hover:text-brand-700 transition-colors">
                          <User size={16} /> Minha Conta
                        </Link>
                        {session.user.role === "ADMIN" && (
                          <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 text-sm text-brand-700 font-semibold rounded-xl hover:bg-brand-50 transition-colors">
                            <Settings size={16} /> Painel Admin
                          </Link>
                        )}
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 rounded-xl hover:bg-red-50 transition-colors w-full"
                          >
                            <LogOut size={16} /> Sair
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-2 space-y-2">
                        <Link href="/login" className="btn-primary w-full py-2.5 text-sm">Entrar</Link>
                        <Link href="/cadastro" className="btn-outline w-full py-2 text-sm">Criar conta</Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Carrinho */}
              <Link href="/carrinho" className={iconBtn} aria-label="Carrinho">
                <ShoppingBag size={20} />
                {cartCount > 0 && <span className={counter}>{cartCount > 9 ? "9+" : cartCount}</span>}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Busca (sobreposta) */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="animate-fade-in absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div className="animate-fade-in relative bg-white shadow-xl">
            <form onSubmit={submitSearch} className="container-main flex items-center gap-3 h-16 md:h-20">
              <Search className="text-gray-400 flex-shrink-0" size={20} />
              <input
                autoFocus
                type="search"
                enterKeyHint="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="O que você procura?"
                className="flex-1 min-w-0 h-full bg-transparent text-base md:text-lg text-gray-900 placeholder-gray-400 focus:outline-none"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className={iconBtn} aria-label="Fechar busca">
                <X size={20} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Menu lateral (mobile) */}
      <div
        className={cn("xl:hidden fixed inset-0 z-[60]", mobileOpen ? "visible" : "invisible pointer-events-none")}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn("absolute inset-0 bg-black/40 transition-opacity duration-300", mobileOpen ? "opacity-100" : "opacity-0")}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          onClick={closeOnLink(() => setMobileOpen(false))}
          className={cn(
            "absolute inset-y-0 left-0 w-[86%] max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100 flex-shrink-0">
            <Image src="/imagens/logo.png" alt="Hearts Couro" width={64} height={62} className="h-10 w-auto object-contain" />
            <button onClick={() => setMobileOpen(false)} className={cn(iconBtn, "-mr-2")} aria-label="Fechar menu">
              <X size={22} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
            <Link href="/produtos" className="flex items-center justify-between px-3 py-3.5 text-[15px] font-semibold text-gray-900 rounded-xl active:bg-brand-50">
              Ver toda a coleção <ArrowRight size={18} className="text-brand-700" />
            </Link>
            {navLinks.map((link) => (
              <div key={link.href} className="border-t border-gray-50">
                <div className="flex items-center">
                  <Link
                    href={link.href}
                    className={cn("flex-1 px-3 py-3.5 text-[15px] font-medium text-gray-800 rounded-xl active:bg-brand-50", link.className)}
                  >
                    {link.label}
                  </Link>
                  {link.children && (
                    <button
                      onClick={() => setExpanded(expanded === link.href ? null : link.href)}
                      className={iconBtn}
                      aria-label={`Ver seções de ${link.label}`}
                      aria-expanded={expanded === link.href}
                    >
                      <ChevronDown size={18} className={cn("transition-transform duration-200", expanded === link.href && "rotate-180")} />
                    </button>
                  )}
                </div>
                {link.children && (
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-300",
                      expanded === link.href ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="pl-3 pb-2">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="flex items-center justify-between px-3 py-3 text-sm text-gray-600 rounded-xl active:bg-brand-50"
                          >
                            {child.label}
                            <ChevronRight size={16} className="text-gray-300" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="border-t border-gray-100 p-4 flex-shrink-0 space-y-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {session ? (
              <>
                <div className="flex items-center gap-3 px-1 pb-2">
                  <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center">
                    {session.user.name?.[0]?.toUpperCase() ?? <User size={18} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{session.user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/conta/pedidos" className="flex items-center justify-center gap-2 py-3 text-sm font-medium bg-gray-50 rounded-xl active:bg-brand-50">
                    <Package size={16} /> Pedidos
                  </Link>
                  <Link href="/conta" className="flex items-center justify-center gap-2 py-3 text-sm font-medium bg-gray-50 rounded-xl active:bg-brand-50">
                    <User size={16} /> Conta
                  </Link>
                </div>
                {session.user.role === "ADMIN" && (
                  <Link href="/admin" className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-brand-700 bg-brand-50 rounded-xl">
                    <Settings size={16} /> Painel Admin
                  </Link>
                )}
                <button onClick={() => signOut({ callbackUrl: "/" })} className="w-full py-2.5 text-sm font-medium text-red-600">
                  Sair
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" className="btn-primary py-3 text-sm">Entrar</Link>
                <Link href="/cadastro" className="btn-outline py-2.5 text-sm">Criar conta</Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
