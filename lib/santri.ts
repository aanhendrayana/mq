import { db } from "@/lib/db";
import { enrollments, courses, programs, lessons, progresPelajaran } from "@/lib/db/schema";
import { eq, ne, inArray, desc, and, isNotNull } from "drizzle-orm";
import type { Course, Enrollment, StatusEnrollment } from "@/lib/database.types";

export type KelasSaya = Enrollment & {
  courses: Pick<Course, "id" | "judul"> & { slug: string; jenjang: string | null };
  total_pelajaran: number;
  selesai: number;
  persen: number;
};

export async function kelasSaya(santriId: string): Promise<KelasSaya[]> {
  const enrollRows = await db
    .select({
      enrollment: enrollments,
      course: {
        id: courses.id,
        judul: courses.judul,
        slug: programs.slug,
        jenjang: programs.jenjang,
      },
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .innerJoin(programs, eq(courses.programId, programs.id))
    .where(and(eq(enrollments.santriId, santriId), ne(enrollments.status, "berhenti")))
    .orderBy(desc(enrollments.dibuatAt));

  if (!enrollRows.length) return [];

  const courseIds = enrollRows.map((r) => r.enrollment.courseId);

  const [lessonRows, progresRows] = await Promise.all([
    db
      .select({ id: lessons.id, courseId: lessons.courseId })
      .from(lessons)
      .where(inArray(lessons.courseId, courseIds)),
    db
      .select({
        courseId: progresPelajaran.courseId,
        selesaiAt: progresPelajaran.selesaiAt,
      })
      .from(progresPelajaran)
      .where(
        and(
          eq(progresPelajaran.santriId, santriId),
          inArray(progresPelajaran.courseId, courseIds),
          isNotNull(progresPelajaran.selesaiAt)
        )
      ),
  ]);

  return enrollRows.map((r) => {
    const e = r.enrollment;
    const total = lessonRows.filter((l) => l.courseId === e.courseId).length;
    const selesai = progresRows.filter((p) => p.courseId === e.courseId).length;

    const enrollmentFormatted: Enrollment = {
      id: e.id,
      santri_id: e.santriId,
      course_id: e.courseId,
      batch_id: e.batchId,
      status: e.status as StatusEnrollment,
      tgl_mulai: e.tglMulai,
      dibuat_at: e.dibuatAt.toISOString(),
    };

    return {
      ...enrollmentFormatted,
      courses: {
        id: r.course.id,
        judul: r.course.judul,
        slug: r.course.slug,
        jenjang: r.course.jenjang,
      },
      total_pelajaran: total,
      selesai,
      persen: total === 0 ? 0 : Math.round((selesai / total) * 100),
    };
  });
}
