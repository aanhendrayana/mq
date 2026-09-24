/**
 * Lampiran pertemuan: materi tambahan (video YouTube, PDF, slide, audio,
 * gambar) yang "diputar" langsung di aplikasi, bukan sekadar tautan unduh.
 *
 * Dipakai di dua tempat: template_pertemuan (rencana per program) dan
 * sesi_halaqah (jadwal sungguhan per rombel, disalin dari template lewat
 * "Terapkan Template"). Berkas ini bebas dari "use server" supaya bisa
 * dipakai baik di server action maupun komponen klien (pemutar).
 */

export const TIPE_LAMPIRAN = ["youtube", "pdf", "slide", "audio", "gambar", "vicon"] as const;
export type TipeLampiran = (typeof TIPE_LAMPIRAN)[number];

export type LampiranPertemuan = {
  tipe: TipeLampiran;
  url: string;
  nama: string;
};

export const LABEL_TIPE_LAMPIRAN: Record<TipeLampiran, string> = {
  youtube: "Video YouTube",
  pdf: "PDF",
  slide: "Slide (Google Slides)",
  audio: "Audio",
  gambar: "Gambar",
  vicon: "Link Vicon (Zoom/Google Meet)",
};

/** Petunjuk singkat di bawah kolom URL, disesuaikan tipe yang dipilih. */
export const PETUNJUK_TIPE_LAMPIRAN: Record<TipeLampiran, string> = {
  youtube: "Tempel URL video YouTube apa pun — ID-nya diambil otomatis.",
  pdf: "Tempel URL PDF. Untuk Google Drive: buka berkasnya, ganti /view di akhir URL menjadi /preview.",
  slide: "Tempel URL Google Slides: buka presentasinya, ganti /edit di akhir URL menjadi /embed.",
  audio: "Tempel URL berkas audio (mis. .mp3) yang bisa diakses langsung.",
  gambar: "Tempel URL gambar (jpg, jpeg, png) yang bisa diakses langsung.",
  vicon: "Tempel tautan Zoom/Google Meet — terbuka di tab baru. Untuk ruang tambahan (mis. breakout/kelas cadangan); ruang utama halaqah tetap diisi ustadzah di kolom \"Tautan pertemuan\".",
};

/** Menerima URL YouTube apa pun maupun ID mentah, mengembalikan ID-nya. */
export function idYoutube(masukan: string): string {
  const t = masukan.trim();
  if (!t) return "";
  const pola = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/(?:embed|shorts|live)\/)([\w-]{11})/,
  ];
  for (const p of pola) {
    const c = t.match(p);
    if (c) return c[1];
  }
  return t;
}
