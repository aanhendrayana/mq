import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { JudulHalaman } from "@/components/dasbor/judul-halaman";
import { TabelPenilaian, type BarisSantri } from "@/components/pengajar/tabel-penilaian";
import { wajibPengajar } from "@/lib/auth";
import { buatKlienServer } from "@/lib/db/server";
import { tanggalJam } from "@/lib/format";

export const metadata: Metadata = { title: "Absensi & Penilaian" };

export default async function SesiPage({
  params,
}: PageProps<"/pengajar/batch/[id]/sesi/[sid]">) {
  const { id, sid } = await params;
  await wajibPengajar();
  const db = await buatKlienServer();

  const { data: sesi } = await db
    .from("sesi_halaqah")
    .select("*, batches(nama, courses(judul))")
    .eq("id", sid)
    .eq("batch_id", id)
    .maybeSingle();
  if (!sesi) notFound();

  const { data: enroll } = await db
    .from("enrollments")
    .select("id, santri_id, profiles(nama)")
    .eq("batch_id", id)
    .neq("status", "berhenti");

  const idSantri = (enroll ?? []).map((e) => e.santri_id);

  const [{ data: kehadiran }, { data: penilaian }] = idSantri.length
    ? await Promise.all([
        db.from("kehadiran").select("*").eq("sesi_id", sid),
        db.from("penilaian_setoran").select("*").eq("sesi_id", sid),
      ])
    : [{ data: [] }, { data: [] }];

  const awal: BarisSantri[] = (enroll ?? [])
    .map((e) => {
      const h = (kehadiran ?? []).find((k) => k.santri_id === e.santri_id);
      const n = (penilaian ?? []).find((p) => p.santri_id === e.santri_id);
      return {
        santri_id: e.santri_id,
        enrollment_id: e.id,
        nama: e.profiles?.nama ?? "(tanpa nama)",
        // Default 'hadir': lebih cepat bagi ustadzah mengubah beberapa yang absen
        // daripada mencentang seluruh kelas satu per satu.
        status: h?.status ?? "hadir",
        nilai_makhraj: n?.nilai_makhraj ?? 80,
        nilai_tajwid: n?.nilai_tajwid ?? 80,
        nilai_kelancaran: n?.nilai_kelancaran ?? 80,
        nilai_adab: n?.nilai_adab ?? 85,
        materi: n?.materi ?? "",
        catatan_ustadz: n?.catatan_ustadz ?? "",
        sudahDinilai: Boolean(n),
      };
    })
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <TautanTombol
        href={`/pengajar/batch/${id}`}
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="size-4" />
        {sesi.batches?.nama}
      </TautanTombol>

      <JudulHalaman
        judul={`Pertemuan ${sesi.pertemuan_ke}: ${sesi.judul}`}
        keterangan={sesi.batches?.courses?.judul}
      />

      <Card className="mb-6 gap-1 p-4">
        <p className="flex items-center gap-2 text-sm">
          <CalendarDays className="size-4 text-muted-foreground" />
          {tanggalJam(sesi.mulai_at)} · {sesi.durasi_menit} menit
        </p>
        {sesi.materi && (
          <p className="text-sm text-muted-foreground">Materi: {sesi.materi}</p>
        )}
      </Card>

      {awal.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Belum ada santriwati di angkatan ini, jadi tidak ada yang bisa diabsen.
        </Card>
      ) : (
        <TabelPenilaian
          sesiId={sid}
          batchId={id}
          materiSesi={sesi.materi ?? ""}
          awal={awal}
        />
      )}
    </div>
  );
}
