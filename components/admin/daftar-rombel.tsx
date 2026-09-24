import { UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { KeadaanKosong } from "@/components/dasbor/judul-halaman";
import { DialogBatch } from "@/components/admin/dialog-batch";
import { TombolTempatkan } from "@/components/admin/penempatan-santri";
import { tanggal } from "@/lib/format";
import type { Batch } from "@/lib/database.types";

const WARNA_STATUS = {
  draf: "bg-muted text-muted-foreground",
  pendaftaran: "bg-emas/15 text-emas-foreground border-emas/40",
  berjalan: "bg-success/15 text-success border-success/40",
  selesai: "bg-muted text-muted-foreground",
} as const;

type BatchDenganRelasi = Batch & {
  courses?: { judul: string } | null;
  profiles?: { nama: string } | null;
};

type EnrollBaris = {
  id: string;
  batch_id: string | null;
  course_id: string;
  profiles?: { nama: string } | null;
};

/**
 * Kartu per rombel: penugasan ustadzah pembimbing (diambil dari akun
 * berperan Ustadzah/Ummi Rifa/Admin) dan roster santriwati (diambil dari
 * akun berperan Santri lewat enrollments) — dipakai di /admin/batch (semua
 * rombel) dan tab "Rombel & Penugasan" pada satu kelas.
 */
export function DaftarRombel({
  batches,
  kelas,
  pengajar,
  enroll,
  tautanKelasnya = true,
}: {
  batches: BatchDenganRelasi[];
  kelas: { id: string; judul: string }[];
  pengajar: { id: string; nama: string }[];
  enroll: EnrollBaris[];
  /** Sembunyikan judul kelas di tiap kartu — berguna saat sudah dipersempit ke satu kelas. */
  tautanKelasnya?: boolean;
}) {
  const belumDitempatkan = enroll.filter((e) => !e.batch_id);

  if (batches.length === 0) {
    return (
      <KeadaanKosong
        ikon={UsersRound}
        judul="Belum ada rombel"
        keterangan="Buat rombel agar santriwati bisa memilihnya saat mendaftar dan mendapat jadwal halaqah."
      />
    );
  }

  return (
    <div className="space-y-4">
      {batches.map((b) => {
        const anggota = enroll.filter((e) => e.batch_id === b.id);
        const calon = belumDitempatkan.filter((e) => e.course_id === b.course_id);

        return (
          <Card key={b.id} className="gap-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                {tautanKelasnya && (
                  <p className="text-xs text-muted-foreground">{b.courses?.judul}</p>
                )}
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
                  kelas={kelas}
                  pengajar={pengajar}
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
                Buka Panel Rombel
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
                  Santriwati kelas ini yang belum punya rombel:
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
  );
}
