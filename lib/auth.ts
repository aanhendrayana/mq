import "server-only";
import { redirect } from "next/navigation";
import { buatKlienServer } from "@/lib/supabase/server";
import { BERANDA_PERAN, type Peran } from "@/lib/konstanta";
import type { Profile } from "@/lib/database.types";

export type PenggunaAktif = {
  id: string;
  email: string | null;
  profil: Profile;
};

/**
 * Pengguna yang sedang masuk, atau null.
 *
 * Selalu memakai getUser() (bukan getSession()) karena cookie sesi ada di sisi
 * klien dan bisa dimanipulasi; getUser() memverifikasinya ke Supabase.
 */
export async function penggunaSekarang(): Promise<PenggunaAktif | null> {
  const supabase = await buatKlienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profil } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profil) return null;
  return { id: user.id, email: user.email ?? null, profil };
}

/** Wajib sudah masuk. Kalau belum, dilempar ke /masuk dengan tujuan kembali. */
export async function wajibMasuk(tujuan?: string): Promise<PenggunaAktif> {
  const pengguna = await penggunaSekarang();
  if (!pengguna) {
    const kembali = tujuan ? `?next=${encodeURIComponent(tujuan)}` : "";
    redirect(`/masuk${kembali}`);
  }
  return pengguna;
}

/**
 * Wajib punya salah satu peran. Kalau perannya tidak cocok, dialihkan ke
 * beranda perannya sendiri — bukan ditampilkan 403 — supaya santri yang
 * salah membuka /admin tidak melihat bahwa halaman itu ada.
 */
export async function wajibPeran(...peran: Peran[]): Promise<PenggunaAktif> {
  const pengguna = await wajibMasuk();
  if (!peran.includes(pengguna.profil.peran)) {
    redirect(BERANDA_PERAN[pengguna.profil.peran]);
  }
  return pengguna;
}

export const wajibAdmin = () => wajibPeran("admin");
export const wajibPengajar = () => wajibPeran("ustadz", "admin");
