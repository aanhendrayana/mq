import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Download, ListTree } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { PemutarVideo } from "@/components/belajar/pemutar-video";
import { DaftarKurikulum } from "@/components/belajar/daftar-kurikulum";
import { wajibMasuk } from "@/lib/auth";
import { muatIsiKelas } from "@/lib/kelas-santri";

export async function generateMetadata({
  params,
}: PageProps<"/belajar/[kelas]/[pelajaran]">): Promise<Metadata> {
  const { pelajaran } = await params;
  return { title: pelajaran };
}

export default async function PelajaranPage({
  params,
}: PageProps<"/belajar/[kelas]/[pelajaran]">) {
  const { kelas: slugKelas, pelajaran: slugPelajaran } = await params;
  const pengguna = await wajibMasuk();
  const isi = await muatIsiKelas(slugKelas, pengguna.id);
  if (!isi) notFound();

  const indeks = isi.urut.findIndex((l) => l.slug === slugPelajaran);
  if (indeks === -1) notFound();

  const pelajaran = isi.urut[indeks];
  const sebelumnya = indeks > 0 ? isi.urut[indeks - 1] : null;
  const berikutnya = indeks < isi.urut.length - 1 ? isi.urut[indeks + 1] : null;
  const lampiran = pelajaran.lampiran ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* --------------------------------------------------------- Utama */}
        <div className="min-w-0">
          <TautanTombol
            href={`/belajar/${slugKelas}`}
            variant="ghost"
            size="sm"
            className="mb-3 -ml-2"
          >
            <ArrowLeft className="size-4" />
            {isi.kelas.judul}
          </TautanTombol>

          <h1 className="font-heading mb-1 text-2xl font-bold tracking-tight">
            {pelajaran.judul}
          </h1>
          <p className="mb-5 text-sm text-muted-foreground">
            Pelajaran {indeks + 1} dari {isi.total}
          </p>

          {pelajaran.tipe === "video" ? (
            <PemutarVideo
              lessonId={pelajaran.id}
              courseId={isi.kelas.id}
              provider={pelajaran.video_provider}
              videoId={pelajaran.video_id}
              mulaiDari={pelajaran.detik_terakhir}
              sudahSelesai={pelajaran.selesai}
            />
          ) : (
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">
                Pelajaran ini berupa materi bacaan. Tandai selesai setelah Anda
                mempelajarinya.
              </p>
              <div className="mt-4">
                <PemutarVideo
                  lessonId={pelajaran.id}
                  courseId={isi.kelas.id}
                  provider={pelajaran.video_provider}
                  videoId={null}
                  mulaiDari={0}
                  sudahSelesai={pelajaran.selesai}
                />
              </div>
            </Card>
          )}

          {pelajaran.konten_md && (
            <Card className="mt-6 p-6">
              <h2 className="font-heading mb-3 font-semibold">Catatan pelajaran</h2>
              <p className="leading-relaxed whitespace-pre-line text-muted-foreground">
                {pelajaran.konten_md}
              </p>
            </Card>
          )}

          {lampiran.length > 0 && (
            <Card className="mt-6 p-6">
              <h2 className="font-heading mb-3 font-semibold">Lampiran</h2>
              <ul className="space-y-2">
                {lampiran.map((l) => (
                  <li key={l.url}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Download className="size-4" />
                      {l.nama}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Separator className="my-8" />

          <nav className="flex flex-wrap items-center justify-between gap-3">
            {sebelumnya ? (
              <TautanTombol
                href={`/belajar/${slugKelas}/${sebelumnya.slug}`}
                variant="outline"
                className="max-w-[45%]"
              >
                <ArrowLeft className="size-4" />
                <span className="truncate">{sebelumnya.judul}</span>
              </TautanTombol>
            ) : (
              <span />
            )}

            {berikutnya && (
              <TautanTombol
                href={`/belajar/${slugKelas}/${berikutnya.slug}`}
                className="max-w-[45%]"
              >
                <span className="truncate">{berikutnya.judul}</span>
                <ArrowRight className="size-4" />
              </TautanTombol>
            )}
          </nav>
        </div>

        {/* ------------------------------------------------------ Kurikulum */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card className="gap-4 p-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  <ListTree className="size-4" />
                  Materi kelas
                </span>
                <span className="tabular-nums text-muted-foreground">{isi.persen}%</span>
              </div>
              <Progress value={isi.persen} className="h-1.5" />
            </div>

            <div className="max-h-[65vh] overflow-y-auto">
              <DaftarKurikulum
                bab={isi.bab}
                slugKelas={slugKelas}
                slugAktif={slugPelajaran}
              />
            </div>

            <Link
              href="/belajar/jadwal"
              className="rounded-lg bg-secondary/60 p-3 text-xs leading-relaxed text-secondary-foreground hover:bg-secondary"
            >
              Sudah paham materinya? Setorkan bacaan Anda di halaqah berikutnya →
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}
