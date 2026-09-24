"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { buatKlienServer } from "@/lib/db/server";
import { wajibAdmin } from "@/lib/auth";

export type HasilAdmin = { pesan?: string; sukses?: string } | undefined;

/** Ubah "Tahsin Dasar" menjadi "tahsin-dasar". */
function keSlug(teks: string): string {
  return teks
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Menerima URL YouTube apa pun maupun ID mentah, mengembalikan ID-nya. */
function idYouTube(masukan: string): string {
  const t = masukan.trim();
  if (!t) return "";
  const pola = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/(?:embed|shorts|live)\/)([\w-]{11})/,
  ];
  for (const p of pola) {
    const c = t.match(p);
    if (c) return c[1];
  }
  return /^[\w-]{11}$/.test(t) ? t : t;
}

const skemaKelas = z.object({
  program_id: z.uuid("Pilih program."),
  judul: z.string().trim().min(3, "Judul kelas minimal 3 huruf."),
  is_published: z.coerce.boolean().optional(),
});

export async function simpanKelasAction(
  _sebelumnya: HasilAdmin,
  formData: FormData,
): Promise<HasilAdmin> {
  await wajibAdmin();
  const hasil = skemaKelas.safeParse(Object.fromEntries(formData));
  if (!hasil.success) return { pesan: hasil.error.issues[0].message };

  const d = hasil.data;
  const id = String(formData.get("id") ?? "");

  const isi = {
    program_id: d.program_id,
    judul: d.judul,
    is_published: Boolean(d.is_published),
  };

  const db = await buatKlienServer();
  const { data: program } = await db
    .from("programs")
    .select("slug")
    .eq("id", d.program_id)
    .maybeSingle();

  if (id) {
    const { error } = await db.from("courses").update(isi).eq("id", id);
    if (error) return { pesan: galatRamah(error.message, error.code) };
    revalidatePath("/admin/kelas");
    revalidatePath(`/admin/kelas/${id}`);
    if (program) revalidatePath(`/program/${program.slug}`);
    return { sukses: "Kelas tersimpan." };
  }

  const { data, error } = await db.from("courses").insert(isi).select("id").single();
  if (error) return { pesan: galatRamah(error.message, error.code) };

  revalidatePath("/admin/kelas");
  redirect(`/admin/kelas/${data.id}`);
}

function galatRamah(pesan: string, kode?: string): string {
  if (kode === "23505") {
    return "Program ini sudah punya kelas lain. Satu program hanya bisa punya satu kelas.";
  }
  return pesan;
}

export async function ubahTerbitAction(id: string, terbit: boolean): Promise<HasilAdmin> {
  await wajibAdmin();
  const db = await buatKlienServer();
  const { error } = await db
    .from("courses")
    .update({ is_published: terbit })
    .eq("id", id);
  if (error) return { pesan: error.message };

  revalidatePath("/admin/kelas");
  revalidatePath("/program");
  return { sukses: terbit ? "Kelas diterbitkan." : "Kelas disembunyikan dari katalog." };
}

/* ------------------------------------------------------------------ Bab ---- */

const skemaModul = z.object({
  course_id: z.uuid(),
  judul: z.string().trim().min(3, "Judul bab minimal 3 huruf."),
  ringkasan: z.string().trim().max(500).optional(),
  urutan: z.coerce.number().int().min(0),
});

export async function simpanModulAction(
  _sebelumnya: HasilAdmin,
  formData: FormData,
): Promise<HasilAdmin> {
  await wajibAdmin();
  const hasil = skemaModul.safeParse(Object.fromEntries(formData));
  if (!hasil.success) return { pesan: hasil.error.issues[0].message };

  const id = String(formData.get("id") ?? "");
  const isi = {
    course_id: hasil.data.course_id,
    judul: hasil.data.judul,
    ringkasan: hasil.data.ringkasan || null,
    urutan: hasil.data.urutan,
  };

  const db = await buatKlienServer();
  const { error } = id
    ? await db.from("modules").update(isi).eq("id", id)
    : await db.from("modules").insert(isi);
  if (error) return { pesan: error.message };

  revalidatePath(`/admin/kelas/${hasil.data.course_id}`);
  return { sukses: "Bab tersimpan." };
}

export async function hapusModulAction(id: string, courseId: string): Promise<HasilAdmin> {
  await wajibAdmin();
  const db = await buatKlienServer();

  const { count } = await db
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("module_id", id);

  if ((count ?? 0) > 0) {
    return {
      pesan: `Bab ini masih berisi ${count} pelajaran. Hapus atau pindahkan pelajarannya dulu.`,
    };
  }

  const { error } = await db.from("modules").delete().eq("id", id);
  if (error) return { pesan: error.message };

  revalidatePath(`/admin/kelas/${courseId}`);
  return { sukses: "Bab dihapus." };
}

/* ------------------------------------------------------------ Pelajaran ---- */

const skemaPelajaran = z.object({
  module_id: z.uuid(),
  course_id: z.uuid(),
  judul: z.string().trim().min(3, "Judul pelajaran minimal 3 huruf."),
  slug: z.string().trim().optional(),
  tipe: z.enum(["video", "teks", "audio", "tugas"]),
  video_provider: z.enum(["youtube", "bunny", "db"]),
  video_id: z.string().trim().optional(),
  durasi_menit: z.coerce.number().min(0).max(600),
  konten_md: z.string().trim().max(20000).optional(),
  urutan: z.coerce.number().int().min(0),
  is_preview: z.coerce.boolean().optional(),
});

export async function simpanPelajaranAction(
  _sebelumnya: HasilAdmin,
  formData: FormData,
): Promise<HasilAdmin> {
  await wajibAdmin();
  const hasil = skemaPelajaran.safeParse(Object.fromEntries(formData));
  if (!hasil.success) return { pesan: hasil.error.issues[0].message };

  const d = hasil.data;
  const id = String(formData.get("id") ?? "");

  const isi = {
    module_id: d.module_id,
    course_id: d.course_id,
    judul: d.judul,
    slug: keSlug(d.slug || d.judul),
    tipe: d.tipe,
    video_provider: d.video_provider,
    // Admin boleh menempel URL YouTube penuh; yang disimpan tetap ID-nya saja.
    video_id: d.video_provider === "youtube" ? idYouTube(d.video_id ?? "") || null : d.video_id || null,
    durasi_detik: Math.round(d.durasi_menit * 60),
    konten_md: d.konten_md || null,
    urutan: d.urutan,
    is_preview: Boolean(d.is_preview),
  };

  const db = await buatKlienServer();
  const { error } = id
    ? await db.from("lessons").update(isi).eq("id", id)
    : await db.from("lessons").insert(isi);

  if (error) {
    if (error.code === "23505") {
      return { pesan: "Slug pelajaran sudah dipakai di kelas ini. Ubah judul atau slug." };
    }
    return { pesan: error.message };
  }

  revalidatePath(`/admin/kelas/${d.course_id}`);
  return { sukses: "Pelajaran tersimpan." };
}

export async function hapusPelajaranAction(
  id: string,
  courseId: string,
): Promise<HasilAdmin> {
  await wajibAdmin();
  const db = await buatKlienServer();
  const { error } = await db.from("lessons").delete().eq("id", id);
  if (error) return { pesan: error.message };

  revalidatePath(`/admin/kelas/${courseId}`);
  return { sukses: "Pelajaran dihapus. Progres santriwati pada pelajaran ini ikut terhapus." };
}
