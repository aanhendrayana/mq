"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { buatKlienServer } from "@/lib/supabase/server";
import { wajibAdmin } from "@/lib/auth";
import type { Peran } from "@/lib/konstanta";

export type HasilPengguna = { pesan?: string; sukses?: string } | undefined;

/**
 * Mengubah peran seorang pengguna.
 *
 * Perubahan ini nyata: mengangkat seseorang menjadi admin memberinya akses ke
 * seluruh data santriwati dan tombol verifikasi pembayaran. Karena itu ada dua
 * pengaman di sini — dan trigger `jaga_peran_profil()` di database sebagai
 * pengaman ketiga bila jalur ini pernah dilewati.
 */
export async function ubahPeranAction(
  penggunaId: string,
  peranBaru: Peran,
): Promise<HasilPengguna> {
  const admin = await wajibAdmin();

  if (!z.enum(["santri", "ustadz", "admin"]).safeParse(peranBaru).success) {
    return { pesan: "Peran tidak dikenali." };
  }

  // Admin tidak boleh menurunkan perannya sendiri: kalau dia satu-satunya admin,
  // sistem akan terkunci tanpa siapa pun yang bisa mengembalikannya.
  if (penggunaId === admin.id) {
    return { pesan: "Anda tidak dapat mengubah peran akun Anda sendiri." };
  }

  const supabase = await buatKlienServer();

  if (peranBaru !== "admin") {
    const { data: calon } = await supabase
      .from("profiles")
      .select("peran")
      .eq("id", penggunaId)
      .maybeSingle();

    if (calon?.peran === "admin") {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("peran", "admin");

      if ((count ?? 0) <= 1) {
        return { pesan: "Ini satu-satunya admin. Angkat admin lain lebih dulu." };
      }
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ peran: peranBaru })
    .eq("id", penggunaId);

  if (error) return { pesan: error.message };

  revalidatePath("/admin/pengguna");
  return { sukses: "Peran pengguna diperbarui." };
}
