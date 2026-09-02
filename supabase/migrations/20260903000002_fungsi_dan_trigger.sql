-- =====================================================================
-- MQ Ummina Online — Fungsi & Trigger
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Utilitas umum
-- ---------------------------------------------------------------------
create or replace function public.set_diubah_at()
returns trigger
language plpgsql
as $$
begin
  new.diubah_at := now();
  return new;
end;
$$;

create trigger trg_profiles_diubah before update on public.profiles
  for each row execute function public.set_diubah_at();
create trigger trg_courses_diubah  before update on public.courses
  for each row execute function public.set_diubah_at();
create trigger trg_lessons_diubah  before update on public.lessons
  for each row execute function public.set_diubah_at();
create trigger trg_progres_diubah  before update on public.progres_pelajaran
  for each row execute function public.set_diubah_at();
create trigger trg_pengaturan_diubah before update on public.pengaturan_situs
  for each row execute function public.set_diubah_at();

-- ---------------------------------------------------------------------
-- 2. Peran & hak akses
--
-- PENTING: fungsi-fungsi ini WAJIB `security definer`. Kalau policy pada
-- tabel `profiles` melakukan subquery ke `profiles`, Postgres akan masuk
-- rekursi tak berujung ("infinite recursion detected in policy").
-- ---------------------------------------------------------------------
create or replace function public.peran_saya()
returns peran_pengguna
language sql
security definer
stable
set search_path = public
as $$
  select peran from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select peran = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_pengajar()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select peran in ('ustadz', 'admin') from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Apakah user saat ini pembimbing angkatan tsb (atau admin)?
create or replace function public.membimbing_batch(p_batch uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.batches b
    where b.id = p_batch and b.ustadz_id = auth.uid()
  );
$$;

-- Apakah user saat ini punya akses aktif ke sebuah kelas?
create or replace function public.sudah_terdaftar(p_course uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.enrollments e
    where e.course_id = p_course
      and e.santri_id = auth.uid()
      and e.status in ('aktif', 'selesai')
  );
$$;

-- Apakah user saat ini pembimbing angkatan dari sebuah sesi halaqah?
create or replace function public.membimbing_sesi(p_sesi uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1
    from public.sesi_halaqah s
    join public.batches b on b.id = s.batch_id
    where s.id = p_sesi and b.ustadz_id = auth.uid()
  );
$$;

-- Apakah user saat ini pembimbing angkatan dari sebuah pendaftaran?
create or replace function public.membimbing_enrollment(p_enrollment uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1
    from public.enrollments e
    join public.batches b on b.id = e.batch_id
    where e.id = p_enrollment and b.ustadz_id = auth.uid()
  );
$$;

-- Apakah user saat ini pembimbing dari seorang santri (di angkatan mana pun)?
create or replace function public.membimbing_santri(p_santri uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1
    from public.enrollments e
    join public.batches b on b.id = e.batch_id
    where e.santri_id = p_santri and b.ustadz_id = auth.uid()
  );
$$;

