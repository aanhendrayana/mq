# MQ Ummina Online

Platform kursus membaca Al-Qur'an daring untuk **Madrasah Qur'an Ummina** —
madrasah **khusus muslimah**: seluruh santriwati dan pengajarnya perempuan.

Alurnya meniru model kursus daring pada umumnya — katalog kelas, beli, belajar
mandiri lewat video — lalu ditambah bagian yang khas madrasah Qur'an: **halaqah
setoran terjadwal**, **absensi**, **penilaian bacaan empat aspek**, **rapor
tahsin**, dan **sertifikat yang bisa diverifikasi publik**.

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · PostgreSQL Native · Drizzle ORM
- **Autentikasi:** Native Session JWT (jose + bcryptjs) mandiri
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
├─ api/bukti-bayar/ akses berkas bukti transfer privat
└─ api/sertifikat/  unduhan PDF
components/  ui/ (shadcn) · marketing/ · belajar/ · pengajar/ · admin/ · dasbor/
lib/         db/{schema,seed,klien,server,admin} · auth · konstanta · format · kelas · dst.
proxy.ts     penyegaran sesi JWT + proteksi rute per peran
```

Beberapa segmen di bawah `/belajar` bersifat **kata kunci**: `tagihan`,
`jadwal`, `rapor`, `sertifikat`, `profil`. Jangan memberi slug kelas dengan
nama-nama itu — rute statis menang atas rute dinamis dan kelasnya jadi tak
terjangkau.

## Catatan keamanan

- **Autentikasi Mandiri (JWT HS256 & HTTP-only Cookies)**: Sesi diamankan dengan token JWT terenkripsi yang disimpan dalam cookie `httpOnly` dengan proteksi `SameSite: Lax`.
- **Proteksi Rute di Edge/Proxy**: Rute privat `/admin`, `/pengajar`, dan `/belajar` diproteksi langsung di [proxy.ts](proxy.ts) sebelum mencapai server component.
- **Validasi Transaksi di Server**: Santriwati tidak bisa mengubah status pesanan. Pembuatan pesanan (`buat_pesanan()`) dan verifikasi pembayaran (`setujui_pesanan()`) diproses secara atomic di sisi server.
- **Penyimpanan Bukti Bayar Privat**: Berkas bukti transfer disimpan secara aman dan diakses melalui endpoint proteksi `/api/bukti-bayar/...` yang memverifikasi kepemilikan akun atau hak akses admin.
- **Verifikasi Sertifikat Publik**: Menggunakan fungsi `cek_sertifikat()` yang aman tanpa mengekspos token lain.

### Batas yang perlu diketahui

Video YouTube *unlisted* **bisa bocor** kalau tautannya disebarkan santriwati, dan
tidak ada cara mencegahnya sepenuhnya. Karena `video_provider` tersimpan per
pelajaran di database, pindah ke Bunny.net (yang mendukung token & DRM) nanti
hanya perlu menambah satu cabang di
[components/belajar/pemutar-video.tsx](components/belajar/pemutar-video.tsx) —
tanpa migrasi data.

## Perintah

```bash
npm run dev       # server pengembangan (Turbopack)
npm run build     # build produksi standalone (sekaligus typecheck)
npm run lint      # ESLint
npx tsc --noEmit  # typecheck saja
```

