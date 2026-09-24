-- =====================================================================
-- Migrasi database lokal ke skema terbaru (sinkron dengan commit
-- "Tambahkan sistem peran-ganda, Template Program, dan penyatuan
-- Program-Kelas").
--
-- Jalankan SEKALI di komputer yang database lokalnya masih memakai skema
-- lama (sebelum migrasi ini) — biasanya karena baru "git pull" tapi belum
-- menyamakan skema database, sehingga muncul error seperti:
--   "Failed query: select ... "jenjang", "subjudul", ... from "programs""
--
-- Cara pakai:
--   psql "$DATABASE_URL" -f migrasi_2026-09-24_peran-ganda_dan_program.sql
-- (DATABASE_URL bisa dilihat di .env.local)
--
-- PENTING — baca dulu sebelum menjalankan:
-- 1. Skrip ini AMAN dijalankan berulang kali (idempotent) untuk sebagian
--    besar langkah, KECUALI Tahap 5 (courses) yang menghapus baris kelas
--    "duplikat" di bawah satu program yang sama (karena satu program kini
--    hanya boleh punya satu kelas). Jika database Anda dipakai untuk data
--    sungguhan (bukan sekadar data uji/seed), CEK DULU query pratinjau di
--    Tahap 5 sebelum melanjutkan — jangan langsung jalankan skrip utuh.
-- 2. Backup dulu kalau ragu:
--      pg_dump "$DATABASE_URL" > backup_sebelum_migrasi.sql
-- =====================================================================


-- ---------------------------------------------------------------------
-- TAHAP 0 — Perluas enum peran_pengguna (harus di luar transaksi eksplisit
-- di PostgreSQL lama; aman dijalankan berulang lewat IF NOT EXISTS).
-- ---------------------------------------------------------------------
ALTER TYPE peran_pengguna ADD VALUE IF NOT EXISTS 'tamu';
ALTER TYPE peran_pengguna ADD VALUE IF NOT EXISTS 'ummi';


BEGIN;

-- ---------------------------------------------------------------------
-- TAHAP 1 — Sistem peran-ganda: pindah dari satu kolom users.peran
-- menjadi tabel pengguna_peran (many-to-many).
-- ---------------------------------------------------------------------

-- Tiga view ini (kurikulum_publik, pengajar_publik, pengaturan_situs)
-- TIDAK dibuat otomatis oleh `drizzle-kit push` — di banyak setup lokal
-- baru, ketiganya malah belum pernah ada sama sekali (halaman /tentang,
-- /program/[slug], dan admin/pengaturan akan error tanpanya). Dihapus dulu
-- di sini karena pengajar_publik bergantung pada users.peran (kolom lama)
-- yang akan di-drop, lalu ketiganya dibuat ulang di Tahap 1c dengan definisi
-- yang benar.
DROP VIEW IF EXISTS pengajar_publik;
DROP VIEW IF EXISTS kurikulum_publik;
DROP VIEW IF EXISTS pengaturan_situs;

CREATE TABLE IF NOT EXISTS pengguna_peran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pengguna_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  peran peran_pengguna NOT NULL,
  dibuat_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS pengguna_peran_unik ON pengguna_peran (pengguna_id, peran);
CREATE INDEX IF NOT EXISTS pengguna_peran_peran_idx ON pengguna_peran (peran);

-- 1a. Salin peran lama tiap pengguna (kolom users.peran) jadi baris di
--     pengguna_peran, kalau kolomnya masih ada (skrip ini aman dijalankan
--     ulang meski kolomnya sudah pernah di-drop).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'peran'
  ) THEN
    INSERT INTO pengguna_peran (pengguna_id, peran)
    SELECT id, peran FROM users
    ON CONFLICT (pengguna_id, peran) DO NOTHING;
  END IF;
END $$;

-- 1b. Hapus kolom & index lama.
DROP INDEX IF EXISTS users_peran_idx;
ALTER TABLE users DROP COLUMN IF EXISTS peran;

-- 1c. Buat ulang ketiga view. pengajar_publik memakai pengguna_peran
--     (bukan lagi users.peran).
CREATE VIEW pengajar_publik AS
SELECT id, nama, bio, avatar_url
FROM users u
WHERE EXISTS (
  SELECT 1 FROM pengguna_peran pp
  WHERE pp.pengguna_id = u.id
    AND pp.peran = ANY (ARRAY['ustadz', 'ummi', 'admin']::peran_pengguna[])
);

CREATE VIEW kurikulum_publik AS
SELECT l.id, l.module_id, l.course_id, l.judul, l.tipe, l.durasi_detik, l.is_preview, l.urutan
FROM lessons l
JOIN courses c ON c.id = l.course_id
WHERE c.is_published;

CREATE VIEW pengaturan_situs AS
SELECT kunci, nilai, keterangan, is_publik, diubah_at
FROM pengaturan;


-- ---------------------------------------------------------------------
-- TAHAP 2 — Kolom baru di programs (isian "sales page" + jenjang/harga
-- yang dulu ada di courses, sekarang di level program).
-- ---------------------------------------------------------------------
ALTER TABLE programs ADD COLUMN IF NOT EXISTS deskripsi_lengkap text;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS apa_yang_dipelajari jsonb NOT NULL DEFAULT '[]';
ALTER TABLE programs ADD COLUMN IF NOT EXISTS untuk_siapa jsonb NOT NULL DEFAULT '[]';
ALTER TABLE programs ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS jenjang text;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS subjudul text;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS prasyarat text;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS harga integer NOT NULL DEFAULT 0;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS harga_coret integer;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS durasi_pekan integer;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS diubah_at timestamptz NOT NULL DEFAULT now();


