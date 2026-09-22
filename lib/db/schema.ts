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
export const peranPenggunaEnum = pgEnum("peran_pengguna", ["santri", "ustadz", "admin"]);
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
  peran: peranPenggunaEnum("peran").notNull().default("santri"),
  tglLahir: date("tgl_lahir"),
  kota: text("kota"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  dibuatAt: timestamp("dibuat_at", { withTimezone: true }).notNull().defaultNow(),
  diubahAt: timestamp("diubah_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("users_peran_idx").on(table.peran),
  index("users_email_idx").on(table.email),
]);

// ---------------------------------------------------------------------
// 3. KURIKULUM (Programs, Courses, Modules, Lessons)
// ---------------------------------------------------------------------
export const programs = pgTable("programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  nama: text("nama").notNull(),
  deskripsi: text("deskripsi"),
  ikon: text("ikon"),
  urutan: integer("urutan").notNull().default(0),
  dibuatAt: timestamp("dibuat_at", { withTimezone: true }).notNull().defaultNow(),
});

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  programId: uuid("program_id").notNull().references(() => programs.id, { onDelete: "restrict" }),
  slug: text("slug").notNull().unique(),
  judul: text("judul").notNull(),
  subjudul: text("subjudul"),
  jenjang: text("jenjang"),
  deskripsi: text("deskripsi"),
  apaYangDipelajari: jsonb("apa_yang_dipelajari").notNull().default([]),
  untukSiapa: jsonb("untuk_siapa").notNull().default([]),
  prasyarat: text("prasyarat"),
  thumbnailUrl: text("thumbnail_url"),
  harga: integer("harga").notNull().default(0),
  hargaCoret: integer("harga_coret"),
  durasiPekan: integer("durasi_pekan"),
  isPublished: boolean("is_published").notNull().default(false),
  urutan: integer("urutan").notNull().default(0),
  dibuatAt: timestamp("dibuat_at", { withTimezone: true }).notNull().defaultNow(),
  diubahAt: timestamp("diubah_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("courses_program_idx").on(table.programId),
  index("courses_published_idx").on(table.isPublished, table.urutan),
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
}));

export const programsRelations = relations(programs, ({ many }) => ({
  courses: many(courses),
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
export type Program = typeof programs.$inferSelect;
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
