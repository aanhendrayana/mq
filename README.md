# MQ Ummina Online

Platform kursus membaca Al-Qur'an daring untuk **Madrasah Qur'an Ummina** —
madrasah **khusus muslimah**: seluruh santriwati dan pengajarnya perempuan.

Alurnya meniru model kursus daring pada umumnya — katalog kelas, beli, belajar
mandiri lewat video — lalu ditambah bagian yang khas madrasah Qur'an: **halaqah
setoran terjadwal**, **absensi**, **penilaian bacaan empat aspek**, **rapor
tahsin**, dan **sertifikat yang bisa diverifikasi publik**.

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · PostgreSQL Native · Drizzle ORM
- **Autentikasi:** Native Session JWT (jose + bcryptjs), tanpa ketergantungan Supabase
- **Pembayaran:** transfer manual + kode unik + verifikasi admin
- **Video:** YouTube unlisted (penyedia disimpan per pelajaran, siap pindah ke Bunny.net)

> **Istilah.** Antarmuka memakai *santriwati* dan *ustadzah*. Pengenal di
> database sengaja dibiarkan netral (`santri_id`, `ustadz_id`, nilai enum
> `'santri'`/`'ustadz'`) — menggantinya menyentuh seluruh migrasi, tipe, dan
> query tanpa mengubah apa pun yang dilihat pengguna. Kolom jenis kelamin
> memang tidak ada: di madrasah khusus muslimah kolom itu tidak akan pernah
> membedakan satu baris dari baris lainnya.

---

## 1. Menyiapkan Database PostgreSQL

Aplikasi ini menggunakan database PostgreSQL murni. Pastikan PostgreSQL (versi 15 atau 16) sudah terpasang dan berjalan di sistem Anda.

### Buat Database
```bash
createdb mq_ummina
# Atau melalui psql:
# psql -c "CREATE DATABASE mq_ummina;"
```

### Konfigurasi `.env.local`
Salin berkas contoh konfigurasi:
```bash
cp .env.example .env.local
```
Sesuaikan isi `.env.local`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/mq_ummina
AUTH_SECRET=buat-string-rahasia-minimal-32-karakter-acak
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Dorong Skema dan Isi Data Contoh (Seed)
```bash
# Terapkan skema tabel ke PostgreSQL
npx drizzle-kit push

# Isi data awal (program, kelas, ustadzah, admin, data demo)
npx tsx lib/db/seed.ts
```

Akun bawaan yang dibuat oleh seed:
- **Admin**: `admin@mqummina.id` / sandi: `admin123`
- **Ustadzah**: `ustadzah@mqummina.id` / sandi: `ustadzah123`
- **Santri**: `santri@mqummina.id` / sandi: `santri123`

---

## 2. Menjalankan Aplikasi

```bash
npm install
npm run dev
```

Buka di browser: <http://localhost:3000> (atau port yang dialokasikan Next.js).

---

## Alur kerja sehari-hari

**Santriwati** — daftar akun → pilih kelas → transfer sejumlah nominal **berikut
kode uniknya** → unggah bukti → tunggu verifikasi → belajar video → ikut halaqah
→ lihat rapor → unduh sertifikat.

**Ustadzah** (`/pengajar`) — melihat angkatan bimbingannya, menjadwalkan
pertemuan, mengisi absensi dan nilai empat aspek dalam satu layar saat halaqah
berlangsung.

**Admin** (`/admin`) — memverifikasi pembayaran, mengelola kelas & materi,
membuat angkatan dan menempatkan santriwati, menerbitkan sertifikat, mengubah
konten halaman depan tanpa deploy ulang.

### Kode unik pembayaran

Nominal tagihan selalu `harga + kode unik 3 digit` (mis. Rp 450.000 →
**Rp 450.137**). Kode itulah yang dipakai admin mencocokkan pembayaran di mutasi
rekening ketika dua orang membayar nominal sama di hari yang sama. Santriwati
yang membulatkan nominalnya akan memperlambat verifikasinya sendiri.

---

## Peta direktori

