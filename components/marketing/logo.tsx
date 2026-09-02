import Link from "next/link";
import { cn } from "@/lib/utils";
import { SITUS } from "@/lib/konstanta";

export function Logo({
  className,
  tautan = "/",
}: {
  className?: string;
  tautan?: string | null;
}) {
  const isi = (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" strokeLinejoin="round" />
          <path d="M19 18v3H6.5A2.5 2.5 0 0 1 4 18.5" strokeLinejoin="round" />
          <path d="M9 8h6M9 11.5h4" strokeLinecap="round" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-heading text-[15px] font-semibold tracking-tight">
          Madrasah Qur&apos;an
        </span>
        <span className="text-[13px] font-medium text-primary">Ummina</span>
      </span>
      <span className="sr-only">{SITUS.nama}</span>
    </span>
  );

  return tautan ? <Link href={tautan}>{isi}</Link> : isi;
}
