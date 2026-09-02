import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/marketing/logo";
import { penggunaSekarang } from "@/lib/auth";
import { BERANDA_PERAN } from "@/lib/konstanta";

const TAUTAN = [
  { href: "/program", label: "Program" },
  { href: "/tentang", label: "Tentang" },
  { href: "/cek-sertifikat", label: "Cek Sertifikat" },
  { href: "/kontak", label: "Kontak" },
];

export async function HeaderSitus() {
  const pengguna = await penggunaSekarang();
  const beranda = pengguna ? BERANDA_PERAN[pengguna.profil.peran] : null;

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Logo />

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {TAUTAN.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {beranda ? (
            <TautanTombol href={beranda} size="sm">
              Dasbor Saya
            </TautanTombol>
          ) : (
            <>
              <TautanTombol href="/masuk" variant="ghost" size="sm">
                Masuk
              </TautanTombol>
              <TautanTombol href="/daftar" size="sm">
                Daftar Gratis
              </TautanTombol>
            </>
          )}
        </div>

        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Buka menu"
                className="ml-auto md:hidden"
              >
                <Menu className="size-5" />
              </Button>
            }
          />
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="text-left">
                <Logo tautan={null} />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4">
              {TAUTAN.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  {t.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2 p-4">
              {beranda ? (
                <TautanTombol href={beranda}>Dasbor Saya</TautanTombol>
              ) : (
                <>
                  <TautanTombol href="/daftar">Daftar Gratis</TautanTombol>
                  <TautanTombol href="/masuk" variant="outline">
                    Masuk
                  </TautanTombol>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
