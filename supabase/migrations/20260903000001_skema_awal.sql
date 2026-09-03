-- =====================================================================
-- MQ Ummina Online — Skema Awal
-- Berisi: enum, tabel, indeks, dan batasan (constraint).
-- Fungsi/trigger ada di 20260903000002, RLS di 20260903000003.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ENUM
-- ---------------------------------------------------------------------
create type peran_pengguna    as enum ('santri', 'ustadz', 'admin');
create type tipe_pelajaran    as enum ('video', 'teks', 'audio', 'tugas');
create type penyedia_video    as enum ('youtube', 'bunny', 'supabase');
create type status_batch      as enum ('draf', 'pendaftaran', 'berjalan', 'selesai');
create type status_kehadiran  as enum ('hadir', 'izin', 'sakit', 'alpa');
create type status_enrollment as enum ('aktif', 'selesai', 'berhenti');
create type status_hafalan    as enum ('baru', 'murojaah', 'lulus');
create type status_pesanan    as enum (
  'menunggu_bayar', 'menunggu_verifikasi', 'lunas', 'ditolak', 'kadaluarsa'
);

-- ---------------------------------------------------------------------
-- 2. IDENTITAS
-- ---------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  nama          text not null default '',
  no_hp         text,
  peran         peran_pengguna not null default 'santri',
  -- Tidak ada kolom jenis kelamin: madrasah ini khusus muslimah, jadi kolom
  -- seperti itu tidak akan pernah membedakan satu baris dari baris lainnya.
  tgl_lahir     date,
  kota          text,
  avatar_url    text,
  bio           text, -- dipakai untuk profil ustadzah di halaman kelas
  dibuat_at     timestamptz not null default now(),
  diubah_at     timestamptz not null default now()
);
comment on table public.profiles is 'Data pengguna, diisi otomatis saat pendaftaran auth.';

create index profiles_peran_idx on public.profiles (peran);

-- ---------------------------------------------------------------------
-- 3. KURIKULUM
-- ---------------------------------------------------------------------
create table public.programs (
  id        uuid primary key default gen_random_uuid(),
  slug      text not null unique,
  nama      text not null,
  deskripsi text,
  ikon      text, -- nama ikon lucide, mis. 'book-open'
  urutan    int not null default 0,
  dibuat_at timestamptz not null default now()
);
comment on table public.programs is 'Kategori besar: Tahsin, Iqro, Tahfidz, Kelas Guru.';

create table public.courses (
  id                  uuid primary key default gen_random_uuid(),
  program_id          uuid not null references public.programs (id) on delete restrict,
  slug                text not null unique,
  judul               text not null,
  subjudul            text,
  jenjang             text, -- 'Dasar', 'Menengah', 'Jilid 1', dst.
  deskripsi           text,
  apa_yang_dipelajari jsonb not null default '[]'::jsonb, -- array of string
  untuk_siapa         jsonb not null default '[]'::jsonb, -- array of string
  prasyarat           text,
  thumbnail_url       text,
  harga               int not null default 0 check (harga >= 0),
  harga_coret         int check (harga_coret is null or harga_coret >= 0),
  durasi_pekan        int,
  is_published        boolean not null default false,
  urutan              int not null default 0,
  dibuat_at           timestamptz not null default now(),
  diubah_at           timestamptz not null default now()
);
comment on table public.courses is 'Satu kelas yang dijual, mis. "Tahsin Dasar".';

create index courses_program_idx   on public.courses (program_id);
create index courses_published_idx on public.courses (is_published, urutan);

create table public.modules (
  id        uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  judul     text not null,
  ringkasan text,
  urutan    int not null default 0,
  dibuat_at timestamptz not null default now(),
  -- dipakai composite FK dari lessons agar course_id tak bisa melenceng
  unique (id, course_id)
);
comment on table public.modules is 'Bab di dalam sebuah kelas.';

create index modules_course_idx on public.modules (course_id, urutan);

