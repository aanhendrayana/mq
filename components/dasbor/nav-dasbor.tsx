"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ItemNav = {
  href: string;
  label: string;
  ikon: LucideIcon;
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
            <i.ikon className="size-4 shrink-0" />
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
