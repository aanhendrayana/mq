"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { buatKlienServer } from "@/lib/supabase/server";

export type HasilAksi = { pesan?: string; sukses?: string } | undefined;

const skemaSesi = z.object({
  batch_id: z.uuid(),
  pertemuan_ke: z.coerce.number().int().min(1).max(200),
  judul: z.string().trim().min(3, "Judul pertemuan minimal 3 huruf."),
  tanggal: z.string().min(1, "Tanggal wajib diisi."),
  jam: z.string().min(1, "Jam wajib diisi."),
  durasi_menit: z.coerce.number().int().min(15).max(300),
  link_meeting: z.union([z.url("Tautan pertemuan tidak valid."), z.literal("")]),
  materi: z.string().trim().max(300).optional(),
});

/**
 * Menambah atau memperbarui satu pertemuan halaqah.
 *
 * Waktu diterima terpisah (tanggal + jam) dan digabung sebagai waktu Jakarta.
 * Kalau digabung di klien, hasilnya mengikuti zona waktu perangkat ustadz —
 * ustadz yang sedang bepergian bisa menjadwalkan sesi di jam yang salah.
 */
export async function simpanSesiAction(
  _sebelumnya: HasilAksi,
  formData: FormData,
): Promise<HasilAksi> {
  const hasil = skemaSesi.safeParse(Object.fromEntries(formData));
  if (!hasil.success) return { pesan: hasil.error.issues[0].message };

  const d = hasil.data;
  const mulaiAt = new Date(`${d.tanggal}T${d.jam}:00+07:00`);
  if (Number.isNaN(mulaiAt.getTime())) {
    return { pesan: "Tanggal atau jam tidak valid." };
  }

  const supabase = await buatKlienServer();
  const idSesi = String(formData.get("sesi_id") ?? "");

  const isi = {
    batch_id: d.batch_id,
    pertemuan_ke: d.pertemuan_ke,
    judul: d.judul,
    mulai_at: mulaiAt.toISOString(),
    durasi_menit: d.durasi_menit,
    link_meeting: d.link_meeting || null,
    materi: d.materi || null,
  };

  const { error } = idSesi
    ? await supabase.from("sesi_halaqah").update(isi).eq("id", idSesi)
    : await supabase.from("sesi_halaqah").insert(isi);

  if (error) {
    if (error.code === "23505") {
      return { pesan: `Pertemuan ke-${d.pertemuan_ke} sudah ada di angkatan ini.` };
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
  /** Kolom nilai dibiarkan kosong bila santri tidak hadir. */
  nilai_diisi: z.coerce.boolean().optional(),
});

/**
 * Menyimpan absensi dan penilaian seluruh santri satu sesi sekaligus.
 *
 * Sengaja satu aksi untuk satu sesi (bukan satu aksi per santri): ustadz mengisi
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
    return { pesan: "Belum ada santri di angkatan ini." };
  }

  const supabase = await buatKlienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { pesan: "Sesi Anda berakhir." };

  const { data: sesi } = await supabase
    .from("sesi_halaqah")
    .select("mulai_at")
    .eq("id", sesiId)
    .maybeSingle();
  const tanggalSesi = sesi ? sesi.mulai_at.slice(0, 10) : new Date().toISOString().slice(0, 10);

  const { error: galatHadir } = await supabase.from("kehadiran").upsert(
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

  // Hanya santri yang benar-benar menyetorkan bacaan yang dinilai. Menyimpan
  // nilai 0 untuk yang tidak hadir akan merusak rata-rata rapornya.
  const dinilai = tervalidasi.data.filter((b) => b.nilai_diisi && b.status === "hadir");

  if (dinilai.length > 0) {
    const { error } = await supabase.from("penilaian_setoran").upsert(
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
    sukses: `Tersimpan: absensi ${tervalidasi.data.length} santri, penilaian ${dinilai.length} santri.`,
  };
}
