import { db } from "@/lib/db";
import { courses, programs, modules, lessons } from "@/lib/db/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import type { Course, PelajaranPublik, Program } from "@/lib/database.types";

export type KelasRingkas = Course & {
  programs: Pick<
    Program,
    | "slug"
    | "nama"
    | "deskripsi_lengkap"
    | "apa_yang_dipelajari"
    | "untuk_siapa"
    | "thumbnail_url"
    | "jenjang"
    | "subjudul"
    | "prasyarat"
    | "harga"
    | "harga_coret"
    | "durasi_pekan"
  > | null;
  jumlah_pelajaran: number;
  total_detik: number;
};

export async function daftarKelas(opsi?: {
  program?: string;
  batas?: number;
}): Promise<KelasRingkas[]> {
  // Query courses with programs
  const rows = await db
    .select({
      course: courses,
      program: programs,
    })
    .from(courses)
    .innerJoin(programs, eq(courses.programId, programs.id))
    .where(
      opsi?.program
        ? and(eq(courses.isPublished, true), eq(programs.slug, opsi.program))
        : eq(courses.isPublished, true)
    )
    .orderBy(asc(programs.urutan))
    .limit(opsi?.batas ?? 100);

  if (!rows.length) return [];

  const courseIds = rows.map((r) => r.course.id);
  const lessonRows = await db
    .select({
      courseId: lessons.courseId,
      durasiDetik: lessons.durasiDetik,
    })
    .from(lessons)
    .where(inArray(lessons.courseId, courseIds));

  return rows.map((r) => {
    const c = r.course;
    const p = r.program;
    const milik = lessonRows.filter((l) => l.courseId === c.id);
    const courseFormatted: Course = {
      id: c.id,
      program_id: c.programId,
      judul: c.judul,
      is_published: c.isPublished,
      dibuat_at: c.dibuatAt.toISOString(),
      diubah_at: c.diubahAt.toISOString(),
    };

    return {
      ...courseFormatted,
      programs: {
        slug: p.slug,
        nama: p.nama,
        deskripsi_lengkap: p.deskripsiLengkap,
        apa_yang_dipelajari: p.apaYangDipelajari as string[],
        untuk_siapa: p.untukSiapa as string[],
        thumbnail_url: p.thumbnailUrl,
        jenjang: p.jenjang,
        subjudul: p.subjudul,
        prasyarat: p.prasyarat,
        harga: p.harga,
        harga_coret: p.hargaCoret,
        durasi_pekan: p.durasiPekan,
      },
      jumlah_pelajaran: milik.length,
      total_detik: milik.reduce((sum, l) => sum + (l.durasiDetik ?? 0), 0),
    };
  });
}

export type KurikulumBab = {
  id: string;
  judul: string;
  ringkasan: string | null;
  urutan: number;
  pelajaran: PelajaranPublik[];
};

export async function kurikulumPublik(courseId: string): Promise<KurikulumBab[]> {
  const [modulRows, lessonRows] = await Promise.all([
    db
      .select()
      .from(modules)
      .where(eq(modules.courseId, courseId))
      .orderBy(asc(modules.urutan)),
    db
      .select({
        id: lessons.id,
        moduleId: lessons.moduleId,
        courseId: lessons.courseId,
        judul: lessons.judul,
        tipe: lessons.tipe,
        durasiDetik: lessons.durasiDetik,
        isPreview: lessons.isPreview,
        urutan: lessons.urutan,
      })
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(asc(lessons.urutan)),
  ]);

  return modulRows.map((m) => ({
    id: m.id,
    judul: m.judul,
    ringkasan: m.ringkasan,
    urutan: m.urutan,
    pelajaran: lessonRows
      .filter((l) => l.moduleId === m.id)
      .map((l) => ({
        id: l.id,
        module_id: l.moduleId,
        course_id: l.courseId,
        judul: l.judul,
        tipe: l.tipe as PelajaranPublik["tipe"],
        durasi_detik: l.durasiDetik,
        is_preview: l.isPreview,
        urutan: l.urutan,
      })),
  }));
}
