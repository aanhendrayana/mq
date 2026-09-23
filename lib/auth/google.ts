/**
 * Nilai bersama untuk alur masuk/daftar dengan akun Google (OpenID Connect).
 *
 * Berkas ini sengaja bebas dari `server-only` supaya peta pesan galat bisa
 * dipakai juga oleh komponen klien di halaman /masuk dan /daftar.
 */

export const COOKIE_GOOGLE_STATE = "mq_google_state";
export const COOKIE_GOOGLE_VERIFIER = "mq_google_verifier";
export const COOKIE_GOOGLE_NONCE = "mq_google_nonce";
export const COOKIE_GOOGLE_TUJUAN = "mq_google_next";
export const COOKIE_GOOGLE_ASAL = "mq_google_asal";

/** Semua cookie sementara yang dipakai selama alur OAuth berlangsung. */
export const COOKIE_SEMENTARA_GOOGLE = [
  COOKIE_GOOGLE_STATE,
  COOKIE_GOOGLE_VERIFIER,
  COOKIE_GOOGLE_NONCE,
  COOKIE_GOOGLE_TUJUAN,
  COOKIE_GOOGLE_ASAL,
] as const;

/** Umur cookie sementara OAuth: cukup untuk satu kali bolak-balik ke Google. */
export const UMUR_COOKIE_OAUTH = 10 * 60;

/**
 * Menyaring tujuan setelah berhasil masuk supaya hanya menerima path internal
 * (menolak `//situs-lain.com` yang oleh browser dibaca sebagai URL absolut).
 */
export function tujuanAman(nilai: string | null | undefined): string {
  return nilai?.startsWith("/") && !nilai.startsWith("//") ? nilai : "/belajar";
}

/** Halaman tempat pengguna memulai: dipakai saat alur Google gagal. */
export function asalAman(nilai: string | null | undefined): "/masuk" | "/daftar" {
  return nilai === "/masuk" ? "/masuk" : "/daftar";
}

/** Pesan yang ditampilkan di halaman masuk/daftar untuk tiap kode galat. */
export const PESAN_GALAT_GOOGLE: Record<string, string> = {
  google_belum_dikonfigurasi:
    "Masuk dengan Google belum dikonfigurasi di server. Silakan pakai email dan kata sandi.",
  google_dibatalkan: "Anda membatalkan proses masuk dengan Google.",
  google_gagal: "Masuk dengan Google gagal. Silakan coba lagi.",
  google_email_belum_terverifikasi:
    "Email Google Anda belum terverifikasi. Verifikasi dulu di akun Google, atau daftar dengan email.",
};

/** Mengambil pesan yang pas untuk sebuah kode galat, dengan cadangan umum. */
export function pesanGalatGoogle(kode: string): string {
  return PESAN_GALAT_GOOGLE[kode] ?? PESAN_GALAT_GOOGLE.google_gagal;
}
