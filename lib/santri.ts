import { buatKlienServer } from "@/lib/supabase/server";
import type { Course, Enrollment } from "@/lib/database.types";

export type KelasSaya = Enrollment & {
  courses: Pick<Course, "id" | "slug" | "judul" | "subjudul" | "jenjang" | "thumbnail_url">;
  total_pelajaran: number;
  selesai: number;
  persen: number;
};

/**
 * Kelas yang diikuti seorang santri beserta progresnya.
 *
 * Jumlah pelajaran & progres diambil dengan dua query agregat, bukan satu query
 * per kelas, agar tidak menjadi masalah N+1 saat santri mengikuti banyak kelas.
 */
export async function kelasSaya(santriId: string): Promise<KelasSaya[]> {
  const supabase = await buatKlienServer();

  const { data: enroll } = await supabase
    .from("enrollments")
    .select("*, courses(id, slug, judul, subjudul, jenjang, thumbnail_url)")
    .eq("santri_id", santriId)
    .neq("status", "berhenti")
    .order("dibuat_at", { ascending: false });

  if (!enroll?.length) return [];
  const idKelas = enroll.map((e) => e.course_id);

  const [{ data: pelajaran }, { data: progres }] = await Promise.all([
    supabase.from("kurikulum_publik").select("id, course_id").in("course_id", idKelas),
    supabase
      .from("progres_pelajaran")
      .select("course_id, selesai_at")
      .eq("santri_id", santriId)
      .in("course_id", idKelas)
      .not("selesai_at", "is", null),
  ]);

  return enroll.map((e) => {
    const total = (pelajaran ?? []).filter((p) => p.course_id === e.course_id).length;
    const selesai = (progres ?? []).filter((p) => p.course_id === e.course_id).length;
    return {
      ...(e as unknown as KelasSaya),
      total_pelajaran: total,
      selesai,
      persen: total === 0 ? 0 : Math.round((selesai / total) * 100),
    };
  });
}
