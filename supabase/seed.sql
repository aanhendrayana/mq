-- =====================================================================
-- MQ Ummina Online — Data Contoh
--
-- Jalankan SETELAH semua migrasi. Aman diulang (memakai UUID tetap +
-- `on conflict do nothing`).
--
-- Seluruh isi contoh ditulis untuk madrasah khusus muslimah.
--
-- CATATAN: berkas ini TIDAK membuat akun pengguna. Buat akun lewat halaman
-- /daftar di aplikasi, lalu naikkan perannya dengan supabase/promosikan_peran.sql.
--
-- Semua `video_id` di bawah masih memakai video uji publik (Big Buck Bunny,
-- film terbuka Blender). Ganti dengan ID video MQ Ummina yang sebenarnya
-- lewat /admin/kelas sebelum dipakai santriwati.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Program
-- ---------------------------------------------------------------------
insert into public.programs (id, slug, nama, deskripsi, ikon, urutan) values
  ('11111111-0000-4000-8000-000000000001', 'tahsin', 'Tahsin',
   'Memperbaiki bacaan Al-Qur''an: makhraj, sifat huruf, dan hukum tajwid, bertahap dari dasar hingga tartil.',
   'book-open-check', 1),
  ('11111111-0000-4000-8000-000000000002', 'iqro', 'Iqro & Baca Dasar',
   'Untuk muslimah yang benar-benar memulai dari nol: mengenal huruf hijaiyah sampai lancar membaca.',
   'baby', 2),
  ('11111111-0000-4000-8000-000000000003', 'tahfidz', 'Tahfidz',
   'Menghafal Al-Qur''an dengan target terukur dan murojaah terbimbing.',
   'brain', 3),
  ('11111111-0000-4000-8000-000000000004', 'kelas-guru', 'Kelas Guru',
   'Menyiapkan ustadzah pengajar Al-Qur''an: penguasaan materi, metode mengajar, tashih, dan sertifikasi.',
   'graduation-cap', 4)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Kelas
