"use client";

import { useEffect, useRef } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let muatanApi: Promise<void> | null = null;

/** Memuat IFrame API sekali saja, meski beberapa pemutar dipasang bergantian. */
function muatApiYouTube(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (muatanApi) return muatanApi;

  muatanApi = new Promise<void>((selesai) => {
    const sebelumnya = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      sebelumnya?.();
      selesai();
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    document.head.appendChild(s);
  });
  return muatanApi;
}

export type PropsPemutar = {
  videoId: string;
  /** Detik terakhir yang ditonton, untuk melanjutkan dari posisi sebelumnya. */
  mulaiDari?: number;
  /** Dipanggil berkala (~10 detik) dengan posisi tonton saat ini. */
  onPosisi?: (detik: number) => void;
  /** Dipanggil sekali ketika ambang penyelesaian tercapai. */
  onSelesai?: () => void;
  /** Bagian durasi yang menandai selesai, mis. 0.9 untuk 90%. */
  ambangSelesai?: number;
};

export function PemutarYouTube({
  videoId,
  mulaiDari = 0,
  onPosisi,
  onSelesai,
  ambangSelesai = 0.9,
}: PropsPemutar) {
  const wadah = useRef<HTMLDivElement>(null);
  const player = useRef<any>(null);
  const sudahSelesai = useRef(false);

  // Simpan callback di ref supaya efek utama tidak perlu dijalankan ulang
  // (dan memuat ulang video dari awal) setiap kali komponen induk render.
  // Penyalinannya dilakukan di dalam efek: menulis ref saat render melanggar
  // aturan kemurnian React.
  const cbPosisi = useRef(onPosisi);
  const cbSelesai = useRef(onSelesai);

  useEffect(() => {
    cbPosisi.current = onPosisi;
    cbSelesai.current = onSelesai;
  });

  useEffect(() => {
    let dibatalkan = false;
    let jeda: ReturnType<typeof setInterval> | undefined;
    sudahSelesai.current = false;

    muatApiYouTube().then(() => {
      if (dibatalkan || !wadah.current) return;

      player.current = new window.YT.Player(wadah.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          start: Math.floor(mulaiDari),
          hl: "id",
          cc_lang_pref: "id",
        },
        events: {
          onStateChange: (e: any) => {
            const MEMUTAR = 1;
            const TAMAT = 0;
            if (e.data === TAMAT && !sudahSelesai.current) {
              sudahSelesai.current = true;
              cbSelesai.current?.();
            }
            if (e.data !== MEMUTAR) {
              clearInterval(jeda);
              // Simpan posisi juga saat dijeda, agar berpindah halaman
              // tidak menghilangkan kemajuan menonton.
              const p = player.current?.getCurrentTime?.();
              if (typeof p === "number") cbPosisi.current?.(p);
              return;
            }

            clearInterval(jeda);
            jeda = setInterval(() => {
              const p = player.current;
              if (!p?.getCurrentTime) return;
              const sekarang = p.getCurrentTime();
              const total = p.getDuration?.() ?? 0;
              cbPosisi.current?.(sekarang);
              if (!sudahSelesai.current && total > 0 && sekarang / total >= ambangSelesai) {
                sudahSelesai.current = true;
                cbSelesai.current?.();
              }
            }, 10_000);
          },
        },
      });
    });

    return () => {
      dibatalkan = true;
      clearInterval(jeda);
      player.current?.destroy?.();
      player.current = null;
    };
    // mulaiDari sengaja tidak masuk daftar: perubahannya tidak boleh memuat
    // ulang pemutar di tengah tontonan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, ambangSelesai]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
      <div ref={wadah} className="size-full" />
    </div>
  );
}
