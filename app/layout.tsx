import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Lora, Amiri } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SITUS } from "@/lib/konstanta";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const amiri = Amiri({
  variable: "--font-arab",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITUS.url),
  title: {
    default: `${SITUS.nama} — Belajar Membaca Al-Qur'an Online`,
    template: `%s | ${SITUS.nama}`,
  },
  description: SITUS.deskripsi,
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: SITUS.nama,
    title: `${SITUS.nama} — Belajar Membaca Al-Qur'an Online`,
    description: SITUS.deskripsi,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} ${lora.variable} ${amiri.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
