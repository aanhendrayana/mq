"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookMarked,
  BookOpen,
  CalendarDays,
  ChartLine,
  GraduationCap,
  LayoutDashboard,
  Receipt,
  Settings,
  UserRound,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ikon navigasi dipetakan dari nama, bukan dioper sebagai komponen.
 *
 * Layout dasbor adalah Server Component, sedangkan komponen ini berjalan di
 * klien. React tidak bisa menyerialkan fungsi melintasi batas itu, jadi yang
 * menyeberang hanya string dan pemetaannya terjadi di sini.
 */
const IKON = {
  award: Award,
  "book-marked": BookMarked,
  "book-open": BookOpen,
  calendar: CalendarDays,
  chart: ChartLine,
  dasbor: LayoutDashboard,
  dompet: Wallet,
  kwitansi: Receipt,
  pengaturan: Settings,
  pengguna: UserRound,
  "topi-wisuda": GraduationCap,
  users: Users,
  "users-bulat": UsersRound,
} as const;

export type NamaIkon = keyof typeof IKON;

export type ItemNav = {
  href: string;
  label: string;
  ikon: NamaIkon;
  /** Cocokkan persis, bukan berdasarkan awalan (untuk beranda tiap panel). */
  persis?: boolean;
  lencana?: number;
};

export function NavDasbor({ item }: { item: ItemNav[] }) {
  const path = usePathname();

  return (
    <nav className="space-y-0.5">
      {item.map((i) => {
        const aktif = i.persis ? path === i.href : path.startsWith(i.href);
        const Ikon = IKON[i.ikon];
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={aktif ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              aktif
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <Ikon className="size-4 shrink-0" />
            <span className="flex-1 truncate">{i.label}</span>
            {i.lencana ? (
              <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                {i.lencana}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
