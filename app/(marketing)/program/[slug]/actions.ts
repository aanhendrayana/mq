"use server";

import { redirect } from "next/navigation";
import { buatKlienServer } from "@/lib/db/server";

export type HasilDaftar = { pesan: string } | undefined;

/**
 * Mendaftar ke sebuah kelas: membuat pesanan lalu mengantar ke halaman tagihan.
 *
 * Harga, nomor invoice, kode unik, dan batas waktu semuanya ditentukan fungsi
 * database `buat_pesanan()`. Yang dikirim dari sini hanya id kelas & rombel,
 * sehingga nominal tidak bisa dipalsukan dari sisi klien.
 */
export async function daftarKelasAction(
  _sebelumnya: HasilDaftar,
  formData: FormData,
): Promise<HasilDaftar> {
  const courseId = String(formData.get("course_id") ?? "");
  const batchId = String(formData.get("batch_id") ?? "");
  const slug = String(formData.get("slug") ?? "");

  if (!courseId) return { pesan: "Kelas tidak dikenali." };

  const db = await buatKlienServer();
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) redirect(`/masuk?next=${encodeURIComponent(`/program/${slug}`)}`);

  const { data, error } = await db.rpc("buat_pesanan", {
    p_course: courseId,
    p_batch: batchId || null,
  });

  if (error) return { pesan: error.message };

  redirect(`/belajar/tagihan/${data.nomor_invoice}`);
}
