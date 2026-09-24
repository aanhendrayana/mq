import { db } from "@/lib/db";
import { courses, programs, enrollments, modules, lessons, progresPelajaran } from "@/lib/db/schema";
import { eq, and, ne, asc } from "drizzle-orm";
import type { Course, Enrollment, Lesson, Modul, StatusEnrollment } from "@/lib/database.types";

export type PelajaranBelajar = Lesson & { selesai: boolean; detik_terakhir: number };

export type BabBelajar = Pick<Modul, "id" | "judul" | "ringkasan" | "urutan"> & {
  pelajaran: PelajaranBelajar[];
};

export type IsiKelas = {
  kelas: Course & { jenjang: string | null; subjudul: string | null };
  enrollment: Enrollment;
  bab: BabBelajar[];
  /** Daftar datar berurutan, dipakai untuk navigasi sebelumnya/berikutnya. */
  urut: PelajaranBelajar[];
  total: number;
  selesai: number;
  persen: number;
};

export async function muatIsiKelas(
  slugProgram: string,
  santriId: string,
): Promise<IsiKelas | null> {
  const [row] = await db
    .select({ course: courses, program: programs })
    .from(courses)
    .innerJoin(programs, eq(courses.programId, programs.id))
    .where(eq(programs.slug, slugProgram))
    .limit(1);

  if (!row) return null;
  const courseRow = row.course;
  const programRow = row.program;

  const [enrollRow] = await db
    .select()
    .from(enrollments)
    .where(
      and(
        eq(enrollments.santriId, santriId),
        eq(enrollments.courseId, courseRow.id),
        ne(enrollments.status, "berhenti")
      )
    )
    .limit(1);

  if (!enrollRow) return null;

  const [modulRows, lessonRows, progresRows] = await Promise.all([
    db
      .select()
      .from(modules)
      .where(eq(modules.courseId, courseRow.id))
      .orderBy(asc(modules.urutan)),
    db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseRow.id))
      .orderBy(asc(lessons.urutan)),
    db
      .select()
      .from(progresPelajaran)
      .where(
        and(
          eq(progresPelajaran.santriId, santriId),
          eq(progresPelajaran.courseId, courseRow.id)
        )
      ),
  ]);

  const petaProgres = new Map(
    progresRows.map((p) => [
      p.lessonId,
      { selesai: Boolean(p.selesaiAt), detik: p.detikTerakhir },
    ])
  );

  const bab: BabBelajar[] = modulRows.map((m) => ({
    id: m.id,
    judul: m.judul,
    ringkasan: m.ringkasan,
    urutan: m.urutan,
    pelajaran: lessonRows
      .filter((l) => l.moduleId === m.id)
      .map((l) => {
        const lessonFormatted: Lesson = {
          id: l.id,
          module_id: l.moduleId,
          course_id: l.courseId,
          slug: l.slug,
          judul: l.judul,
          tipe: l.tipe as Lesson["tipe"],
          video_provider: l.videoProvider as Lesson["video_provider"],
          video_id: l.videoId,
          durasi_detik: l.durasiDetik,
          konten_md: l.kontenMd,
          lampiran: l.lampiran as Lesson["lampiran"],
          is_preview: l.isPreview,
          urutan: l.urutan,
          dibuat_at: l.dibuatAt.toISOString(),
          diubah_at: l.diubahAt.toISOString(),
        };

        return {
          ...lessonFormatted,
          selesai: petaProgres.get(l.id)?.selesai ?? false,
          detik_terakhir: petaProgres.get(l.id)?.detik ?? 0,
        };
      }),
  }));

  const urut = bab.flatMap((b) => b.pelajaran);
  const total = urut.length;
  const selesai = urut.filter((l) => l.selesai).length;

  const kelasFormatted: IsiKelas["kelas"] = {
    id: courseRow.id,
    program_id: courseRow.programId,
    judul: courseRow.judul,
    is_published: courseRow.isPublished,
    dibuat_at: courseRow.dibuatAt.toISOString(),
    diubah_at: courseRow.diubahAt.toISOString(),
    jenjang: programRow.jenjang,
    subjudul: programRow.subjudul,
  };

  const enrollmentFormatted: Enrollment = {
    id: enrollRow.id,
    santri_id: enrollRow.santriId,
    course_id: enrollRow.courseId,
    batch_id: enrollRow.batchId,
    status: enrollRow.status as StatusEnrollment,
    tgl_mulai: enrollRow.tglMulai,
    dibuat_at: enrollRow.dibuatAt.toISOString(),
  };

  return {
    kelas: kelasFormatted,
    enrollment: enrollmentFormatted,
    bab,
    urut,
    total,
    selesai,
    persen: total === 0 ? 0 : Math.round((selesai / total) * 100),
  };
}
