import "server-only";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ambilTokenDariCookie, verifikasiTokenSesi } from "@/lib/auth/session";
import { berandaUntukPeran, type Peran } from "@/lib/konstanta";

export type PenggunaProfil = {
  id: string;
  nama: string;
  no_hp: string | null;
  /** Bisa lebih dari satu — lihat komentar di lib/konstanta.ts (PERAN). */
  peranList: Peran[];
  tgl_lahir: string | null;
  kota: string | null;
  avatar_url: string | null;
  bio: string | null;
  dibuat_at: string;
  diubah_at: string;
};

export type PenggunaAktif = {
  id: string;
  email: string | null;
  profil: PenggunaProfil;
};

/**
 * Mengambil data pengguna yang sedang masuk dari sesi cookie & database PostgreSQL.
 */
export async function penggunaSekarang(): Promise<PenggunaAktif | null> {
  const token = await ambilTokenDariCookie();
  if (!token) return null;

  const payload = await verifikasiTokenSesi(token);
  if (!payload) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.id),
    with: { peranList: true },
  });

  if (!user) return null;

  const profil: PenggunaProfil = {
    id: user.id,
    nama: user.nama,
    no_hp: user.noHp,
    peranList: user.peranList.map((p) => p.peran as Peran),
    tgl_lahir: user.tglLahir,
    kota: user.kota,
    avatar_url: user.avatarUrl,
    bio: user.bio,
    dibuat_at: user.dibuatAt.toISOString(),
    diubah_at: user.diubahAt.toISOString(),
  };

  return {
    id: user.id,
    email: user.email,
    profil,
  };
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
 * Wajib punya salah satu dari peran yang diminta (cukup satu, karena
 * pengguna bisa berperan ganda). Kalau tak satu pun cocok, dialihkan ke
 * beranda yang sesuai kombinasi perannya sendiri.
 */
export async function wajibPeran(...peran: Peran[]): Promise<PenggunaAktif> {
  const pengguna = await wajibMasuk();
  const cocok = pengguna.profil.peranList.some((p) => peran.includes(p));
  if (!cocok) {
    redirect(berandaUntukPeran(pengguna.profil.peranList));
  }
  return pengguna;
}

/** Ummi Rifa dan Admin sama-sama berhak akses penuh — lihat PERAN_AKSES_PENUH. */
export const wajibAdmin = () => wajibPeran("admin", "ummi");
export const wajibPengajar = () => wajibPeran("ustadz", "admin", "ummi");
