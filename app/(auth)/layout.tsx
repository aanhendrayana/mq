import Link from "next/link";
import { Logo } from "@/components/marketing/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-16 items-center px-4 sm:px-8">
        <Logo />
      </header>

      <main className="pola-islami flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="px-4 py-6 text-center text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Kembali ke beranda
        </Link>
      </footer>
    </div>
  );
}
