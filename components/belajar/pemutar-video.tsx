"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PemutarYouTube } from "@/components/belajar/pemutar-youtube";
import { simpanProgresAction } from "@/app/(santri)/belajar/[kelas]/actions";
import { AMBANG_SELESAI_VIDEO } from "@/lib/konstanta";
import type { PenyediaVideo } from "@/lib/database.types";

type Props = {
  lessonId: string;
  courseId: string;
  provider: PenyediaVideo;
  videoId: string | null;
  mulaiDari: number;
  sudahSelesai: boolean;
};

/**
 * Lapisan pemisah antara halaman pelajaran dan penyedia video.
 *
 * Penyedia disimpan per pelajaran di database, jadi memindahkan materi dari
 * YouTube ke Bunny.net nanti cukup dengan menambah satu cabang di sini —
 * tanpa mengubah halaman, tabel, atau data yang sudah ada.
 */
export function PemutarVideo({
  lessonId,
  courseId,
  provider,
  videoId,
  mulaiDari,
  sudahSelesai,
}: Props) {
  const router = useRouter();
  const [selesai, setSelesai] = useState(sudahSelesai);
  const [menyimpan, mulaiTransisi] = useTransition();
  const posisiTerakhir = useRef(mulaiDari);

  const simpanPosisi = useCallback(
    (detik: number) => {
      posisiTerakhir.current = detik;
      // Tidak perlu menunggu hasilnya: ini penanda kenyamanan, bukan data kritis.
      void simpanProgresAction({ lessonId, courseId, detik, selesai: false });
    },
    [lessonId, courseId],
  );

  const tandaiSelesai = useCallback(
    (otomatis: boolean) => {
      if (selesai) return;
      setSelesai(true);
      mulaiTransisi(async () => {
        const hasil = await simpanProgresAction({
          lessonId,
          courseId,
          detik: posisiTerakhir.current,
          selesai: true,
        });
        if (!hasil.ok) {
          setSelesai(false);
          toast.error(hasil.pesan ?? "Gagal menyimpan progres.");
          return;
        }
        toast.success(
          otomatis ? "Pelajaran ditandai selesai." : "Pelajaran ditandai selesai.",
        );
        router.refresh();
      });
    },
    [selesai, lessonId, courseId, router],
  );

  if (!videoId) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted text-center">
        <VideoOff className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Video pelajaran ini belum tersedia.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {provider === "youtube" ? (
        <PemutarYouTube
          videoId={videoId}
          mulaiDari={mulaiDari}
          ambangSelesai={AMBANG_SELESAI_VIDEO}
          onPosisi={simpanPosisi}
          onSelesai={() => tandaiSelesai(true)}
        />
      ) : (
        // Penyedia lain (Bunny.net, dsb.) belum dipasang. Ditangani
        // secara eksplisit agar tidak diam-diam menampilkan layar kosong.
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted text-center">
          <VideoOff className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Penyedia video &ldquo;{provider}&rdquo; belum didukung.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          {selesai
            ? "Pelajaran ini sudah Anda selesaikan."
            : `Ditandai selesai otomatis setelah ${Math.round(AMBANG_SELESAI_VIDEO * 100)}% video ditonton.`}
        </p>
        <Button
          variant={selesai ? "secondary" : "default"}
          size="sm"
          disabled={selesai || menyimpan}
          onClick={() => tandaiSelesai(false)}
        >
          <CheckCircle2 className="size-4" />
          {selesai ? "Selesai" : "Tandai Selesai"}
        </Button>
      </div>
    </div>
  );
}