create table public.lessons (
  id             uuid primary key default gen_random_uuid(),
  module_id      uuid not null,
  -- didenormalisasi dari modules agar policy RLS & query progres tidak perlu join.
  -- Composite FK di bawah menjamin nilainya selalu sama dengan modul induknya.
  course_id      uuid not null,
  slug           text not null,
  judul          text not null,
  tipe           tipe_pelajaran not null default 'video',
  video_provider penyedia_video not null default 'youtube',
  video_id       text, -- ID YouTube (mis. 'dQw4w9WgXcQ'), bukan URL penuh
  durasi_detik   int not null default 0 check (durasi_detik >= 0),
  konten_md      text,
  lampiran       jsonb not null default '[]'::jsonb, -- [{nama, url}]
  is_preview     boolean not null default false,     -- boleh ditonton tanpa membeli
  urutan         int not null default 0,
  dibuat_at      timestamptz not null default now(),
  diubah_at      timestamptz not null default now(),
  constraint lessons_module_fkey
    foreign key (module_id, course_id)
    references public.modules (id, course_id) on delete cascade,
  constraint lessons_slug_unik unique (course_id, slug),
  -- Dirujuk FK gabungan dari progres_pelajaran. Postgres mewajibkan tabel
  -- tujuan punya batasan unik yang persis cocok dengan kolom yang dirujuk.
  constraint lessons_id_course_unik unique (id, course_id)
);
comment on column public.lessons.course_id is
  'Denormalisasi dari modules.course_id; dijaga oleh composite FK.';

create index lessons_module_idx on public.lessons (module_id, urutan);
create index lessons_course_idx on public.lessons (course_id);

-- ---------------------------------------------------------------------
-- 4. ANGKATAN & HALAQAH
-- ---------------------------------------------------------------------
create table public.batches (
  id             uuid primary key default gen_random_uuid(),
  course_id      uuid not null references public.courses (id) on delete cascade,
  nama           text not null, -- 'Tahsin Dasar — Angkatan 5'
  ustadz_id      uuid references public.profiles (id) on delete set null,
  tgl_mulai      date,
  tgl_selesai    date,
  kuota          int not null default 20 check (kuota > 0),
  jadwal_ringkas text, -- 'Senin & Rabu, 19.30 WIB'
  status         status_batch not null default 'draf',
  catatan        text,
  dibuat_at      timestamptz not null default now(),
  unique (id, course_id)
);
comment on table public.batches is 'Angkatan/kelompok halaqah dengan jadwal tetap.';

create index batches_course_idx on public.batches (course_id, status);
create index batches_ustadz_idx on public.batches (ustadz_id);

create table public.sesi_halaqah (
  id            uuid primary key default gen_random_uuid(),
  batch_id      uuid not null references public.batches (id) on delete cascade,
  pertemuan_ke  int not null check (pertemuan_ke > 0),
  judul         text not null,
  mulai_at      timestamptz not null,
  durasi_menit  int not null default 60 check (durasi_menit > 0),
  link_meeting  text,
  materi        text,
  catatan       text,
  dibuat_at     timestamptz not null default now(),
  unique (batch_id, pertemuan_ke)
);
comment on table public.sesi_halaqah is 'Satu pertemuan halaqah terjadwal.';

create index sesi_halaqah_batch_idx on public.sesi_halaqah (batch_id, mulai_at);

-- ---------------------------------------------------------------------
-- 5. PENDAFTARAN & PEMBAYARAN
-- ---------------------------------------------------------------------
create table public.enrollments (
  id         uuid primary key default gen_random_uuid(),
  santri_id  uuid not null references public.profiles (id) on delete cascade,
  course_id  uuid not null references public.courses (id) on delete cascade,
  batch_id   uuid,
  status     status_enrollment not null default 'aktif',
  tgl_mulai  date not null default current_date,
  dibuat_at  timestamptz not null default now(),
  constraint enrollments_batch_fkey
    foreign key (batch_id, course_id)
    references public.batches (id, course_id) on delete set null,
  constraint enrollments_unik unique (santri_id, course_id)
);
comment on table public.enrollments is
  'Hak akses santriwati atas sebuah kelas. Dibuat saat pembayaran disetujui admin.';

