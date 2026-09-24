"use server";

import { revalidatePath } from "next/cache";
import { buatKlienServer } from "@/lib/db/server";
import { wajibAdmin } from "@/lib/auth";
import { EMAIL_KHUSUS_PERAN, PERAN, PERAN_AKSES_PENUH, type Peran } from "@/lib/konstanta";

export type HasilPengguna = { pesan?: string; sukses?: string } | undefined;

/**
 * Menyalakan atau memadamkan satu tag peran pada seorang pengguna.
 *
 * Peran sekarang berupa kumpulan tag (satu akun bisa berperan ganda, mis.
 * Ustadzah + Santri), jadi aksinya menambah/menghapus satu baris di
 * `pengguna_peran`, bukan mengganti satu kolom.
 *
 * Tiga pengaman di sini: (1) admin tidak bisa mengubah perannya sendiri —
 * kalau dia satu-satunya akses penuh, sistem terkunci tanpa siapa pun yang
 * bisa mengembalikannya; (2) "Ummi Rifa" dan "Admin" terkunci masing-masing
 * ke satu email tertentu (lihat EMAIL_KHUSUS_PERAN), bukan peran generik yang
 * bisa dipegang siapa saja; (3) tidak boleh memadamkan akses penuh terakhir
 * yang tersisa di seluruh sistem.
 */
export async function ubahPeranAction(
  penggunaId: string,
  peran: Peran,
  aktif: boolean,
): Promise<HasilPengguna> {
  const admin = await wajibAdmin();

  if (!Object.values(PERAN).includes(peran)) {
    return { pesan: "Peran tidak dikenali." };
  }

  if (penggunaId === admin.id) {
    return { pesan: "Anda tidak dapat mengubah peran akun Anda sendiri." };
  }

  const db = await buatKlienServer();

  const emailWajib = EMAIL_KHUSUS_PERAN[peran];
  if (aktif && emailWajib) {
    const { data: target } = await db
      .from("profiles")
      .select("email")
      .eq("id", penggunaId)
      .maybeSingle();
    if (target?.email !== emailWajib) {
      return { pesan: `Peran ini hanya untuk akun ${emailWajib}.` };
    }
  }

  if (!aktif && PERAN_AKSES_PENUH.includes(peran)) {
    const { data: penuh } = await db
      .from("pengguna_peran")
      .select("pengguna_id")
      .in("peran", PERAN_AKSES_PENUH)
      .neq("pengguna_id", penggunaId);
    const jumlahLain = new Set((penuh ?? []).map((r) => r.pengguna_id)).size;
    if (jumlahLain === 0) {
      return { pesan: "Ini akses penuh terakhir. Angkat akun lain lebih dulu." };
    }
  }

  if (aktif) {
    const { data: sudahAda } = await db
      .from("pengguna_peran")
      .select("id")
      .eq("pengguna_id", penggunaId)
      .eq("peran", peran)
      .maybeSingle();
    if (!sudahAda) {
      const { error } = await db
        .from("pengguna_peran")
        .insert({ pengguna_id: penggunaId, peran });
      if (error) return { pesan: error.message };
    }
  } else {
    const { error } = await db
      .from("pengguna_peran")
      .delete()
      .eq("pengguna_id", penggunaId)
      .eq("peran", peran);
    if (error) return { pesan: error.message };
  }

  revalidatePath("/admin/pengguna");
  return { sukses: "Peran pengguna diperbarui." };
}
