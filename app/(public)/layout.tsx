import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsappFloatButton } from "@/components/layout/WhatsappFloatButton";
import { WelcomeCouponPopup } from "@/components/layout/WelcomeCouponPopup";
import { getProductCategoryTree } from "@/lib/product-categories";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const categories = await getProductCategoryTree();

  return (
    <>
      <Header categories={categories} />
      <main className="min-h-screen pt-[104px]">{children}</main>
      <Footer categories={categories} />
      <WhatsappFloatButton />
      <WelcomeCouponPopup />
    </>
  );
}