create index enrollments_santri_idx on public.enrollments (santri_id, status);
create index enrollments_batch_idx  on public.enrollments (batch_id);

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  nomor_invoice     text not null unique,
  santri_id         uuid not null references public.profiles (id) on delete cascade,
  course_id         uuid not null references public.courses (id) on delete restrict,
  batch_id          uuid references public.batches (id) on delete set null,
  harga             int not null check (harga >= 0),
  -- kode unik 3 digit ditambahkan ke nominal agar admin mudah mencocokkan mutasi bank
  kode_unik         int not null check (kode_unik between 1 and 999),
  total_bayar       int generated always as (harga + kode_unik) stored,
  status            status_pesanan not null default 'menunggu_bayar',
  bukti_url         text, -- path objek di bucket privat 'bukti-bayar'
  nama_pengirim     text,
  catatan_santri    text,
  alasan_tolak      text,
  diverifikasi_oleh uuid references public.profiles (id) on delete set null,
  diverifikasi_at   timestamptz,
  kadaluarsa_at     timestamptz not null,
  dibuat_at         timestamptz not null default now()
);
comment on table public.orders is 'Pesanan pembayaran manual (transfer bank + bukti).';

create index orders_santri_idx on public.orders (santri_id, dibuat_at desc);
create index orders_status_idx on public.orders (status, dibuat_at desc);

-- Cegah pesanan ganda: satu santriwati hanya boleh punya satu pesanan hidup per kelas.
create unique index orders_aktif_unik
  on public.orders (santri_id, course_id)
  where status in ('menunggu_bayar', 'menunggu_verifikasi', 'lunas');

-- ---------------------------------------------------------------------
-- 6. PROGRES BELAJAR
-- ---------------------------------------------------------------------
create table public.progres_pelajaran (
  id             uuid primary key default gen_random_uuid(),
  santri_id      uuid not null references public.profiles (id) on delete cascade,
  lesson_id      uuid not null,
  course_id      uuid not null,
  detik_terakhir int not null default 0 check (detik_terakhir >= 0),
  selesai_at     timestamptz,
  diubah_at      timestamptz not null default now(),
  constraint progres_lesson_fkey
    foreign key (lesson_id, course_id)
    references public.lessons (id, course_id) on delete cascade,
  constraint progres_unik unique (santri_id, lesson_id)
);
comment on table public.progres_pelajaran is
  'Posisi tonton & status selesai per pelajaran per santriwati.';

create index progres_santri_kelas_idx
  on public.progres_pelajaran (santri_id, course_id);

-- ---------------------------------------------------------------------
-- 7. KEHADIRAN & PENILAIAN
-- ---------------------------------------------------------------------
create table public.kehadiran (
  id            uuid primary key default gen_random_uuid(),
  sesi_id       uuid not null references public.sesi_halaqah (id) on delete cascade,
  santri_id     uuid not null references public.profiles (id) on delete cascade,
  status        status_kehadiran not null default 'alpa',
  catatan       text,
  dicatat_oleh  uuid references public.profiles (id) on delete set null,
  dicatat_at    timestamptz not null default now(),
  constraint kehadiran_unik unique (sesi_id, santri_id)
);

create index kehadiran_santri_idx on public.kehadiran (santri_id);

create table public.penilaian_setoran (
  id               uuid primary key default gen_random_uuid(),
  enrollment_id    uuid not null references public.enrollments (id) on delete cascade,
  sesi_id          uuid references public.sesi_halaqah (id) on delete set null,
  santri_id        uuid not null references public.profiles (id) on delete cascade,
  ustadz_id        uuid references public.profiles (id) on delete set null,
  tanggal          date not null default current_date,
  materi           text, -- 'QS. Al-Baqarah 1-10' atau 'Jilid 3 hal. 12'
  nilai_makhraj    smallint not null check (nilai_makhraj    between 0 and 100),
  nilai_tajwid     smallint not null check (nilai_tajwid     between 0 and 100),
  nilai_kelancaran smallint not null check (nilai_kelancaran between 0 and 100),
  nilai_adab       smallint not null check (nilai_adab       between 0 and 100),
  nilai_rata       numeric(5, 2) generated always as (
    (nilai_makhraj + nilai_tajwid + nilai_kelancaran + nilai_adab) / 4.0
  ) stored,
  catatan_ustadz   text,
  rekaman_url      text,
  dibuat_at        timestamptz not null default now(),
  -- satu penilaian per santriwati per sesi halaqah
  constraint penilaian_sesi_unik unique (sesi_id, santri_id)
);
comment on table public.penilaian_setoran is
  'Hasil koreksi bacaan oleh ustadzah, dasar dari rapor tahsin.';

