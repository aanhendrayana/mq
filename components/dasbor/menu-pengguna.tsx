"use client";

import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { keluarAction } from "@/app/(auth)/actions";
import { inisial } from "@/lib/format";
import { BERANDA_PERAN } from "@/lib/konstanta";
import type { PenggunaAktif } from "@/lib/auth";

const LABEL_PERAN = {
  santri: "Santriwati",
  ustadz: "Ustadzah Pembimbing",
  admin: "Administrator",
} as const;

export function MenuPengguna({
  pengguna,
  /** Tampilkan nama di samping avatar. Dipakai di header situs yang lebih lapang. */
  tampilkanNama = false,
  /** Sertakan tautan ke dasbor. Tidak perlu bila sudah berada di dalam dasbor. */
  tautanDasbor = false,
}: {
  pengguna: PenggunaAktif;
  tampilkanNama?: boolean;
  tautanDasbor?: boolean;
}) {
  const nama = pengguna.profil.nama || "Pengguna";
  const beranda = BERANDA_PERAN[pengguna.profil.peran];

  const avatar = (
    <span
      aria-hidden
      className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
    >
      {inisial(nama)}
    </span>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          tampilkanNama ? (
            <Button variant="ghost" className="h-10 gap-2 pr-2 pl-1.5">
              {avatar}
              {/* Nama dipotong: gelar lengkap seperti "S.Q., Hafidzoh" bisa
                  sangat panjang dan akan mendorong navigasi keluar layar. */}
              <span className="hidden max-w-40 truncate text-sm font-medium lg:inline">
                {nama}
              </span>
              <ChevronDown className="hidden size-3.5 text-muted-foreground lg:inline" />
              <span className="sr-only">Menu akun</span>
            </Button>
          ) : (
            <Button variant="ghost" size="icon" aria-label="Menu akun" className="rounded-full">
              {avatar}
            </Button>
          )
        }
      />

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold">{nama}</p>
          <p className="truncate text-xs text-muted-foreground">{pengguna.email}</p>
          <p className="mt-1 text-xs text-primary">{LABEL_PERAN[pengguna.profil.peran]}</p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {tautanDasbor && (
          <DropdownMenuItem render={<Link href={beranda} />}>
            <LayoutDashboard className="size-4" />
            Dasbor Saya
          </DropdownMenuItem>
        )}

        <DropdownMenuItem render={<Link href="/belajar/profil" />}>
          <User className="size-4" />
          Profil Saya
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <form action={keluarAction}>
          <button
            type="submit"
            className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10"
          >
            <LogOut className="size-4" />
            Keluar
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
