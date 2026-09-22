import type { Metadata } from "next";
import { Award, Download, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { JudulHalaman, KeadaanKosong } from "@/components/dasbor/judul-halaman";
import { wajibMasuk } from "@/lib/auth";
import { buatKlienServer } from "@/lib/db/server";
import { SYARAT_SERTIFIKAT } from "@/lib/konstanta";
import { tanggal } from "@/lib/format";

export const metadata: Metadata = { title: "Sertifikat" };

export default async function SertifikatPage() {
  const pengguna = await wajibMasuk();
  const db = await buatKlienServer();

  const { data: sertifikat } = await db
    .from("sertifikat")
    .select("*, courses(judul, jenjang)")
    .eq("santri_id", pengguna.id)
    .order("tgl_terbit", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <JudulHalaman
        judul="Sertifikat"
        keterangan="Sertifikat kelulusan yang sudah diterbitkan madrasah untuk Anda."
      />

      {!sertifikat || sertifikat.length === 0 ? (
        <KeadaanKosong
          ikon={Award}
          judul="Belum ada sertifikat"
          keterangan={`Sertifikat diterbitkan setelah materi tuntas 100%, rata-rata nilai setoran minimal ${SYARAT_SERTIFIKAT.minRataNilai}, dan kehadiran halaqah minimal ${SYARAT_SERTIFIKAT.minKehadiranPersen}%.`}
          aksi={<TautanTombol href="/belajar/rapor" variant="outline">Lihat Rapor Saya</TautanTombol>}
        />
      ) : (
        <div className="space-y-4">
          {sertifikat.map((s) => (
            <Card key={s.id} className="gap-4 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">{s.nomor}</p>
                  <h2 className="font-heading mt-1 text-lg font-bold">
                    {s.courses?.judul}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Terbit {tanggal(s.tgl_terbit)}
                  </p>
                </div>
                <Award className="size-9 shrink-0 text-emas" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {s.predikat && <Badge variant="secondary">{s.predikat}</Badge>}
                {s.nilai_rata !== null && (
                  <Badge variant="outline" className="tabular-nums">
                    Nilai {Number(s.nilai_rata).toFixed(1)}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <TautanTombol href={`/api/sertifikat/${s.nomor.replaceAll("/", "-")}`}>
                  <Download className="size-4" />
                  Unduh PDF
                </TautanTombol>
                <TautanTombol
                  href={`/cek-sertifikat/${s.token_verifikasi}`}
                  variant="outline"
                >
                  <ShieldCheck className="size-4" />
                  Halaman Verifikasi
                </TautanTombol>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Bagikan tautan verifikasi kepada pihak yang ingin memastikan
                keaslian sertifikat ini. Halaman tersebut dapat dibuka siapa saja
                tanpa perlu masuk.
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
