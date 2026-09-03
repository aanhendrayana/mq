import Link from "next/link";
import { LayoutDashboard, LogOut, Menu, UserRound } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/marketing/logo";
import { MenuPengguna } from "@/components/dasbor/menu-pengguna";
import { TombolKeluar } from "@/components/dasbor/tombol-keluar";
import { keluarAction } from "@/app/(auth)/actions";
import { penggunaSekarang } from "@/lib/auth";
import { BERANDA_PERAN } from "@/lib/konstanta";
import { inisial } from "@/lib/format";
import { cn } from "@/lib/utils";

const TAUTAN = [
  { href: "/program", label: "Program" },
  { href: "/tentang", label: "Tentang" },
  { href: "/cek-sertifikat", label: "Cek Sertifikat" },
  { href: "/kontak", label: "Kontak" },
];

const LABEL_PERAN = {
  santri: "Santriwati",
  ustadz: "Ustadzah Pembimbing",
  admin: "Administrator",
} as const;

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
          {pengguna && beranda ? (
            <>
              <TautanTombol href={beranda} variant="outline" size="sm">
                Dasbor Saya
              </TautanTombol>
              {/* Nama pengguna & tombol keluar: tanpa ini, pengunjung yang sudah
                  masuk tidak punya cara keluar dari halaman publik. */}
              <MenuPengguna pengguna={pengguna} tampilkanNama />
              <TombolKeluar />
            </>
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
          {/* className, bukan render={<Button/>}: Base UI sudah merender
              <button> sendiri, dan menyisipkan Button ke dalam `render`
              membuat urutan penggabungan prop berbeda antara server dan
              klien sehingga memicu hydration mismatch. */}
          <SheetTrigger
            aria-label="Buka menu"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "ml-auto md:hidden",
            )}
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="text-left">
                <Logo tautan={null} />
              </SheetTitle>
            </SheetHeader>

            {pengguna && (
              <div className="flex items-center gap-3 px-4 pb-3">
                <span
                  aria-hidden
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                >
                  {inisial(pengguna.profil.nama || "?")}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {pengguna.profil.nama}
                  </p>
                  <p className="truncate text-xs text-primary">
                    {LABEL_PERAN[pengguna.profil.peran]}
                  </p>
                </div>
              </div>
            )}

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

              {pengguna && (
                <>
                  <Separator className="my-2" />
                  <Link
                    href={BERANDA_PERAN[pengguna.profil.peran]}
                    className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent"
                  >
                    <LayoutDashboard className="size-4" />
                    Dasbor Saya
                  </Link>
                  <Link
                    href="/belajar/profil"
                    className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent"
                  >
                    <UserRound className="size-4" />
                    Profil Saya
                  </Link>
                </>
              )}
            </nav>

            <div className="mt-auto flex flex-col gap-2 p-4">
              {pengguna ? (
                <form action={keluarAction}>
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full text-destructive"
                  >
                    <LogOut className="size-4" />
                    Keluar
                  </Button>
                </form>
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
