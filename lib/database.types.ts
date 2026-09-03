/**
 * Tipe skema database — ditulis tangan agar selaras dengan berkas migrasi di
 * `supabase/migrations/`.
 *
 * Kalau skema berubah, perbarui berkas ini. Bisa juga digantikan hasil
 * `supabase gen types typescript --linked > lib/database.types.ts` bila
 * Supabase CLI sudah terpasang dan proyek sudah di-link.
 */

export type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

export type PeranPengguna = "santri" | "ustadz" | "admin";
export type TipePelajaran = "video" | "teks" | "audio" | "tugas";
export type PenyediaVideo = "youtube" | "bunny" | "supabase";
export type StatusBatch = "draf" | "pendaftaran" | "berjalan" | "selesai";
export type StatusKehadiran = "hadir" | "izin" | "sakit" | "alpa";
export type StatusEnrollment = "aktif" | "selesai" | "berhenti";
export type StatusHafalan = "baru" | "murojaah" | "lulus";
export type StatusPesanan =
  | "menunggu_bayar"
  | "menunggu_verifikasi"
  | "lunas"
  | "ditolak"
  | "kadaluarsa";

export type Profile = {
  id: string;
  nama: string;
  no_hp: string | null;
  peran: PeranPengguna;
  tgl_lahir: string | null;
  kota: string | null;
  avatar_url: string | null;
  bio: string | null;
  dibuat_at: string;
  diubah_at: string;
};

export type Program = {
  id: string;
  slug: string;
  nama: string;
  deskripsi: string | null;
  ikon: string | null;
  urutan: number;
  dibuat_at: string;
};

export type Course = {
  id: string;
  program_id: string;
  slug: string;
  judul: string;
  subjudul: string | null;
  jenjang: string | null;
  deskripsi: string | null;
  apa_yang_dipelajari: string[];
  untuk_siapa: string[];
  prasyarat: string | null;
  thumbnail_url: string | null;
  harga: number;
  harga_coret: number | null;
  durasi_pekan: number | null;
  is_published: boolean;
  urutan: number;
  dibuat_at: string;
  diubah_at: string;
};

export type Modul = {
  id: string;
  course_id: string;
  judul: string;
  ringkasan: string | null;
  urutan: number;
  dibuat_at: string;
};

export type Lesson = {
  id: string;
  module_id: string;
  course_id: string;
  slug: string;
  judul: string;
  tipe: TipePelajaran;
  video_provider: PenyediaVideo;
  video_id: string | null;
  durasi_detik: number;
  konten_md: string | null;
  lampiran: { nama: string; url: string }[];
  is_preview: boolean;
  urutan: number;
  dibuat_at: string;
  diubah_at: string;
};

/** Baris view `kurikulum_publik`: aman ditampilkan ke pengunjung. */
export type PelajaranPublik = Pick<
  Lesson,
  "id" | "module_id" | "course_id" | "judul" | "tipe" | "durasi_detik" | "is_preview" | "urutan"
>;

export type Batch = {
  id: string;
  course_id: string;
  nama: string;
  ustadz_id: string | null;
  tgl_mulai: string | null;
  tgl_selesai: string | null;
  kuota: number;
  jadwal_ringkas: string | null;
  status: StatusBatch;
  catatan: string | null;
  dibuat_at: string;
};

export type SesiHalaqah = {
  id: string;
  batch_id: string;
  pertemuan_ke: number;
  judul: string;
  mulai_at: string;
  durasi_menit: number;
  link_meeting: string | null;
  materi: string | null;
  catatan: string | null;
  dibuat_at: string;
};

export type Enrollment = {
  id: string;
  santri_id: string;
  course_id: string;
  batch_id: string | null;
  status: StatusEnrollment;
  tgl_mulai: string;
  dibuat_at: string;
};

export type Order = {
  id: string;
  nomor_invoice: string;
  santri_id: string;
  course_id: string;
  batch_id: string | null;
  harga: number;
  kode_unik: number;
  total_bayar: number;
  status: StatusPesanan;
  bukti_url: string | null;
  nama_pengirim: string | null;
  catatan_santri: string | null;
  alasan_tolak: string | null;
  diverifikasi_oleh: string | null;
  diverifikasi_at: string | null;
  kadaluarsa_at: string;
  dibuat_at: string;
};

export type ProgresPelajaran = {
  id: string;
  santri_id: string;
  lesson_id: string;
  course_id: string;
  detik_terakhir: number;
  selesai_at: string | null;
  diubah_at: string;
};

export type Kehadiran = {
  id: string;
  sesi_id: string;
  santri_id: string;
  status: StatusKehadiran;
  catatan: string | null;
  dicatat_oleh: string | null;
  dicatat_at: string;
};

