import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  smallint,
  boolean,
  timestamp,
  date,
  numeric,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------
// 1. ENUM
// ---------------------------------------------------------------------
export const peranPenggunaEnum = pgEnum("peran_pengguna", [
  "tamu",
  "santri",
  "ustadz",
  "ummi",
  "admin",
]);
export const tipePelajaranEnum = pgEnum("tipe_pelajaran", ["video", "teks", "audio", "tugas"]);
export const penyediaVideoEnum = pgEnum("penyedia_video", ["youtube", "bunny", "supabase"]);
export const statusBatchEnum = pgEnum("status_batch", ["draf", "pendaftaran", "berjalan", "selesai"]);
export const statusKehadiranEnum = pgEnum("status_kehadiran", ["hadir", "izin", "sakit", "alpa"]);
export const statusEnrollmentEnum = pgEnum("status_enrollment", ["aktif", "selesai", "berhenti"]);
export const statusPesananEnum = pgEnum("status_pesanan", [
  "menunggu_bayar",
  "menunggu_verifikasi",
  "lunas",
  "ditolak",
  "kadaluarsa",
]);

// ---------------------------------------------------------------------
// 2. USERS (Identitas & Profil)
// ---------------------------------------------------------------------
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nama: text("nama").notNull().default(""),
  noHp: text("no_hp"),
  tglLahir: date("tgl_lahir"),
  kota: text("kota"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  dibuatAt: timestamp("dibuat_at", { withTimezone: true }).notNull().defaultNow(),
  diubahAt: timestamp("diubah_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("users_email_idx").on(table.email),
]);

/**
 * Peran seorang pengguna — satu akun bisa memegang beberapa sekaligus (mis.
 * ustadzah yang juga ikut kelas sebagai santriwati). Karena itu peran TIDAK
 * lagi jadi satu kolom di `users`, melainkan baris-baris di sini.
 *
 * "tamu" adalah keadaan bawaan pendaftar baru — belum ikut kelas apa pun.
 * Begitu pembayaran kelas pertamanya disetujui admin (lihat `setujui_pesanan`
 * di lib/db/klien.ts), tag ini diganti otomatis jadi "santri".
 */
