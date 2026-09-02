/**
 * Nilai tetap seluruh aplikasi.
 *
 * Yang bisa diubah admin lewat panel (rekening bank, kontak WA, teks landing)
 * TIDAK ditaruh di sini — tempatnya di tabel `pengaturan_situs`. File ini hanya
 * untuk hal yang memang butuh deploy ulang bila berubah.
 */

export const SITUS = {
  nama: "Madrasah Qur'an Ummina",
  namaPendek: "MQ Ummina",
  deskripsi:
    "Belajar membaca Al-Qur'an secara online bersama ustadz pembimbing: materi video terstruktur, halaqah setoran langsung, rapor tahsin, dan sertifikat.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

/** Peran pengguna. Selaras dengan enum `peran_pengguna` di database. */
export const PERAN = {
  SANTRI: "santri",
  USTADZ: "ustadz",
  ADMIN: "admin",
} as const;
export type Peran = (typeof PERAN)[keyof typeof PERAN];

/** Rute awal setelah login, per peran. */
export const BERANDA_PERAN: Record<Peran, string> = {
  santri: "/belajar",
  ustadz: "/pengajar",
  admin: "/admin",
};

/** Empat aspek penilaian setoran bacaan. Urutan ini dipakai di form & rapor. */
export const ASPEK_NILAI = [
  {
    kunci: "nilai_makhraj",
    label: "Makhraj",
    keterangan: "Ketepatan tempat keluarnya huruf",
  },
  {
    kunci: "nilai_tajwid",
    label: "Tajwid",
    keterangan: "Hukum bacaan: mad, ghunnah, idgham, dst.",
  },
  {
    kunci: "nilai_kelancaran",
    label: "Kelancaran",
    keterangan: "Kefasihan dan kelancaran membaca",
  },
  {
    kunci: "nilai_adab",
    label: "Adab",
    keterangan: "Adab dan kesungguhan saat setoran",
  },
] as const;

export type KunciAspek = (typeof ASPEK_NILAI)[number]["kunci"];

/** Syarat kelulusan sebelum sertifikat boleh diterbitkan admin. */
export const SYARAT_SERTIFIKAT = {
  minProgresPersen: 100,
  minRataNilai: 75,
  minKehadiranPersen: 80,
} as const;

/** Batas waktu pembayaran manual sebelum pesanan hangus. */
export const JAM_KADALUARSA_PESANAN = 24;

/** Persentase durasi video yang menandai pelajaran selesai otomatis. */
export const AMBANG_SELESAI_VIDEO = 0.9;

/** Menit sebelum sesi dimulai saat tombol "Gabung Halaqah" mulai aktif. */
export const MENIT_BUKA_LINK_HALAQAH = 15;

/** Predikat berdasarkan rata-rata nilai setoran. */
export function predikat(rata: number): string {
  if (rata >= 90) return "Mumtaz (Istimewa)";
  if (rata >= 80) return "Jayyid Jiddan (Sangat Baik)";
  if (rata >= 70) return "Jayyid (Baik)";
  if (rata >= 60) return "Maqbul (Cukup)";
  return "Perlu Perbaikan";
}
