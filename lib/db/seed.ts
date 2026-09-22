import { db } from "./index";
import {
  users,
  programs,
  courses,
  modules,
  lessons,
  batches,
  faq,
  testimoni,
  pengaturan,
} from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🌱 Memulai seeding data awal ke PostgreSQL mq_ummina...");

  // 1. PENGGUNA AWAL
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash("admin123", salt);
  const ustadzHash = await bcrypt.hash("ustadzah123", salt);
  const santriHash = await bcrypt.hash("santri123", salt);

  const ustadzId = "00000000-0000-4000-8000-000000000002";

  await db
    .insert(users)
    .values([
      {
        id: "00000000-0000-4000-8000-000000000001",
        email: "admin@mqummina.id",
        passwordHash: adminHash,
        nama: "Administrator Ummina",
        noHp: "081234567890",
        peran: "admin",
        bio: "Pengelola MQ Ummina Online",
      },
      {
        id: ustadzId,
        email: "ustadzah@mqummina.id",
        passwordHash: ustadzHash,
        nama: "Ustadzah Ma'rifah, S.Q., Hafidzoh",
        noHp: "081234567891",
        peran: "ustadz",
        bio: "Hafidzoh 30 juz dan Sarjana Ilmu Al-Qur'an. Membimbing tahsin dan tahfidz muslimah, dengan perhatian khusus pada ketepatan makhraj dan sifat huruf.",
      },
      {
        id: "00000000-0000-4000-8000-000000000003",
        email: "santri@mqummina.id",
        passwordHash: santriHash,
        nama: "Fatimah Az-Zahra",
        noHp: "081234567892",
        peran: "santri",
        kota: "Bandung",
      },
    ])
    .onConflictDoNothing();

  // 2. PROGRAM
  await db
    .insert(programs)
    .values([
      {
        id: "11111111-0000-4000-8000-000000000001",
        slug: "tahsin",
        nama: "Tahsin",
        deskripsi:
          "Memperbaiki bacaan Al-Qur'an: makhraj, sifat huruf, dan hukum tajwid, bertahap dari dasar hingga tartil.",
        ikon: "book-open-check",
        urutan: 1,
      },
      {
        id: "11111111-0000-4000-8000-000000000002",
        slug: "iqro",
        nama: "Iqro & Baca Dasar",
        deskripsi:
          "Untuk muslimah yang benar-benar memulai dari nol: mengenal huruf hijaiyah sampai lancar membaca.",
        ikon: "baby",
        urutan: 2,
      },
      {
        id: "11111111-0000-4000-8000-000000000003",
        slug: "tahfidz",
        nama: "Tahfidz",
        deskripsi:
          "Menghafal Al-Qur'an dengan target terukur dan murojaah terbimbing.",
        ikon: "brain",
        urutan: 3,
      },
      {
        id: "11111111-0000-4000-8000-000000000004",
        slug: "kelas-guru",
        nama: "Kelas Guru",
        deskripsi:
          "Menyiapkan ustadzah pengajar Al-Qur'an: penguasaan materi, metode mengajar, tashih, dan sertifikasi.",
        ikon: "graduation-cap",
        urutan: 4,
      },
    ])
    .onConflictDoNothing();

  // 3. KELAS (COURSES)
  await db
    .insert(courses)
    .values([
      {
        id: "22222222-0000-4000-8000-000000000001",
        programId: "11111111-0000-4000-8000-000000000001",
        slug: "tahsin-dasar",
        judul: "Tahsin Dasar",
        subjudul:
          "Perbaiki fondasi bacaan Anda: makhraj, sifat huruf, dan hukum tajwid pokok.",
        jenjang: "Dasar",
        deskripsi:
          "Kelas ini untuk Anda yang sudah bisa membaca Al-Qur'an tetapi merasa bacaannya belum benar. Selama 12 pekan Anda mempelajari tempat keluarnya huruf, sifat huruf, hukum nun sukun dan mim sukun, serta mad — dengan materi video yang bisa diulang kapan saja, lalu disetorkan langsung kepada ustadzah pembimbing di halaqah dua kali sepekan.",
        apaYangDipelajari: [
          "Melafalkan 29 huruf hijaiyah sesuai makhraj yang benar",
          "Membedakan sifat huruf yang sering tertukar",
          "Menerapkan hukum nun sukun, tanwin, dan mim sukun",
          "Membaca mad dengan panjang yang tepat",
          "Berhenti dan memulai bacaan pada tempat yang benar",
        ],
        untukSiapa: [
          "Muslimah dewasa yang ingin memperbaiki bacaan",
          "Ibu yang ingin mengajari anaknya mengaji di rumah",
          "Mualaf yang sudah lancar membaca huruf hijaiyah",
        ],
        prasyarat:
          "Sudah bisa membaca huruf hijaiyah bersambung (minimal lulus Iqro jilid 6).",
        harga: 450000,
        hargaCoret: 650000,
        durasiPekan: 12,
        isPublished: true,
        urutan: 1,
      },
      {
        id: "22222222-0000-4000-8000-000000000002",
        programId: "11111111-0000-4000-8000-000000000001",
        slug: "tahsin-menengah",
        judul: "Tahsin Menengah",
        subjudul: "Pendalaman tajwid dan latihan tartil pada surat-surat pilihan.",
        jenjang: "Menengah",
        deskripsi:
          "Lanjutan dari Tahsin Dasar. Fokus pada mad far'i, gharib, dan latihan tartil dengan irama yang benar.",
        apaYangDipelajari: [
          "Menguasai seluruh cabang mad far'i",
          "Membaca bacaan gharib yang umum",
          "Melatih tartil dan nafas",
        ],
        untukSiapa: [
          "Alumni Tahsin Dasar",
          "Muslimah yang lulus tes penempatan menengah",
        ],
        prasyarat: "Lulus Tahsin Dasar atau lolos tes penempatan.",
        harga: 550000,
        hargaCoret: 750000,
        durasiPekan: 12,
        isPublished: true,
        urutan: 2,
      },
      {
        id: "22222222-0000-4000-8000-000000000003",
        programId: "11111111-0000-4000-8000-000000000002",
        slug: "iqro-dewasa",
        judul: "Iqro untuk Dewasa",
        subjudul:
          "Mulai dari nol tanpa sungkan: kelas khusus dewasa yang baru belajar membaca.",
        jenjang: "Pemula",
        deskripsi:
          "Dirancang untuk muslimah dewasa yang baru mulai belajar membaca Al-Qur'an. Tempo pelan, kelompok kecil sesama muslimah, tanpa rasa malu.",
        apaYangDipelajari: [
          "Mengenal dan menulis huruf hijaiyah",
          "Membaca huruf bersambung",
          "Membaca ayat pendek dengan lancar",
        ],
        untukSiapa: [
          "Muslimah dewasa yang belum pernah mengaji",
          "Mualaf",
        ],
        prasyarat: "Tidak ada. Kelas ini benar-benar dari nol.",
        harga: 350000,
        hargaCoret: null,
        durasiPekan: 16,
        isPublished: true,
        urutan: 3,
      },
      {
        id: "22222222-0000-4000-8000-000000000004",
        programId: "11111111-0000-4000-8000-000000000003",
        slug: "tahfidz-juz-30",
        judul: "Tahfidz Juz 30",
        subjudul:
          "Hafal juz Amma dengan bacaan yang sudah benar dan murojaah terbimbing.",
        jenjang: "Juz 30",
        deskripsi:
          "Menghafal juz 30 secara bertahap dengan setoran rutin dan jadwal murojaah yang dipantau ustadzah pembimbing.",
        apaYangDipelajari: [
          "Menghafal 37 surat juz 30",
          "Menjaga hafalan lewat murojaah terstruktur",
          "Memperbaiki bacaan sambil menghafal",
        ],
        untukSiapa: [
          "Muslimah yang bacaannya sudah cukup baik",
          "Alumni Tahsin Dasar",
        ],
        prasyarat: "Bacaan minimal setara lulusan Tahsin Dasar.",
        harga: 500000,
        hargaCoret: null,
        durasiPekan: 24,
        isPublished: true,
        urutan: 4,
      },
      {
        id: "22222222-0000-4000-8000-000000000005",
        programId: "11111111-0000-4000-8000-000000000004",
        slug: "sertifikasi-guru",
        judul: "Kelas Guru Al-Qur'an & Sertifikasi",
        subjudul:
          "Persiapan menjadi pengajar Al-Qur'an: metode, praktik mengajar, tashih, dan sertifikasi.",
        jenjang: "Sertifikasi",
        deskripsi:
          "Program untuk calon ustadzah: penguasaan materi tahsin, metodologi pengajaran, praktik mengajar, diakhiri tashih dan sertifikasi.",
        apaYangDipelajari: [
          "Metodologi mengajar Al-Qur'an",
          "Teknik mengoreksi bacaan santriwati",
          "Menyusun rencana pembelajaran",
          "Lulus tashih dan memperoleh sertifikat pengajar",
        ],
        untukSiapa: [
          "Guru TPQ/TPA muslimah",
          "Alumni Tahsin Menengah",
          "Calon ustadzah di lembaga atau majelis taklim",
        ],
        prasyarat: "Lulus Tahsin Menengah dan lolos tashih awal.",
        harga: 1500000,
        hargaCoret: 2000000,
        durasiPekan: 20,
        isPublished: true,
        urutan: 5,
      },
    ])
    .onConflictDoNothing();

  // 4. MODUL & LESSON (Tahsin Dasar)
  await db
    .insert(modules)
    .values([
      {
        id: "33333333-0000-4000-8000-000000000001",
        courseId: "22222222-0000-4000-8000-000000000001",
        judul: "Pengantar & Adab Belajar Al-Qur'an",
        ringkasan: "Meluruskan niat dan memahami cara kerja kelas.",
        urutan: 1,
      },
      {
        id: "33333333-0000-4000-8000-000000000002",
        courseId: "22222222-0000-4000-8000-000000000001",
        judul: "Makhrajul Huruf",
        ringkasan: "Lima tempat keluarnya huruf dan latihan pelafalan.",
        urutan: 2,
      },
      {
        id: "33333333-0000-4000-8000-000000000003",
        courseId: "22222222-0000-4000-8000-000000000001",
        judul: "Sifatul Huruf",
        ringkasan: "Sifat huruf yang membedakan bunyi yang mirip.",
        urutan: 3,
      },
      {
        id: "33333333-0000-4000-8000-000000000004",
        courseId: "22222222-0000-4000-8000-000000000001",
        judul: "Hukum Nun Sukun, Tanwin & Mim Sukun",
        ringkasan: "Izhar, idgham, iqlab, ikhfa, dan hukum mim sukun.",
        urutan: 4,
      },
      {
        id: "33333333-0000-4000-8000-000000000005",
        courseId: "22222222-0000-4000-8000-000000000001",
        judul: "Mad & Waqaf",
        ringkasan: "Panjang bacaan dan tempat berhenti yang benar.",
        urutan: 5,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(lessons)
    .values([
      {
        id: "44444444-0000-4000-8000-000000000001",
        moduleId: "33333333-0000-4000-8000-000000000001",
        courseId: "22222222-0000-4000-8000-000000000001",
        slug: "selamat-datang",
        judul: "Selamat Datang di Kelas Tahsin Dasar",
        tipe: "video",
        videoProvider: "youtube",
        videoId: "aqz-KE-bpKQ",
        durasiDetik: 420,
        kontenMd:
          "Perkenalan ustadzah pembimbing, gambaran isi kelas, dan target yang ingin dicapai selama 12 pekan.",
        isPreview: true,
        urutan: 1,
      },
      {
        id: "44444444-0000-4000-8000-000000000002",
        moduleId: "33333333-0000-4000-8000-000000000001",
        courseId: "22222222-0000-4000-8000-000000000001",
        slug: "adab-terhadap-quran",
        judul: "Adab Terhadap Al-Qur'an",
        tipe: "video",
        videoProvider: "youtube",
        videoId: "aqz-KE-bpKQ",
        durasiDetik: 780,
        kontenMd: "Adab sebelum, saat, dan sesudah membaca Al-Qur'an.",
        isPreview: false,
        urutan: 2,
      },
      {
        id: "44444444-0000-4000-8000-000000000003",
        moduleId: "33333333-0000-4000-8000-000000000001",
        courseId: "22222222-0000-4000-8000-000000000001",
        slug: "cara-menggunakan-kelas",
        judul: "Cara Menggunakan Kelas Ini",
        tipe: "video",
        videoProvider: "youtube",
        videoId: "aqz-KE-bpKQ",
        durasiDetik: 360,
        kontenMd:
          "Alur belajar: tonton materi, latih mandiri, lalu setorkan di halaqah.",
        isPreview: true,
        urutan: 3,
      },
      {
        id: "44444444-0000-4000-8000-000000000004",
        moduleId: "33333333-0000-4000-8000-000000000002",
        courseId: "22222222-0000-4000-8000-000000000001",
        slug: "lima-tempat-makhraj",
        judul: "Lima Tempat Keluarnya Huruf",
        tipe: "video",
        videoProvider: "youtube",
        videoId: "aqz-KE-bpKQ",
        durasiDetik: 900,
        kontenMd: "Al-Jauf, Al-Halq, Al-Lisan, Asy-Syafatain, dan Al-Khaisyum.",
        isPreview: false,
        urutan: 1,
      },
      {
        id: "44444444-0000-4000-8000-000000000005",
        moduleId: "33333333-0000-4000-8000-000000000002",
        courseId: "22222222-0000-4000-8000-000000000001",
        slug: "al-jauf-dan-al-halq",
        judul: "Al-Jauf & Al-Halq",
        tipe: "video",
        videoProvider: "youtube",
        videoId: "aqz-KE-bpKQ",
        durasiDetik: 1080,
        kontenMd:
          "Huruf mad dan enam huruf tenggorokan yang paling sering keliru.",
        isPreview: false,
        urutan: 2,
      },
    ])
    .onConflictDoNothing();

  // 5. ANGKATAN (BATCH)
  await db
    .insert(batches)
    .values([
      {
        id: "55555555-0000-4000-8000-000000000001",
        courseId: "22222222-0000-4000-8000-000000000001",
        nama: "Tahsin Dasar — Angkatan 1",
        ustadzId: ustadzId,
        kuota: 20,
        jadwalRingkas: "Senin & Rabu, 19.30 WIB",
        status: "berjalan",
        catatan: "Kelompok malam hari bersama Ustadzah Ma'rifah",
      },
    ])
    .onConflictDoNothing();

  // 6. PENGATURAN SITUS
  await db
    .insert(pengaturan)
    .values([
      {
        kunci: "kontak",
        nilai: {
          whatsapp: "628000000000",
          email: "info@mqummina.id",
          alamat: "Bandung, Jawa Barat",
          instagram: "mqummina",
        },
        keterangan: "Kontak yang tampil di footer & tombol WhatsApp",
        isPublik: true,
      },
      {
        kunci: "rekening",
        nilai: {
          bank: "Bank Syariah Indonesia (BSI)",
          nomor: "0000000000",
          atas_nama: "Yayasan Madrasah Quran Ummina",
        },
        keterangan: "Rekening tujuan transfer manual.",
        isPublik: false,
      },
      {
        kunci: "hero",
        nilai: {
          judul: "Belajar Membaca Al-Qur'an di Ruang Khusus Muslimah",
          subjudul:
            "Materi video terstruktur yang bisa diulang kapan saja, dipadukan halaqah setoran langsung bersama ustadzah agar bacaan Anda benar-benar dikoreksi.",
          cta: "Lihat Program",
          catatan: "Khusus muslimah · Pengajar ustadzah · Kelas daring",
        },
        keterangan: "Teks utama halaman depan",
        isPublik: true,
      },
      {
        kunci: "statistik",
        nilai: {
          santri: "1.200+",
          pengajar: "12",
          kelas: "12",
          kepuasan: "4,9/5",
        },
        keterangan: "Angka statistik di halaman depan",
        isPublik: true,
      },
      {
        kunci: "alur_belajar",
        nilai: [
          {
            judul: "Pilih Program",
            isi: "Tentukan kelas sesuai kemampuan Anda: dari mengenal huruf hingga tahsin lanjutan.",
          },
          {
            judul: "Daftar & Bayar",
            isi: "Transfer sesuai nominal unik, unggah bukti, akses dibuka setelah diverifikasi.",
          },
          {
            judul: "Pelajari Materi",
            isi: "Tonton video pelajaran kapan saja, ulangi sebanyak yang Anda perlukan.",
          },
          {
            judul: "Setoran Halaqah",
            isi: "Ikuti halaqah terjadwal bersama ustadzah untuk dikoreksi langsung.",
          },
          {
            judul: "Rapor & Sertifikat",
            isi: "Pantau perkembangan bacaan, lalu terima sertifikat kelulusan.",
          },
        ],
        keterangan: "Langkah-langkah di halaman depan",
        isPublik: true,
      },
      {
        kunci: "pengasuh",
        nilai: {
          nama: "Ustadzah Ma'rifah, S.Q., Hafidzoh",
          peran: "Pengasuh & Pengajar Utama",
          bio: "Hafidzoh 30 juz dan Sarjana Ilmu Al-Qur'an. Membimbing tahsin dan tahfidz muslimah, dengan perhatian khusus pada ketepatan makhraj dan sifat huruf. Beliau memimpin langsung penyusunan kurikulum dan tashih kelulusan di Madrasah Qur'an Ummina.",
        },
        keterangan: "Profil pengasuh madrasah yang tampil di halaman Tentang",
        isPublik: true,
      },
    ])
    .onConflictDoNothing();

  // 7. FAQ
  await db
    .insert(faq)
    .values([
      {
        pertanyaan: "Apakah benar madrasah ini khusus muslimah?",
        jawaban:
          "Benar, tanpa kecuali. Seluruh santriwati dan pengajarnya perempuan, dan halaqah setoran hanya diikuti muslimah — sehingga Anda bisa membaca dengan tenang dan leluasa.",
        urutan: 1,
        isPublished: true,
      },
      {
        pertanyaan: "Apakah kelas ini untuk pemula?",
        jawaban:
          "Tergantung program yang dipilih. Iqro untuk Dewasa dirancang benar-benar dari nol, sedangkan Tahsin Dasar mengandaikan Anda sudah bisa membaca huruf bersambung. Jika ragu, hubungi kami untuk tes penempatan gratis.",
        urutan: 2,
        isPublished: true,
      },
      {
        pertanyaan: "Berapa lama akses materinya?",
        jawaban:
          "Materi video dapat diakses selamanya selama program masih berjalan. Yang terbatas waktu hanya halaqah setoran, karena mengikuti jadwal angkatan.",
        urutan: 3,
        isPublished: true,
      },
      {
        pertanyaan: "Bagaimana kalau saya tidak bisa hadir di jam halaqah?",
        jawaban:
          "Sampaikan izin kepada ustadzah pembimbing. Rekaman ringkasan sesi akan dibagikan, dan setoran dapat disusulkan pada pertemuan berikutnya.",
        urutan: 4,
        isPublished: true,
      },
      {
        pertanyaan:
          "Saya ibu rumah tangga dengan anak kecil, apakah bisa mengikuti?",
        jawaban:
          "Sangat bisa, dan banyak santriwati kami memang begitu. Materi video ditonton di sela kesibukan, sedangkan halaqah hanya dua kali sepekan di malam hari. Bila sesekali berhalangan, setoran dapat disusulkan.",
        urutan: 5,
        isPublished: true,
      },
      {
        pertanyaan: "Bagaimana cara pembayarannya?",
        jawaban:
          "Transfer bank ke rekening yayasan sesuai nominal unik yang tertera pada tagihan Anda, lalu unggah bukti transfer. Akses dibuka setelah admin memverifikasi, umumnya kurang dari 1x24 jam.",
        urutan: 6,
        isPublished: true,
      },
      {
        pertanyaan: "Apakah mendapat sertifikat?",
        jawaban:
          "Ya, setelah materi tuntas, rata-rata nilai setoran minimal 75, dan kehadiran halaqah minimal 80%. Sertifikat dapat diverifikasi keasliannya lewat halaman cek sertifikat.",
        urutan: 7,
        isPublished: true,
      },
    ])
    .onConflictDoNothing();

  // 8. TESTIMONI
  await db
    .insert(testimoni)
    .values([
      {
        courseId: "22222222-0000-4000-8000-000000000001",
        nama: "Ummu Fitri",
        keterangan: "Santriwati Tahsin Dasar, Bekasi",
        isi: "Saya sudah 30 tahun mengaji tanpa pernah dikoreksi. Baru di sini tahu makhraj huruf 'ain saya keliru selama ini. Halaqah-nya yang bikin beda dengan kursus video biasa.",
        rating: 5,
        urutan: 1,
        isPublished: true,
      },
      {
        courseId: "22222222-0000-4000-8000-000000000001",
        nama: "Ummu Hanifah",
        keterangan: "Santriwati Tahsin Dasar, Surabaya",
        isi: "Videonya bisa diulang berkali-kali sampai paham, lalu disetorkan ke ustadzah. Rapornya jelas, kelihatan bagian mana yang masih lemah.",
        rating: 5,
        urutan: 2,
        isPublished: true,
      },
      {
        courseId: "22222222-0000-4000-8000-000000000003",
        nama: "Ummu Ratna",
        keterangan: "Santriwati Iqro Dewasa, Depok",
        isi: "Awalnya malu karena umur 40 baru belajar. Ternyata sekelas isinya ibu-ibu seumuran semua dan ustadzahnya sabar sekali.",
        rating: 5,
        urutan: 3,
        isPublished: true,
      },
    ])
    .onConflictDoNothing();

  console.log("✅ Seeding selesai! Data contoh dan akun pengguna berhasil dibuat.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Gagal seeding:", err);
  process.exit(1);
});
