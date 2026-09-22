import type { Metadata } from "next";
import { Plus, UserRound, UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { JudulHalaman, KeadaanKosong } from "@/components/dasbor/judul-halaman";
import { DialogBatch } from "@/components/admin/dialog-batch";
import { TombolTempatkan } from "@/components/admin/penempatan-santri";
import { wajibAdmin } from "@/lib/auth";
import { buatKlienServer } from "@/lib/db/server";
import { tanggal } from "@/lib/format";

export const metadata: Metadata = { title: "Angkatan" };

const WARNA_STATUS = {
  draf: "bg-muted text-muted-foreground",
  pendaftaran: "bg-emas/15 text-emas-foreground border-emas/40",
  berjalan: "bg-success/15 text-success border-success/40",
  selesai: "bg-muted text-muted-foreground",
} as const;

export default async function AdminBatchPage() {
  await wajibAdmin();
  const db = await buatKlienServer();

  const [{ data: batches }, { data: kelas }, { data: pengajar }, { data: enroll }] =
    await Promise.all([
      db
        .from("batches")
        .select("*, courses(judul), profiles(nama)")
        .order("tgl_mulai", { ascending: false }),
      db.from("courses").select("id, judul").order("urutan"),
      db.from("profiles").select("id, nama").in("peran", ["ustadz", "admin"]).order("nama"),
      db
        .from("enrollments")
        .select("id, batch_id, course_id, status, profiles(nama)")
        .neq("status", "berhenti"),
    ]);

  // Santriwati yang sudah membayar tapi belum punya angkatan — kalau dibiarkan,
  // mereka tidak akan pernah melihat jadwal halaqah.
  const belumDitempatkan = (enroll ?? []).filter((e) => !e.batch_id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <JudulHalaman
        judul="Angkatan"
        keterangan="Kelompok halaqah beserta pembimbing, jadwal, dan kuotanya."
        aksi={
          <DialogBatch
            kelas={kelas ?? []}
            pengajar={pengajar ?? []}
            pemicu={
              <>
                <Plus className="size-4" />
                Angkatan Baru
              </>
            }
          />
        }
      />

      {belumDitempatkan.length > 0 && (
        <Card className="mb-8 gap-3 border-emas/50 bg-emas/5 p-5">
          <h2 className="font-heading flex items-center gap-2 font-semibold">
            <UserRound className="size-4" />
            {belumDitempatkan.length} santriwati belum ditempatkan di angkatan
          </h2>
          <p className="text-sm text-muted-foreground">
            Mereka sudah punya akses materi, tetapi belum melihat jadwal halaqah
            mana pun. Tempatkan lewat tombol pada angkatan yang sesuai di bawah.
          </p>
          <ul className="space-y-1 text-sm">
            {belumDitempatkan.map((e) => (
              <li key={e.id} className="text-muted-foreground">
                {e.profiles?.nama} —{" "}
                {(kelas ?? []).find((k) => k.id === e.course_id)?.judul}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {!batches || batches.length === 0 ? (
        <KeadaanKosong
          ikon={UsersRound}
          judul="Belum ada angkatan"
          keterangan="Buat angkatan agar santriwati bisa memilihnya saat mendaftar dan mendapat jadwal halaqah."
        />
      ) : (
        <div className="space-y-4">
          {batches.map((b) => {
            const anggota = (enroll ?? []).filter((e) => e.batch_id === b.id);
            const calon = belumDitempatkan.filter((e) => e.course_id === b.course_id);

            return (
              <Card key={b.id} className="gap-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{b.courses?.judul}</p>
                    <h3 className="font-heading font-semibold">{b.nama}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {b.profiles?.nama ?? "Pembimbing belum ditentukan"}
                      {b.jadwal_ringkas && ` · ${b.jadwal_ringkas}`}
                      {b.tgl_mulai && ` · mulai ${tanggal(b.tgl_mulai)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={WARNA_STATUS[b.status]}>
                      {b.status}
                    </Badge>
                    <DialogBatch
                      kelas={kelas ?? []}
                      pengajar={pengajar ?? []}
                      batch={b}
                      pemicu="Ubah"
                      varian="outline"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {anggota.length} dari {b.kuota} kursi terisi
                  </span>
                  <TautanTombol href={`/pengajar/batch/${b.id}`} size="sm" variant="outline">
                    Buka Panel Angkatan
                  </TautanTombol>
                </div>

                {anggota.length > 0 && (
                  <ul className="divide-y rounded-lg border text-sm">
                    {anggota.map((e) => (
                      <li key={e.id} className="flex items-center gap-3 p-2.5">
                        <span className="min-w-0 flex-1 truncate">{e.profiles?.nama}</span>
                        <TombolTempatkan enrollmentId={e.id} batchId={null} keluarkan />
                      </li>
                    ))}
                  </ul>
                )}

                {calon.length > 0 && anggota.length < b.kuota && (
                  <div className="rounded-lg border border-dashed p-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Santriwati kelas ini yang belum punya angkatan:
                    </p>
                    <ul className="space-y-1.5">
                      {calon.map((e) => (
                        <li key={e.id} className="flex items-center gap-3 text-sm">
                          <span className="min-w-0 flex-1 truncate">{e.profiles?.nama}</span>
                          <TombolTempatkan enrollmentId={e.id} batchId={b.id} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
