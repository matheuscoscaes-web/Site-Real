import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsappFloatButton } from "@/components/layout/WhatsappFloatButton";
import { ActiveCouponBar } from "@/components/layout/ActiveCoupon";
import { BlackBar, BlackModeProvider } from "@/components/layout/BlackMode";
import { getProductCategoryTree } from "@/lib/product-categories";
import { isBlackModeActive, isFlashSaleActive } from "@/lib/black";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const categories = await getProductCategoryTree();

  return (
    <BlackModeProvider active={isBlackModeActive()} flashSale={isFlashSaleActive()}>
      <Header categories={categories} />
      <main className="min-h-screen pt-16 md:pt-20">
        <BlackBar />
        <ActiveCouponBar />
        {children}
      </main>
      <Footer categories={categories} />
      <WhatsappFloatButton />
    </BlackModeProvider>
  );
}
