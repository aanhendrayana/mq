import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { JudulHalaman } from "@/components/dasbor/judul-halaman";
import { FormKelas } from "@/components/admin/form-kelas";
import { EditorKurikulum, type BabAdmin } from "@/components/admin/editor-kurikulum";
import { DialogBatch } from "@/components/admin/dialog-batch";
import { DaftarRombel } from "@/components/admin/daftar-rombel";
import { wajibAdmin } from "@/lib/auth";
import { buatKlienServer } from "@/lib/db/server";

export const metadata: Metadata = { title: "Kelola Kelas" };

export default async function AdminDetailKelasPage({
  params,
}: PageProps<"/admin/kelas/[id]">) {
  const { id } = await params;
  await wajibAdmin();
  const db = await buatKlienServer();

  const { data: kelas } = await db
    .from("courses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!kelas) notFound();

  // Ustadzah/Ummi Rifa/Admin yang boleh ditugaskan membimbing rombel —
  // peran sekarang tabel terpisah, jadi cari dulu id akunnya lewat itu.
  const { data: tagPengajar } = await db
    .from("pengguna_peran")
    .select("pengguna_id")
    .in("peran", ["ustadz", "ummi", "admin"]);
  const idPengajar = [...new Set((tagPengajar ?? []).map((t) => t.pengguna_id))];

  const [{ data: program }, { data: modul }, { data: pelajaran }, { data: rombel }, { data: pengajar }, { data: enroll }] =
    await Promise.all([
      db.from("programs").select("id, nama, slug").order("urutan"),
      db.from("modules").select("*").eq("course_id", id).order("urutan"),
      db.from("lessons").select("*").eq("course_id", id).order("urutan"),
      db
        .from("batches")
        .select("*, courses(judul), profiles(nama)")
        .eq("course_id", id)
        .order("tgl_mulai", { ascending: false }),
      idPengajar.length
        ? db.from("profiles").select("id, nama").in("id", idPengajar).order("nama")
        : Promise.resolve({ data: [] as { id: string; nama: string }[], error: null }),
      db
        .from("enrollments")
        .select("id, santri_id, batch_id, course_id, status, profiles(nama)")
        .eq("course_id", id)
        .neq("status", "berhenti"),
    ]);

  const bab: BabAdmin[] = (modul ?? []).map((m) => ({
    ...m,
    pelajaran: (pelajaran ?? []).filter((l) => l.module_id === m.id),
  }));

  const programSendiri = (program ?? []).find((p) => p.id === kelas.program_id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <TautanTombol href="/admin/kelas" variant="ghost" size="sm" className="mb-4 -ml-2">
        <ArrowLeft className="size-4" />
        Kelas & Materi
      </TautanTombol>

      <JudulHalaman
        judul={kelas.judul}
        keterangan={kelas.is_published ? "Terbit di katalog publik" : "Masih draf"}
        aksi={
          kelas.is_published && programSendiri ? (
            <TautanTombol href={`/program/${programSendiri.slug}`} variant="outline" target="_blank">
              <ExternalLink className="size-4" />
              Lihat Halaman Publik
            </TautanTombol>
          ) : undefined
        }
      />

      <Tabs defaultValue="materi">
        <TabsList className="mb-6">
          <TabsTrigger value="materi">Bab &amp; Pelajaran</TabsTrigger>
          <TabsTrigger value="detail">Detail Kelas</TabsTrigger>
          <TabsTrigger value="penugasan">Rombel &amp; Penugasan</TabsTrigger>
        </TabsList>

        <TabsContent value="materi">
          <EditorKurikulum courseId={kelas.id} bab={bab} />
        </TabsContent>

        <TabsContent value="detail">
          <Card className="p-6">
            <FormKelas key={kelas.diubah_at} kelas={kelas} program={program ?? []} />
          </Card>
        </TabsContent>

        <TabsContent value="penugasan">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Tugaskan ustadzah pembimbing tiap rombel, dan tempatkan santriwati
              yang sudah membayar kelas ini ke rombelnya.
            </p>
            <DialogBatch
              kelas={[{ id: kelas.id, judul: kelas.judul }]}
              pengajar={pengajar ?? []}
              pemicu={
                <>
                  <Plus className="size-4" />
                  Rombel Baru
                </>
              }
            />
          </div>
          <DaftarRombel
            batches={rombel ?? []}
            kelas={[{ id: kelas.id, judul: kelas.judul }]}
            pengajar={pengajar ?? []}
            enroll={enroll ?? []}
            tautanKelasnya={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
