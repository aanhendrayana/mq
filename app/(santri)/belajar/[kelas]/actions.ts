"use server";

import { revalidatePath } from "next/cache";
import { buatKlienServer } from "@/lib/supabase/server";

/**
 * Menyimpan posisi tonton dan/atau menandai pelajaran selesai.
 *
 * `course_id` dikirim dari klien hanya untuk mengisi kolom denormalisasi;
 * kalau nilainya tidak cocok dengan pelajaran, FK gabungan
 * (lesson_id, course_id) -> lessons akan menolak barisnya di database.
 * Policy RLS juga memastikan santri hanya bisa menulis progres kelas yang
 * memang diikutinya.
 */
export async function simpanProgresAction(input: {
  lessonId: string;
  courseId: string;
  detik: number;
  selesai: boolean;
}): Promise<{ ok: boolean; pesan?: string }> {
  const supabase = await buatKlienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, pesan: "Sesi berakhir." };

  const { data: adaSebelumnya } = await supabase
    .from("progres_pelajaran")
    .select("id, selesai_at")
    .eq("santri_id", user.id)
    .eq("lesson_id", input.lessonId)
    .maybeSingle();

  const { error } = await supabase.from("progres_pelajaran").upsert(
    {
      ...(adaSebelumnya ? { id: adaSebelumnya.id } : {}),
      santri_id: user.id,
      lesson_id: input.lessonId,
      course_id: input.courseId,
      detik_terakhir: Math.max(0, Math.floor(input.detik)),
      // Sekali selesai tetap selesai: memutar ulang video tidak membatalkan
      // pencapaian yang sudah diraih.
      selesai_at: adaSebelumnya?.selesai_at ?? (input.selesai ? new Date().toISOString() : null),
    },
    { onConflict: "santri_id,lesson_id" },
  );

  if (error) return { ok: false, pesan: error.message };

  if (input.selesai && !adaSebelumnya?.selesai_at) {
    revalidatePath("/belajar", "layout");
  }
  return { ok: true };
}
