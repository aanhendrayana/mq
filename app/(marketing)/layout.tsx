import { HeaderSitus } from "@/components/marketing/header-situs";
import { FooterSitus } from "@/components/marketing/footer-situs";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <HeaderSitus />
      <main className="flex-1">{children}</main>
      <FooterSitus />
    </>
  );
}
