# MQ Ummina Online

Platform kursus membaca Al-Qur'an daring untuk **Madrasah Qur'an Ummina**.

Alurnya meniru model kursus daring pada umumnya — katalog kelas, beli, belajar
mandiri lewat video — lalu ditambah bagian yang khas madrasah Qur'an: **halaqah
setoran terjadwal**, **absensi**, **penilaian bacaan empat aspek**, **rapor
tahsin**, dan **sertifikat yang bisa diverifikasi publik**.

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) · Supabase
- **Pembayaran:** transfer manual + kode unik + verifikasi admin
- **Video:** YouTube unlisted (penyedia disimpan per pelajaran, siap pindah ke Bunny.net)

---

## 1. Menyiapkan Supabase

1. Buat proyek baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, lalu jalankan berkas berikut **berurutan**:

   ```
   supabase/migrations/20260903000001_skema_awal.sql
   supabase/migrations/20260903000002_fungsi_dan_trigger.sql
   supabase/migrations/20260903000003_rls.sql
   supabase/migrations/20260903000004_storage.sql
   supabase/migrations/20260903000005_pengaturan_awal.sql
   ```

3. (Opsional) Jalankan `supabase/seed.sql` untuk mengisi contoh program, kelas,
   kurikulum, FAQ, dan testimoni.

   > Video pada data contoh memakai video uji publik. Ganti dengan video MQ
   > Ummina yang sebenarnya lewat **/admin/kelas** sebelum dipakai santri.

Kalau Supabase CLI terpasang dan proyek sudah di-`link`, langkah 2–3 bisa
diringkas menjadi `supabase db push` lalu menjalankan `seed.sql`.
`supabase start` / `db reset` butuh Docker.

## 2. Menjalankan aplikasi

```bash
npm install
cp .env.example .env.local     # lalu isi nilainya
npm run dev                    # http://localhost:3000
```

Isi `.env.local` dari **Project Settings → API** di dasbor Supabase:

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

**Santri** — daftar akun → pilih kelas → transfer sejumlah nominal **berikut
kode uniknya** → unggah bukti → tunggu verifikasi → belajar video → ikut halaqah
→ lihat rapor → unduh sertifikat.

**Ustadz** (`/pengajar`) — melihat angkatan bimbingannya, menjadwalkan
pertemuan, mengisi absensi dan nilai empat aspek dalam satu layar saat halaqah
berlangsung.

**Admin** (`/admin`) — memverifikasi pembayaran, mengelola kelas & materi,
membuat angkatan dan menempatkan santri, menerbitkan sertifikat, mengubah
konten halaman depan tanpa deploy ulang.

### Kode unik pembayaran

Nominal tagihan selalu `harga + kode unik 3 digit` (mis. Rp 450.000 →
**Rp 450.137**). Kode itulah yang dipakai admin mencocokkan pembayaran di mutasi
rekening ketika dua orang membayar nominal sama di hari yang sama. Santri yang
membulatkan nominalnya akan memperlambat verifikasinya sendiri.

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
  JavaScript dan bisa dibaca siapa saja; yang memisahkan data satu santri dari
  santri lain hanyalah policy di `20260903000003_rls.sql`.
- Fungsi cek peran ditulis `security definer` — policy pada `profiles` yang
  melakukan subquery ke `profiles` akan memicu rekursi tak berujung.
- Santri **tidak punya** hak INSERT/UPDATE pada `orders`. Pesanan dibuat lewat
  `buat_pesanan()` dan bukti diunggah lewat `unggah_bukti()`, sehingga harga
  selalu ditentukan server.
- Verifikasi pembayaran (`setujui_pesanan()`) menandai lunas **dan** membuka
  akses kelas dalam satu transaksi, supaya tak pernah ada santri yang sudah
  membayar tapi tidak bisa masuk kelas.
- Bucket `bukti-bayar` privat; admin membukanya lewat URL bertanda tangan
  berumur 10 menit, bukan URL publik permanen.
- Verifikasi sertifikat publik lewat fungsi `cek_sertifikat()`, bukan `select`
  ke tabel — supaya token milik orang lain tidak bisa dipanen.

### Batas yang perlu diketahui

Video YouTube *unlisted* **bisa bocor** kalau tautannya disebarkan santri, dan
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

## Menguji keamanan RLS (jangan dilewat sebelum rilis)

Dengan **anon key** langsung ke Supabase (curl atau SQL Editor sebagai pengguna
lain), pastikan semuanya ditolak:

- `select * from lessons` → hanya pelajaran `is_preview`
- `select * from penilaian_setoran` → kosong atau hanya milik sendiri
- `update orders set status='lunas'` → ditolak
- membuka objek `bukti-bayar` milik orang lain → 403
- santri membuka `/admin` dan `/pengajar` → dialihkan oleh `proxy.ts`
- ustadz A menilai santri di angkatan ustadz B → ditolak policy
