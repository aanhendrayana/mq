import type { Metadata } from "next";
import { Award, Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JudulHalaman, KeadaanKosong } from "@/components/dasbor/judul-halaman";
import { TombolTerbitkan } from "@/components/admin/tombol-terbitkan";
import { wajibAdmin } from "@/lib/auth";
import { buatKlienServer } from "@/lib/supabase/server";
import { SYARAT_SERTIFIKAT } from "@/lib/konstanta";
import { tanggal } from "@/lib/format";
import type { RingkasanCapaian } from "@/lib/database.types";

export const metadata: Metadata = { title: "Sertifikat" };

function Syarat({ terpenuhi, teks }: { terpenuhi: boolean; teks: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${
        terpenuhi ? "text-success" : "text-muted-foreground"
      }`}
    >
      {terpenuhi ? <Check className="size-3" /> : <X className="size-3" />}
      {teks}
    </span>
  );
}

export default async function AdminSertifikatPage() {
  await wajibAdmin();
  const supabase = await buatKlienServer();

  const [{ data: enroll }, { data: sertifikat }] = await Promise.all([
    supabase
      .from("enrollments")
      .select("id, santri_id, course_id, status, profiles(nama), courses(judul)")
      .neq("status", "berhenti"),
    supabase
      .from("sertifikat")
      .select("*, profiles!sertifikat_santri_id_fkey(nama), courses(judul)")
      .order("tgl_terbit", { ascending: false }),
  ]);

  const sudahPunya = new Set(
    (sertifikat ?? []).map((s) => `${s.santri_id}:${s.course_id}`),
  );
  const calon = (enroll ?? []).filter(
    (e) => !sudahPunya.has(`${e.santri_id}:${e.course_id}`),
  );

  const capaian = new Map<string, RingkasanCapaian>();
  for (const e of calon) {
    const { data } = await supabase.rpc("ringkasan_capaian", {
      p_santri: e.santri_id,
      p_course: e.course_id,
    });
    if (data) capaian.set(e.id, data);
  }

  // Yang paling mendekati lulus ditaruh di atas: itulah yang perlu diperiksa admin.
  const urut = [...calon].sort(
    (a, b) =>
      (capaian.get(b.id)?.progres_persen ?? 0) - (capaian.get(a.id)?.progres_persen ?? 0),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <JudulHalaman
        judul="Sertifikat"
        keterangan={`Syarat kelulusan: materi tuntas 100%, rata-rata nilai minimal ${SYARAT_SERTIFIKAT.minRataNilai}, kehadiran minimal ${SYARAT_SERTIFIKAT.minKehadiranPersen}%.`}
      />

      <h2 className="font-heading mb-3 text-lg font-semibold">Calon penerima</h2>
      {urut.length === 0 ? (
        <Card className="mb-10 p-8 text-center text-sm text-muted-foreground">
          Semua santriwati yang terdaftar sudah menerima sertifikatnya.
        </Card>
      ) : (
        <div className="mb-10 space-y-2">
          {urut.map((e) => {
            const c = capaian.get(e.id);
            const materiOk = (c?.progres_persen ?? 0) >= SYARAT_SERTIFIKAT.minProgresPersen;
            const nilaiOk = (c?.nilai_rata ?? 0) >= SYARAT_SERTIFIKAT.minRataNilai;
            const hadirOk =
              (c?.kehadiran_persen ?? 0) >= SYARAT_SERTIFIKAT.minKehadiranPersen;
            const lulus = materiOk && nilaiOk && hadirOk;

            return (
              <Card key={e.id} className="flex-row flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{e.profiles?.nama}</p>
                  <p className="text-xs text-muted-foreground">{e.courses?.judul}</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                    <Syarat terpenuhi={materiOk} teks={`Materi ${c?.progres_persen ?? 0}%`} />
                    <Syarat
                      terpenuhi={nilaiOk}
                      teks={`Nilai ${c?.nilai_rata ?? "—"}`}
                    />
                    <Syarat
                      terpenuhi={hadirOk}
                      teks={`Hadir ${c?.kehadiran_persen ?? 0}%`}
                    />
                  </div>
                </div>

                <TombolTerbitkan
                  santriId={e.santri_id}
                  courseId={e.course_id}
                  namaSantri={e.profiles?.nama ?? "Santriwati ini"}
                  memenuhiSyarat={lulus}
                />
              </Card>
            );
          })}
        </div>
      )}

      <h2 className="font-heading mb-3 text-lg font-semibold">Sudah diterbitkan</h2>
      {!sertifikat || sertifikat.length === 0 ? (
        <KeadaanKosong
          ikon={Award}
          judul="Belum ada sertifikat terbit"
          keterangan="Sertifikat yang sudah diterbitkan akan tercatat di sini beserta nomornya."
        />
      ) : (
        <div className="space-y-2">
          {sertifikat.map((s) => (
            <Card key={s.id} className="flex-row flex-wrap items-center gap-3 p-4">
              <Award className="size-5 shrink-0 text-emas" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{s.profiles?.nama}</p>
                <p className="font-mono text-xs text-muted-foreground">{s.nomor}</p>
              </div>
              <span className="text-xs text-muted-foreground">{s.courses?.judul}</span>
              {s.predikat && <Badge variant="secondary">{s.predikat}</Badge>}
              <span className="text-xs text-muted-foreground">{tanggal(s.tgl_terbit)}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
