/**
 * Nilai tetap seluruh aplikasi.
 *
 * Yang bisa diubah admin lewat panel (rekening bank, kontak WA, teks landing)
 * TIDAK ditaruh di sini — tempatnya di tabel `pengaturan_situs`. File ini hanya
 * untuk hal yang memang butuh deploy ulang bila berubah.
 */

export const SITUS = {
  nama: "Madrasah Quran Nurul Musthofa Perum Safira",
  namaPendek: "Madrasah Quran Nurul Musthofa",
  deskripsi:
    "Madrasah Quran daring khusus muslimah di Perum Safira. Belajar membaca Al-Quran bersama ustadzah pembimbing: materi video terstruktur, halaqah setoran langsung, rapor tahsin, dan sertifikat.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

/**
 * Peran pengguna. Selaras dengan enum `peran_pengguna` di database.
 *
 * Satu akun bisa memegang BEBERAPA peran sekaligus (mis. ustadzah yang juga
 * ikut kelas sebagai santriwati) — lihat tabel `pengguna_peran` di
 * lib/db/schema.ts. Karena itu di seluruh kode, peran seorang pengguna selalu
 * berupa array (`Peran[]`), bukan satu nilai tunggal.
 */
export const PERAN = {
  TAMU: "tamu",
  SANTRI: "santri",
  USTADZ: "ustadz",
  UMMI: "ummi",
  ADMIN: "admin",
} as const;
export type Peran = (typeof PERAN)[keyof typeof PERAN];

/** Label tampilan tiap peran. */
export const LABEL_PERAN: Record<Peran, string> = {
  tamu: "Tamu",
  santri: "Santriwati",
  ustadz: "Ustadzah Pembimbing",
  ummi: "Ummi Rifa",
  admin: "Administrator",
};

/**
 * Dua peran tertinggi dikunci ke satu email tertentu masing-masing — bukan
 * peran generik yang bisa dipegang siapa saja seperti Santri/Ustadzah.
 * Dipakai `ubahPeranAction` untuk menolak menempelkannya ke akun lain.
 */
export const EMAIL_KHUSUS_PERAN: Partial<Record<Peran, string>> = {
  ummi: "mq.ummina@gmail.com",
  admin: "aanhendrayana@gmail.com",
};

/** Peran yang berarti "akses penuh ke semuanya" — dipakai gerbang admin. */
export const PERAN_AKSES_PENUH: Peran[] = ["ummi", "admin"];

/**
 * Rute dasbor per peran, dari yang paling diutamakan. Untuk akun berperan
 * ganda (mis. Ustadzah + Santri), urutan ini yang menentukan ke mana ia
 * diantar setelah masuk.
 */
const PRIORITAS_BERANDA: { peran: Peran; href: string }[] = [
  { peran: "admin", href: "/admin" },
  { peran: "ummi", href: "/admin" },
  { peran: "ustadz", href: "/pengajar" },
  { peran: "santri", href: "/belajar" },
  { peran: "tamu", href: "/belajar" },
];

/** Rute dasbor yang cocok untuk kombinasi peran seorang pengguna. */
export function berandaUntukPeran(peranList: readonly Peran[]): string {
  for (const { peran, href } of PRIORITAS_BERANDA) {
    if (peranList.includes(peran)) return href;
  }
  return "/belajar";
}

/** Label gabungan untuk ditampilkan di menu akun, mis. "Ustadzah Pembimbing & Santriwati". */
export function labelPeranList(peranList: readonly Peran[]): string {
  if (peranList.length === 0) return LABEL_PERAN.tamu;
  return peranList.map((p) => LABEL_PERAN[p]).join(" & ");
}

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