export const penggunaPeran = pgTable("pengguna_peran", {
  id: uuid("id").primaryKey().defaultRandom(),
  penggunaId: uuid("pengguna_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  peran: peranPenggunaEnum("peran").notNull(),
  dibuatAt: timestamp("dibuat_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("pengguna_peran_unik").on(table.penggunaId, table.peran),
  index("pengguna_peran_peran_idx").on(table.peran),
]);

// ---------------------------------------------------------------------
// 3. KURIKULUM (Programs, Courses, Modules, Lessons)
// ---------------------------------------------------------------------
export const programs = pgTable("programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  nama: text("nama").notNull(),
  // Ringkasan pendek — dipakai di badge/kartu kategori.
  deskripsi: text("deskripsi"),
  ikon: text("ikon"),
  urutan: integer("urutan").notNull().default(0),
  // Isian "sales page" dipindah ke sini dari courses: diisi sekali per
  // program, otomatis terpakai untuk kelasnya — satu program = satu kelas
  // jual (analoginya kelas 1 SD: materi matematika sama, tinggal beda
  // rombel/seksi A/B/C/D lewat tabel `batches`).
  deskripsiLengkap: text("deskripsi_lengkap"),
  apaYangDipelajari: jsonb("apa_yang_dipelajari").notNull().default([]),
  untukSiapa: jsonb("untuk_siapa").notNull().default([]),
  thumbnailUrl: text("thumbnail_url"),
  jenjang: text("jenjang"),
  subjudul: text("subjudul"),
  prasyarat: text("prasyarat"),
  harga: integer("harga").notNull().default(0),
  hargaCoret: integer("harga_coret"),
  durasiPekan: integer("durasi_pekan"),
  dibuatAt: timestamp("dibuat_at", { withTimezone: true }).notNull().defaultNow(),
  diubahAt: timestamp("diubah_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Rencana pertemuan satu program (setara RPS) — dibuat Ummi Rifa/Admin,
 * berlaku untuk SEMUA kelas & rombel di bawah program ini. Admin menyalin
 * baris-baris ini jadi jadwal sesi_halaqah sungguhan lewat "Terapkan
 * Template" pada sebuah rombel (lihat terapkanTemplateAction).
 *
 * Strukturnya sengaja meniru persis pola Bab & Pelajaran materi video
 * (modules/lessons di bawah) — template_bab mengelompokkan beberapa
 * template_pertemuan, sama seperti sebuah modul mengelompokkan pelajaran.
 */
export const templateBab = pgTable("template_bab", {
  id: uuid("id").primaryKey().defaultRandom(),
  programId: uuid("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),
  judul: text("judul").notNull(),
  ringkasan: text("ringkasan"),
  urutan: integer("urutan").notNull().default(0),
  dibuatAt: timestamp("dibuat_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("template_bab_program_idx").on(table.programId, table.urutan),
]);

export const templatePertemuan = pgTable("template_pertemuan", {
  id: uuid("id").primaryKey().defaultRandom(),
  babId: uuid("bab_id").notNull().references(() => templateBab.id, { onDelete: "cascade" }),
  // Disalin dari template_bab.programId supaya bisa disaring langsung tanpa
  // join — sama seperti lessons.courseId di samping lessons.moduleId.
  programId: uuid("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),
  pertemuanKe: integer("pertemuan_ke").notNull(),
  judul: text("judul").notNull(),
  materi: text("materi"),
  durasiMenit: integer("durasi_menit").notNull().default(60),
  // Materi tambahan (video YouTube, PDF, slide, audio, gambar) yang bisa
  // "diputar" langsung di aplikasi — lihat lib/lampiran.ts.
  lampiran: jsonb("lampiran").notNull().default([]),
  dibuatAt: timestamp("dibuat_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("template_pertemuan_program_ke_unik").on(table.programId, table.pertemuanKe),
  index("template_pertemuan_program_idx").on(table.programId),
  index("template_pertemuan_bab_idx").on(table.babId, table.pertemuanKe),
]);

/**
 * Satu program = satu kelas jual (lihat komentar di `programs` di atas).
 * Slug, jenjang, subjudul, prasyarat, harga, durasi, dan urutan tampil
 * semua pindah ke `programs` — kelas di sini tinggal wadah materi (bab &
 * pelajaran, lihat modules/lessons) dan status terbit, terhubung 1:1 ke
 * programnya lewat programId yang UNIK.
 */
export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  programId: uuid("program_id").notNull().unique().references(() => programs.id, { onDelete: "restrict" }),
  judul: text("judul").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  dibuatAt: timestamp("dibuat_at", { withTimezone: true }).notNull().defaultNow(),
  diubahAt: timestamp("diubah_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("courses_published_idx").on(table.isPublished),
]);

export const modules = pgTable("modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  judul: text("judul").notNull(),
  ringkasan: text("ringkasan"),
  urutan: integer("urutan").notNull().default(0),
  dibuatAt: timestamp("dibuat_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("modules_course_idx").on(table.courseId, table.urutan),
]);

export const lessons = pgTable("lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: uuid("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  judul: text("judul").notNull(),
  tipe: tipePelajaranEnum("tipe").notNull().default("video"),
  videoProvider: penyediaVideoEnum("video_provider").notNull().default("youtube"),
  videoId: text("video_id"),
  durasiDetik: integer("durasi_detik").notNull().default(0),
  kontenMd: text("konten_md"),
  lampiran: jsonb("lampiran").notNull().default([]),
  isPreview: boolean("is_preview").notNull().default(false),
  urutan: integer("urutan").notNull().default(0),
  dibuatAt: timestamp("dibuat_at", { withTimezone: true }).notNull().defaultNow(),
  diubahAt: timestamp("diubah_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("lessons_module_idx").on(table.moduleId, table.urutan),
  index("lessons_course_idx").on(table.courseId),
  uniqueIndex("lessons_course_slug_unik").on(table.courseId, table.slug),
]);

// ---------------------------------------------------------------------
// 4. ANGKATAN & HALAQAH
// ---------------------------------------------------------------------
export const batches = pgTable("batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  nama: text("nama").notNull(),
  ustadzId: uuid("ustadz_id").references(() => users.id, { onDelete: "set null" }),
  tglMulai: date("tgl_mulai"),
  tglSelesai: date("tgl_selesai"),
  kuota: integer("kuota").notNull().default(20),
  jadwalRingkas: text("jadwal_ringkas"),
  status: statusBatchEnum("status").notNull().default("draf"),
  catatan: text("catatan"),
  dibuatAt: timestamp("dibuat_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("batches_course_idx").on(table.courseId, table.status),
  index("batches_ustadz_idx").on(table.ustadzId),
]);

export const sesiHalaqah = pgTable("sesi_halaqah", {
  id: uuid("id").primaryKey().defaultRandom(),
  batchId: uuid("batch_id").notNull().references(() => batches.id, { onDelete: "cascade" }),
  pertemuanKe: integer("pertemuan_ke").notNull(),
  judul: text("judul").notNull(),
  mulaiAt: timestamp("mulai_at", { withTimezone: true }).notNull(),
  durasiMenit: integer("durasi_menit").notNull().default(60),
  linkMeeting: text("link_meeting"),
  materi: text("materi"),
  catatan: text("catatan"),
  // Materi tambahan (video YouTube, PDF, slide, audio, gambar) — disalin
  // dari template_pertemuan.lampiran saat "Terapkan Template", tapi bisa
  // ditambah sendiri untuk sesi yang dibuat manual (lihat lib/lampiran.ts).
  lampiran: jsonb("lampiran").notNull().default([]),
  // Terisi kalau sesi ini hasil salinan template program (lihat
  // terapkanTemplateAction). Ustadzah biasa hanya boleh mengubah jadwal &
  // link pada sesi yang templatePertemuanId-nya terisi — judul/materi
  // terkunci ke template, cuma admin/Ummi Rifa yang boleh mengubahnya
  // (lewat halaman template program).
  templatePertemuanId: uuid("template_pertemuan_id").references(() => templatePertemuan.id, {
    onDelete: "set null",
  }),
  dibuatAt: timestamp("dibuat_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("sesi_halaqah_batch_idx").on(table.batchId, table.mulaiAt),
  uniqueIndex("sesi_halaqah_pertemuan_unik").on(table.batchId, table.pertemuanKe),
]);

// ---------------------------------------------------------------------
// 5. PENDAFTARAN & PEMBAYARAN
// ---------------------------------------------------------------------
export const enrollments = pgTable("enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  santriId: uuid("santri_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  batchId: uuid("batch_id").references(() => batches.id, { onDelete: "set null" }),
  status: statusEnrollmentEnum("status").notNull().default("aktif"),
  tglMulai: date("tgl_mulai").notNull().defaultNow(),
  dibuatAt: timestamp("dibuat_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("enrollments_santri_idx").on(table.santriId, table.status),
  index("enrollments_batch_idx").on(table.batchId),
  uniqueIndex("enrollments_santri_course_unik").on(table.santriId, table.courseId),
]);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  nomorInvoice: text("nomor_invoice").notNull().unique(),
  santriId: uuid("santri_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "restrict" }),
  batchId: uuid("batch_id").references(() => batches.id, { onDelete: "set null" }),
  harga: integer("harga").notNull(),
  kodeUnik: integer("kode_unik").notNull(),
  totalBayar: integer("total_bayar").notNull(),
  status: statusPesananEnum("status").notNull().default("menunggu_bayar"),
  buktiUrl: text("bukti_url"),
  namaPengirim: text("nama_pengirim"),
  catatanSantri: text("catatan_santri"),
  alasanTolak: text("alasan_tolak"),
  diverifikasiOleh: uuid("diverifikasi_oleh").references(() => users.id, { onDelete: "set null" }),
  diverifikasiAt: timestamp("diverifikasi_at", { withTimezone: true }),
  kadaluarsaAt: timestamp("kadaluarsa_at", { withTimezone: true }).notNull(),
  dibuatAt: timestamp("dibuat_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("orders_santri_idx").on(table.santriId, table.dibuatAt),
  index("orders_status_idx").on(table.status, table.dibuatAt),
]);

// ---------------------------------------------------------------------
// 6. PROGRES BELAJAR, KEHADIRAN, PENILAIAN
// ---------------------------------------------------------------------
export const progresPelajaran = pgTable("progres_pelajaran", {
  id: uuid("id").primaryKey().defaultRandom(),
  santriId: uuid("santri_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: uuid("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  detikTerakhir: integer("detik_terakhir").notNull().default(0),
  selesaiAt: timestamp("selesai_at", { withTimezone: true }),
  diubahAt: timestamp("diubah_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("progres_santri_kelas_idx").on(table.santriId, table.courseId),
  uniqueIndex("progres_santri_lesson_unik").on(table.santriId, table.lessonId),
]);

export const kehadiran = pgTable("kehadiran", {
  id: uuid("id").primaryKey().defaultRandom(),
  sesiId: uuid("sesi_id").notNull().references(() => sesiHalaqah.id, { onDelete: "cascade" }),
  santriId: uuid("santri_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: statusKehadiranEnum("status").notNull().default("alpa"),
  catatan: text("catatan"),
  dicatatOleh: uuid("dicatat_oleh").references(() => users.id, { onDelete: "set null" }),
  dicatatAt: timestamp("dicatat_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("kehadiran_santri_idx").on(table.santriId),
  uniqueIndex("kehadiran_sesi_santri_unik").on(table.sesiId, table.santriId),
]);

export const penilaianSetoran = pgTable("penilaian_setoran", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id").notNull().references(() => enrollments.id, { onDelete: "cascade" }),
  sesiId: uuid("sesi_id").references(() => sesiHalaqah.id, { onDelete: "set null" }),
  santriId: uuid("santri_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ustadzId: uuid("ustadz_id").references(() => users.id, { onDelete: "set null" }),
  tanggal: date("tanggal").notNull().defaultNow(),
  materi: text("materi"),
  nilaiMakhraj: smallint("nilai_makhraj").notNull(),
  nilaiTajwid: smallint("nilai_tajwid").notNull(),
  nilaiKelancaran: smallint("nilai_kelancaran").notNull(),
  nilaiAdab: smallint("nilai_adab").notNull(),
  nilaiRata: numeric("nilai_rata", { precision: 5, scale: 2 }),
  catatanUstadz: text("catatan_ustadz"),
  rekamanUrl: text("rekaman_url"),
  dibuatAt: timestamp("dibuat_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("penilaian_santri_idx").on(table.santriId, table.tanggal),
  uniqueIndex("penilaian_sesi_santri_unik").on(table.sesiId, table.santriId),
]);

// ---------------------------------------------------------------------
// 7. SERTIFIKAT, PENGATURAN, TESTIMONI, FAQ
// ---------------------------------------------------------------------
export const sertifikat = pgTable("sertifikat", {
  id: uuid("id").primaryKey().defaultRandom(),
  nomor: text("nomor").notNull().unique(),
  tokenVerifikasi: text("token_verifikasi").notNull().unique(),
  santriId: uuid("santri_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  batchId: uuid("batch_id").references(() => batches.id, { onDelete: "set null" }),
  tglTerbit: date("tgl_terbit").notNull().defaultNow(),
  nilaiRata: numeric("nilai_rata", { precision: 5, scale: 2 }),
  predikat: text("predikat"),
  rekapNilai: jsonb("rekap_nilai").notNull().default({}),
  diterbitkanOleh: uuid("diterbitkan_oleh").references(() => users.id, { onDelete: "set null" }),
  dibuatAt: timestamp("dibuat_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("sertifikat_santri_idx").on(table.santriId),
  index("sertifikat_token_idx").on(table.tokenVerifikasi),
]);

export const pengaturan = pgTable("pengaturan", {
  kunci: text("kunci").primaryKey(),
  nilai: jsonb("nilai").notNull(),
  keterangan: text("keterangan"),
  isPublik: boolean("is_publik").notNull().default(true),
  diubahAt: timestamp("diubah_at", { withTimezone: true }).notNull().defaultNow(),
});

export const testimoni = pgTable("testimoni", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").references(() => courses.id, { onDelete: "set null" }),
  nama: text("nama").notNull(),
  keterangan: text("keterangan"),
  isi: text("isi").notNull(),
  rating: integer("rating").notNull().default(5),
  avatarUrl: text("avatar_url"),
  isPublished: boolean("is_published").notNull().default(true),
  urutan: integer("urutan").notNull().default(0),
  dibuatAt: timestamp("dibuat_at", { withTimezone: true }).notNull().defaultNow(),
});

export const faq = pgTable("faq", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").references(() => courses.id, { onDelete: "set null" }),
  pertanyaan: text("pertanyaan").notNull(),
  jawaban: text("jawaban").notNull(),
  urutan: integer("urutan").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
});

// ---------------------------------------------------------------------
// 8. RELATIONS
// ---------------------------------------------------------------------
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  enrollments: many(enrollments),
  kehadiran: many(kehadiran),
  penilaian: many(penilaianSetoran),
  sertifikat: many(sertifikat),
  peranList: many(penggunaPeran),
}));

export const penggunaPeranRelations = relations(penggunaPeran, ({ one }) => ({
  pengguna: one(users, {
    fields: [penggunaPeran.penggunaId],
    references: [users.id],
  }),
}));

export const programsRelations = relations(programs, ({ many }) => ({
  courses: many(courses),
  templateBab: many(templateBab),
  templatePertemuan: many(templatePertemuan),
}));

export const templateBabRelations = relations(templateBab, ({ one, many }) => ({
  program: one(programs, {
    fields: [templateBab.programId],
    references: [programs.id],
  }),
  pertemuan: many(templatePertemuan),
}));

export const templatePertemuanRelations = relations(templatePertemuan, ({ one }) => ({
  bab: one(templateBab, {
    fields: [templatePertemuan.babId],
    references: [templateBab.id],
  }),
  program: one(programs, {
    fields: [templatePertemuan.programId],
    references: [programs.id],
  }),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  program: one(programs, {
    fields: [courses.programId],
    references: [programs.id],
  }),
  modules: many(modules),
  lessons: many(lessons),
  batches: many(batches),
  enrollments: many(enrollments),
  orders: many(orders),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, {
    fields: [modules.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  module: one(modules, {
    fields: [lessons.moduleId],
    references: [modules.id],
  }),
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
}));

export const batchesRelations = relations(batches, ({ one, many }) => ({
  course: one(courses, {
    fields: [batches.courseId],
    references: [courses.id],
  }),
  ustadz: one(users, {
    fields: [batches.ustadzId],
    references: [users.id],
  }),
  sesi: many(sesiHalaqah),
  enrollments: many(enrollments),
}));

export const sesiHalaqahRelations = relations(sesiHalaqah, ({ one, many }) => ({
  batch: one(batches, {
    fields: [sesiHalaqah.batchId],
    references: [batches.id],
  }),
  templatePertemuan: one(templatePertemuan, {
    fields: [sesiHalaqah.templatePertemuanId],
    references: [templatePertemuan.id],
  }),
  kehadiran: many(kehadiran),
  penilaian: many(penilaianSetoran),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  santri: one(users, {
    fields: [enrollments.santriId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
  batch: one(batches, {
    fields: [enrollments.batchId],
    references: [batches.id],
  }),
  penilaian: many(penilaianSetoran),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  santri: one(users, {
    fields: [orders.santriId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [orders.courseId],
    references: [courses.id],
  }),
  batch: one(batches, {
    fields: [orders.batchId],
    references: [batches.id],
  }),
}));

export const sertifikatRelations = relations(sertifikat, ({ one }) => ({
  santri: one(users, {
    fields: [sertifikat.santriId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [sertifikat.courseId],
    references: [courses.id],
  }),
  batch: one(batches, {
    fields: [sertifikat.batchId],
    references: [batches.id],
  }),
}));

// Tipe entitas untuk inferensi TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type PenggunaPeran = typeof penggunaPeran.$inferSelect;
export type Program = typeof programs.$inferSelect;
export type TemplateBab = typeof templateBab.$inferSelect;
export type TemplatePertemuan = typeof templatePertemuan.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Batch = typeof batches.$inferSelect;
export type SesiHalaqah = typeof sesiHalaqah.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type ProgresPelajaran = typeof progresPelajaran.$inferSelect;
export type Kehadiran = typeof kehadiran.$inferSelect;
export type PenilaianSetoran = typeof penilaianSetoran.$inferSelect;
export type Sertifikat = typeof sertifikat.$inferSelect;
export type Pengaturan = typeof pengaturan.$inferSelect;
export type Testimoni = typeof testimoni.$inferSelect;
export type Faq = typeof faq.$inferSelect;
