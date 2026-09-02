import Link from "next/link";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Tautan yang tampil seperti tombol.
 *
 * Komponen `Button` di sini dibangun di atas Base UI, yang memakai prop
 * `render` alih-alih `asChild` milik Radix. Membungkus `buttonVariants` pada
 * `next/link` lebih ringkas dan tetap menghasilkan <a> yang benar untuk
 * navigasi (bisa dibuka di tab baru, terbaca perayap mesin pencari).
 */
export function TautanTombol({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) {
  return (
    <Link
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
