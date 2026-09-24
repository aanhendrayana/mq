"use client";

import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogOut, User } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { keluarAction } from "@/app/(auth)/actions";
import { inisial } from "@/lib/format";
import { berandaUntukPeran, labelPeranList } from "@/lib/konstanta";
import { cn } from "@/lib/utils";
import type { PenggunaAktif } from "@/lib/auth";

export function MenuPengguna({
  pengguna,
  /** Tampilkan nama di samping avatar. Dipakai di header yang lebih lapang. */
  tampilkanNama = false,
  /** Sertakan tautan ke dasbor. Tidak perlu bila sudah berada di dalam dasbor. */
  tautanDasbor = false,
}: {
  pengguna: PenggunaAktif;
  tampilkanNama?: boolean;
  tautanDasbor?: boolean;
}) {
  const nama = pengguna.profil.nama || "Pengguna";

  return (
    <DropdownMenu>
      {/*
        Gaya tombol diberikan lewat `className`, bukan `render={<Button/>}`.
        Base UI sudah merender <button> sendiri, dan menyisipkan komponen Button
        (yang juga Base UI) ke dalam `render` membuat urutan penggabungan prop
        berbeda antara server dan klien — hasilnya hydration mismatch pada
        atribut data-slot.
      */}
      <DropdownMenuTrigger
        aria-label="Menu akun"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          tampilkanNama ? "h-10 gap-2 pr-2 pl-1.5" : "size-9 rounded-full p-0",
        )}
      >
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
        >
          {inisial(nama)}
        </span>
        {tampilkanNama && (
          <>
            {/* Nama dipotong: gelar lengkap seperti "S.Q., Hafidzoh" panjang
                dan akan mendorong navigasi keluar layar. */}
            <span className="hidden max-w-28 truncate text-sm font-medium sm:inline lg:max-w-44">
              {nama}
            </span>
            <ChevronDown className="hidden size-3.5 text-muted-foreground sm:inline" />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        {/*
          Blok identitas ini sengaja <div> biasa, bukan DropdownMenuLabel.
          DropdownMenuLabel memetakan ke Menu.GroupLabel milik Base UI yang
          WAJIB berada di dalam Menu.Group — di luar itu ia melempar exception
          dan menjatuhkan seluruh halaman. Lagi pula ini bukan label sebuah
          grup, melainkan keterangan akun.
        */}
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-semibold">{nama}</p>
          <p className="truncate text-xs text-muted-foreground">{pengguna.email}</p>
          <p className="mt-1 text-xs text-primary">
            {labelPeranList(pengguna.profil.peranList)}
          </p>
        </div>

        <DropdownMenuSeparator />

        {tautanDasbor && (
          <DropdownMenuItem render={<Link href={berandaUntukPeran(pengguna.profil.peranList)} />}>
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
