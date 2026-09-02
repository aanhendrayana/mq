import { buatKlienServer } from "@/lib/supabase/server";

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

export type Statistik = Record<string, string>;
export type LangkahAlur = { judul: string; isi: string };

const CADANGAN = {
  kontak: {
    whatsapp: "628000000000",
    email: "info@mqummina.id",
    alamat: "Indonesia",
    instagram: "mqummina",
  } satisfies Kontak,
  rekening: {
    bank: "—",
    nomor: "—",
    atas_nama: "—",
  } satisfies Rekening,
  hero: {
    judul: "Belajar Membaca Al-Qur'an dengan Bimbingan Ustadz",
    subjudul:
      "Materi video terstruktur yang bisa diulang kapan saja, dipadukan halaqah setoran langsung.",
    cta: "Lihat Program",
    catatan: "Kelas daring · Bimbingan ustadz",
  } satisfies Hero,
};

/**
 * Membaca beberapa kunci `pengaturan_situs` sekaligus.
 *
 * Selalu mengembalikan nilai cadangan bila kunci belum ada, supaya halaman
 * depan tidak pernah kosong hanya karena admin belum mengisi pengaturan.
 */
export async function ambilPengaturan<K extends string>(
  ...kunci: K[]
): Promise<Record<K, unknown>> {
  const supabase = await buatKlienServer();
  const { data } = await supabase
    .from("pengaturan_situs")
    .select("kunci, nilai")
    .in("kunci", kunci);

  const hasil = {} as Record<K, unknown>;
  for (const k of kunci) {
    hasil[k] =
      data?.find((r) => r.kunci === k)?.nilai ??
      (CADANGAN as Record<string, unknown>)[k] ??
      null;
  }
  return hasil;
}

export async function ambilKontak(): Promise<Kontak> {
  const { kontak } = await ambilPengaturan("kontak");
  return { ...CADANGAN.kontak, ...(kontak as Partial<Kontak>) };
}

/**
 * Rekening tujuan transfer. Barisnya tidak publik (is_publik = false), jadi
 * hanya terbaca oleh pengguna yang sudah masuk — panggil ini dari halaman
 * tagihan, bukan dari halaman marketing.
 */
export async function ambilRekening(): Promise<Rekening> {
  const { rekening } = await ambilPengaturan("rekening");
  return { ...CADANGAN.rekening, ...(rekening as Partial<Rekening>) };
}