-- ---------------------------------------------------------------------
insert into public.courses (
  id, program_id, slug, judul, subjudul, jenjang, deskripsi,
  apa_yang_dipelajari, untuk_siapa, prasyarat,
  harga, harga_coret, durasi_pekan, is_published, urutan
) values
(
  '22222222-0000-4000-8000-000000000001',
  '11111111-0000-4000-8000-000000000001',
  'tahsin-dasar', 'Tahsin Dasar',
  'Perbaiki fondasi bacaan Anda: makhraj, sifat huruf, dan hukum tajwid pokok.',
  'Dasar',
  'Kelas ini untuk Anda yang sudah bisa membaca Al-Qur''an tetapi merasa bacaannya belum benar. Selama 12 pekan Anda mempelajari tempat keluarnya huruf, sifat huruf, hukum nun sukun dan mim sukun, serta mad — dengan materi video yang bisa diulang kapan saja, lalu disetorkan langsung kepada ustadzah pembimbing di halaqah dua kali sepekan.',
  '["Melafalkan 29 huruf hijaiyah sesuai makhraj yang benar","Membedakan sifat huruf yang sering tertukar","Menerapkan hukum nun sukun, tanwin, dan mim sukun","Membaca mad dengan panjang yang tepat","Berhenti dan memulai bacaan pada tempat yang benar"]'::jsonb,
  '["Muslimah dewasa yang ingin memperbaiki bacaan","Ibu yang ingin mengajari anaknya mengaji di rumah","Mualaf yang sudah lancar membaca huruf hijaiyah"]'::jsonb,
  'Sudah bisa membaca huruf hijaiyah bersambung (minimal lulus Iqro jilid 6).',
  450000, 650000, 12, true, 1
),
(
  '22222222-0000-4000-8000-000000000002',
  '11111111-0000-4000-8000-000000000001',
  'tahsin-menengah', 'Tahsin Menengah',
  'Pendalaman tajwid dan latihan tartil pada surat-surat pilihan.',
  'Menengah',
  'Lanjutan dari Tahsin Dasar. Fokus pada mad far''i, gharib, dan latihan tartil dengan irama yang benar.',
  '["Menguasai seluruh cabang mad far''i","Membaca bacaan gharib yang umum","Melatih tartil dan nafas"]'::jsonb,
  '["Alumni Tahsin Dasar","Muslimah yang lulus tes penempatan menengah"]'::jsonb,
  'Lulus Tahsin Dasar atau lolos tes penempatan.',
  550000, 750000, 12, true, 2
),
(
  '22222222-0000-4000-8000-000000000003',
  '11111111-0000-4000-8000-000000000002',
  'iqro-dewasa', 'Iqro untuk Dewasa',
  'Mulai dari nol tanpa sungkan: kelas khusus dewasa yang baru belajar membaca.',
  'Pemula',
  'Dirancang untuk muslimah dewasa yang baru mulai belajar membaca Al-Qur''an. Tempo pelan, kelompok kecil sesama muslimah, tanpa rasa malu.',
  '["Mengenal dan menulis huruf hijaiyah","Membaca huruf bersambung","Membaca ayat pendek dengan lancar"]'::jsonb,
  '["Muslimah dewasa yang belum pernah mengaji","Mualaf"]'::jsonb,
  'Tidak ada. Kelas ini benar-benar dari nol.',
  350000, null, 16, true, 3
),
(
  '22222222-0000-4000-8000-000000000004',
  '11111111-0000-4000-8000-000000000003',
  'tahfidz-juz-30', 'Tahfidz Juz 30',
  'Hafal juz Amma dengan bacaan yang sudah benar dan murojaah terbimbing.',
  'Juz 30',
  'Menghafal juz 30 secara bertahap dengan setoran rutin dan jadwal murojaah yang dipantau ustadzah pembimbing.',
  '["Menghafal 37 surat juz 30","Menjaga hafalan lewat murojaah terstruktur","Memperbaiki bacaan sambil menghafal"]'::jsonb,
  '["Muslimah yang bacaannya sudah cukup baik","Alumni Tahsin Dasar"]'::jsonb,
  'Bacaan minimal setara lulusan Tahsin Dasar.',
  500000, null, 24, true, 4
),
(
  '22222222-0000-4000-8000-000000000005',
  '11111111-0000-4000-8000-000000000004',
  'sertifikasi-guru', 'Kelas Guru Al-Qur''an & Sertifikasi',
  'Persiapan menjadi pengajar Al-Qur''an: metode, praktik mengajar, tashih, dan sertifikasi.',
  'Sertifikasi',
  'Program untuk calon ustadzah: penguasaan materi tahsin, metodologi pengajaran, praktik mengajar, diakhiri tashih dan sertifikasi.',
  '["Metodologi mengajar Al-Qur''an","Teknik mengoreksi bacaan santriwati","Menyusun rencana pembelajaran","Lulus tashih dan memperoleh sertifikat pengajar"]'::jsonb,
  '["Guru TPQ/TPA muslimah","Alumni Tahsin Menengah","Calon ustadzah di lembaga atau majelis taklim"]'::jsonb,
  'Lulus Tahsin Menengah dan lolos tashih awal.',
  1500000, 2000000, 20, true, 5
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Kurikulum Tahsin Dasar
-- ---------------------------------------------------------------------
insert into public.modules (id, course_id, judul, ringkasan, urutan) values
  ('33333333-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001',
   'Pengantar & Adab Belajar Al-Qur''an', 'Meluruskan niat dan memahami cara kerja kelas.', 1),
  ('33333333-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001',
   'Makhrajul Huruf', 'Lima tempat keluarnya huruf dan latihan pelafalan.', 2),
  ('33333333-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000001',
   'Sifatul Huruf', 'Sifat huruf yang membedakan bunyi yang mirip.', 3),
  ('33333333-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000001',
   'Hukum Nun Sukun, Tanwin & Mim Sukun', 'Izhar, idgham, iqlab, ikhfa, dan hukum mim sukun.', 4),
  ('33333333-0000-4000-8000-000000000005', '22222222-0000-4000-8000-000000000001',
   'Mad & Waqaf', 'Panjang bacaan dan tempat berhenti yang benar.', 5)
on conflict (id) do nothing;

insert into public.lessons (
  id, module_id, course_id, slug, judul, tipe, video_provider, video_id,
  durasi_detik, konten_md, is_preview, urutan
) values
-- Bab 1
('44444444-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001',
 'selamat-datang', 'Selamat Datang di Kelas Tahsin Dasar', 'video', 'youtube', 'aqz-KE-bpKQ', 420,
 'Perkenalan ustadzah pembimbing, gambaran isi kelas, dan target yang ingin dicapai selama 12 pekan.', true, 1),
('44444444-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001',
 'adab-terhadap-quran', 'Adab Terhadap Al-Qur''an', 'video', 'youtube', 'aqz-KE-bpKQ', 780,
 'Adab sebelum, saat, dan sesudah membaca Al-Qur''an.', false, 2),
('44444444-0000-4000-8000-000000000003', '33333333-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001',
 'cara-menggunakan-kelas', 'Cara Menggunakan Kelas Ini', 'video', 'youtube', 'aqz-KE-bpKQ', 360,
 'Alur belajar: tonton materi, latih mandiri, lalu setorkan di halaqah.', true, 3),

-- Bab 2
('44444444-0000-4000-8000-000000000004', '33333333-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001',
 'lima-tempat-makhraj', 'Lima Tempat Keluarnya Huruf', 'video', 'youtube', 'aqz-KE-bpKQ', 900,
 'Al-Jauf, Al-Halq, Al-Lisan, Asy-Syafatain, dan Al-Khaisyum.', false, 1),
('44444444-0000-4000-8000-000000000005', '33333333-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001',
 'al-jauf-dan-al-halq', 'Al-Jauf & Al-Halq', 'video', 'youtube', 'aqz-KE-bpKQ', 1080,
 'Huruf mad dan enam huruf tenggorokan yang paling sering keliru.', false, 2),
('44444444-0000-4000-8000-000000000006', '33333333-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001',
 'al-lisan-1', 'Al-Lisan — Bagian 1', 'video', 'youtube', 'aqz-KE-bpKQ', 1200, null, false, 3),
('44444444-0000-4000-8000-000000000007', '33333333-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001',
 'al-lisan-2', 'Al-Lisan — Bagian 2', 'video', 'youtube', 'aqz-KE-bpKQ', 1140, null, false, 4),
('44444444-0000-4000-8000-000000000008', '33333333-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001',
 'syafatain-khaisyum', 'Asy-Syafatain & Al-Khaisyum', 'video', 'youtube', 'aqz-KE-bpKQ', 840, null, false, 5),

-- Bab 3
('44444444-0000-4000-8000-000000000009', '33333333-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000001',
 'sifat-berlawanan-1', 'Sifat Berlawanan: Hams–Jahr & Syiddah–Rakhawah', 'video', 'youtube', 'aqz-KE-bpKQ', 960, null, false, 1),
('44444444-0000-4000-8000-000000000010', '33333333-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000001',
 'sifat-berlawanan-2', 'Isti''la–Istifal & Ithbaq–Infitah', 'video', 'youtube', 'aqz-KE-bpKQ', 900, null, false, 2),
('44444444-0000-4000-8000-000000000011', '33333333-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000001',
 'sifat-tidak-berlawanan', 'Sifat Tidak Berlawanan: Qalqalah, Shafir, dan Lainnya', 'video', 'youtube', 'aqz-KE-bpKQ', 1020, null, false, 3),

-- Bab 4
('44444444-0000-4000-8000-000000000012', '33333333-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000001',
 'izhar-halqi', 'Izhar Halqi', 'video', 'youtube', 'aqz-KE-bpKQ', 720, null, false, 1),
('44444444-0000-4000-8000-000000000013', '33333333-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000001',
 'idgham', 'Idgham Bighunnah & Bilaghunnah', 'video', 'youtube', 'aqz-KE-bpKQ', 840, null, false, 2),
('44444444-0000-4000-8000-000000000014', '33333333-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000001',
 'iqlab-ikhfa', 'Iqlab & Ikhfa'' Haqiqi', 'video', 'youtube', 'aqz-KE-bpKQ', 960, null, false, 3),
('44444444-0000-4000-8000-000000000015', '33333333-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000001',
 'hukum-mim-sukun', 'Hukum Mim Sukun', 'video', 'youtube', 'aqz-KE-bpKQ', 780, null, false, 4),

-- Bab 5
('44444444-0000-4000-8000-000000000016', '33333333-0000-4000-8000-000000000005', '22222222-0000-4000-8000-000000000001',
 'mad-thabii', 'Mad Thabi''i', 'video', 'youtube', 'aqz-KE-bpKQ', 660, null, false, 1),
('44444444-0000-4000-8000-000000000017', '33333333-0000-4000-8000-000000000005', '22222222-0000-4000-8000-000000000001',
 'mad-fari', 'Mad Far''i yang Sering Ditemui', 'video', 'youtube', 'aqz-KE-bpKQ', 1140, null, false, 2),
('44444444-0000-4000-8000-000000000018', '33333333-0000-4000-8000-000000000005', '22222222-0000-4000-8000-000000000001',
 'tanda-waqaf', 'Tanda Waqaf & Ibtida''', 'video', 'youtube', 'aqz-KE-bpKQ', 900, null, false, 3),
('44444444-0000-4000-8000-000000000019', '33333333-0000-4000-8000-000000000005', '22222222-0000-4000-8000-000000000001',
 'praktik-surat-pendek', 'Praktik Membaca Surat Pendek', 'video', 'youtube', 'aqz-KE-bpKQ', 1320,
 'Menerapkan seluruh materi pada QS. Al-Bayyinah dan QS. Al-Qadr.', false, 4)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- FAQ
-- ---------------------------------------------------------------------
insert into public.faq (course_id, pertanyaan, jawaban, urutan) values
  (null, 'Apakah benar madrasah ini khusus muslimah?',
   'Benar, tanpa kecuali. Seluruh santriwati dan pengajarnya perempuan, dan halaqah setoran hanya diikuti muslimah — sehingga Anda bisa membaca dengan tenang dan leluasa.', 1),
  (null, 'Apakah kelas ini untuk pemula?',
   'Tergantung program yang dipilih. Iqro untuk Dewasa dirancang benar-benar dari nol, sedangkan Tahsin Dasar mengandaikan Anda sudah bisa membaca huruf bersambung. Jika ragu, hubungi kami untuk tes penempatan gratis.', 2),
  (null, 'Berapa lama akses materinya?',
   'Materi video dapat diakses selamanya selama program masih berjalan. Yang terbatas waktu hanya halaqah setoran, karena mengikuti jadwal angkatan.', 3),
  (null, 'Bagaimana kalau saya tidak bisa hadir di jam halaqah?',
   'Sampaikan izin kepada ustadzah pembimbing. Rekaman ringkasan sesi akan dibagikan, dan setoran dapat disusulkan pada pertemuan berikutnya.', 4),
  (null, 'Saya ibu rumah tangga dengan anak kecil, apakah bisa mengikuti?',
   'Sangat bisa, dan banyak santriwati kami memang begitu. Materi video ditonton di sela kesibukan, sedangkan halaqah hanya dua kali sepekan di malam hari. Bila sesekali berhalangan, setoran dapat disusulkan.', 5),
  (null, 'Bagaimana cara pembayarannya?',
   'Transfer bank ke rekening yayasan sesuai nominal unik yang tertera pada tagihan Anda, lalu unggah bukti transfer. Akses dibuka setelah admin memverifikasi, umumnya kurang dari 1x24 jam.', 6),
  (null, 'Apakah mendapat sertifikat?',
   'Ya, setelah materi tuntas, rata-rata nilai setoran minimal 75, dan kehadiran halaqah minimal 80%. Sertifikat dapat diverifikasi keasliannya lewat halaman cek sertifikat.', 7)
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Testimoni
-- ---------------------------------------------------------------------
insert into public.testimoni (course_id, nama, keterangan, isi, rating, urutan) values
  ('22222222-0000-4000-8000-000000000001', 'Ummu Fitri', 'Santriwati Tahsin Dasar, Bekasi',
   'Saya sudah 30 tahun mengaji tanpa pernah dikoreksi. Baru di sini tahu makhraj huruf ''ain saya keliru selama ini. Halaqah-nya yang bikin beda dengan kursus video biasa.', 5, 1),
  ('22222222-0000-4000-8000-000000000001', 'Ummu Hanifah', 'Santriwati Tahsin Dasar, Surabaya',
   'Videonya bisa diulang berkali-kali sampai paham, lalu disetorkan ke ustadzah. Rapornya jelas, kelihatan bagian mana yang masih lemah.', 5, 2),
  ('22222222-0000-4000-8000-000000000003', 'Ummu Ratna', 'Santriwati Iqro Dewasa, Depok',
   'Awalnya malu karena umur 40 baru belajar. Ternyata sekelas isinya ibu-ibu seumuran semua dan ustadzahnya sabar sekali.', 5, 3)
on conflict do nothing;
