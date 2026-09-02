import type { Metadata } from "next";
import { CalendarDays, CircleCheck, CircleX, Clock, Video } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JudulHalaman, KeadaanKosong } from "@/components/dasbor/judul-halaman";
import { TombolGabung } from "@/components/belajar/tombol-gabung";
import { wajibMasuk } from "@/lib/auth";
import { buatKlienServer } from "@/lib/supabase/server";
import { jarakWaktu, tanggalJam } from "@/lib/format";
import { waktuPermintaan } from "@/lib/waktu";
import type { StatusKehadiran } from "@/lib/database.types";

export const metadata: Metadata = { title: "Jadwal Halaqah" };

const LABEL_HADIR: Record<StatusKehadiran, { teks: string; kelas: string }> = {
  hadir: { teks: "Hadir", kelas: "bg-success/15 text-success border-success/40" },
  izin: { teks: "Izin", kelas: "bg-warning/15 text-warning-foreground border-warning/40" },
  sakit: { teks: "Sakit", kelas: "bg-warning/15 text-warning-foreground border-warning/40" },
  alpa: { teks: "Tidak hadir", kelas: "bg-destructive/10 text-destructive border-destructive/40" },
};

export default async function JadwalPage() {
  const pengguna = await wajibMasuk();
  const supabase = await buatKlienServer();

  const { data: enroll } = await supabase
    .from("enrollments")
    .select("batch_id, courses(judul)")
    .eq("santri_id", pengguna.id)
    .neq("status", "berhenti")
    .not("batch_id", "is", null);

  const idBatch = (enroll ?? []).map((e) => e.batch_id).filter(Boolean) as string[];

  const [{ data: sesi }, { data: kehadiran }, { data: angkatan }] = idBatch.length
    ? await Promise.all([
        supabase
          .from("sesi_halaqah")
          .select("*")
          .in("batch_id", idBatch)
          .order("mulai_at"),
        supabase
          .from("kehadiran")
          .select("sesi_id, status, catatan")
          .eq("santri_id", pengguna.id),
        supabase
          .from("batches")
          .select("id, nama, jadwal_ringkas, course_id, courses(judul)")
          .in("id", idBatch),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const sekarang = (await waktuPermintaan()).getTime();
  const mendatang = (sesi ?? []).filter((s) => new Date(s.mulai_at).getTime() >= sekarang);
  const lampau = (sesi ?? [])
    .filter((s) => new Date(s.mulai_at).getTime() < sekarang)
    .reverse();

  const petaHadir = new Map((kehadiran ?? []).map((k) => [k.sesi_id, k]));
  const petaBatch = new Map((angkatan ?? []).map((b) => [b.id, b]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <JudulHalaman
        judul="Jadwal Halaqah"
        keterangan="Pertemuan setoran bacaan bersama ustadz pembimbing angkatan Anda."
      />

      {angkatan && angkatan.length > 0 && (
        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          {angkatan.map((b) => (
            <Card key={b.id} className="gap-1 p-4">
              <p className="text-xs text-muted-foreground">{b.courses?.judul}</p>
              <p className="font-heading font-semibold">{b.nama}</p>
              {b.jadwal_ringkas && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="size-3.5" />
                  {b.jadwal_ringkas}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {idBatch.length === 0 ? (
        <KeadaanKosong
          ikon={CalendarDays}
          judul="Belum tergabung di angkatan"
          keterangan="Anda belum ditempatkan pada angkatan halaqah mana pun. Admin akan menempatkan Anda setelah pembayaran diverifikasi."
        />
      ) : (
        <>
          <h2 className="font-heading mb-3 text-lg font-semibold">Pertemuan mendatang</h2>
          {mendatang.length === 0 ? (
            <Card className="mb-8 p-6 text-center text-sm text-muted-foreground">
              Belum ada pertemuan terjadwal. Ustadz pembimbing akan menambahkannya.
            </Card>
          ) : (
            <div className="mb-10 space-y-3">
              {mendatang.map((s) => (
                <Card key={s.id} className="gap-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {petaBatch.get(s.batch_id)?.nama} · Pertemuan {s.pertemuan_ke}
                      </p>
                      <h3 className="font-heading font-semibold">{s.judul}</h3>
                    </div>
                    <Badge variant="secondary">{jarakWaktu(s.mulai_at)}</Badge>
                  </div>

                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarDays className="size-4" />
                    {tanggalJam(s.mulai_at)} · {s.durasi_menit} menit
                  </p>

                  {s.materi && (
                    <p className="rounded-lg bg-secondary/50 p-3 text-sm">
                      <span className="font-medium">Materi setoran: </span>
                      {s.materi}
                    </p>
                  )}

                  <TombolGabung mulaiAt={s.mulai_at} link={s.link_meeting} />
                </Card>
              ))}
            </div>
          )}

          {lampau.length > 0 && (
            <>
              <h2 className="font-heading mb-3 text-lg font-semibold">Riwayat pertemuan</h2>
              <div className="space-y-2">
                {lampau.map((s) => {
                  const h = petaHadir.get(s.id);
                  const g = h ? LABEL_HADIR[h.status] : null;
                  return (
                    <Card key={s.id} className="flex-row flex-wrap items-center gap-3 p-4">
                      {h?.status === "hadir" ? (
                        <CircleCheck className="size-4 shrink-0 text-success" />
                      ) : (
                        <CircleX className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          Pertemuan {s.pertemuan_ke}: {s.judul}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tanggalJam(s.mulai_at)}
                        </p>
                      </div>
                      {g ? (
                        <Badge variant="outline" className={g.kelas}>
                          {g.teks}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Belum dicatat
                        </Badge>
                      )}
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      <p className="mt-8 flex items-start gap-2 rounded-lg border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
        <Video className="mt-0.5 size-4 shrink-0" />
        Tautan pertemuan aktif 15 menit sebelum jadwal dimulai. Siapkan mushaf
        dan tempat yang tenang agar bacaan Anda terdengar jelas oleh ustadz.
      </p>
    </div>
  );
}
