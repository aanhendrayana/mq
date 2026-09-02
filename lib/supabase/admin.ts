import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Klien service_role: MELEWATI seluruh RLS.
 *
 * Hanya untuk hal yang memang tidak bisa dilakukan atas nama pengguna:
 * - membaca bukti transfer milik santri lain di panel admin,
 * - membuat signed URL berkas privat,
 * - pekerjaan latar (kadaluarsa pesanan).
 *
 * Jangan pernah dipakai untuk memenuhi permintaan yang datanya berasal dari
 * klien tanpa memeriksa peran pemanggil lebih dulu (lihat `wajibAdmin()` di
 * lib/auth.ts). Berkas ini ditandai "server-only" agar gagal saat build kalau
 * tak sengaja diimpor komponen klien.
 */
export function buatKlienAdmin() {
  const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!kunci) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY belum diisi. Lihat .env.example.",
    );
  }

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, kunci, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
