-- =====================================================================
-- MQ Ummina Online — Row Level Security
--
-- Anon key ada di bundel JavaScript dan bisa dibaca siapa saja. RLS adalah
-- satu-satunya yang memisahkan data satu santri dari santri lain. Setiap tabel
-- di bawah WAJIB punya `enable row level security`; tabel tanpa policy sama
-- sekali berarti tertutup untuk anon & authenticated (hanya service_role yang
-- bisa masuk), dan itu memang perilaku yang diinginkan untuk beberapa tabel.
-- =====================================================================

alter table public.profiles          enable row level security;
alter table public.programs          enable row level security;
alter table public.courses           enable row level security;
alter table public.modules           enable row level security;
alter table public.lessons           enable row level security;
alter table public.batches           enable row level security;
alter table public.sesi_halaqah      enable row level security;
alter table public.enrollments       enable row level security;
alter table public.orders            enable row level security;
alter table public.progres_pelajaran enable row level security;
alter table public.kehadiran         enable row level security;
alter table public.penilaian_setoran enable row level security;
alter table public.hafalan           enable row level security;
alter table public.sertifikat        enable row level security;
alter table public.qna               enable row level security;
alter table public.testimoni         enable row level security;
alter table public.faq               enable row level security;
alter table public.pengaturan_situs  enable row level security;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create policy "profil sendiri bisa dibaca"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "admin baca semua profil"
  on public.profiles for select to authenticated
  using (public.is_admin());

create policy "ustadz baca profil santri bimbingannya"
  on public.profiles for select to authenticated
  using (public.membimbing_santri(id));

-- Kolom `peran` tetap terkunci oleh trigger jaga_peran_profil().
create policy "profil sendiri bisa diubah"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "admin kelola profil"
  on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Halaman kelas publik perlu menampilkan nama & bio ustadz, tapi TIDAK boleh
-- membocorkan no_hp / tgl_lahir. Karena RLS bekerja per-baris (bukan per-kolom),
-- pembatasan kolom dilakukan lewat view berikut.
create view public.pengajar_publik
with (security_barrier = true) as
  select id, nama, bio, avatar_url
  from public.profiles
  where peran in ('ustadz', 'admin');

comment on view public.pengajar_publik is
  'Sengaja SECURITY DEFINER (default view): hanya memaparkan kolom yang aman untuk publik.';

grant select on public.pengajar_publik to anon, authenticated;

-- ---------------------------------------------------------------------
-- programs / courses / modules / lessons
-- ---------------------------------------------------------------------
create policy "program bisa dibaca siapa saja"
  on public.programs for select to anon, authenticated using (true);

create policy "admin kelola program"
  on public.programs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "kelas terbit bisa dibaca siapa saja"
  on public.courses for select to anon, authenticated
  using (is_published);

create policy "admin & pengajar baca semua kelas"
  on public.courses for select to authenticated
  using (public.is_admin() or public.mengajar_kelas(id));

create policy "admin kelola kelas"
  on public.courses for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Daftar bab boleh dilihat publik (jadi kurikulum tampil di halaman penjualan).
create policy "bab kelas terbit bisa dibaca"
  on public.modules for select to anon, authenticated
  using (exists (
    select 1 from public.courses c where c.id = course_id and c.is_published
  ));

create policy "admin & pengajar baca semua bab"
  on public.modules for select to authenticated
  using (public.is_admin() or public.mengajar_kelas(course_id));

create policy "admin kelola bab"
  on public.modules for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Judul pelajaran ikut tampil di kurikulum halaman penjualan, tapi `video_id`
-- ada di baris yang sama. Karena itu barisnya hanya dibuka untuk pelajaran
-- pratinjau; sisanya wajib terdaftar. Judul untuk pengunjung diambil lewat
-- view `kurikulum_publik` di bawah, yang tidak memuat video_id/konten.
create policy "pelajaran pratinjau bisa dibaca"
  on public.lessons for select to anon, authenticated
  using (is_preview and exists (
    select 1 from public.courses c where c.id = course_id and c.is_published
  ));

create policy "santri terdaftar baca pelajaran"
  on public.lessons for select to authenticated
  using (public.sudah_terdaftar(course_id));

create policy "admin & pengajar baca pelajaran"
  on public.lessons for select to authenticated
  using (public.is_admin() or public.mengajar_kelas(course_id));

create policy "admin kelola pelajaran"
  on public.lessons for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create view public.kurikulum_publik
with (security_barrier = true) as
  select l.id, l.module_id, l.course_id, l.judul, l.tipe,
         l.durasi_detik, l.is_preview, l.urutan
  from public.lessons l
  join public.courses c on c.id = l.course_id
  where c.is_published;

comment on view public.kurikulum_publik is
  'Daftar pelajaran untuk halaman penjualan: tanpa video_id, konten, maupun lampiran.';

grant select on public.kurikulum_publik to anon, authenticated;

-- ---------------------------------------------------------------------
-- batches / sesi_halaqah
-- ---------------------------------------------------------------------
create policy "angkatan yang dibuka bisa dilihat"
  on public.batches for select to anon, authenticated
  using (
    status in ('pendaftaran', 'berjalan')
    and exists (select 1 from public.courses c where c.id = course_id and c.is_published)
  );

create policy "pengajar & admin baca angkatannya"
  on public.batches for select to authenticated
  using (public.is_admin() or ustadz_id = auth.uid());

