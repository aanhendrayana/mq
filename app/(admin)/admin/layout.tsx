import { KerangkaDasbor } from "@/components/dasbor/kerangka";
import { wajibAdmin } from "@/lib/auth";
import { buatKlienServer } from "@/lib/db/server";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const pengguna = await wajibAdmin();

  // Lencana pembayaran: pesanan yang menunggu diperiksa admin.
  const db = await buatKlienServer();
  const { count } = await db
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
            { href: "/admin", label: "Ringkasan", ikon: "dasbor", persis: true },
            {
              href: "/admin/pembayaran",
              label: "Pembayaran",
              ikon: "dompet",
              lencana: count ?? 0,
            },
          ],
        },
        {
          label: "Akademik",
          item: [
            { href: "/admin/kelas", label: "Kelas & Materi", ikon: "book-open" },
            { href: "/admin/batch", label: "Angkatan", ikon: "users-bulat" },
            { href: "/admin/sertifikat", label: "Sertifikat", ikon: "award" },
          ],
        },
        {
          label: "Sistem",
          item: [
            { href: "/admin/pengguna", label: "Pengguna", ikon: "users" },
            { href: "/admin/pengaturan", label: "Pengaturan Situs", ikon: "pengaturan" },
          ],
        },
      ]}
    >
      {children}
    </KerangkaDasbor>
  );
}
