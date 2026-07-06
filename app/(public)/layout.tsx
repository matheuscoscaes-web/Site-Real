import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsappFloatButton } from "@/components/layout/WhatsappFloatButton";
import { WelcomeCouponPopup } from "@/components/layout/WelcomeCouponPopup";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-[104px]">{children}</main>
      <Footer />
      <WhatsappFloatButton />
      <WelcomeCouponPopup />
    </>
  );
}
