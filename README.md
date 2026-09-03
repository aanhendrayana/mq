# MQ Ummina Online

Platform kursus membaca Al-Qur'an daring untuk **Madrasah Qur'an Ummina** —
madrasah **khusus muslimah**: seluruh santriwati dan pengajarnya perempuan.

Alurnya meniru model kursus daring pada umumnya — katalog kelas, beli, belajar
mandiri lewat video — lalu ditambah bagian yang khas madrasah Qur'an: **halaqah
setoran terjadwal**, **absensi**, **penilaian bacaan empat aspek**, **rapor
tahsin**, dan **sertifikat yang bisa diverifikasi publik**.

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) · Supabase
- **Pembayaran:** transfer manual + kode unik + verifikasi admin
- **Video:** YouTube unlisted (penyedia disimpan per pelajaran, siap pindah ke Bunny.net)

> **Istilah.** Antarmuka memakai *santriwati* dan *ustadzah*. Pengenal di
> database sengaja dibiarkan netral (`santri_id`, `ustadz_id`, nilai enum
> `'santri'`/`'ustadz'`) — menggantinya menyentuh seluruh migrasi, tipe, dan
> query tanpa mengubah apa pun yang dilihat pengguna. Kolom jenis kelamin
> memang tidak ada: di madrasah khusus muslimah kolom itu tidak akan pernah
> membedakan satu baris dari baris lainnya.

---

## 1. Menyiapkan Supabase

Ada dua jalur. **Lokal** untuk mengembangkan dan menguji tanpa menyentuh data
sungguhan; **cloud** untuk produksi.

### 1a. Lokal (disarankan saat mengembangkan)

Supabase lokal berjalan sebagai kumpulan kontainer, jadi butuh runtime
container. Colima dipilih karena ringan, tanpa GUI, dan tanpa lisensi berbayar.

```bash
brew install colima docker supabase/tap/supabase
colima start --cpu 4 --memory 8 --disk 60   # sekali saja; VM-nya menetap

cd 03_mq_ummina_online
supabase start        # unduhan ~3 GB pada kali pertama
```

`supabase start` otomatis menjalankan seluruh migrasi di `supabase/migrations/`
lalu memuat `supabase/seed.sql`. Setelah selesai, perintah itu mencetak
`API URL`, `anon key`, dan `service_role key` — salin ke `.env.local`.

Perintah harian:

```bash
supabase status      # lihat URL & kunci kapan saja
supabase db reset    # bangun ulang dari nol (migrasi + seed)
supabase stop        # matikan kontainer
colima stop          # matikan VM-nya sekalian
```

**Supabase Studio** ada di <http://localhost:54323> — untuk melihat isi tabel
dan menjalankan SQL. **Inbucket** di <http://localhost:54324> menangkap semua
email keluar, jadi tautan konfirmasi & atur ulang sandi bisa diuji tanpa
mengirim email sungguhan.

### 1b. Supabase Cloud (produksi)

1. Buat proyek baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, lalu jalankan berkas berikut **berurutan**:

   ```
   supabase/migrations/20260903000001_skema_awal.sql
   supabase/migrations/20260903000002_fungsi_dan_trigger.sql
   supabase/migrations/20260903000003_rls.sql
   supabase/migrations/20260903000004_storage.sql
   supabase/migrations/20260903000005_pengaturan_awal.sql
   ```

3. (Opsional) Jalankan `supabase/seed.sql` untuk contoh program, kelas,
   kurikulum, FAQ, dan testimoni.

Kalau proyeknya sudah di-`supabase link`, langkah 2 bisa diringkas menjadi
`supabase db push`.

> Video pada data contoh memakai video uji publik. Ganti dengan video MQ Ummina
> yang sebenarnya lewat **/admin/kelas** sebelum dipakai santriwati.

## 2. Menjalankan aplikasi

```bash
npm install
cp .env.example .env.local     # lalu isi nilainya
npm run dev                    # http://localhost:3000
```

Untuk pengembangan lokal, isi `.env.local` dari keluaran `supabase status`.
Untuk produksi, dari **Project Settings → API** di dasbor Supabase:

| Variabel | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyek |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Kunci anon — **aman** terlihat di browser; yang mengamankan data adalah RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Kunci service_role — **melewati seluruh RLS**, jangan pernah diawali `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | Alamat situs saat produksi (untuk metadata, tautan email, dan QR sertifikat) |

## 3. Membuat admin pertama

Peran tidak bisa dinaikkan dari dalam aplikasi — trigger `jaga_peran_profil()`
menolak perubahan kolom `peran` oleh siapa pun kecuali admin. Admin pertama
karena itu dibuat lewat SQL Editor (yang berjalan sebagai `service_role`):

1. Daftar akun biasa lewat halaman **/daftar**.
2. Buka `supabase/promosikan_peran.sql`, ganti alamat emailnya, jalankan di SQL Editor.

Setelah ada satu admin, peran berikutnya diatur lewat **/admin/pengguna**.

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