```
app/
├─ (marketing)/     landing, katalog, detail kelas, tentang, kontak, cek sertifikat
├─ (auth)/          masuk, daftar, lupa sandi
├─ (santri)/belajar/  kelas saya, pemutar, jadwal, rapor, sertifikat, tagihan, profil
├─ (pengajar)/pengajar/  angkatan, jadwal mengajar, absensi & penilaian
├─ (admin)/admin/   ringkasan, pembayaran, kelas, angkatan, sertifikat, pengguna, pengaturan
├─ auth/konfirmasi/ pendaratan tautan email Supabase
└─ api/sertifikat/  unduhan PDF
components/  ui/ (shadcn) · marketing/ · belajar/ · pengajar/ · admin/ · dasbor/
lib/         supabase/{client,server,admin,proxy} · auth · konstanta · format · kelas · dst.
supabase/    migrations/ · seed.sql · promosikan_peran.sql
proxy.ts     penyegaran sesi + proteksi rute per peran
```

Beberapa segmen di bawah `/belajar` bersifat **kata kunci**: `tagihan`,
`jadwal`, `rapor`, `sertifikat`, `profil`. Jangan memberi slug kelas dengan
nama-nama itu — rute statis menang atas rute dinamis dan kelasnya jadi tak
terjangkau.

## Catatan keamanan

- **RLS adalah pengaman utama, bukan pelengkap.** Anon key ada di dalam bundel
  JavaScript dan bisa dibaca siapa saja; yang memisahkan data satu santriwati
  dari santriwati lain hanyalah policy di `20260903000003_rls.sql`.
- Fungsi cek peran ditulis `security definer` — policy pada `profiles` yang
  melakukan subquery ke `profiles` akan memicu rekursi tak berujung.
- Santriwati **tidak punya** hak INSERT/UPDATE pada `orders`. Pesanan dibuat lewat
  `buat_pesanan()` dan bukti diunggah lewat `unggah_bukti()`, sehingga harga
  selalu ditentukan server.
- Verifikasi pembayaran (`setujui_pesanan()`) menandai lunas **dan** membuka
  akses kelas dalam satu transaksi, supaya tak pernah ada santriwati yang
  sudah membayar tapi tidak bisa masuk kelas.
- Bucket `bukti-bayar` privat; admin membukanya lewat URL bertanda tangan
  berumur 10 menit, bukan URL publik permanen.
- Verifikasi sertifikat publik lewat fungsi `cek_sertifikat()`, bukan `select`
  ke tabel — supaya token milik orang lain tidak bisa dipanen.

### Batas yang perlu diketahui

Video YouTube *unlisted* **bisa bocor** kalau tautannya disebarkan santriwati, dan
tidak ada cara mencegahnya sepenuhnya. Karena `video_provider` tersimpan per
pelajaran di database, pindah ke Bunny.net (yang mendukung token & DRM) nanti
hanya perlu menambah satu cabang di
[components/belajar/pemutar-video.tsx](components/belajar/pemutar-video.tsx) —
tanpa migrasi data.

## Perintah

```bash
npm run dev     # server pengembangan
npm run build   # build produksi (sekaligus typecheck)
npm run lint    # ESLint
npx tsc --noEmit  # typecheck saja
```

## Menguji keamanan RLS

`supabase/uji_rls.sql` menjalankan ~40 pemeriksaan terhadap policy yang
sesungguhnya. Skrip itu meniru pengguna nyata dengan menyetel peran Postgres
`anon`/`authenticated` beserta klaim JWT-nya — persis seperti PostgREST saat
menerima permintaan dari browser — jadi yang diuji policy-nya, bukan logika
aplikasi. Seluruh isinya dibungkus transaksi yang di-`rollback`, sehingga aman
dijalankan berulang kali dan tidak meninggalkan data.

```bash
psql "$(supabase status -o env | grep '^DB_URL=' | cut -d= -f2- | tr -d '"')" \
     -v ON_ERROR_STOP=1 -f supabase/uji_rls.sql
```

Pemeriksaan yang gagal memunculkan exception dan menghentikan skrip di titik
yang salah. Yang diuji antara lain: tamu tidak melihat `video_id` pelajaran
berbayar, santriwati tidak bisa menandai pesanannya lunas sendiri atau mengangkat
dirinya jadi admin, harga tidak bisa dipalsukan dari klien, ustadzah tidak bisa
menilai santriwati di luar bimbingannya, dan token sertifikat tidak bisa dipanen
dari tabel.

Yang **tidak** tercakup skrip ini dan perlu diperiksa manual:

- santriwati membuka `/admin` dan `/pengajar` → harus dialihkan oleh `proxy.ts`
- membuka objek `bukti-bayar` milik orang lain lewat URL Storage → harus 403
