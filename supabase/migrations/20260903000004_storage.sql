-- =====================================================================
-- MQ Ummina Online — Bucket Storage & Policy
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  -- Gambar publik: thumbnail kelas, avatar, logo, lampiran materi.
  ('materi', 'materi', true, 10485760,
   array['image/png','image/jpeg','image/webp','image/svg+xml','application/pdf']),

  -- Bukti transfer: PRIVAT. Berisi tangkapan layar mutasi rekening santri.
  ('bukti-bayar', 'bukti-bayar', false, 5242880,
   array['image/png','image/jpeg','image/webp','application/pdf']),

  -- Rekaman setoran bacaan (opsional, dipakai bila santri mengirim audio).
  ('rekaman', 'rekaman', false, 26214400,
   array['audio/mpeg','audio/mp4','audio/webm','audio/ogg','video/mp4','video/webm'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Bucket publik 'materi' — baca bebas, tulis hanya admin.
-- ---------------------------------------------------------------------
create policy "materi bisa dibaca siapa saja"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'materi');

create policy "admin kelola materi"
  on storage.objects for all to authenticated
  using (bucket_id = 'materi' and public.is_admin())
  with check (bucket_id = 'materi' and public.is_admin());

-- ---------------------------------------------------------------------
-- Bucket privat 'bukti-bayar'
--
-- Konvensi path WAJIB: <user_id>/<nomor_invoice>.<ext>
-- Folder pertama dipakai policy untuk menentukan pemilik berkas.
-- ---------------------------------------------------------------------
create policy "santri unggah bukti miliknya"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'bukti-bayar'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "santri ganti bukti miliknya"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'bukti-bayar'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'bukti-bayar'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "santri baca bukti miliknya"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'bukti-bayar'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "admin baca semua bukti"
  on storage.objects for select to authenticated
  using (bucket_id = 'bukti-bayar' and public.is_admin());

create policy "admin hapus bukti"
  on storage.objects for delete to authenticated
  using (bucket_id = 'bukti-bayar' and public.is_admin());

-- ---------------------------------------------------------------------
-- Bucket privat 'rekaman' — konvensi path sama: <user_id>/<berkas>
-- Ustadz pembimbing perlu bisa mendengarkan, karena itu dibuka untuk pengajar.
-- ---------------------------------------------------------------------
create policy "santri kelola rekamannya"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'rekaman'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'rekaman'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pengajar dengar rekaman santri bimbingannya"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'rekaman'
    and public.membimbing_santri(((storage.foldername(name))[1])::uuid)
  );
