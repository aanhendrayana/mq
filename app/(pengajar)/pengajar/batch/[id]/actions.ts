"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { buatKlienServer } from "@/lib/db/server";
import { aksesPenuhPengajaran, wajibPembimbingRombel } from "@/lib/pengajar";
import { TIPE_LAMPIRAN, idYoutube } from "@/lib/lampiran";

export type HasilAksi = { pesan?: string; sukses?: string } | undefined;

/**
 * Menyalin rencana pertemuan template program ke rombel sungguhan.
 *
 * Hanya Ummi Rifa/Admin yang boleh memicunya (bukan ustadzah) — sengaja
 * manual, bukan otomatis saat rombel dibuat, supaya admin bisa menunda
 * kalau jadwal rombel itu memang perlu beda dari biasanya. Aman dipanggil
 * berulang: pertemuan yang sudah ada (berdasarkan nomor urutnya) dilewati,
 * jadi menambah pertemuan baru ke template lalu menekan tombol ini lagi
 * cukup menambahkan yang baru saja.
 */
export async function terapkanTemplateAction(batchId: string): Promise<HasilAksi> {
  const pengguna = await wajibPembimbingRombel(batchId);
  if (!aksesPenuhPengajaran(pengguna)) {
    return { pesan: "Hanya admin atau Ummi Rifa yang bisa menerapkan template." };
  }

  const db = await buatKlienServer();

  const { data: batch } = await db
    .from("batches")
    .select("course_id, tgl_mulai")
    .eq("id", batchId)
    .maybeSingle();
  if (!batch) return { pesan: "Rombel tidak ditemukan." };

  const { data: kelas } = await db
    .from("courses")
    .select("program_id")
    .eq("id", batch.course_id)
    .maybeSingle();
  if (!kelas) return { pesan: "Kelas rombel ini tidak ditemukan." };

  const { data: template } = await db
    .from("template_pertemuan")
    .select("*")
    .eq("program_id", kelas.program_id)
    .order("pertemuan_ke");
  if (!template || template.length === 0) {
    return { pesan: "Program kelas ini belum punya rencana pertemuan. Buat dulu di menu Template Program." };
  }

  const { data: sesiAda } = await db
    .from("sesi_halaqah")
    .select("pertemuan_ke")
    .eq("batch_id", batchId);
  const keAda = new Set((sesiAda ?? []).map((s) => s.pertemuan_ke));

  // Jadwal seminggu sekali, dimulai dari tanggal mulai rombel (kalau ada
  // isinya) jam 19.30 WIB — ustadzah tetap bisa menggeser tiap sesi lewat
  // "Ubah Pertemuan" seperti biasa kalau harinya memang bentrok.
  const dasar = batch.tgl_mulai
    ? new Date(`${batch.tgl_mulai}T19:30:00+07:00`)
    : (() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        d.setHours(19, 30, 0, 0);
        return d;
      })();

  let ditambah = 0;
  for (const t of template) {
    if (keAda.has(t.pertemuan_ke)) continue;
    const mulaiAt = new Date(dasar.getTime() + (t.pertemuan_ke - 1) * 7 * 24 * 60 * 60 * 1000);
    const { error } = await db.from("sesi_halaqah").insert({
      batch_id: batchId,
      pertemuan_ke: t.pertemuan_ke,
      judul: t.judul,
      materi: t.materi,
      durasi_menit: t.durasi_menit,
      lampiran: t.lampiran,
      mulai_at: mulaiAt.toISOString(),
      template_pertemuan_id: t.id,
    });
    if (!error) ditambah++;
  }

  if (ditambah === 0) {
    return { pesan: "Semua pertemuan di template sudah ada pada rombel ini." };
  }

  revalidatePath(`/pengajar/batch/${batchId}`);
  revalidatePath("/belajar/jadwal");
  return { sukses: `${ditambah} pertemuan dari template diterapkan ke rombel ini.` };
}

const skemaSesi = z.object({
  batch_id: z.uuid(),
  pertemuan_ke: z.coerce.number().int().min(1).max(200),
  judul: z.string().trim().min(3, "Judul pertemuan minimal 3 huruf."),
  tanggal: z.string().min(1, "Tanggal wajib diisi."),
  jam: z.string().min(1, "Jam wajib diisi."),
  durasi_menit: z.coerce.number().int().min(15).max(300),
  link_meeting: z.union([z.url("Tautan pertemuan tidak valid."), z.literal("")]),
  materi: z.string().trim().max(300).optional(),
  lampiran_json: z.string().optional(),
});

