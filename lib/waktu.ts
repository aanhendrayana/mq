import "server-only";

/**
 * Waktu server saat permintaan ini diproses.
 *
 * Dibungkus fungsi async, bukan `Date.now()` langsung di badan komponen, karena
 * dua alasan: nilainya dibaca sekali per permintaan (bukan berubah-ubah di
 * tengah render), dan memanggil sumber tak murni langsung saat render melanggar
 * aturan kemurnian React.
 *
 * Semua perbandingan "sudah lewat / akan datang" memakai waktu server, bukan
 * jam perangkat pengguna — jam perangkat bisa salah atau berbeda zona waktu.
 */
export async function waktuPermintaan(): Promise<Date> {
  return new Date();
}
