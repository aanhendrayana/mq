import "server-only";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { batches } from "@/lib/db/schema";
import { wajibPengajar, type PenggunaAktif } from "@/lib/auth";
import { PERAN_AKSES_PENUH } from "@/lib/konstanta";

/**
 * Admin/Ummi Rifa mengelola semua rombel. Ustadzah biasa hanya rombel
 * yang admin tugaskan padanya lewat `batches.ustadzId` (lihat DialogBatch).
 */
export function aksesPenuhPengajaran(pengguna: PenggunaAktif): boolean {
  return pengguna.profil.peranList.some((p) => PERAN_AKSES_PENUH.includes(p));
}

/**
 * Id rombel yang boleh dikelola pengguna ini. `null` berarti tanpa batasan
 * (Admin/Ummi Rifa boleh lihat semua) — dipakai untuk menyaring query daftar
 * rombel/jadwal/santriwati bimbingan.
 */
export async function idRombelBimbingan(pengguna: PenggunaAktif): Promise<string[] | null> {
  if (aksesPenuhPengajaran(pengguna)) return null;

  const baris = await db.query.batches.findMany({
    where: eq(batches.ustadzId, pengguna.id),
    columns: { id: true },
  });
  return baris.map((b) => b.id);
}

/**
 * Wajib menjadi pembimbing rombel ini (atau Admin/Ummi Rifa). Dipakai di
 * halaman detail satu rombel, halaman sesi di dalamnya, dan aksi simpan
 * sesi/penilaian — supaya seorang ustadzah tidak bisa membuka atau mengubah
 * data rombel ustadzah lain hanya dengan menebak URL atau id rombel.
 */
export async function wajibPembimbingRombel(batchId: string): Promise<PenggunaAktif> {
  const pengguna = await wajibPengajar();
  if (aksesPenuhPengajaran(pengguna)) return pengguna;

  const batch = await db.query.batches.findFirst({
    where: eq(batches.id, batchId),
    columns: { ustadzId: true },
  });
  if (!batch || batch.ustadzId !== pengguna.id) {
    redirect("/pengajar");
  }
  return pengguna;
}
