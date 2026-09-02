"use client";

import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDetak } from "@/hooks/use-detak";
import { MENIT_BUKA_LINK_HALAQAH } from "@/lib/konstanta";

/**
 * Tombol gabung halaqah yang baru aktif menjelang jadwal.
 *
 * Waktunya dipantau di klien karena halaman ini bisa dibuka jauh sebelum sesi
 * dimulai; kalau dihitung sekali saat render, tombolnya tidak akan pernah
 * berubah menjadi aktif tanpa memuat ulang halaman.
 */
export function TombolGabung({
  mulaiAt,
  link,
}: {
  mulaiAt: string;
  link: string | null;
}) {
  const sekarang = useDetak();

  if (!link) {
    return (
      <p className="text-xs text-muted-foreground">
        Tautan pertemuan belum diisi ustadz pembimbing.
      </p>
    );
  }

  const ambang =
    new Date(mulaiAt).getTime() - MENIT_BUKA_LINK_HALAQAH * 60_000;
  // Selama waktu klien belum diketahui (render server & hidrasi awal), tombol
  // dianggap belum aktif — lebih baik terlambat aktif daripada berkedip.
  const aktif = sekarang !== null && sekarang >= ambang;

  if (!aktif) {
    return (
      <Button size="sm" disabled className="w-fit">
        <Video className="size-4" />
        Tautan aktif {MENIT_BUKA_LINK_HALAQAH} menit sebelum mulai
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      className="w-fit"
      nativeButton={false}
      render={
        <a href={link} target="_blank" rel="noopener noreferrer">
          <Video className="size-4" />
          Gabung Halaqah
        </a>
      }
    />
  );
}