const skemaLampiranSesi = z.array(
  z.object({
    tipe: z.enum(TIPE_LAMPIRAN),
    url: z.url("Tautan lampiran tidak valid."),
    nama: z.string().trim().min(1, "Nama lampiran wajib diisi.").max(120),
  }),
);

/**
 * Menambah atau memperbarui satu pertemuan halaqah.
 *
 * Waktu diterima terpisah (tanggal + jam) dan digabung sebagai waktu Jakarta.
 * Kalau digabung di klien, hasilnya mengikuti zona waktu perangkat ustadzah —
 * ustadzah yang sedang bepergian bisa menjadwalkan sesi di jam yang salah.
 */
export async function simpanSesiAction(
  _sebelumnya: HasilAksi,
  formData: FormData,
): Promise<HasilAksi> {
  const hasil = skemaSesi.safeParse(Object.fromEntries(formData));
  if (!hasil.success) return { pesan: hasil.error.issues[0].message };

  const d = hasil.data;
  // Tanpa ini, ustadzah mana pun bisa menjadwalkan pertemuan di rombel yang
  // bukan bimbingannya hanya dengan mengirim batch_id-nya langsung.
  const pengguna = await wajibPembimbingRombel(d.batch_id);

  const mulaiAt = new Date(`${d.tanggal}T${d.jam}:00+07:00`);
  if (Number.isNaN(mulaiAt.getTime())) {
    return { pesan: "Tanggal atau jam tidak valid." };
  }

  let lampiranMentah: unknown;
  try {
    lampiranMentah = JSON.parse(d.lampiran_json || "[]");
  } catch {
    return { pesan: "Data lampiran tidak terbaca." };
  }
  const hasilLampiran = skemaLampiranSesi.safeParse(lampiranMentah);
  if (!hasilLampiran.success) {
    return { pesan: hasilLampiran.error.issues[0].message };
  }

  const db = await buatKlienServer();
  const idSesi = String(formData.get("sesi_id") ?? "");

  let judul = d.judul;
  let materi = d.materi || null;
  let pertemuanKe = d.pertemuan_ke;
  let lampiran: unknown = hasilLampiran.data.map((l) =>
    l.tipe === "youtube" ? { ...l, url: idYoutube(l.url) } : l,
  );

  if (idSesi && !aksesPenuhPengajaran(pengguna)) {
    // Sesi hasil salinan template: judul/materi/nomor urut/lampiran bukan
    // wewenang ustadzah — kalaupun formnya dipaksa mengirim nilai lain (mis.
    // lewat devtools), nilai yang tersimpan tetap yang sudah ditentukan
    // template.
    const { data: sesiSekarang } = await db
      .from("sesi_halaqah")
      .select("template_pertemuan_id, judul, materi, pertemuan_ke, lampiran")
      .eq("id", idSesi)
      .maybeSingle();
    if (sesiSekarang?.template_pertemuan_id) {
      judul = sesiSekarang.judul;
      materi = sesiSekarang.materi;
      pertemuanKe = sesiSekarang.pertemuan_ke;
      lampiran = sesiSekarang.lampiran;
    }
  }

  const isi = {
    batch_id: d.batch_id,
    pertemuan_ke: pertemuanKe,
    judul,
    mulai_at: mulaiAt.toISOString(),
    durasi_menit: d.durasi_menit,
    link_meeting: d.link_meeting || null,
    materi,
    lampiran,
  };

  const { error } = idSesi
    ? await db.from("sesi_halaqah").update(isi).eq("id", idSesi)
    : await db.from("sesi_halaqah").insert(isi);

  if (error) {
    if (error.code === "23505") {
      return { pesan: `Pertemuan ke-${d.pertemuan_ke} sudah ada di rombel ini.` };
    }
    return { pesan: error.message };
  }

  revalidatePath(`/pengajar/batch/${d.batch_id}`);
  revalidatePath("/belajar/jadwal");
  return { sukses: "Pertemuan tersimpan." };
}

