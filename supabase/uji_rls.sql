-- =====================================================================
-- Uji keamanan RLS — dijalankan terhadap database lokal
--
--   psql "$(supabase status -o env | grep '^DB_URL=' | cut -d= -f2- | tr -d '\"')" \
--        -v ON_ERROR_STOP=1 -f supabase/uji_rls.sql
--
-- Skrip ini MENIRU pengguna sungguhan dengan menyetel peran Postgres
-- `authenticated`/`anon` beserta klaim JWT-nya, persis seperti yang dilakukan
-- PostgREST saat menerima permintaan dari browser. Jadi yang diuji benar-benar
-- policy RLS, bukan sekadar logika aplikasi.
--
-- Setiap pemeriksaan yang gagal memunculkan exception sehingga skrip berhenti
-- di titik yang salah. Kalau baris penutup tercetak, semuanya lolos.
--
-- Seluruh isinya dibungkus transaksi yang di-ROLLBACK, jadi database Anda
-- kembali persis seperti sebelum skrip dijalankan.
-- =====================================================================

\set ON_ERROR_STOP on
\timing off

begin;

-- ---------------------------------------------------------------------
-- Alat bantu
--
-- Ditaruh di skema sendiri, bukan pg_temp: skema sementara dimiliki session
-- user, dan peran `anon`/`authenticated` belum tentu punya hak USAGE di
-- sana — persis pada saat kita berganti peran untuk mengujinya.
-- ---------------------------------------------------------------------
create schema uji;
grant usage on schema uji to public;

create function uji.jadi(p_user uuid) returns void
language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', p_user::text, 'role', 'authenticated')::text,
    true);
end $$;

create function uji.jadi_tamu() returns void
language plpgsql as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

create function uji.jadi_super() returns void
language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

create function uji.periksa(p_nama text, p_lolos boolean) returns void
language plpgsql as $$
begin
  if p_lolos then
    raise notice '  OK    %', p_nama;
  else
    raise exception 'GAGAL: %', p_nama;
  end if;
end $$;

grant execute on all functions in schema uji to public;

-- ---------------------------------------------------------------------
-- Pemeran uji
--
-- UUID hanya boleh memuat digit heksadesimal (0-9, a-f), jadi penanda
-- perannya memakai huruf yang sah: a=admin, b/c=ustadz, d/e=santri,
-- f0..f7 = data kelas.
-- ---------------------------------------------------------------------
--   admin    00000000-0000-4000-8000-00000000000a
--   ustadz A 00000000-0000-4000-8000-00000000000b
--   ustadz B 00000000-0000-4000-8000-00000000000c
--   santri A 00000000-0000-4000-8000-00000000000d
--   santri B 00000000-0000-4000-8000-00000000000e

select uji.jadi_super();

do $$
begin
  -- Lewat auth.users supaya trigger handle_new_user() ikut teruji.
  -- Kata sandi sengaja dikosongkan: skrip ini menyetel klaim JWT langsung,
  -- tidak pernah melewati GoTrue, dan seluruh barisnya di-rollback.
  insert into auth.users (instance_id, id, aud, role, email,
                          email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                          created_at, updated_at)
  select '00000000-0000-0000-0000-000000000000', x.id, 'authenticated', 'authenticated',
         x.email, now(),
         '{"provider":"email","providers":["email"]}'::jsonb,
         json_build_object('nama', x.nama, 'no_hp', '081234567890')::jsonb,
         now(), now()
  from (values
    ('00000000-0000-4000-8000-00000000000a'::uuid, 'admin@uji.test',   'Admin Uji'),
    ('00000000-0000-4000-8000-00000000000b'::uuid, 'ustadza@uji.test', 'Ustadz A'),
    ('00000000-0000-4000-8000-00000000000c'::uuid, 'ustadzb@uji.test', 'Ustadz B'),
    ('00000000-0000-4000-8000-00000000000d'::uuid, 'santria@uji.test', 'Santri A'),
    ('00000000-0000-4000-8000-00000000000e'::uuid, 'santrib@uji.test', 'Santri B')
  ) as x(id, email, nama);

  update public.profiles set peran = 'admin'
   where id = '00000000-0000-4000-8000-00000000000a';
  update public.profiles set peran = 'ustadz'
   where id in ('00000000-0000-4000-8000-00000000000b',
                '00000000-0000-4000-8000-00000000000c');