-- ---------------------------------------------------------------------
-- TAHAP 3 — Tabel Template Program (RPS): template_bab & template_pertemuan.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS template_bab (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  judul text NOT NULL,
  ringkasan text,
  urutan integer NOT NULL DEFAULT 0,
  dibuat_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS template_bab_program_idx ON template_bab (program_id, urutan);

CREATE TABLE IF NOT EXISTS template_pertemuan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bab_id uuid NOT NULL REFERENCES template_bab(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  pertemuan_ke integer NOT NULL,
  judul text NOT NULL,
  materi text,
  durasi_menit integer NOT NULL DEFAULT 60,
  lampiran jsonb NOT NULL DEFAULT '[]',
  dibuat_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS template_pertemuan_program_ke_unik ON template_pertemuan (program_id, pertemuan_ke);
CREATE INDEX IF NOT EXISTS template_pertemuan_program_idx ON template_pertemuan (program_id);
CREATE INDEX IF NOT EXISTS template_pertemuan_bab_idx ON template_pertemuan (bab_id, pertemuan_ke);


-- ---------------------------------------------------------------------
-- TAHAP 4 — Lampiran & tautan template di sesi_halaqah.
-- ---------------------------------------------------------------------
ALTER TABLE sesi_halaqah ADD COLUMN IF NOT EXISTS lampiran jsonb NOT NULL DEFAULT '[]';
ALTER TABLE sesi_halaqah ADD COLUMN IF NOT EXISTS template_pertemuan_id uuid
  REFERENCES template_pertemuan(id) ON DELETE SET NULL;


-- ---------------------------------------------------------------------
-- TAHAP 5 — Penyatuan Program:Kelas jadi 1:1. INI TAHAP YANG MENGUBAH DATA.
--
-- Sebelum lanjut, jalankan dulu query PRATINJAU ini secara terpisah untuk
-- melihat kelas mana yang akan "kalah" (dihapus beserta bab/pelajaran,
-- rombel, dan pendaftarannya) karena berbagi program dengan kelas lain:
--
--   SELECT c.id, c.judul, c.program_id, p.nama AS program,
--          row_number() OVER (PARTITION BY c.program_id ORDER BY c.dibuat_at) AS urutan_simpan
--   FROM courses c JOIN programs p ON p.id = c.program_id
--   ORDER BY c.program_id, c.dibuat_at;
--
-- Baris dengan urutan_simpan = 1 yang DIPERTAHANKAN (jadi wakil kelas
-- program itu); urutan_simpan > 1 akan DIHAPUS di bawah ini.
-- ---------------------------------------------------------------------

-- 5a. Backfill data jenjang/subjudul/prasyarat/harga/dll ke programs dari
--     kelas "wakil" (yang paling lama dibuat) di bawahnya.
WITH wakil AS (
  SELECT DISTINCT ON (c.program_id)
    c.program_id, c.jenjang, c.subjudul, c.prasyarat, c.harga, c.harga_coret, c.durasi_pekan
  FROM courses c
  ORDER BY c.program_id, c.dibuat_at
)
UPDATE programs p
SET jenjang = wakil.jenjang,
    subjudul = wakil.subjudul,
    prasyarat = wakil.prasyarat,
    harga = COALESCE(wakil.harga, p.harga),
    harga_coret = wakil.harga_coret,
    durasi_pekan = wakil.durasi_pekan
FROM wakil
WHERE wakil.program_id = p.id;

-- 5b. Hapus kelas duplikat (semua kecuali yang paling lama dibuat) di
--     bawah program yang sama — akan ikut menghapus bab/pelajaran, rombel,
--     dan pendaftaran milik kelas itu (lihat ON DELETE CASCADE di skema).
WITH duplikat AS (
  SELECT c.id,
         row_number() OVER (PARTITION BY c.program_id ORDER BY c.dibuat_at) AS urutan_simpan
  FROM courses c
)
DELETE FROM courses WHERE id IN (SELECT id FROM duplikat WHERE urutan_simpan > 1);

-- 5c. Hapus kolom-kolom yang sudah pindah ke programs.
ALTER TABLE courses DROP COLUMN IF EXISTS slug;
ALTER TABLE courses DROP COLUMN IF EXISTS subjudul;
ALTER TABLE courses DROP COLUMN IF EXISTS jenjang;
ALTER TABLE courses DROP COLUMN IF EXISTS deskripsi;
ALTER TABLE courses DROP COLUMN IF EXISTS apa_yang_dipelajari;
ALTER TABLE courses DROP COLUMN IF EXISTS untuk_siapa;
ALTER TABLE courses DROP COLUMN IF EXISTS prasyarat;
ALTER TABLE courses DROP COLUMN IF EXISTS thumbnail_url;
ALTER TABLE courses DROP COLUMN IF EXISTS harga;
ALTER TABLE courses DROP COLUMN IF EXISTS harga_coret;
ALTER TABLE courses DROP COLUMN IF EXISTS durasi_pekan;
ALTER TABLE courses DROP COLUMN IF EXISTS urutan;

-- 5d. Satu program = satu kelas: tambahkan constraint UNIK.
DROP INDEX IF EXISTS courses_program_idx;
ALTER TABLE courses ADD CONSTRAINT courses_program_id_unique UNIQUE (program_id);

-- 5e. courses_published_idx lama ikut terhapus otomatis oleh PostgreSQL saat
--     kolom urutan (bagian dari index itu) di-drop di atas — dibuat ulang
--     di sini tanpa urutan, sesuai skema baru.
CREATE INDEX IF NOT EXISTS courses_published_idx ON courses (is_published);


COMMIT;

-- Selesai. Jalankan `npm run dev` lagi setelah ini.
