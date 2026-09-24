"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { buatKlienServer } from "@/lib/db/server";
import { wajibAdmin } from "@/lib/auth";

export type HasilBatch = { pesan?: string; sukses?: string } | undefined;

const skema = z.object({
  course_id: z.uuid("Pilih kelas."),
  nama: z.string().trim().min(3, "Nama rombel minimal 3 huruf."),
  ustadz_id: z.union([z.uuid(), z.literal("")]).optional(),
  tgl_mulai: z.string().optional(),
  tgl_selesai: z.string().optional(),
  kuota: z.coerce.number().int().min(1).max(500),
  jadwal_ringkas: z.string().trim().max(120).optional(),
  status: z.enum(["draf", "pendaftaran", "berjalan", "selesai"]),
  catatan: z.string().trim().max(1000).optional(),
});

export async function simpanBatchAction(
  _sebelumnya: HasilBatch,
  formData: FormData,
): Promise<HasilBatch> {
  await wajibAdmin();
  const hasil = skema.safeParse(Object.fromEntries(formData));
  if (!hasil.success) return { pesan: hasil.error.issues[0].message };

  const d = hasil.data;
  const id = String(formData.get("id") ?? "");

  const isi = {
    course_id: d.course_id,
    nama: d.nama,
    ustadz_id: d.ustadz_id || null,
    tgl_mulai: d.tgl_mulai || null,
    tgl_selesai: d.tgl_selesai || null,
    kuota: d.kuota,
    jadwal_ringkas: d.jadwal_ringkas || null,
    status: d.status,
    catatan: d.catatan || null,
  };

  const db = await buatKlienServer();

  if (id) {
    // Kelas sebuah rombel tidak boleh berpindah setelah ada santriwati di
    // dalamnya: FK gabungan (batch_id, course_id) pada `enrollments` akan
    // menolaknya, dan diam-diam memindahkan santriwati juga bukan yang diinginkan.
    const { count } = await db
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("batch_id", id);

    const { data: lama } = await db
      .from("batches")
      .select("course_id")
      .eq("id", id)
      .maybeSingle();

    if ((count ?? 0) > 0 && lama && lama.course_id !== d.course_id) {
      return {
        pesan: `Rombel ini sudah berisi ${count} santriwati, jadi kelasnya tidak bisa diganti.`,
      };
    }
  }

  const { error } = id
    ? await db.from("batches").update(isi).eq("id", id)
    : await db.from("batches").insert(isi);

  if (error) return { pesan: error.message };

  revalidatePath("/admin/batch");
  revalidatePath("/pengajar");
  return { sukses: "Rombel tersimpan." };
}

/**
 * Menempatkan seorang santriwati ke sebuah rombel.
 *
 * Diperlukan ketika santriwati mendaftar sebelum rombelnya dibuka, atau ketika
 * ia perlu dipindahkan (mis. jadwalnya bentrok).
 */
export async function tempatkanSantriAction(
  enrollmentId: string,
  batchId: string | null,
): Promise<HasilBatch> {
  await wajibAdmin();
  const db = await buatKlienServer();

  if (batchId) {
    const { data: batch } = await db
      .from("batches")
      .select("kuota, course_id")
      .eq("id", batchId)
      .maybeSingle();
    if (!batch) return { pesan: "Rombel tidak ditemukan." };

    const { count } = await db
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("batch_id", batchId)
      .neq("status", "berhenti");

    if ((count ?? 0) >= batch.kuota) {
      return { pesan: `Kuota rombel sudah penuh (${count}/${batch.kuota}).` };
    }
  }

  const { error } = await db
    .from("enrollments")
    .update({ batch_id: batchId })
    .eq("id", enrollmentId);

  if (error) return { pesan: error.message };

  revalidatePath("/admin/batch");
  revalidatePath("/belajar/jadwal");
  return { sukses: batchId ? "Santriwati ditempatkan." : "Santriwati dikeluarkan dari rombel." };
}
