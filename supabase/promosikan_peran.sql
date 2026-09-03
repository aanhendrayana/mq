-- =====================================================================
-- Menaikkan peran pengguna
--
-- Peran TIDAK bisa dinaikkan dari aplikasi: trigger `jaga_peran_profil()`
-- menolak perubahan kolom `peran` oleh siapa pun kecuali admin. Admin pertama
-- karena itu harus dibuat dari sini (SQL Editor Supabase berjalan sebagai
-- service_role, sehingga lolos dari trigger tersebut).
--
-- Cara pakai:
--   1. Daftarkan akunnya lebih dulu lewat halaman /daftar di aplikasi.
--   2. Ganti alamat email di bawah, lalu jalankan di SQL Editor Supabase.
-- =====================================================================

-- Jadikan admin
update public.profiles p
   set peran = 'admin'
  from auth.users u
 where u.id = p.id
   and u.email = 'ganti-dengan-email-admin@contoh.com';

-- Jadikan ustadzah
update public.profiles p
   set peran = 'ustadz'
  from auth.users u
 where u.id = p.id
   and u.email = 'ganti-dengan-email-ustadz@contoh.com';

-- Periksa hasilnya
select u.email, p.nama, p.peran
  from public.profiles p
  join auth.users u on u.id = p.id
 order by p.peran, u.email;