end $$;

do $$
declare v_jml int;
begin
  select count(*) into v_jml from public.profiles
   where id in ('00000000-0000-4000-8000-00000000000a',
                '00000000-0000-4000-8000-00000000000b',
                '00000000-0000-4000-8000-00000000000c',
                '00000000-0000-4000-8000-00000000000d',
                '00000000-0000-4000-8000-00000000000e');
  perform uji.periksa('trigger handle_new_user() membuat 5 profil otomatis', v_jml = 5);

  select count(*) into v_jml from public.profiles
   where id = '00000000-0000-4000-8000-00000000000d'
     and nama = 'Santri A' and peran = 'santri' and no_hp = '081234567890';
  perform uji.periksa(
    'pendaftar baru selalu berperan santri, nama & HP terbawa dari metadata',
    v_jml = 1);
end $$;

-- Data uji: 1 kelas, 1 bab, 2 pelajaran (1 pratinjau), 2 angkatan beda ustadz
do $$
begin
  insert into public.programs (id, slug, nama)
  values ('00000000-0000-4000-8000-0000000000f0', 'uji-rls', 'Program Uji');

  insert into public.courses (id, program_id, slug, judul, harga, is_published)
  values ('00000000-0000-4000-8000-0000000000f1',
          '00000000-0000-4000-8000-0000000000f0',
          'kelas-uji-rls', 'Kelas Uji', 100000, true);

  insert into public.modules (id, course_id, judul, urutan)
  values ('00000000-0000-4000-8000-0000000000f2',
          '00000000-0000-4000-8000-0000000000f1', 'Bab Uji', 1);

  insert into public.lessons (id, module_id, course_id, slug, judul, video_id, is_preview, urutan)
  values
    ('00000000-0000-4000-8000-0000000000f3',
     '00000000-0000-4000-8000-0000000000f2',
     '00000000-0000-4000-8000-0000000000f1',
     'pratinjau-uji', 'Pelajaran Pratinjau', 'VIDEOGRATIS', true, 1),
    ('00000000-0000-4000-8000-0000000000f4',
     '00000000-0000-4000-8000-0000000000f2',
     '00000000-0000-4000-8000-0000000000f1',
     'berbayar-uji', 'Pelajaran Berbayar', 'VIDEORAHASIA', false, 2);

  insert into public.batches (id, course_id, nama, ustadz_id, kuota, status)
  values
    ('00000000-0000-4000-8000-0000000000f5', '00000000-0000-4000-8000-0000000000f1',
     'Angkatan Ustadz A', '00000000-0000-4000-8000-00000000000b', 10, 'pendaftaran'),
    ('00000000-0000-4000-8000-0000000000f6', '00000000-0000-4000-8000-0000000000f1',
     'Angkatan Ustadz B', '00000000-0000-4000-8000-00000000000c', 10, 'pendaftaran');
end $$;

-- =====================================================================
\echo ''
\echo '=== 1. Pengunjung anonim (belum masuk) ==='
-- =====================================================================
do $$
declare v_jml int;
begin
  perform uji.jadi_tamu();

  select count(*) into v_jml from public.lessons
   where course_id = '00000000-0000-4000-8000-0000000000f1';
  perform uji.periksa('tamu hanya melihat pelajaran pratinjau', v_jml = 1);

  select count(*) into v_jml from public.lessons where video_id = 'VIDEORAHASIA';
  perform uji.periksa('video_id pelajaran berbayar TIDAK bocor ke tamu', v_jml = 0);

  select count(*) into v_jml from public.orders;
  perform uji.periksa('tamu tidak bisa membaca pesanan siapa pun', v_jml = 0);

  select count(*) into v_jml from public.penilaian_setoran;
  perform uji.periksa('tamu tidak bisa membaca nilai siapa pun', v_jml = 0);

  select count(*) into v_jml from public.profiles;
  perform uji.periksa('tamu tidak bisa membaca tabel profil', v_jml = 0);

  select count(*) into v_jml from public.sertifikat;
  perform uji.periksa('tamu tidak bisa memanen token sertifikat', v_jml = 0);

  select count(*) into v_jml from public.pengaturan_situs where kunci = 'rekening';
  perform uji.periksa('nomor rekening tidak terbaca tamu', v_jml = 0);

  select count(*) into v_jml from public.pengaturan_situs where kunci = 'kontak';
  perform uji.periksa('pengaturan publik tetap terbaca tamu', v_jml = 1);

  select count(*) into v_jml from public.courses
   where id = '00000000-0000-4000-8000-0000000000f1';
  perform uji.periksa('katalog kelas terbit terbaca tamu', v_jml = 1);

  select count(*) into v_jml from public.kurikulum_publik
   where course_id = '00000000-0000-4000-8000-0000000000f1';
  perform uji.periksa(
    'kurikulum lengkap tetap tampil di halaman jualan lewat view aman', v_jml = 2);
