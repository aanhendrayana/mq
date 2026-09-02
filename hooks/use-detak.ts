"use client";

import { useSyncExternalStore } from "react";

/*
 * Satu detak waktu bersama untuk seluruh komponen yang perlu tahu "sekarang".
 *
 * Disimpan di tingkat modul (bukan state per komponen) supaya sepuluh kartu
 * jadwal di satu halaman berbagi satu interval, bukan menyalakan sepuluh.
 * Snapshot-nya disimpan sebagai nilai tetap antar-detak; useSyncExternalStore
 * membandingkan hasil getSnapshot dengan Object.is, jadi mengembalikan
 * Date.now() yang baru setiap panggilan akan memicu render tanpa henti.
 */
let detak = Date.now();
const pendengar = new Set<() => void>();
let pewaktu: ReturnType<typeof setInterval> | null = null;

function berlangganan(beritahu: () => void) {
  pendengar.add(beritahu);

  if (!pewaktu) {
    // Segarkan saat pelanggan pertama masuk: nilai `detak` bisa basi bila
    // seluruh komponen sempat dilepas dan intervalnya dihentikan.
    detak = Date.now();
    pewaktu = setInterval(() => {
      detak = Date.now();
      pendengar.forEach((f) => f());
    }, 30_000);
  }

  return () => {
    pendengar.delete(beritahu);
    if (pendengar.size === 0 && pewaktu) {
      clearInterval(pewaktu);
      pewaktu = null;
    }
  };
}

/**
 * Waktu sekarang di peramban, disegarkan tiap 30 detik.
 *
 * Namanya memakai awalan `use` (bukan `gunakan`) karena React mewajibkan
 * setiap hook diawali begitu agar aturan hook bisa ditegakkan linter.
 *
 * Mengembalikan `null` saat render di server dan pada render hidrasi pertama,
 * sehingga tidak pernah terjadi ketidakcocokan hidrasi. Penggunanya harus
 * menganggap `null` sebagai "belum diketahui" dan menampilkan keadaan yang aman.
 */
export function useDetak(): number | null {
  return useSyncExternalStore(
    berlangganan,
    () => detak,
    () => null,
  );
}