create index penilaian_santri_idx on public.penilaian_setoran (santri_id, tanggal);
create index penilaian_enroll_idx on public.penilaian_setoran (enrollment_id);

create table public.hafalan (
  id            uuid primary key default gen_random_uuid(),
  enrollment_id uuid references public.enrollments (id) on delete cascade,
  santri_id     uuid not null references public.profiles (id) on delete cascade,
  ustadz_id     uuid references public.profiles (id) on delete set null,
  nomor_surat   int check (nomor_surat between 1 and 114),
  nama_surat    text not null,
  ayat_mulai    int check (ayat_mulai > 0),
  ayat_selesai  int check (ayat_selesai > 0),
  status        status_hafalan not null default 'baru',
  nilai         smallint check (nilai between 0 and 100),
  catatan       text,
  tanggal       date not null default current_date,
  dibuat_at     timestamptz not null default now()
);
comment on table public.hafalan is 'Khusus program Tahfidz.';

create index hafalan_santri_idx on public.hafalan (santri_id, tanggal desc);

-- ---------------------------------------------------------------------
-- 8. SERTIFIKAT
-- ---------------------------------------------------------------------
create table public.sertifikat (
  id                uuid primary key default gen_random_uuid(),
  nomor             text not null unique, -- 'MQU/TSN-D/2026/0042'
  token_verifikasi  text not null unique default encode(gen_random_bytes(12), 'hex'),
  santri_id         uuid not null references public.profiles (id) on delete cascade,
  course_id         uuid not null references public.courses (id) on delete restrict,
  batch_id          uuid references public.batches (id) on delete set null,
  tgl_terbit        date not null default current_date,
  nilai_rata        numeric(5, 2),
  predikat          text,
  rekap_nilai       jsonb not null default '{}'::jsonb,
  diterbitkan_oleh  uuid references public.profiles (id) on delete set null,
  dibuat_at         timestamptz not null default now(),
  constraint sertifikat_unik unique (santri_id, course_id)
);
comment on column public.sertifikat.token_verifikasi is
  'Dipakai di URL publik /cek-sertifikat/[token] dan QR pada PDF.';

-- ---------------------------------------------------------------------
-- 9. TANYA-JAWAB & KONTEN MARKETING
-- ---------------------------------------------------------------------
create table public.qna (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses (id) on delete cascade,
  lesson_id  uuid references public.lessons (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  parent_id  uuid references public.qna (id) on delete cascade,
  isi        text not null check (length(trim(isi)) > 0),
  is_pinned  boolean not null default false,
  dibuat_at  timestamptz not null default now()
);

create index qna_lesson_idx on public.qna (lesson_id, dibuat_at);
create index qna_course_idx on public.qna (course_id, dibuat_at);

create table public.testimoni (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid references public.courses (id) on delete set null,
  nama         text not null,
  keterangan   text, -- 'Santriwati Tahsin Dasar, Bandung'
  isi          text not null,
  rating       smallint not null default 5 check (rating between 1 and 5),
  avatar_url   text,
  is_published boolean not null default true,
  urutan       int not null default 0,
  dibuat_at    timestamptz not null default now()
);

create table public.faq (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid references public.courses (id) on delete cascade, -- null = FAQ umum
  pertanyaan   text not null,
  jawaban      text not null,
  urutan       int not null default 0,
  is_published boolean not null default true
);

create table public.pengaturan_situs (
  kunci      text primary key,
  nilai      jsonb not null,
  keterangan text,
  is_publik  boolean not null default false, -- true = boleh dibaca pengunjung anonim
  diubah_at  timestamptz not null default now()
);
comment on table public.pengaturan_situs is
  'Konten & konfigurasi yang boleh diubah admin tanpa deploy ulang (rekening, kontak, teks landing).';
