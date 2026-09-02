import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, PlayCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { DaftarKurikulum } from "@/components/belajar/daftar-kurikulum";
import { wajibMasuk } from "@/lib/auth";
import { muatIsiKelas } from "@/lib/kelas-santri";
import { durasi } from "@/lib/format";

export async function generateMetadata({
  params,
}: PageProps<"/belajar/[kelas]">): Promise<Metadata> {
  const { kelas } = await params;
  return { title: kelas };
}

export default async function RingkasanKelasPage({
  params,
}: PageProps<"/belajar/[kelas]">) {
  const { kelas: slug } = await params;
  const pengguna = await wajibMasuk();
  const isi = await muatIsiKelas(slug, pengguna.id);
  if (!isi) notFound();

  // Pelajaran pertama yang belum selesai; kalau semua selesai, kembali ke awal.
  const lanjut = isi.urut.find((l) => !l.selesai) ?? isi.urut[0];
  const totalDetik = isi.urut.reduce((t, l) => t + l.durasi_detik, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <TautanTombol href="/belajar" variant="ghost" size="sm" className="mb-4 -ml-2">
        <ArrowLeft className="size-4" />
        Kelas Saya
      </TautanTombol>

      <div className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          {isi.kelas.jenjang && <Badge variant="secondary">{isi.kelas.jenjang}</Badge>}
          {isi.enrollment.status === "selesai" && <Badge>Lulus</Badge>}
        </div>

        <h1 className="font-heading text-3xl font-bold tracking-tight">{isi.kelas.judul}</h1>
        {isi.kelas.subjudul && (
          <p className="mt-2 leading-relaxed text-muted-foreground">{isi.kelas.subjudul}</p>
        )}
      </div>

      <Card className="mb-8 gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-4" />
              {isi.total} pelajaran
            </span>
            <span>{durasi(totalDetik)}</span>
          </div>
          {lanjut && (
            <TautanTombol href={`/belajar/${slug}/${lanjut.slug}`}>
              <PlayCircle className="size-4" />
              {isi.selesai === 0 ? "Mulai Belajar" : "Lanjutkan"}
            </TautanTombol>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {isi.selesai} dari {isi.total} pelajaran selesai
            </span>
            <span className="font-semibold tabular-nums">{isi.persen}%</span>
          </div>
          <Progress value={isi.persen} className="h-2.5" />
        </div>
      </Card>

      <h2 className="font-heading mb-4 text-lg font-semibold">Materi kelas</h2>
      <Card className="p-5">
        <DaftarKurikulum bab={isi.bab} slugKelas={slug} />
      </Card>
    </div>
  );
}
