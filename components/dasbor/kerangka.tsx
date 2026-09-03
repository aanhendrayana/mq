import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/marketing/logo";
import { MenuPengguna } from "@/components/dasbor/menu-pengguna";
import { NavDasbor, type ItemNav } from "@/components/dasbor/nav-dasbor";
import type { PenggunaAktif } from "@/lib/auth";

export type { ItemNav };

export function KerangkaDasbor({
  pengguna,
  nav,
  judulPanel,
  children,
}: {
  pengguna: PenggunaAktif;
  nav: { label?: string; item: ItemNav[] }[];
  /** Ditampilkan di sidebar untuk membedakan panel ustadz/admin dari santriwati. */
  judulPanel?: string;
  children: React.ReactNode;
}) {
  const isiSidebar = (
    <div className="flex h-full flex-col gap-6 py-4">
      {judulPanel && (
        <p className="px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {judulPanel}
        </p>
      )}
      {nav.map((grup, i) => (
        <div key={grup.label ?? i} className="space-y-1">
          {grup.label && (
            <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">
              {grup.label}
            </p>
          )}
          <NavDasbor item={grup.item} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-md">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Buka menu" className="lg:hidden">
                <Menu className="size-5" />
              </Button>
            }
          />
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle className="text-left">
                <Logo tautan={null} />
              </SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto px-3">{isiSidebar}</div>
          </SheetContent>
        </Sheet>

        <Logo />

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
            render={<Link href="/program">Katalog Kelas</Link>}
            nativeButton={false}
          />
          <MenuPengguna pengguna={pengguna} />
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-r bg-sidebar px-3 lg:block">
          <div className="sticky top-16">{isiSidebar}</div>
        </aside>

        <main className="min-w-0 flex-1 bg-muted/25">{children}</main>
      </div>
    </div>
  );
}