export type PenilaianSetoran = {
  id: string;
  enrollment_id: string;
  sesi_id: string | null;
  santri_id: string;
  ustadz_id: string | null;
  tanggal: string;
  materi: string | null;
  nilai_makhraj: number;
  nilai_tajwid: number;
  nilai_kelancaran: number;
  nilai_adab: number;
  nilai_rata: number;
  catatan_ustadz: string | null;
  rekaman_url: string | null;
  dibuat_at: string;
};

export type Hafalan = {
  id: string;
  enrollment_id: string | null;
  santri_id: string;
  ustadz_id: string | null;
  nomor_surat: number | null;
  nama_surat: string;
  ayat_mulai: number | null;
  ayat_selesai: number | null;
  status: StatusHafalan;
  nilai: number | null;
  catatan: string | null;
  tanggal: string;
  dibuat_at: string;
};

export type Sertifikat = {
  id: string;
  nomor: string;
  token_verifikasi: string;
  santri_id: string;
  course_id: string;
  batch_id: string | null;
  tgl_terbit: string;
  nilai_rata: number | null;
  predikat: string | null;
  rekap_nilai: Json;
  diterbitkan_oleh: string | null;
  dibuat_at: string;
};

export type Qna = {
  id: string;
  course_id: string;
  lesson_id: string | null;
  user_id: string;
  parent_id: string | null;
  isi: string;
  is_pinned: boolean;
  dibuat_at: string;
};

export type Testimoni = {
  id: string;
  course_id: string | null;
  nama: string;
  keterangan: string | null;
  isi: string;
  rating: number;
  avatar_url: string | null;
  is_published: boolean;
  urutan: number;
  dibuat_at: string;
};

export type Faq = {
  id: string;
  course_id: string | null;
  pertanyaan: string;
  jawaban: string;
  urutan: number;
  is_published: boolean;
};

export type PengaturanSitus = {
  kunci: string;
  nilai: Json;
  keterangan: string | null;
  is_publik: boolean;
  diubah_at: string;
};

export type PengajarPublik = {
  id: string;
  nama: string;
  bio: string | null;
  avatar_url: string | null;
};

/** Kembalian fungsi `ringkasan_capaian()`. */
export type RingkasanCapaian = {
  total_pelajaran: number;
  pelajaran_selesai: number;
  progres_persen: number;
  jumlah_penilaian: number;
  nilai_rata: number | null;
  sesi_lewat: number;
  hadir: number;
  kehadiran_persen: number;
};

/**
 * Deskripsi satu foreign key. supabase-js memakai daftar ini untuk menyimpulkan
 * tipe hasil `select("*, programs(...)")`; tanpa itu, setiap join akan
 * bertipe `SelectQueryError`.
 */
type Relasi<Nama extends string, Kolom extends string, Tujuan extends string> = {
  foreignKeyName: Nama;
  columns: [Kolom];
  isOneToOne: false;
  referencedRelation: Tujuan;
  referencedColumns: ["id"];
};

type Tabel<Row, Rel extends readonly unknown[] = []> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: Rel;
};

