"use server";

import { revalidatePath } from "next/cache";
import { buatKlienServer } from "@/lib/supabase/server";
import { wajibAdmin } from "@/lib/auth";

export type HasilSertifikat = { pesan?: string; sukses?: string } | undefined;

/**
 * Menerbitkan sertifikat untuk seorang santriwati pada sebuah kelas.
 *
 * Syarat kelulusan diperiksa di dalam fungsi database `terbitkan_sertifikat()`,
 * bukan di sini — supaya angka yang dipakai memutuskan sama persis dengan yang
 * ditampilkan di rapor santriwati.
 *
 * `paksa` melewati pemeriksaan itu. Disediakan untuk kasus nyata seperti santriwati
 * pindahan yang setorannya dinilai di luar sistem, dan sengaja butuh tindakan
 * terpisah agar tidak terjadi karena kelalaian.
 */
export async function terbitkanSertifikatAction(
  santriId: string,
  courseId: string,
  paksa = false,
): Promise<HasilSertifikat> {
  await wajibAdmin();
  const supabase = await buatKlienServer();

  const { data, error } = await supabase.rpc("terbitkan_sertifikat", {
    p_santri: santriId,
    p_course: courseId,
    p_paksa: paksa,
  });

  if (error) {
    if (error.code === "23505") {
      return { pesan: "Santriwati ini sudah punya sertifikat untuk kelas tersebut." };
    }
    return { pesan: error.message };
  }

  revalidatePath("/admin/sertifikat");
  revalidatePath("/belajar/sertifikat");
  return { sukses: `Sertifikat ${data.nomor} diterbitkan.` };
}
