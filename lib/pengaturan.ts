import { db } from "@/lib/db";
import { pengaturan } from "@/lib/db/schema";
import { inArray, desc } from "drizzle-orm";

export type Kontak = {
  whatsapp: string;
  email: string;
  alamat: string;
  instagram: string;
};

export type Rekening = {
  bank: string;
  nomor: string;
  atas_nama: string;
};

export type Hero = {
  judul: string;
  subjudul: string;
  cta: string;
  catatan: string;
};

export type Pengasuh = {
  nama: string;
  peran: string;
  bio: string;
};

export type Statistik = Record<string, string>;
export type LangkahAlur = { judul: string; isi: string };

const CADANGAN = {
  kontak: {
    whatsapp: "628000000000",
    email: "info@nurulmusthofa.id",
    alamat: "Indonesia",
    instagram: "nurulmusthofa",
  } satisfies Kontak,
  rekening: {
    bank: "—",
    nomor: "—",
    atas_nama: "—",
  } satisfies Rekening,
  hero: {
    judul: "Belajar Membaca Al-Qur'an dengan Bimbingan Ustadzah",
    subjudul:
      "Materi video terstruktur yang bisa diulang kapan saja, dipadukan halaqah setoran langsung.",
    cta: "Lihat Program",
    catatan: "Kelas daring · Bimbingan ustadzah",
  } satisfies Hero,
};

/**
 * Membaca beberapa kunci `pengaturan` sekaligus dari PostgreSQL.
 */
export async function ambilPengaturan<K extends string>(
  ...kunci: K[]
): Promise<Record<K, unknown>> {
  const data = await db
    .select({
      kunci: pengaturan.kunci,
      nilai: pengaturan.nilai,
    })
    .from(pengaturan)
    .where(inArray(pengaturan.kunci, kunci));

  const hasil = {} as Record<K, unknown>;
  for (const k of kunci) {
    hasil[k] =
      data.find((r) => r.kunci === k)?.nilai ??
      (CADANGAN as Record<string, unknown>)[k] ??
      null;
  }
  return hasil;
}

/**
 * Penanda versi seluruh pengaturan: waktu perubahan terbaru.
 */
export async function versiPengaturan(): Promise<string> {
  const data = await db
    .select({ diubahAt: pengaturan.diubahAt })
    .from(pengaturan)
    .orderBy(desc(pengaturan.diubahAt))
    .limit(1);

  return data[0]?.diubahAt?.toISOString() ?? "awal";
}

/** Profil pengasuh madrasah untuk halaman Tentang. */
export async function ambilPengasuh(): Promise<Pengasuh | null> {
  const { pengasuh } = await ambilPengaturan("pengasuh");
  const p = pengasuh as Partial<Pengasuh> | null;
  return p?.nama ? { nama: p.nama, peran: p.peran ?? "", bio: p.bio ?? "" } : null;
}

export async function ambilKontak(): Promise<Kontak> {
  const { kontak } = await ambilPengaturan("kontak");
  return { ...CADANGAN.kontak, ...(kontak as Partial<Kontak>) };
}

/**
 * Rekening tujuan transfer.
 */
export async function ambilRekening(): Promise<Rekening> {
  const { rekening } = await ambilPengaturan("rekening");
  return { ...CADANGAN.rekening, ...(rekening as Partial<Rekening>) };
}