export type Database = {
  public: {
    Tables: {
      profiles: Tabel<Profile>;
      programs: Tabel<Program>;
      courses: Tabel<
        Course,
        [Relasi<"courses_program_id_fkey", "program_id", "programs">]
      >;
      modules: Tabel<Modul, [Relasi<"modules_course_id_fkey", "course_id", "courses">]>;
      // lessons -> courses tidak dicantumkan: di database keduanya terhubung
      // lewat FK gabungan (module_id, course_id) -> modules, bukan FK langsung.
      lessons: Tabel<Lesson, [Relasi<"lessons_module_fkey", "module_id", "modules">]>;
      batches: Tabel<
        Batch,
        [
          Relasi<"batches_course_id_fkey", "course_id", "courses">,
          Relasi<"batches_ustadz_id_fkey", "ustadz_id", "profiles">,
        ]
      >;
      sesi_halaqah: Tabel<
        SesiHalaqah,
        [Relasi<"sesi_halaqah_batch_id_fkey", "batch_id", "batches">]
      >;
      enrollments: Tabel<
        Enrollment,
        [
          Relasi<"enrollments_santri_id_fkey", "santri_id", "profiles">,
          Relasi<"enrollments_course_id_fkey", "course_id", "courses">,
          // FK gabungan (batch_id, course_id) -> batches(id, course_id).
          // PostgREST tetap bisa menyematkannya; kolom pertama yang dipakai.
          Relasi<"enrollments_batch_fkey", "batch_id", "batches">,
        ]
      >;
      orders: Tabel<
        Order,
        [
          Relasi<"orders_santri_id_fkey", "santri_id", "profiles">,
          Relasi<"orders_diverifikasi_oleh_fkey", "diverifikasi_oleh", "profiles">,
          Relasi<"orders_course_id_fkey", "course_id", "courses">,
          Relasi<"orders_batch_id_fkey", "batch_id", "batches">,
        ]
      >;
      progres_pelajaran: Tabel<
        ProgresPelajaran,
        [Relasi<"progres_pelajaran_santri_id_fkey", "santri_id", "profiles">]
      >;
      kehadiran: Tabel<
        Kehadiran,
        [
          Relasi<"kehadiran_sesi_id_fkey", "sesi_id", "sesi_halaqah">,
          Relasi<"kehadiran_santri_id_fkey", "santri_id", "profiles">,
          Relasi<"kehadiran_dicatat_oleh_fkey", "dicatat_oleh", "profiles">,
        ]
      >;
      penilaian_setoran: Tabel<
        PenilaianSetoran,
        [
          Relasi<"penilaian_setoran_enrollment_id_fkey", "enrollment_id", "enrollments">,
          Relasi<"penilaian_setoran_sesi_id_fkey", "sesi_id", "sesi_halaqah">,
          Relasi<"penilaian_setoran_santri_id_fkey", "santri_id", "profiles">,
          Relasi<"penilaian_setoran_ustadz_id_fkey", "ustadz_id", "profiles">,
        ]
      >;
      hafalan: Tabel<
        Hafalan,
        [
          Relasi<"hafalan_santri_id_fkey", "santri_id", "profiles">,
          Relasi<"hafalan_ustadz_id_fkey", "ustadz_id", "profiles">,
        ]
      >;
      sertifikat: Tabel<
        Sertifikat,
        [
          Relasi<"sertifikat_santri_id_fkey", "santri_id", "profiles">,
          Relasi<"sertifikat_diterbitkan_oleh_fkey", "diterbitkan_oleh", "profiles">,
          Relasi<"sertifikat_course_id_fkey", "course_id", "courses">,
          Relasi<"sertifikat_batch_id_fkey", "batch_id", "batches">,
        ]
      >;
      qna: Tabel<
        Qna,
        [
          Relasi<"qna_course_id_fkey", "course_id", "courses">,
          Relasi<"qna_lesson_id_fkey", "lesson_id", "lessons">,
          Relasi<"qna_user_id_fkey", "user_id", "profiles">,
        ]
      >;
      testimoni: Tabel<
        Testimoni,
        [Relasi<"testimoni_course_id_fkey", "course_id", "courses">]
      >;
      faq: Tabel<Faq, [Relasi<"faq_course_id_fkey", "course_id", "courses">]>;
      pengaturan_situs: Tabel<PengaturanSitus>;
    };
    Views: {
      pengajar_publik: { Row: PengajarPublik; Relationships: [] };
      kurikulum_publik: { Row: PelajaranPublik; Relationships: [] };
    };
    Functions: {
      buat_pesanan: {
        Args: { p_course: string; p_batch?: string | null };
        Returns: Order;
      };
      unggah_bukti: {
        Args: {
          p_order: string;
          p_path: string;
          p_nama_pengirim?: string | null;
          p_catatan?: string | null;
        };
        Returns: Order;
      };
      setujui_pesanan: { Args: { p_order: string }; Returns: Enrollment };
      tolak_pesanan: { Args: { p_order: string; p_alasan: string }; Returns: undefined };
      kadaluarsakan_pesanan: { Args: Record<string, never>; Returns: number };
      ringkasan_capaian: {
        Args: { p_santri: string; p_course: string };
        Returns: RingkasanCapaian;
      };
      terbitkan_sertifikat: {
        Args: { p_santri: string; p_course: string; p_paksa?: boolean };
        Returns: Sertifikat;
      };
      cek_sertifikat: {
        Args: { p_token: string };
        Returns: {
          nomor: string;
          nama_santri: string;
          judul_kelas: string;
          jenjang: string | null;
          predikat: string | null;
          tgl_terbit: string;
        }[];
      };
      sudah_terdaftar: { Args: { p_course: string }; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      peran_pengguna: PeranPengguna;
      tipe_pelajaran: TipePelajaran;
      penyedia_video: PenyediaVideo;
      status_batch: StatusBatch;
      status_kehadiran: StatusKehadiran;
      status_enrollment: StatusEnrollment;
      status_hafalan: StatusHafalan;
      status_pesanan: StatusPesanan;
    };
    CompositeTypes: Record<string, never>;
  };
};
