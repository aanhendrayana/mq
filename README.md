# Madrasah Quran Nurul Musthofa Perum Safira

Platform kursus membaca Al-Qur'an daring untuk **Madrasah Quran Nurul Musthofa Perum Safira** —
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

## 0. Prasyarat

- Node.js **20.9 atau lebih baru** (lihat [`.nvmrc`](.nvmrc); kalau pakai `nvm`, jalankan `nvm use`).
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — **cara tercepat** untuk database, lihat Opsi A di bawah. Tidak wajib kalau memang sudah punya PostgreSQL sendiri (Opsi B).

## 1. Menyiapkan Database PostgreSQL

Aplikasi ini menggunakan database PostgreSQL murni, diakses lewat `DATABASE_URL`
— aplikasi dan `drizzle-kit` konek langsung pakai driver `postgres` (npm), **bukan**
lewat CLI `psql`. Jadi kalau pakai Docker, kamu tidak perlu install PostgreSQL,
tidak perlu `psql`/`createdb`, dan tidak perlu utak-atik PATH sama sekali.

### Opsi A — Docker (direkomendasikan untuk kontributor/klon baru)
```bash
docker compose up -d
```
Ini menjalankan Postgres 16 di `localhost:5432` dan **otomatis membuat**
database `mq_ummina` dengan user/sandi `mq_ummina` / `mq_ummina` (lihat
[`docker-compose.yml`](docker-compose.yml)) — tidak ada langkah manual lain.
Untuk mematikan: `docker compose down` (data tetap tersimpan di volume;
`docker compose down -v` kalau mau reset total).

### Opsi B — PostgreSQL sudah terpasang lokal
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
Kalau pakai Opsi A (Docker) dengan kredensial bawaan di atas:
```env
DATABASE_URL=postgresql://mq_ummina:mq_ummina@localhost:5432/mq_ummina
AUTH_SECRET=buat-string-rahasia-minimal-32-karakter-acak
NEXT_PUBLIC_SITE_URL=http://localhost:3000
GOOGLE_CLIENT_ID=id-klien-google
GOOGLE_CLIENT_SECRET=rahasia-klien-google
```
Kalau pakai Opsi B (PostgreSQL lokal), sesuaikan `DATABASE_URL` dengan
username/password/nama database milikmu sendiri.

### Masuk & Daftar dengan Google (opsional)
Tanpa kedua variabel `GOOGLE_*`, aplikasi tetap jalan: tombol Google akan
memberi pesan bahwa fiturnya belum dikonfigurasi, dan pendaftaran lewat email
tetap berfungsi. Untuk mengaktifkannya, di [Google Cloud
Console](https://console.cloud.google.com/):

1. Buat project (atau pakai yang sudah ada).
2. **APIs & Services → OAuth consent screen**: pilih tipe **External**, isi
   nama aplikasi, email dukungan, dan email developer. Scope cukup bawaan
   (`openid`, `email`, `profile`) — tidak perlu scope sensitif, jadi tidak
   perlu proses verifikasi Google. Selama masih **Testing**, hanya email yang
   terdaftar di *Test users* yang bisa masuk; tekan **Publish app** bila sudah
   mau dipakai santri umum.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**,
   pilih **Web application**, lalu isi:
   - *Authorized JavaScript origins*: `http://localhost:3000`
   - *Authorized redirect URIs*: `http://localhost:3000/auth/google/callback`

   Untuk produksi, tambahkan pasangan yang sama dengan domain aslinya
   (`https://domain-anda.id` dan `https://domain-anda.id/auth/google/callback`).
   Nilai `NEXT_PUBLIC_SITE_URL` harus sama persis dengan origin yang didaftarkan,
   karena URI callback dibangun dari variabel itu.
4. Salin **Client ID** dan **Client Secret** ke `.env.local`, lalu jalankan
   ulang `npm run dev` (variabel lingkungan hanya dibaca saat server mulai).

Alurnya memakai Authorization Code + PKCE dengan pemeriksaan `state` dan
`nonce`, dan menolak akun yang emailnya belum terverifikasi di Google. Bila
email akun Google sama dengan akun yang sudah pernah daftar lewat email, kedua
cara masuk itu menunjuk ke akun yang sama. Pendaftar baru lewat Google diantar
ke halaman profil untuk mengisi nomor WhatsApp, karena Google tidak
menyediakannya sedangkan admin memakainya untuk verifikasi pembayaran.

### Dorong Skema dan Isi Data Contoh (Seed)
```bash
# Terapkan skema tabel ke PostgreSQL
npm run db:push

# Isi data awal (program, kelas, ustadzah, admin, data demo)
npm run db:seed
```
> `db:push`/`db:seed` memuat `.env.local` secara eksplisit lewat `dotenv-cli`.
> **Jangan** jalankan `npx drizzle-kit push` / `npx tsx lib/db/seed.ts` langsung —
> keduanya bukan proses Next.js sehingga **tidak** otomatis membaca `.env.local`,
> lalu diam-diam jatuh ke koneksi bawaan di kode dan bisa terlihat nge-hang.

Akun bawaan yang dibuat oleh seed:
- **Admin**: `admin@nurulmusthofa.id` / sandi: `admin123`
- **Ustadzah**: `ustadzah@nurulmusthofa.id` / sandi: `ustadzah123`
- **Santri**: `santri@nurulmusthofa.id` / sandi: `santri123`

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
