-- =====================================================================
-- MQ Ummina Online — Isi awal `pengaturan_situs`
--
-- Nilai di sini adalah CONTOH. Admin mengubahnya lewat /admin/pengaturan
-- tanpa perlu deploy ulang. Ganti nomor rekening & kontak sebelum rilis.
-- =====================================================================

insert into public.pengaturan_situs (kunci, nilai, keterangan, is_publik) values
  ('kontak', jsonb_build_object(
      'whatsapp',  '628000000000',
      'email',     'info@mqummina.id',
      'alamat',    'Bandung, Jawa Barat',
      'instagram', 'mqummina'
   ), 'Kontak yang tampil di footer & tombol WhatsApp', true),

  ('rekening', jsonb_build_object(
      'bank',        'Bank Syariah Indonesia (BSI)',
      'nomor',       '0000000000',
      'atas_nama',   'Yayasan Madrasah Quran Ummina'
   ), 'Rekening tujuan transfer manual. Ditampilkan hanya kepada pengguna yang sudah masuk.', false),

  ('hero', jsonb_build_object(
      'judul',    'Belajar Membaca Al-Qur''an di Ruang Khusus Muslimah',
      'subjudul', 'Materi video terstruktur yang bisa diulang kapan saja, dipadukan halaqah setoran langsung bersama ustadzah agar bacaan Anda benar-benar dikoreksi.',
      'cta',      'Lihat Program',
      'catatan',  'Khusus muslimah · Pengajar ustadzah · Kelas daring'
   ), 'Teks utama halaman depan', true),

  ('statistik', jsonb_build_object(
      'santri',   '1.200+',
      'pengajar', '12',
      'kelas',    '12',
      'kepuasan', '4,9/5'
   ), 'Angka yang tampil di bawah hero halaman depan', true),

  ('alur_belajar', jsonb_build_array(
      jsonb_build_object('judul', 'Pilih Program', 'isi', 'Tentukan kelas sesuai kemampuan Anda: dari mengenal huruf hingga tahsin lanjutan.'),
      jsonb_build_object('judul', 'Daftar & Bayar', 'isi', 'Transfer sesuai nominal unik, unggah bukti, akses dibuka setelah diverifikasi.'),
      jsonb_build_object('judul', 'Pelajari Materi', 'isi', 'Tonton video pelajaran kapan saja, ulangi sebanyak yang Anda perlukan.'),
      jsonb_build_object('judul', 'Setoran Halaqah', 'isi', 'Ikuti halaqah terjadwal bersama ustadzah untuk dikoreksi langsung.'),
      jsonb_build_object('judul', 'Rapor & Sertifikat', 'isi', 'Pantau perkembangan bacaan, lalu terima sertifikat kelulusan.')
   ), 'Langkah-langkah di halaman depan', true),

  ('pengasuh', jsonb_build_object(
      'nama',  'Ustadzah Ma''rifah, S.Q., Hafidzoh',
      'peran', 'Pengasuh & Pengajar Utama',
      'bio',   'Hafidzoh 30 juz dan Sarjana Ilmu Al-Qur''an. Membimbing tahsin dan tahfidz muslimah, dengan perhatian khusus pada ketepatan makhraj dan sifat huruf. Beliau memimpin langsung penyusunan kurikulum dan tashih kelulusan di Madrasah Qur''an Ummina.'
   ), 'Profil pengasuh madrasah yang tampil di halaman Tentang', true)
on conflict (kunci) do nothing;