end $$;

-- =====================================================================
\echo ''
\echo '=== 2. Santri yang belum membeli ==='
-- =====================================================================
do $$
declare v_jml int; v_peran text;
begin
  perform uji.jadi('00000000-0000-4000-8000-00000000000d');

  select count(*) into v_jml from public.lessons
   where course_id = '00000000-0000-4000-8000-0000000000f1';
  perform uji.periksa('santri belum bayar hanya melihat pelajaran pratinjau', v_jml = 1);

  begin
    insert into public.progres_pelajaran (santri_id, lesson_id, course_id)
    values ('00000000-0000-4000-8000-00000000000d',
            '00000000-0000-4000-8000-0000000000f4',
            '00000000-0000-4000-8000-0000000000f1');
    perform uji.periksa('progres kelas yang belum dibeli DITOLAK', false);
  exception when insufficient_privilege or check_violation then
    perform uji.periksa('progres kelas yang belum dibeli ditolak', true);
  end;

  update public.profiles set peran = 'admin'
   where id = '00000000-0000-4000-8000-00000000000d';
  select peran::text into v_peran from public.profiles
   where id = '00000000-0000-4000-8000-00000000000d';
  perform uji.periksa(
    'santri TIDAK bisa mengangkat dirinya menjadi admin', v_peran = 'santri');
end $$;

-- =====================================================================
\echo ''
\echo '=== 3. Pemesanan & verifikasi pembayaran ==='
-- =====================================================================
do $$
declare v_pes public.orders; v_jml int;
begin
  perform uji.jadi('00000000-0000-4000-8000-00000000000d');

  begin
    insert into public.orders (nomor_invoice, santri_id, course_id, harga, kode_unik, kadaluarsa_at)
    values ('PALSU-1', '00000000-0000-4000-8000-00000000000d',
            '00000000-0000-4000-8000-0000000000f1', 0, 1, now() + interval '1 day');
    perform uji.periksa('INSERT langsung ke orders DITOLAK', false);
  exception when insufficient_privilege then
    perform uji.periksa(
      'INSERT langsung ke orders ditolak (harga tak bisa dipalsukan)', true);
  end;

  v_pes := public.buat_pesanan('00000000-0000-4000-8000-0000000000f1',
                               '00000000-0000-4000-8000-0000000000f5');
  perform uji.periksa(
    'buat_pesanan() memakai harga dari database, bukan kiriman klien',
    v_pes.harga = 100000);
  perform uji.periksa(
    'kode unik 3 digit ditambahkan ke total tagihan',
    v_pes.kode_unik between 100 and 998
      and v_pes.total_bayar = v_pes.harga + v_pes.kode_unik);

  update public.orders set status = 'lunas' where id = v_pes.id;
  select count(*) into v_jml from public.orders where id = v_pes.id and status = 'lunas';
  perform uji.periksa('santri TIDAK bisa menandai pesanannya lunas sendiri', v_jml = 0);

  begin
    perform public.setujui_pesanan(v_pes.id);
    perform uji.periksa('santri memanggil setujui_pesanan() DITOLAK', false);
  exception when insufficient_privilege then
    perform uji.periksa('santri memanggil setujui_pesanan() ditolak', true);
  end;

  perform uji.jadi('00000000-0000-4000-8000-00000000000a');
  perform public.setujui_pesanan(v_pes.id);

  perform uji.jadi_super();
  select count(*) into v_jml from public.orders where id = v_pes.id and status = 'lunas';
  perform uji.periksa('admin menyetujui: pesanan menjadi lunas', v_jml = 1);

  select count(*) into v_jml from public.enrollments
   where santri_id = '00000000-0000-4000-8000-00000000000d'
     and course_id = '00000000-0000-4000-8000-0000000000f1'
     and status = 'aktif';
  perform uji.periksa('akses kelas terbuka pada transaksi yang sama', v_jml = 1);