const skemaBaris = z.object({
  santri_id: z.uuid(),
  enrollment_id: z.uuid(),
  status: z.enum(["hadir", "izin", "sakit", "alpa"]),
  nilai_makhraj: z.coerce.number().int().min(0).max(100),
  nilai_tajwid: z.coerce.number().int().min(0).max(100),
  nilai_kelancaran: z.coerce.number().int().min(0).max(100),
  nilai_adab: z.coerce.number().int().min(0).max(100),
  materi: z.string().trim().max(300).optional(),
  catatan_ustadz: z.string().trim().max(2000).optional(),
  /** Kolom nilai dibiarkan kosong bila santriwati tidak hadir. */
  nilai_diisi: z.coerce.boolean().optional(),
});

/**
 * Menyimpan absensi dan penilaian seluruh santriwati satu sesi sekaligus.
 *
 * Sengaja satu aksi untuk satu sesi (bukan satu aksi per santri): ustadzah mengisi
 * tabelnya sambil mendengarkan setoran, dan simpan-per-baris akan memicu puluhan
 * permintaan jaringan di tengah halaqah.
 */
export async function simpanPenilaianAction(
  _sebelumnya: HasilAksi,
  formData: FormData,
): Promise<HasilAksi> {
  const sesiId = String(formData.get("sesi_id") ?? "");
  const batchId = String(formData.get("batch_id") ?? "");
  const mentah = String(formData.get("baris") ?? "[]");

  if (!batchId) return { pesan: "Rombel tidak dikenali." };
  // Tanpa ini, ustadzah mana pun bisa menyimpan absensi/nilai untuk rombel
  // yang bukan bimbingannya hanya dengan mengirim batch_id-nya langsung.
  const pengguna = await wajibPembimbingRombel(batchId);

  let baris: unknown;
  try {
    baris = JSON.parse(mentah);
  } catch {
    return { pesan: "Data penilaian tidak terbaca." };
  }

  const tervalidasi = z.array(skemaBaris).safeParse(baris);
  if (!tervalidasi.success) {
    return { pesan: "Ada nilai yang tidak valid. Nilai harus 0–100." };
  }
  if (tervalidasi.data.length === 0) {
    return { pesan: "Belum ada santriwati di rombel ini." };
  }

  const db = await buatKlienServer();
  const user = { id: pengguna.id };

  const { data: sesi } = await db
    .from("sesi_halaqah")
    .select("mulai_at")
    .eq("id", sesiId)
    .maybeSingle();
  const tanggalSesi = sesi ? sesi.mulai_at.slice(0, 10) : new Date().toISOString().slice(0, 10);

  const { error: galatHadir } = await db.from("kehadiran").upsert(
    tervalidasi.data.map((b) => ({
      sesi_id: sesiId,
      santri_id: b.santri_id,
      status: b.status,
      dicatat_oleh: user.id,
      dicatat_at: new Date().toISOString(),
    })),
    { onConflict: "sesi_id,santri_id" },
  );
  if (galatHadir) return { pesan: `Gagal menyimpan absensi: ${galatHadir.message}` };

  // Hanya santriwati yang benar-benar menyetorkan bacaan yang dinilai. Menyimpan
  // nilai 0 untuk yang tidak hadir akan merusak rata-rata rapornya.
  const dinilai = tervalidasi.data.filter((b) => b.nilai_diisi && b.status === "hadir");

  if (dinilai.length > 0) {
    const { error } = await db.from("penilaian_setoran").upsert(
      dinilai.map((b) => ({
        sesi_id: sesiId,
        enrollment_id: b.enrollment_id,
        santri_id: b.santri_id,
        ustadz_id: user.id,
        tanggal: tanggalSesi,
        materi: b.materi || null,
        nilai_makhraj: b.nilai_makhraj,
        nilai_tajwid: b.nilai_tajwid,
        nilai_kelancaran: b.nilai_kelancaran,
        nilai_adab: b.nilai_adab,
        catatan_ustadz: b.catatan_ustadz || null,
      })),
      { onConflict: "sesi_id,santri_id" },
    );
    if (error) return { pesan: `Gagal menyimpan nilai: ${error.message}` };
  }

  revalidatePath(`/pengajar/batch/${batchId}/sesi/${sesiId}`);
  revalidatePath("/belajar/rapor");
  return {
    sukses: `Tersimpan: absensi ${tervalidasi.data.length} santriwati, penilaian ${dinilai.length} santriwati.`,
  };
}
