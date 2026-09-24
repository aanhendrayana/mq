"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { buatKlienServer } from "@/lib/db/server";
import { wajibAdmin } from "@/lib/auth";
import { TIPE_LAMPIRAN, idYoutube } from "@/lib/lampiran";

export type HasilTemplate = { pesan?: string; sukses?: string } | undefined;

/** Textarea satu-baris-satu-poin -> array JSON. */
function keDaftar(teks: string | undefined): string[] {
  return (teks ?? "")
    .split("\n")
    .map((b) => b.trim())
    .filter(Boolean);
}

/* -------------------------------------------------------- Detail program --- */

const skemaDetail = z.object({
  id: z.uuid(),
  deskripsi_lengkap: z.string().trim().max(5000).optional(),
  apa_yang_dipelajari: z.string().optional(),
  untuk_siapa: z.string().optional(),
  thumbnail_url: z.union([z.url(), z.literal("")]).optional(),
  subjudul: z.string().trim().max(200).optional(),
  jenjang: z.string().trim().max(60).optional(),
  prasyarat: z.string().trim().max(1000).optional(),
  harga: z.coerce.number().int().min(0),
  harga_coret: z.union([z.coerce.number().int().min(0), z.literal("")]).optional(),
  durasi_pekan: z.union([z.coerce.number().int().min(1).max(200), z.literal("")]).optional(),
});

/**
 * Menyimpan isian "sales page" program: deskripsi lengkap, yang akan
 * dikuasai, cocok untuk, dan gambar sampul. Diisi sekali di sini, otomatis
 * dipakai bersama semua kelas di bawah program ini (lihat kelas.ts).
 */
export async function simpanDetailProgramAction(
  _sebelumnya: HasilTemplate,
  formData: FormData,
): Promise<HasilTemplate> {
  await wajibAdmin();
  const hasil = skemaDetail.safeParse(Object.fromEntries(formData));
  if (!hasil.success) return { pesan: hasil.error.issues[0].message };

  const d = hasil.data;
  const db = await buatKlienServer();
  const { error } = await db
    .from("programs")
    .update({
      deskripsi_lengkap: d.deskripsi_lengkap || null,
      apa_yang_dipelajari: keDaftar(d.apa_yang_dipelajari),
      untuk_siapa: keDaftar(d.untuk_siapa),
      thumbnail_url: d.thumbnail_url || null,
      subjudul: d.subjudul || null,
      jenjang: d.jenjang || null,
      prasyarat: d.prasyarat || null,
      harga: d.harga,
      harga_coret: d.harga_coret === "" || d.harga_coret === undefined ? null : d.harga_coret,
      durasi_pekan: d.durasi_pekan === "" || d.durasi_pekan === undefined ? null : d.durasi_pekan,
      diubah_at: new Date().toISOString(),
    })
    .eq("id", d.id);

  if (error) return { pesan: error.message };

  revalidatePath(`/admin/program/${d.id}`);
  revalidatePath("/program");
  return { sukses: "Detail program tersimpan." };
}

/* ------------------------------------------------------------------ Bab --- */

const skemaBab = z.object({
  program_id: z.uuid(),
  judul: z.string().trim().min(3, "Judul bab minimal 3 huruf."),
  ringkasan: z.string().trim().max(300).optional(),
  urutan: z.coerce.number().int().min(0),
});

export async function simpanTemplateBabAction(
  _sebelumnya: HasilTemplate,
  formData: FormData,
): Promise<HasilTemplate> {
  await wajibAdmin();
  const hasil = skemaBab.safeParse(Object.fromEntries(formData));
  if (!hasil.success) return { pesan: hasil.error.issues[0].message };

  const id = String(formData.get("id") ?? "");
  const isi = {
    program_id: hasil.data.program_id,
    judul: hasil.data.judul,
    ringkasan: hasil.data.ringkasan || null,
    urutan: hasil.data.urutan,
  };

  const db = await buatKlienServer();
  const { error } = id
    ? await db.from("template_bab").update(isi).eq("id", id)
    : await db.from("template_bab").insert(isi);
  if (error) return { pesan: error.message };

  revalidatePath(`/admin/program/${hasil.data.program_id}`);
  return { sukses: "Bab tersimpan." };
}

