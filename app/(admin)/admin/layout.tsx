import {
  Award,
  BookOpen,
  LayoutDashboard,
  Settings,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";
import { KerangkaDasbor } from "@/components/dasbor/kerangka";
import { wajibAdmin } from "@/lib/auth";
import { buatKlienServer } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const pengguna = await wajibAdmin();

  // Lencana pembayaran: pesanan yang menunggu diperiksa admin.
  const supabase = await buatKlienServer();
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "menunggu_verifikasi");

  return (
    <KerangkaDasbor
      pengguna={pengguna}
      judulPanel="Administrasi"
      nav={[
        {
          item: [
            { href: "/admin", label: "Ringkasan", ikon: LayoutDashboard, persis: true },
            {
              href: "/admin/pembayaran",
              label: "Pembayaran",
              ikon: Wallet,
              lencana: count ?? 0,
            },
          ],
        },
        {
          label: "Akademik",
          item: [
            { href: "/admin/kelas", label: "Kelas & Materi", ikon: BookOpen },
            { href: "/admin/batch", label: "Angkatan", ikon: UsersRound },
            { href: "/admin/sertifikat", label: "Sertifikat", ikon: Award },
          ],
        },
        {
          label: "Sistem",
          item: [
            { href: "/admin/pengguna", label: "Pengguna", ikon: Users },
            { href: "/admin/pengaturan", label: "Pengaturan Situs", ikon: Settings },
          ],
        },
      ]}
    >
      {children}
    </KerangkaDasbor>
  );
}
