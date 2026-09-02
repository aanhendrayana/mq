"use client";

import Link from "next/link";
import { LogOut, User } from "lucide-react";
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
import type { PenggunaAktif } from "@/lib/auth";

const LABEL_PERAN = {
  santri: "Santri",
  ustadz: "Ustadz Pembimbing",
  admin: "Administrator",
} as const;

export function MenuPengguna({ pengguna }: { pengguna: PenggunaAktif }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Menu akun" className="rounded-full">
            <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {inisial(pengguna.profil.nama || "?")}
            </span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold">{pengguna.profil.nama}</p>
          <p className="truncate text-xs text-muted-foreground">{pengguna.email}</p>
          <p className="mt-1 text-xs text-primary">{LABEL_PERAN[pengguna.profil.peran]}</p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

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
