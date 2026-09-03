import { buatKlienServer } from "@/lib/supabase/server";
import type { Course, Enrollment, Lesson, Modul } from "@/lib/database.types";

export type PelajaranBelajar = Lesson & { selesai: boolean; detik_terakhir: number };

export type BabBelajar = Pick<Modul, "id" | "judul" | "ringkasan" | "urutan"> & {
  pelajaran: PelajaranBelajar[];
};

export type IsiKelas = {
  kelas: Course;
  enrollment: Enrollment;
  bab: BabBelajar[];
  /** Daftar datar berurutan, dipakai untuk navigasi sebelumnya/berikutnya. */
  urut: PelajaranBelajar[];
  total: number;
  selesai: number;
  persen: number;
};

/**
 * Memuat satu kelas beserta seluruh materinya untuk santriwati yang terdaftar.
 *
 * Mengembalikan null bila kelas tidak ada ATAU santriwati belum terdaftar — RLS
 * pada tabel `lessons` juga menutup materinya, jadi ini lapisan kedua, bukan
 * satu-satunya pengaman.
 */
export async function muatIsiKelas(
  slug: string,
  santriId: string,
): Promise<IsiKelas | null> {
  const supabase = await buatKlienServer();

  const { data: kelas } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!kelas) return null;

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("*")
    .eq("santri_id", santriId)
    .eq("course_id", kelas.id)
    .neq("status", "berhenti")
    .maybeSingle();
  if (!enrollment) return null;

  const [{ data: modul }, { data: pelajaran }, { data: progres }] = await Promise.all([
    supabase
      .from("modules")
      .select("id, judul, ringkasan, urutan")
      .eq("course_id", kelas.id)
      .order("urutan"),
    supabase.from("lessons").select("*").eq("course_id", kelas.id).order("urutan"),
    supabase
      .from("progres_pelajaran")
      .select("lesson_id, selesai_at, detik_terakhir")
      .eq("santri_id", santriId)
      .eq("course_id", kelas.id),
  ]);

  const petaProgres = new Map(
    (progres ?? []).map((p) => [
      p.lesson_id,
      { selesai: Boolean(p.selesai_at), detik: p.detik_terakhir },
    ]),
  );

  const bab: BabBelajar[] = (modul ?? []).map((m) => ({
    ...m,
    pelajaran: (pelajaran ?? [])
      .filter((l) => l.module_id === m.id)
      .map((l) => ({
        ...l,
        selesai: petaProgres.get(l.id)?.selesai ?? false,
        detik_terakhir: petaProgres.get(l.id)?.detik ?? 0,
      })),
  }));

  const urut = bab.flatMap((b) => b.pelajaran);
  const total = urut.length;
  const selesai = urut.filter((l) => l.selesai).length;

  return {
    kelas,
    enrollment,
    bab,
    urut,
    total,
    selesai,
    persen: total === 0 ? 0 : Math.round((selesai / total) * 100),
  };
}