-- Apakah user saat ini mengajar salah satu angkatan dari sebuah kelas?
create or replace function public.mengajar_kelas(p_course uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.batches b
    where b.course_id = p_course and b.ustadz_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- 3. Pendaftaran pengguna baru
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Peran SELALU 'santri'. Jangan pernah membaca peran dari metadata pendaftaran,
  -- karena metadata itu dikirim dari klien dan bisa dipalsukan.
  insert into public.profiles (id, nama, no_hp, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'nama'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(new.email, '@', 1)
    ),
    nullif(trim(new.raw_user_meta_data ->> 'no_hp'), ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Kunci kolom `peran`: hanya admin (atau service_role di server) yang boleh mengubah.
-- Tanpa ini, santri bisa `update profiles set peran='admin'` lewat anon key.
create or replace function public.jaga_peran_profil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.peran is distinct from old.peran
     and auth.uid() is not null
     and not public.is_admin() then
    new.peran := old.peran;
  end if;
  return new;
end;
$$;

create trigger trg_profiles_jaga_peran
  before update on public.profiles
  for each row execute function public.jaga_peran_profil();

-- ---------------------------------------------------------------------
-- 4. Penomoran
-- ---------------------------------------------------------------------
create sequence if not exists public.seq_invoice;
create sequence if not exists public.seq_sertifikat;

create or replace function public.buat_nomor_invoice()
returns text
language sql
volatile
set search_path = public
as $$
  select 'INV-' || to_char(now() at time zone 'Asia/Jakarta', 'YYYYMMDD')
      || '-' || lpad(nextval('public.seq_invoice')::text, 4, '0');
$$;

-- ---------------------------------------------------------------------
-- 5. Ringkasan capaian santri
--
-- Satu-satunya sumber kebenaran untuk syarat kelulusan. Dipakai halaman rapor
-- santri DAN tombol "Terbitkan Sertifikat" di panel admin, supaya angka yang
-- dilihat santri dan admin tidak pernah berbeda.
-- ---------------------------------------------------------------------
create or replace function public.ringkasan_capaian(p_santri uuid, p_course uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_total_pelajaran   int;
  v_pelajaran_selesai int;
  v_rata              numeric(5, 2);
  v_jumlah_penilaian  int;
  v_sesi_lewat        int;
  v_hadir             int;
  v_batch             uuid;
begin
  select count(*) into v_total_pelajaran
  from public.lessons where course_id = p_course;

  select count(*) into v_pelajaran_selesai
  from public.progres_pelajaran
  where santri_id = p_santri and course_id = p_course and selesai_at is not null;

  select e.batch_id into v_batch
  from public.enrollments e
  where e.santri_id = p_santri and e.course_id = p_course;

  select round(avg(ps.nilai_rata), 2), count(*)
    into v_rata, v_jumlah_penilaian
  from public.penilaian_setoran ps
  join public.enrollments e on e.id = ps.enrollment_id
  where ps.santri_id = p_santri and e.course_id = p_course;

  -- Kehadiran hanya dihitung dari sesi yang waktunya sudah lewat.
  select count(*) into v_sesi_lewat
  from public.sesi_halaqah s
  where s.batch_id = v_batch and s.mulai_at < now();

  select count(*) into v_hadir
  from public.kehadiran k
  join public.sesi_halaqah s on s.id = k.sesi_id
  where s.batch_id = v_batch
    and s.mulai_at < now()
    and k.santri_id = p_santri
    and k.status = 'hadir';

  return jsonb_build_object(
    'total_pelajaran',   v_total_pelajaran,
    'pelajaran_selesai', v_pelajaran_selesai,
    'progres_persen',    case when v_total_pelajaran = 0 then 0
                              else round(v_pelajaran_selesai * 100.0 / v_total_pelajaran) end,
    'jumlah_penilaian',  v_jumlah_penilaian,
    'nilai_rata',        v_rata,
    'sesi_lewat',        v_sesi_lewat,
    'hadir',             v_hadir,
    'kehadiran_persen',  case when v_sesi_lewat = 0 then 0
                              else round(v_hadir * 100.0 / v_sesi_lewat) end
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 6. Verifikasi pembayaran (atomik)
--
-- Menandai pesanan lunas DAN membuka akses kelas harus terjadi bersamaan.
-- Kalau dipecah jadi dua query dari aplikasi, kegagalan di tengah bisa membuat
-- santri sudah membayar tapi tidak punya akses.
-- ---------------------------------------------------------------------
create or replace function public.setujui_pesanan(p_order uuid)
returns public.enrollments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order   public.orders;
  v_terisi  int;
  v_kuota   int;
  v_enroll  public.enrollments;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang boleh memverifikasi pembayaran'
      using errcode = '42501';
  end if;

  select * into v_order from public.orders where id = p_order for update;
  if not found then
    raise exception 'Pesanan tidak ditemukan' using errcode = 'P0002';
  end if;
  if v_order.status = 'lunas' then
    raise exception 'Pesanan % sudah lunas', v_order.nomor_invoice using errcode = '23505';
  end if;
  if v_order.status = 'ditolak' then
    raise exception 'Pesanan % sudah ditolak', v_order.nomor_invoice using errcode = '22023';
  end if;

  -- Kuota dicek di sini, bukan saat pesanan dibuat: yang memakan kursi adalah
  -- santri yang sudah terverifikasi bayar, bukan yang baru klik daftar.
  if v_order.batch_id is not null then
    select b.kuota into v_kuota from public.batches b
    where b.id = v_order.batch_id for update;

    select count(*) into v_terisi from public.enrollments e
    where e.batch_id = v_order.batch_id and e.status <> 'berhenti';

    if v_terisi >= v_kuota then
      raise exception 'Kuota angkatan sudah penuh (% dari %)', v_terisi, v_kuota
        using errcode = '23514';
    end if;
  end if;

  update public.orders
     set status            = 'lunas',
         diverifikasi_oleh = auth.uid(),
         diverifikasi_at   = now(),
         alasan_tolak      = null
   where id = p_order;

  insert into public.enrollments (santri_id, course_id, batch_id)
  values (v_order.santri_id, v_order.course_id, v_order.batch_id)
  on conflict (santri_id, course_id) do update
     set status   = 'aktif',
         batch_id = coalesce(excluded.batch_id, public.enrollments.batch_id)
  returning * into v_enroll;

  return v_enroll;
end;
$$;

create or replace function public.tolak_pesanan(p_order uuid, p_alasan text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang boleh menolak pembayaran' using errcode = '42501';
  end if;

  update public.orders
     set status            = 'ditolak',
         alasan_tolak      = p_alasan,
         diverifikasi_oleh = auth.uid(),
         diverifikasi_at   = now()
   where id = p_order and status <> 'lunas';

  if not found then
    raise exception 'Pesanan tidak ditemukan atau sudah lunas' using errcode = 'P0002';
  end if;
end;
$$;

-- Tandai pesanan yang lewat batas waktu. Dipanggil aplikasi saat membuka daftar
-- pesanan; nanti bisa dijadwalkan lewat pg_cron.
create or replace function public.kadaluarsakan_pesanan()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jumlah int;
begin
  update public.orders
     set status = 'kadaluarsa'
   where status = 'menunggu_bayar'
     and kadaluarsa_at < now();
  get diagnostics v_jumlah = row_count;
  return v_jumlah;
end;
$$;

-- ---------------------------------------------------------------------
-- 6b. Pembuatan pesanan & unggah bukti oleh santri
--
-- Dibuat sebagai fungsi (bukan INSERT/UPDATE langsung lewat RLS) karena harga,
-- nomor invoice, dan batas waktu HARUS ditentukan server. Kalau santri boleh
-- menulis baris `orders` sendiri, dia bisa mengirim harga 0.
-- ---------------------------------------------------------------------
create or replace function public.buat_pesanan(p_course uuid, p_batch uuid default null)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_harga  int;
  v_hasil  public.orders;
begin
  if auth.uid() is null then
    raise exception 'Harus masuk terlebih dahulu' using errcode = '42501';
  end if;

  select c.harga into v_harga
  from public.courses c
  where c.id = p_course and c.is_published;
  if not found then
    raise exception 'Kelas tidak ditemukan atau belum terbit' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.enrollments
    where santri_id = auth.uid() and course_id = p_course and status <> 'berhenti'
  ) then
    raise exception 'Anda sudah terdaftar di kelas ini' using errcode = '23505';
  end if;

  if p_batch is not null and not exists (
    select 1 from public.batches b
    where b.id = p_batch and b.course_id = p_course
      and b.status in ('pendaftaran', 'berjalan')
  ) then
    raise exception 'Angkatan tidak tersedia' using errcode = 'P0002';
  end if;

  -- Bereskan dulu pesanan lama yang sudah lewat waktu, supaya indeks unik
  -- `orders_aktif_unik` tidak memblokir santri yang ingin mendaftar ulang.
  update public.orders
     set status = 'kadaluarsa'
   where santri_id = auth.uid() and course_id = p_course
     and status = 'menunggu_bayar' and kadaluarsa_at < now();

  insert into public.orders (
    nomor_invoice, santri_id, course_id, batch_id, harga, kode_unik, kadaluarsa_at
  ) values (
    public.buat_nomor_invoice(),
    auth.uid(),
    p_course,
    p_batch,
    v_harga,
    floor(random() * 899 + 100)::int, -- 100..998
    now() + interval '24 hours'
  )
  returning * into v_hasil;

  return v_hasil;
end;
$$;

create or replace function public.unggah_bukti(
  p_order         uuid,
  p_path          text,
  p_nama_pengirim text default null,
  p_catatan       text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hasil public.orders;
begin
  update public.orders
     set bukti_url      = p_path,
         nama_pengirim  = p_nama_pengirim,
         catatan_santri = p_catatan,
         status         = 'menunggu_verifikasi'
   where id = p_order
     and santri_id = auth.uid()
     and status in ('menunggu_bayar', 'menunggu_verifikasi', 'ditolak')
  returning * into v_hasil;

  if not found then
    raise exception 'Pesanan tidak ditemukan atau tidak bisa diubah lagi'
      using errcode = 'P0002';
  end if;

  return v_hasil;
end;
$$;

-- ---------------------------------------------------------------------
-- 7. Penerbitan sertifikat
-- ---------------------------------------------------------------------
create or replace function public.terbitkan_sertifikat(
  p_santri  uuid,
  p_course  uuid,
  p_paksa   boolean default false
)
returns public.sertifikat
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capaian jsonb;
  v_rata    numeric(5, 2);
  v_kode    text;
  v_batch   uuid;
  v_hasil   public.sertifikat;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang boleh menerbitkan sertifikat' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.enrollments
    where santri_id = p_santri and course_id = p_course
  ) then
    raise exception 'Santri belum terdaftar di kelas ini' using errcode = 'P0002';
  end if;

  v_capaian := public.ringkasan_capaian(p_santri, p_course);
  v_rata    := (v_capaian ->> 'nilai_rata')::numeric;

  -- p_paksa dipakai untuk kasus khusus (mis. santri pindahan yang setorannya
  -- dinilai di luar sistem). Admin tetap harus memilihnya secara sadar.
  if not p_paksa then
    if (v_capaian ->> 'progres_persen')::int < 100 then
      raise exception 'Materi belum tuntas (baru %%%)', v_capaian ->> 'progres_persen'
        using errcode = '23514';
    end if;
    if v_rata is null or v_rata < 75 then
      raise exception 'Rata-rata nilai setoran belum memenuhi syarat (minimal 75)'
        using errcode = '23514';
    end if;
    if (v_capaian ->> 'kehadiran_persen')::int < 80 then
      raise exception 'Kehadiran halaqah belum memenuhi syarat (minimal 80%%)'
        using errcode = '23514';
    end if;
  end if;

  select e.batch_id into v_batch from public.enrollments e
  where e.santri_id = p_santri and e.course_id = p_course;

  select upper(regexp_replace(left(c.slug, 8), '[^a-zA-Z0-9]', '', 'g'))
    into v_kode
  from public.courses c where c.id = p_course;

  insert into public.sertifikat (
    nomor, santri_id, course_id, batch_id, nilai_rata, predikat, rekap_nilai, diterbitkan_oleh
  ) values (
    'MQU/' || v_kode || '/' || to_char(now(), 'YYYY') || '/'
      || lpad(nextval('public.seq_sertifikat')::text, 4, '0'),
    p_santri, p_course, v_batch, v_rata,
    case
      when v_rata >= 90 then 'Mumtaz (Istimewa)'
      when v_rata >= 80 then 'Jayyid Jiddan (Sangat Baik)'
      when v_rata >= 70 then 'Jayyid (Baik)'
      when v_rata >= 60 then 'Maqbul (Cukup)'
      else 'Perlu Perbaikan'
    end,
    v_capaian,
    auth.uid()
  )
  returning * into v_hasil;

  update public.enrollments set status = 'selesai'
  where santri_id = p_santri and course_id = p_course;

  return v_hasil;
end;
$$;

-- ---------------------------------------------------------------------
-- 8. Verifikasi sertifikat publik
--
-- Dibuat sebagai fungsi agar tabel `sertifikat` tidak perlu dibuka untuk anon.
-- Hanya mengembalikan data yang memang dicetak di lembar sertifikat.
-- ---------------------------------------------------------------------
create or replace function public.cek_sertifikat(p_token text)
returns table (
  nomor       text,
  nama_santri text,
  judul_kelas text,
  jenjang     text,
  predikat    text,
  tgl_terbit  date
)
language sql
security definer
stable
set search_path = public
as $$
  select s.nomor, p.nama, c.judul, c.jenjang, s.predikat, s.tgl_terbit
  from public.sertifikat s
  join public.profiles p on p.id = s.santri_id
  join public.courses  c on c.id = s.course_id
  where s.token_verifikasi = p_token;
$$;

grant execute on function public.cek_sertifikat(text) to anon, authenticated;
