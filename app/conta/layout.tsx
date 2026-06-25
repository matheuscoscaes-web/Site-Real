import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { User, Package, MapPin, Settings, ChevronRight, Network } from "lucide-react";

const baseNavItems = [
  { href: "/conta", label: "Minha Conta", icon: User, exact: true },
  { href: "/conta/pedidos", label: "Meus Pedidos", icon: Package },
  { href: "/conta/enderecos", label: "Endereços", icon: MapPin },
  { href: "/conta/dados", label: "Dados Pessoais", icon: Settings },
];

export default async function ContaLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?redirect=/conta");

  const showRede = session.user.role === "VENDOR" || session.user.role === "ADMIN" || session.user.role === "RESELLER";
  const navItems = showRede
    ? [...baseNavItems, { href: "/conta/rede", label: "Minha Rede", icon: Network, exact: false }]
    : baseNavItems;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-[104px] bg-gray-50">
        <div className="container-main py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: "Playfair Display, serif" }}>
            Olá, {session.user.name.split(" ")[0]} 👋
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between px-5 py-4 text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors border-b border-gray-100 last:border-0 group"
                  >
                    <span className="flex items-center gap-3">
                      <item.icon size={18} className="text-gray-400 group-hover:text-brand-600" />
                      {item.label}
                    </span>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-400" />
                  </Link>
                ))}
              </nav>
            </aside>

            {/* Content */}
            <div className="lg:col-span-3">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
