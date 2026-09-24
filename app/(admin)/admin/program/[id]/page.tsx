import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { JudulHalaman } from "@/components/dasbor/judul-halaman";
import { EditorTemplateProgram, type BabTemplate } from "@/components/admin/editor-template-program";
import { FormDetailProgram } from "@/components/admin/form-detail-program";
import { wajibAdmin } from "@/lib/auth";
import { buatKlienServer } from "@/lib/db/server";

export const metadata: Metadata = { title: "Template Program" };

export default async function AdminTemplateProgramPage({
  params,
}: PageProps<"/admin/program/[id]">) {
  const { id } = await params;
  await wajibAdmin();
  const db = await buatKlienServer();

  const { data: program } = await db.from("programs").select("*").eq("id", id).maybeSingle();
  if (!program) notFound();

  const [{ data: babMentah }, { data: pertemuanMentah }] = await Promise.all([
    db.from("template_bab").select("*").eq("program_id", id).order("urutan"),
    db.from("template_pertemuan").select("*").eq("program_id", id).order("pertemuan_ke"),
  ]);

  const bab: BabTemplate[] = (babMentah ?? []).map((b) => ({
    ...b,
    pertemuan: (pertemuanMentah ?? []).filter((p) => p.bab_id === b.id),
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <TautanTombol href="/admin/program" variant="ghost" size="sm" className="mb-4 -ml-2">
        <ArrowLeft className="size-4" />
        Template Program
      </TautanTombol>

      <JudulHalaman
        judul={program.nama}
        keterangan="Rencana pertemuan (RPS) dan isi halaman jual program ini — berlaku untuk semua kelas di bawahnya."
      />

      <Tabs defaultValue="pertemuan">
        <TabsList className="mb-6">
          <TabsTrigger value="pertemuan">Rencana Pertemuan</TabsTrigger>
          <TabsTrigger value="detail">Detail Program</TabsTrigger>
        </TabsList>

        <TabsContent value="pertemuan">
          <p className="mb-4 text-sm text-muted-foreground">
            Disusun per bab seperti materi video. Ustadzah hanya mengisi link
            vicon dan menyesuaikan tanggal/jam pada sesi hasil salinan ini.
          </p>
          <EditorTemplateProgram programId={program.id} bab={bab} />
        </TabsContent>

        <TabsContent value="detail">
          <Card className="p-6">
            <FormDetailProgram key={program.diubah_at} program={program} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