end $$;

-- =====================================================================
\echo ''
\echo '=== 4. Santri yang sudah membeli ==='
-- =====================================================================
do $$
declare v_jml int;
begin
  perform uji.jadi('00000000-0000-4000-8000-00000000000d');

  select count(*) into v_jml from public.lessons
   where course_id = '00000000-0000-4000-8000-0000000000f1';
  perform uji.periksa('santri yang sudah bayar melihat seluruh pelajaran', v_jml = 2);

  select count(*) into v_jml from public.lessons where video_id = 'VIDEORAHASIA';
  perform uji.periksa('video_id pelajaran berbayar kini terbaca', v_jml = 1);

  insert into public.progres_pelajaran (santri_id, lesson_id, course_id, selesai_at)
  values ('00000000-0000-4000-8000-00000000000d',
          '00000000-0000-4000-8000-0000000000f4',
          '00000000-0000-4000-8000-0000000000f1', now());
  perform uji.periksa('santri bisa mencatat progres kelasnya sendiri', true);

  -- Santri B belum membeli apa pun.
  perform uji.jadi('00000000-0000-4000-8000-00000000000e');

  select count(*) into v_jml from public.progres_pelajaran;
  perform uji.periksa('santri lain tidak melihat progres santri A', v_jml = 0);

  select count(*) into v_jml from public.orders;
  perform uji.periksa('santri lain tidak melihat tagihan santri A', v_jml = 0);

  select count(*) into v_jml from public.profiles;
  perform uji.periksa('santri hanya melihat profilnya sendiri', v_jml = 1);

  select count(*) into v_jml from public.lessons where video_id = 'VIDEORAHASIA';
  perform uji.periksa('santri lain tetap tidak melihat video berbayar', v_jml = 0);
end $$;

-- =====================================================================
\echo ''
\echo '=== 5. Batas wewenang ustadz ==='
-- =====================================================================
do $$
declare v_enr uuid; v_jml int;
begin
  perform uji.jadi_super();
  select id into v_enr from public.enrollments
   where santri_id = '00000000-0000-4000-8000-00000000000d';

  perform uji.jadi('00000000-0000-4000-8000-00000000000b');

  insert into public.sesi_halaqah (id, batch_id, pertemuan_ke, judul, mulai_at)
  values ('00000000-0000-4000-8000-0000000000f7',
          '00000000-0000-4000-8000-0000000000f5', 1, 'Pertemuan Uji',
          now() - interval '1 hour');
  perform uji.periksa('ustadz bisa menjadwalkan pertemuan angkatannya', true);

  insert into public.kehadiran (sesi_id, santri_id, status)
  values ('00000000-0000-4000-8000-0000000000f7',
          '00000000-0000-4000-8000-00000000000d', 'hadir');
  perform uji.periksa('ustadz bisa mencatat absensi angkatannya', true);

  insert into public.penilaian_setoran
    (enrollment_id, sesi_id, santri_id, ustadz_id,
     nilai_makhraj, nilai_tajwid, nilai_kelancaran, nilai_adab)
  values (v_enr, '00000000-0000-4000-8000-0000000000f7',
          '00000000-0000-4000-8000-00000000000d',
          '00000000-0000-4000-8000-00000000000b', 80, 85, 75, 90);
  perform uji.periksa('ustadz pembimbing bisa menilai santrinya', true);

  select count(*) into v_jml from public.penilaian_setoran where nilai_rata = 82.50;
  perform uji.periksa('kolom nilai_rata dihitung otomatis oleh database', v_jml = 1);

  -- Ustadz B bukan pembimbing santri A.
  perform uji.jadi('00000000-0000-4000-8000-00000000000c');

  select count(*) into v_jml from public.penilaian_setoran;
  perform uji.periksa('ustadz lain TIDAK melihat nilai santri bimbingan A', v_jml = 0);

  begin
    insert into public.penilaian_setoran
      (enrollment_id, santri_id, ustadz_id,
       nilai_makhraj, nilai_tajwid, nilai_kelancaran, nilai_adab)
    values (v_enr, '00000000-0000-4000-8000-00000000000d',
            '00000000-0000-4000-8000-00000000000c', 10, 10, 10, 10);
    perform uji.periksa('ustadz lain menilai santri bukan bimbingannya DITOLAK', false);
  exception when insufficient_privilege then
    perform uji.periksa('ustadz lain menilai santri bukan bimbingannya ditolak', true);
  end;

  select count(*) into v_jml from public.orders;
  perform uji.periksa('ustadz tidak bisa membaca data pembayaran', v_jml = 0);

  perform uji.jadi('00000000-0000-4000-8000-00000000000d');
  select count(*) into v_jml from public.penilaian_setoran;
  perform uji.periksa('santri melihat nilainya sendiri di rapor', v_jml = 1);