create policy "admin kelola angkatan"
  on public.batches for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "santri baca jadwal angkatannya"
  on public.sesi_halaqah for select to authenticated
  using (exists (
    select 1 from public.enrollments e
    where e.batch_id = sesi_halaqah.batch_id and e.santri_id = auth.uid()
  ));

create policy "pengajar baca jadwal bimbingannya"
  on public.sesi_halaqah for select to authenticated
  using (public.membimbing_batch(batch_id));

-- Ustadz boleh menambah/menggeser pertemuan angkatannya sendiri.
create policy "pengajar kelola jadwal bimbingannya"
  on public.sesi_halaqah for all to authenticated
  using (public.membimbing_batch(batch_id))
  with check (public.membimbing_batch(batch_id));

-- ---------------------------------------------------------------------
-- enrollments
--
-- Tidak ada policy INSERT/UPDATE untuk santri: akses kelas hanya lahir dari
-- fungsi setujui_pesanan() yang dijalankan admin.
-- ---------------------------------------------------------------------
create policy "santri baca pendaftarannya"
  on public.enrollments for select to authenticated
  using (santri_id = auth.uid());

create policy "pengajar baca pendaftaran bimbingannya"
  on public.enrollments for select to authenticated
  using (public.membimbing_batch(batch_id));

create policy "admin kelola pendaftaran"
  on public.enrollments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- orders
--
-- Sengaja tanpa policy INSERT/UPDATE untuk santri. Membuat pesanan lewat
-- buat_pesanan(), mengunggah bukti lewat unggah_bukti(). Kalau santri boleh
-- INSERT langsung, dia bisa menulis harga sendiri.
-- ---------------------------------------------------------------------
create policy "santri baca pesanannya"
  on public.orders for select to authenticated
  using (santri_id = auth.uid());

create policy "admin kelola pesanan"
  on public.orders for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- progres_pelajaran
-- ---------------------------------------------------------------------
create policy "santri baca progresnya"
  on public.progres_pelajaran for select to authenticated
  using (santri_id = auth.uid());

create policy "santri catat progresnya"
  on public.progres_pelajaran for insert to authenticated
  with check (santri_id = auth.uid() and public.sudah_terdaftar(course_id));

create policy "santri ubah progresnya"
  on public.progres_pelajaran for update to authenticated
  using (santri_id = auth.uid())
  with check (santri_id = auth.uid() and public.sudah_terdaftar(course_id));

create policy "pengajar & admin baca progres santri"
  on public.progres_pelajaran for select to authenticated
  using (public.membimbing_santri(santri_id));

-- ---------------------------------------------------------------------
-- kehadiran
-- ---------------------------------------------------------------------
create policy "santri baca kehadirannya"
  on public.kehadiran for select to authenticated
  using (santri_id = auth.uid());

create policy "pengajar kelola kehadiran sesinya"
  on public.kehadiran for all to authenticated
  using (public.membimbing_sesi(sesi_id))
  with check (public.membimbing_sesi(sesi_id));

-- ---------------------------------------------------------------------
-- penilaian_setoran
-- ---------------------------------------------------------------------
create policy "santri baca nilainya"
  on public.penilaian_setoran for select to authenticated
  using (santri_id = auth.uid());

create policy "pengajar kelola nilai bimbingannya"
  on public.penilaian_setoran for all to authenticated
  using (public.membimbing_enrollment(enrollment_id))
  with check (public.membimbing_enrollment(enrollment_id));

-- ---------------------------------------------------------------------
-- hafalan
-- ---------------------------------------------------------------------
create policy "santri baca hafalannya"
  on public.hafalan for select to authenticated
  using (santri_id = auth.uid());

create policy "pengajar kelola hafalan bimbingannya"
  on public.hafalan for all to authenticated
  using (public.membimbing_santri(santri_id))
  with check (public.membimbing_santri(santri_id));

-- ---------------------------------------------------------------------
-- sertifikat
--
-- Verifikasi publik TIDAK lewat tabel ini, melainkan fungsi cek_sertifikat(),
-- supaya token orang lain tidak bisa dipanen dengan `select * from sertifikat`.
-- ---------------------------------------------------------------------
create policy "santri baca sertifikatnya"
  on public.sertifikat for select to authenticated
  using (santri_id = auth.uid());

create policy "admin kelola sertifikat"
  on public.sertifikat for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- qna
-- ---------------------------------------------------------------------
create policy "peserta kelas baca tanya-jawab"
  on public.qna for select to authenticated
  using (public.sudah_terdaftar(course_id) or public.mengajar_kelas(course_id));

create policy "peserta kelas bertanya"
  on public.qna for insert to authenticated
  with check (
    user_id = auth.uid()
    and (public.sudah_terdaftar(course_id) or public.mengajar_kelas(course_id))
  );

create policy "penulis ubah pertanyaannya"
  on public.qna for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "penulis hapus pertanyaannya"
  on public.qna for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- testimoni / faq / pengaturan_situs
-- ---------------------------------------------------------------------
create policy "testimoni terbit bisa dibaca"
  on public.testimoni for select to anon, authenticated using (is_published);

create policy "admin kelola testimoni"
  on public.testimoni for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "faq terbit bisa dibaca"
  on public.faq for select to anon, authenticated using (is_published);

create policy "admin kelola faq"
  on public.faq for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "pengaturan publik bisa dibaca siapa saja"
  on public.pengaturan_situs for select to anon using (is_publik);

create policy "pengguna masuk baca pengaturan"
  on public.pengaturan_situs for select to authenticated using (true);

create policy "admin kelola pengaturan"
  on public.pengaturan_situs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
