import type { Metadata } from "next";
import { CalendarClock, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { JudulHalaman, KeadaanKosong } from "@/components/dasbor/judul-halaman";
import { wajibPengajar } from "@/lib/auth";
import { buatKlienServer } from "@/lib/db/server";
import { jarakWaktu, tanggalJam } from "@/lib/format";
import { waktuPermintaan } from "@/lib/waktu";

export const metadata: Metadata = { title: "Angkatan Saya" };

const WARNA_STATUS = {
  draf: "bg-muted text-muted-foreground",
  pendaftaran: "bg-emas/15 text-emas-foreground border-emas/40",
  berjalan: "bg-success/15 text-success border-success/40",
  selesai: "bg-muted text-muted-foreground",
} as const;

export default async function PengajarPage() {
  await wajibPengajar();
  const db = await buatKlienServer();

  // Admin ikut memakai panel ini; kalau tidak ada filter, admin melihat semua
  // angkatan, sedangkan ustadzah hanya angkatannya sendiri (dijamin RLS).
  const { data: angkatan } = await db
    .from("batches")
    .select("*, courses(judul, jenjang)")
    .order("tgl_mulai", { ascending: false });

  const idBatch = (angkatan ?? []).map((b) => b.id);
  const sekarang = await waktuPermintaan();

  const [{ data: enroll }, { data: sesi }] = idBatch.length
    ? await Promise.all([
        db.from("enrollments").select("batch_id, status").in("batch_id", idBatch),
        db
          .from("sesi_halaqah")
          .select("id, batch_id, judul, pertemuan_ke, mulai_at")
          .in("batch_id", idBatch)
          .gte("mulai_at", sekarang.toISOString())
          .order("mulai_at"),
      ])
    : [{ data: [] }, { data: [] }];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <JudulHalaman
        judul="Angkatan Saya"
        keterangan="Kelompok halaqah yang Anda bimbing beserta pertemuan terdekatnya."
      />

      {!angkatan || angkatan.length === 0 ? (
        <KeadaanKosong
          ikon={Users}
          judul="Belum ada angkatan"
          keterangan="Anda belum ditugaskan membimbing angkatan mana pun. Admin akan menugaskan Anda melalui panel administrasi."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {angkatan.map((b) => {
            const jumlah = (enroll ?? []).filter(
              (e) => e.batch_id === b.id && e.status !== "berhenti",
            ).length;
            const berikut = (sesi ?? []).find((s) => s.batch_id === b.id);

            return (
              <Card key={b.id} className="gap-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{b.courses?.judul}</p>
                    <h2 className="font-heading font-semibold">{b.nama}</h2>
                  </div>
                  <Badge variant="outline" className={WARNA_STATUS[b.status]}>
                    {b.status}
                  </Badge>
                </div>

                <dl className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    {jumlah} dari {b.kuota} santriwati
                  </div>
                  {b.jadwal_ringkas && (
                    <div className="flex items-center gap-1.5">
                      <CalendarClock className="size-3.5" />
                      {b.jadwal_ringkas}
                    </div>
                  )}
                </dl>

                {berikut ? (
                  <div className="rounded-lg bg-secondary/50 p-3 text-sm">
                    <p className="font-medium">
                      Pertemuan {berikut.pertemuan_ke}: {berikut.judul}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tanggalJam(berikut.mulai_at)} · {jarakWaktu(berikut.mulai_at)}
                    </p>
                  </div>
                ) : (
                  <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                    Belum ada pertemuan terjadwal.
                  </p>
                )}

                <TautanTombol href={`/pengajar/batch/${b.id}`} size="sm" className="w-full">
                  Kelola Angkatan
                </TautanTombol>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
