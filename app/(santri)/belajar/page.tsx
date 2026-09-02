import type { Metadata } from "next";
import Link from "next/link";
import { BookMarked, CalendarClock, PlayCircle, Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { JudulHalaman, KeadaanKosong } from "@/components/dasbor/judul-halaman";
import { wajibMasuk } from "@/lib/auth";
import { kelasSaya } from "@/lib/santri";
import { buatKlienServer } from "@/lib/supabase/server";
import { jarakWaktu, tanggalJam } from "@/lib/format";
import { waktuPermintaan } from "@/lib/waktu";

export const metadata: Metadata = { title: "Kelas Saya" };

export default async function BelajarPage() {
  const pengguna = await wajibMasuk("/belajar");
  const supabase = await buatKlienServer();

  const [kelas, { data: pesananTertunda }] = await Promise.all([
    kelasSaya(pengguna.id),
    supabase
      .from("orders")
      .select("nomor_invoice, status, courses(judul)")
      .eq("santri_id", pengguna.id)
      .in("status", ["menunggu_bayar", "menunggu_verifikasi"])
      .order("dibuat_at", { ascending: false }),
  ]);

  // Sesi halaqah terdekat yang belum lewat, agar santri tidak melewatkannya.
  const idBatch = kelas.map((k) => k.batch_id).filter(Boolean) as string[];
  const sekarang = await waktuPermintaan();
  const { data: sesiBerikut } = idBatch.length
    ? await supabase
        .from("sesi_halaqah")
        .select("*, batches(nama, course_id)")
        .in("batch_id", idBatch)
        .gte("mulai_at", sekarang.toISOString())
        .order("mulai_at")
        .limit(1)
    : { data: [] };

  const sesi = sesiBerikut?.[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <JudulHalaman
        judul={`Ahlan, ${pengguna.profil.nama.split(" ")[0]}`}
        keterangan="Semoga Allah memudahkan langkah Anda mempelajari Kitab-Nya."
      />

      {/* Pesanan yang belum tuntas ditaruh paling atas: santri sering lupa
          menyelesaikan pembayaran setelah menutup halaman tagihan. */}
      {pesananTertunda && pesananTertunda.length > 0 && (
        <div className="mb-6 space-y-3">
          {pesananTertunda.map((p) => (
            <Card
              key={p.nomor_invoice}
              className="flex-row flex-wrap items-center gap-4 border-emas/50 bg-emas/5 p-4"
            >
              <Receipt className="size-5 shrink-0 text-emas-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {p.status === "menunggu_bayar"
                    ? "Menunggu pembayaran"
                    : "Menunggu verifikasi admin"}
                  {p.courses && ` — ${p.courses.judul}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Invoice {p.nomor_invoice}
                </p>
              </div>
              <TautanTombol href={`/belajar/tagihan/${p.nomor_invoice}`} size="sm">
                {p.status === "menunggu_bayar" ? "Selesaikan" : "Lihat"}
              </TautanTombol>
            </Card>
          ))}
        </div>
      )}

      {sesi && (
        <Card className="mb-8 gap-2 border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <CalendarClock className="size-4" />
            Halaqah berikutnya · {jarakWaktu(sesi.mulai_at)}
          </div>
          <p className="font-heading font-semibold">
            Pertemuan {sesi.pertemuan_ke}: {sesi.judul}
          </p>
          <p className="text-sm text-muted-foreground">{tanggalJam(sesi.mulai_at)}</p>
          <div className="mt-2">
            <TautanTombol href="/belajar/jadwal" size="sm" variant="outline">
              Lihat Jadwal Lengkap
            </TautanTombol>
          </div>
        </Card>
      )}

      <h2 className="font-heading mb-4 text-lg font-semibold">Kelas yang Anda ikuti</h2>

      {kelas.length === 0 ? (
        <KeadaanKosong
          ikon={BookMarked}
          judul="Belum ada kelas"
          keterangan="Anda belum terdaftar di kelas mana pun. Pilih program yang sesuai dengan kemampuan Anda saat ini."
          aksi={<TautanTombol href="/program">Lihat Katalog Kelas</TautanTombol>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {kelas.map((k) => (
            <Card key={k.id} className="gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/belajar/${k.courses.slug}`}
                    className="font-heading font-semibold hover:text-primary"
                  >
                    {k.courses.judul}
                  </Link>
                  {k.courses.jenjang && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {k.courses.jenjang}
                    </p>
                  )}
                </div>
                {k.status === "selesai" && <Badge variant="secondary">Selesai</Badge>}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {k.selesai} dari {k.total_pelajaran} pelajaran
                  </span>
                  <span className="font-medium tabular-nums">{k.persen}%</span>
                </div>
                <Progress value={k.persen} className="h-2" />
              </div>

              <TautanTombol href={`/belajar/${k.courses.slug}`} size="sm" className="w-full">
                <PlayCircle className="size-4" />
                {k.persen === 0 ? "Mulai Belajar" : "Lanjutkan"}
              </TautanTombol>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
