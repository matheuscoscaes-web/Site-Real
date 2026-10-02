import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsappFloatButton } from "@/components/layout/WhatsappFloatButton";
import { getProductCategoryTree } from "@/lib/product-categories";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const categories = await getProductCategoryTree();

  return (
    <>
      <Header categories={categories} />
      <main className="min-h-screen pt-16 md:pt-20">{children}</main>
      <Footer categories={categories} />
      <WhatsappFloatButton />
    </>
  );
}