end $$;

-- =====================================================================
\echo ''
\echo '=== 6. Penerbitan & verifikasi sertifikat ==='
-- =====================================================================
do $$
declare v_cap jsonb; v_srt public.sertifikat; v_jml int; v_token text;
begin
  perform uji.jadi('00000000-0000-4000-8000-00000000000a');

  v_cap := public.ringkasan_capaian('00000000-0000-4000-8000-00000000000d',
                                    '00000000-0000-4000-8000-0000000000f1');
  perform uji.periksa(
    'ringkasan_capaian: 1 dari 2 pelajaran selesai = 50%',
    (v_cap ->> 'progres_persen')::int = 50);
  perform uji.periksa(
    'ringkasan_capaian: kehadiran dihitung dari sesi yang sudah lewat',
    (v_cap ->> 'sesi_lewat')::int = 1 and (v_cap ->> 'kehadiran_persen')::int = 100);
  perform uji.periksa(
    'ringkasan_capaian: rata-rata nilai terbaca',
    (v_cap ->> 'nilai_rata')::numeric = 82.50);

  begin
    perform public.terbitkan_sertifikat('00000000-0000-4000-8000-00000000000d',
                                        '00000000-0000-4000-8000-0000000000f1', false);
    perform uji.periksa('sertifikat DITOLAK saat materi belum tuntas', false);
  exception when check_violation then
    perform uji.periksa('sertifikat ditolak saat materi belum tuntas', true);
  end;

  v_srt := public.terbitkan_sertifikat('00000000-0000-4000-8000-00000000000d',
                                       '00000000-0000-4000-8000-0000000000f1', true);
  perform uji.periksa(
    'penerbitan manual berhasil, nomor & predikat terbentuk',
    v_srt.nomor like 'MQU/%' and v_srt.predikat is not null);

  perform uji.jadi_super();
  select count(*) into v_jml from public.enrollments
   where santri_id = '00000000-0000-4000-8000-00000000000d' and status = 'selesai';
  perform uji.periksa('status pendaftaran otomatis menjadi selesai', v_jml = 1);

  v_token := v_srt.token_verifikasi;

  perform uji.jadi_tamu();
  select count(*) into v_jml from public.cek_sertifikat(v_token);
  perform uji.periksa('tamu bisa memverifikasi sertifikat lewat token', v_jml = 1);

  select count(*) into v_jml from public.cek_sertifikat('token-ngawur');
  perform uji.periksa('token palsu tidak menghasilkan apa pun', v_jml = 0);

  select count(*) into v_jml from public.sertifikat;
  perform uji.periksa('tabel sertifikat tetap tertutup bagi tamu', v_jml = 0);
end $$;

-- =====================================================================
\echo ''
\echo '=== 7. Admin ==='
-- =====================================================================
do $$
declare v_jml int;
begin
  perform uji.jadi('00000000-0000-4000-8000-00000000000a');

  select count(*) into v_jml from public.profiles;
  perform uji.periksa('admin melihat seluruh profil', v_jml >= 5);

  select count(*) into v_jml from public.orders;
  perform uji.periksa('admin melihat seluruh pesanan', v_jml >= 1);

  select count(*) into v_jml from public.pengaturan_situs where kunci = 'rekening';
  perform uji.periksa('admin bisa membaca pengaturan rekening', v_jml = 1);

  select count(*) into v_jml from public.penilaian_setoran;
  perform uji.periksa('admin melihat seluruh penilaian', v_jml >= 1);
end $$;

\echo ''
\echo '  ====================================================='
\echo '   SELURUH PEMERIKSAAN RLS LOLOS'
\echo '  ====================================================='
\echo ''

-- Semua data uji dibuang; database kembali seperti sebelum skrip dijalankan.
rollback;
