import type { Metadata } from "next";
import { BadgeCheck, ShieldX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { buatKlienServer } from "@/lib/supabase/server";
import { tanggal } from "@/lib/format";

export const metadata: Metadata = {
  title: "Hasil Verifikasi Sertifikat",
  // Halaman ini memuat nama seseorang; jangan sampai terindeks mesin pencari.
  robots: { index: false, follow: false },
};

export default async function HasilVerifikasiPage({
  params,
}: PageProps<"/cek-sertifikat/[token]">) {
  const { token } = await params;
  const supabase = await buatKlienServer();

  // Lewat fungsi `cek_sertifikat()`, bukan `select` langsung ke tabel: dengan
  // begitu token milik orang lain tidak bisa dipanen dari tabel sertifikat.
  const { data } = await supabase.rpc("cek_sertifikat", { p_token: token });
  const sertifikat = data?.[0];

  if (!sertifikat) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <Card className="items-center gap-4 p-10 text-center">
          <ShieldX className="size-12 text-destructive" />
          <h1 className="font-heading text-2xl font-bold">Sertifikat tidak ditemukan</h1>
          <p className="leading-relaxed text-muted-foreground">
            Kode verifikasi ini tidak cocok dengan sertifikat mana pun yang
            diterbitkan Madrasah Qur&apos;an Ummina. Periksa kembali penulisan
            kodenya, atau hubungi kami bila Anda yakin kode ini benar.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <TautanTombol href="/cek-sertifikat" variant="outline">
              Coba Kode Lain
            </TautanTombol>
            <TautanTombol href="/kontak">Hubungi Kami</TautanTombol>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex flex-col items-center gap-2 bg-primary px-8 py-8 text-center text-primary-foreground">
          <BadgeCheck className="size-11" />
          <h1 className="font-heading text-2xl font-bold">Sertifikat Sah</h1>
          <p className="text-sm text-primary-foreground/80">
            Diterbitkan oleh Madrasah Qur&apos;an Ummina
          </p>
        </div>

        <dl className="divide-y px-8 py-2">
          {[
            ["Nomor sertifikat", sertifikat.nomor],
            ["Nama pemilik", sertifikat.nama_santri],
            [
              "Program",
              sertifikat.jenjang
                ? `${sertifikat.judul_kelas} — ${sertifikat.jenjang}`
                : sertifikat.judul_kelas,
            ],
            ["Tanggal terbit", tanggal(sertifikat.tgl_terbit)],
          ].map(([label, nilai]) => (
            <div key={label} className="flex flex-wrap justify-between gap-3 py-4">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="text-right text-sm font-medium">{nilai}</dd>
            </div>
          ))}

          {sertifikat.predikat && (
            <div className="flex flex-wrap items-center justify-between gap-3 py-4">
              <dt className="text-sm text-muted-foreground">Predikat</dt>
              <dd>
                <Badge variant="secondary">{sertifikat.predikat}</Badge>
              </dd>
            </div>
          )}
        </dl>

        <p className="border-t bg-secondary/40 px-8 py-5 text-xs leading-relaxed text-muted-foreground">
          Data di atas dibaca langsung dari pangkalan data madrasah pada saat
          halaman ini dibuka. Bila ada keraguan, hubungi kami melalui halaman
          kontak dengan menyebutkan nomor sertifikat.
        </p>
      </Card>
    </div>
  );
}
