import { buatKlienServer } from "@/lib/supabase/server";
import type { Course, PelajaranPublik, Program } from "@/lib/database.types";

export type KelasRingkas = Course & {
  programs: Pick<Program, "slug" | "nama"> | null;
  jumlah_pelajaran: number;
  total_detik: number;
};

/**
 * Daftar kelas terbit untuk katalog & halaman depan.
 *
 * Jumlah pelajaran & durasi diambil dari view `kurikulum_publik` (bukan tabel
 * `lessons`) supaya pengunjung anonim tetap bisa melihat ukuran kelas tanpa
 * membuka baris pelajaran yang memuat video_id.
 */
export async function daftarKelas(opsi?: {
  program?: string;
  batas?: number;
}): Promise<KelasRingkas[]> {
  const supabase = await buatKlienServer();

  let q = supabase
    .from("courses")
    .select("*, programs!inner(slug, nama)")
    .eq("is_published", true)
    .order("urutan");

  if (opsi?.program) q = q.eq("programs.slug", opsi.program);
  if (opsi?.batas) q = q.limit(opsi.batas);

  const { data: kelas } = await q;
  if (!kelas?.length) return [];

  const { data: pelajaran } = await supabase
    .from("kurikulum_publik")
    .select("course_id, durasi_detik")
    .in(
      "course_id",
      kelas.map((k) => k.id),
    );

  return kelas.map((k) => {
    const milik = pelajaran?.filter((p) => p.course_id === k.id) ?? [];
    return {
      ...(k as unknown as Course & { programs: Pick<Program, "slug" | "nama"> }),
      jumlah_pelajaran: milik.length,
      total_detik: milik.reduce((t, p) => t + (p.durasi_detik ?? 0), 0),
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

/** Kurikulum untuk halaman penjualan: judul bab & pelajaran, tanpa video_id. */
export async function kurikulumPublik(courseId: string): Promise<KurikulumBab[]> {
  const supabase = await buatKlienServer();

  const [{ data: bab }, { data: pelajaran }] = await Promise.all([
    supabase
      .from("modules")
      .select("id, judul, ringkasan, urutan")
      .eq("course_id", courseId)
      .order("urutan"),
    supabase
      .from("kurikulum_publik")
      .select("*")
      .eq("course_id", courseId)
      .order("urutan"),
  ]);

  return (bab ?? []).map((b) => ({
    ...b,
    pelajaran: (pelajaran ?? []).filter((p) => p.module_id === b.id),
  }));
}
