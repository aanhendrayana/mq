import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { JudulHalaman } from "@/components/dasbor/judul-halaman";
import { FormKelas } from "@/components/admin/form-kelas";
import { EditorKurikulum, type BabAdmin } from "@/components/admin/editor-kurikulum";
import { wajibAdmin } from "@/lib/auth";
import { buatKlienServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Kelola Kelas" };

export default async function AdminDetailKelasPage({
  params,
}: PageProps<"/admin/kelas/[id]">) {
  const { id } = await params;
  await wajibAdmin();
  const supabase = await buatKlienServer();

  const { data: kelas } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!kelas) notFound();

  const [{ data: program }, { data: modul }, { data: pelajaran }] = await Promise.all([
    supabase.from("programs").select("id, nama").order("urutan"),
    supabase.from("modules").select("*").eq("course_id", id).order("urutan"),
    supabase.from("lessons").select("*").eq("course_id", id).order("urutan"),
  ]);

  const bab: BabAdmin[] = (modul ?? []).map((m) => ({
    ...m,
    pelajaran: (pelajaran ?? []).filter((l) => l.module_id === m.id),
  }));

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
          kelas.is_published ? (
            <TautanTombol href={`/program/${kelas.slug}`} variant="outline" target="_blank">
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
        </TabsList>

        <TabsContent value="materi">
          <EditorKurikulum courseId={kelas.id} bab={bab} />
        </TabsContent>

        <TabsContent value="detail">
          <Card className="p-6">
            <FormKelas key={kelas.diubah_at} kelas={kelas} program={program ?? []} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
