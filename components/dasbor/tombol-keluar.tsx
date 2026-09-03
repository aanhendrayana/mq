import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { keluarAction } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";

/**
 * Tombol keluar yang selalu terlihat di header.
 *
 * Menu akun juga memuat "Keluar", tetapi menyembunyikan satu-satunya jalan
 * keluar di balik klik pada avatar membuatnya sulit ditemukan — terutama bagi
 * pengguna yang tidak terbiasa dengan pola avatar-sebagai-menu.
 *
 * Ini Server Component: `keluarAction` dipanggil lewat form biasa, jadi tetap
 * berfungsi meski JavaScript gagal dimuat.
 */
export function TombolKeluar({ className }: { className?: string }) {
  return (
    <form action={keluarAction} className={cn("contents", className)}>
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        title="Keluar"
        aria-label="Keluar dari akun"
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="size-4.5" />
      </Button>
    </form>
  );
}
