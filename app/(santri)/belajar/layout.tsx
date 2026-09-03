import { KerangkaDasbor } from "@/components/dasbor/kerangka";
import { wajibMasuk } from "@/lib/auth";
import { buatKlienServer } from "@/lib/supabase/server";

export default async function BelajarLayout({ children }: LayoutProps<"/belajar">) {
  const pengguna = await wajibMasuk("/belajar");

  // Lencana pada menu Tagihan agar pesanan yang belum dibayar tidak terlupakan.
  const supabase = await buatKlienServer();
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("santri_id", pengguna.id)
    .in("status", ["menunggu_bayar", "menunggu_verifikasi"]);

  return (
    <KerangkaDasbor
      pengguna={pengguna}
      nav={[
        {
          item: [
            { href: "/belajar", label: "Kelas Saya", ikon: "book-marked", persis: true },
            { href: "/belajar/jadwal", label: "Jadwal Halaqah", ikon: "calendar" },
            { href: "/belajar/rapor", label: "Rapor Tahsin", ikon: "chart" },
            { href: "/belajar/sertifikat", label: "Sertifikat", ikon: "award" },
          ],
        },
        {
          label: "Akun",
          item: [
            {
              href: "/belajar/tagihan",
              label: "Tagihan",
              ikon: "kwitansi",
              lencana: count ?? 0,
            },
            { href: "/belajar/profil", label: "Profil", ikon: "pengguna" },
          ],
        },
      ]}
    >
      {children}
    </KerangkaDasbor>
  );
}
