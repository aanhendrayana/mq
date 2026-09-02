"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { buatKlienServer } from "@/lib/supabase/server";
import { wajibAdmin } from "@/lib/auth";

export type HasilPengaturan = { pesan?: string; sukses?: string } | undefined;

const skema = z.object({
  wa: z.string().trim().min(8, "Nomor WhatsApp tidak valid."),
  email: z.email("Alamat email tidak valid."),
  alamat: z.string().trim().max(200),
  instagram: z.string().trim().max(60),

  bank: z.string().trim().min(2, "Nama bank wajib diisi."),
  no_rek: z.string().trim().min(5, "Nomor rekening tidak valid."),
  atas_nama: z.string().trim().min(3, "Nama pemilik rekening wajib diisi."),

  hero_judul: z.string().trim().min(10, "Judul utama terlalu pendek."),
  hero_subjudul: z.string().trim().min(10, "Subjudul terlalu pendek."),
  hero_cta: z.string().trim().min(2),
  hero_catatan: z.string().trim().max(120),

  stat_santri: z.string().trim().max(20),
  stat_pengajar: z.string().trim().max(20),
  stat_kelas: z.string().trim().max(20),
  stat_kepuasan: z.string().trim().max(20),
});

/** Normalkan 08xx menjadi 628xx supaya tautan wa.me selalu bekerja. */
function normalkanWa(nomor: string): string {
  const bersih = nomor.replace(/\D/g, "");
  if (bersih.startsWith("62")) return bersih;
  if (bersih.startsWith("0")) return `62${bersih.slice(1)}`;
  return bersih;
}

export async function simpanPengaturanAction(
  _sebelumnya: HasilPengaturan,
  formData: FormData,
): Promise<HasilPengaturan> {
  await wajibAdmin();
  const hasil = skema.safeParse(Object.fromEntries(formData));
  if (!hasil.success) return { pesan: hasil.error.issues[0].message };

  const d = hasil.data;
  const supabase = await buatKlienServer();

  const { error } = await supabase.from("pengaturan_situs").upsert(
    [
      {
        kunci: "kontak",
        nilai: {
          whatsapp: normalkanWa(d.wa),
          email: d.email,
          alamat: d.alamat,
          instagram: d.instagram.replace(/^@/, ""),
        },
        is_publik: true,
      },
      {
        kunci: "rekening",
        nilai: { bank: d.bank, nomor: d.no_rek, atas_nama: d.atas_nama },
        // Tetap tidak publik: hanya pengguna yang sudah masuk yang perlu melihat
        // rekening tujuan, dan itu memperkecil peluang disalahgunakan penipu.
        is_publik: false,
      },
      {
        kunci: "hero",
        nilai: {
          judul: d.hero_judul,
          subjudul: d.hero_subjudul,
          cta: d.hero_cta,
          catatan: d.hero_catatan,
        },
        is_publik: true,
      },
      {
        kunci: "statistik",
        nilai: {
          santri: d.stat_santri,
          pengajar: d.stat_pengajar,
          kelas: d.stat_kelas,
          kepuasan: d.stat_kepuasan,
        },
        is_publik: true,
      },
    ],
    { onConflict: "kunci" },
  );

  if (error) return { pesan: error.message };

  revalidatePath("/", "layout");
  return { sukses: "Pengaturan tersimpan dan langsung berlaku di situs." };
}