export async function hapusTemplateBabAction(
  id: string,
  programId: string,
): Promise<HasilTemplate> {
  await wajibAdmin();
  const db = await buatKlienServer();

  const { count } = await db
    .from("template_pertemuan")
    .select("id", { count: "exact", head: true })
    .eq("bab_id", id);

  if ((count ?? 0) > 0) {
    return {
      pesan: `Bab ini masih berisi ${count} pertemuan. Hapus atau pindahkan pertemuannya dulu.`,
    };
  }

  const { error } = await db.from("template_bab").delete().eq("id", id);
  if (error) return { pesan: error.message };

  revalidatePath(`/admin/program/${programId}`);
  return { sukses: "Bab dihapus." };
}

/* ------------------------------------------------------------ Pertemuan --- */

const skema = z.object({
  bab_id: z.uuid(),
  program_id: z.uuid(),
  pertemuan_ke: z.coerce.number().int().min(1).max(200),
  judul: z.string().trim().min(3, "Judul pertemuan minimal 3 huruf."),
  materi: z.string().trim().max(300).optional(),
  durasi_menit: z.coerce.number().int().min(15).max(300),
  lampiran_json: z.string().optional(),
});

const skemaLampiran = z.array(
  z.object({
    tipe: z.enum(TIPE_LAMPIRAN),
    url: z.url("Tautan lampiran tidak valid."),
    nama: z.string().trim().min(1, "Nama lampiran wajib diisi.").max(120),
  }),
);

/** Ambil ID video dari URL YouTube supaya pemutar tidak perlu mengulanginya. */
function rapikanLampiran(mentah: z.infer<typeof skemaLampiran>) {
  return mentah.map((l) =>
    l.tipe === "youtube" ? { ...l, url: idYoutube(l.url) } : l,
  );
}

/**
 * Menambah atau memperbarui satu baris rencana pertemuan dalam sebuah bab.
 *
 * Hanya Ummi Rifa/Admin yang boleh — inilah "RPS" program, berlaku untuk
 * semua kelas & rombel di bawahnya begitu admin menerapkannya (lihat
 * terapkanTemplateAction di app/(pengajar)/pengajar/batch/[id]/actions.ts).
 * Ustadzah TIDAK bisa mengubahnya dari sini.
 */
export async function simpanTemplatePertemuanAction(
  _sebelumnya: HasilTemplate,
  formData: FormData,
): Promise<HasilTemplate> {
  await wajibAdmin();
  const hasil = skema.safeParse(Object.fromEntries(formData));
  if (!hasil.success) return { pesan: hasil.error.issues[0].message };

  let lampiranMentah: unknown;
  try {
    lampiranMentah = JSON.parse(hasil.data.lampiran_json || "[]");
  } catch {
    return { pesan: "Data lampiran tidak terbaca." };
  }
  const hasilLampiran = skemaLampiran.safeParse(lampiranMentah);
  if (!hasilLampiran.success) {
    return { pesan: hasilLampiran.error.issues[0].message };
  }

  const d = hasil.data;
  const id = String(formData.get("id") ?? "");

  const isi = {
    bab_id: d.bab_id,
    program_id: d.program_id,
    pertemuan_ke: d.pertemuan_ke,
    judul: d.judul,
    materi: d.materi || null,
    durasi_menit: d.durasi_menit,
    lampiran: rapikanLampiran(hasilLampiran.data),
  };

  const db = await buatKlienServer();
  const { error } = id
    ? await db.from("template_pertemuan").update(isi).eq("id", id)
    : await db.from("template_pertemuan").insert(isi);

  if (error) {
    if (error.code === "23505") {
      return { pesan: `Pertemuan ke-${d.pertemuan_ke} sudah ada di program ini.` };
    }
    return { pesan: error.message };
  }

  revalidatePath(`/admin/program/${d.program_id}`);
  return { sukses: "Rencana pertemuan tersimpan." };
}

export async function hapusTemplatePertemuanAction(
  id: string,
  programId: string,
): Promise<HasilTemplate> {
  await wajibAdmin();
  const db = await buatKlienServer();

  const { error } = await db.from("template_pertemuan").delete().eq("id", id);
  if (error) return { pesan: error.message };

  revalidatePath(`/admin/program/${programId}`);
  return { sukses: "Pertemuan dihapus dari template." };
}
