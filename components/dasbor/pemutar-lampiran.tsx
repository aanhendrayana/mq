"use client";

import { useState } from "react";
import { FileText, ImageIcon, Music, Presentation, SquarePlay, Video } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { LampiranPertemuan } from "@/lib/lampiran";

const IKON_TIPE = {
  youtube: SquarePlay,
  pdf: FileText,
  slide: Presentation,
  audio: Music,
  gambar: ImageIcon,
  vicon: Video,
} as const;

/**
 * Daftar lampiran satu pertemuan sebagai tombol — diklik membuka dialog
 * berisi pemutar yang sesuai (video YouTube, PDF, slide, audio, gambar),
 * semuanya diputar langsung di aplikasi, bukan diunduh.
 *
 * Kecuali "vicon": Zoom/Google Meet menolak dibuka dalam iframe, jadi
 * tombolnya tautan biasa yang terbuka di tab baru, bukan dialog pemutar.
 */
export function PemutarLampiran({ lampiran }: { lampiran: LampiranPertemuan[] }) {
  const [terbuka, setTerbuka] = useState<LampiranPertemuan | null>(null);

  if (lampiran.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {lampiran.map((l, i) => {
          const Ikon = IKON_TIPE[l.tipe];
          if (l.tipe === "vicon") {
            return (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ size: "sm", variant: "outline" })}
              >
                <Ikon className="size-3.5" />
                {l.nama}
              </a>
            );
          }
          return (
            <Button
              key={i}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setTerbuka(l)}
            >
              <Ikon className="size-3.5" />
              {l.nama}
            </Button>
          );
        })}
      </div>

      <Dialog open={Boolean(terbuka)} onOpenChange={(v) => !v && setTerbuka(null)}>
        <DialogContent className="overflow-hidden sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{terbuka?.nama}</DialogTitle>
          </DialogHeader>
          {terbuka && <IsiLampiran lampiran={terbuka} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function IsiLampiran({ lampiran }: { lampiran: LampiranPertemuan }) {
  switch (lampiran.tipe) {
    case "youtube":
      // url sudah berupa ID video murni — dirapikan saat disimpan di server.
      return (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${lampiran.url}`}
            title={lampiran.nama}
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    case "pdf":
      return (
        <iframe
          src={lampiran.url}
          title={lampiran.nama}
          className="h-[75vh] w-full rounded-lg border"
        />
      );
    case "slide":
      return (
        <div className="aspect-video w-full overflow-hidden rounded-lg border">
          <iframe src={lampiran.url} title={lampiran.nama} className="size-full" allowFullScreen />
        </div>
      );
    case "audio":
      return (
        <audio controls className="w-full" src={lampiran.url}>
          Peramban Anda tidak mendukung pemutaran audio.
        </audio>
      );
    case "gambar":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={lampiran.url}
          alt={lampiran.nama}
          className="max-h-[75vh] w-full rounded-lg object-contain"
        />
      );
    case "vicon":
      // Tidak pernah sampai sini — tombol "vicon" langsung jadi tautan
      // biasa di PemutarLampiran, tidak membuka dialog ini.
      return null;
  }
}
