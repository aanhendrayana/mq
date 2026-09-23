"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { buatKlienServer } from "@/lib/db/server";

export type HasilProfil = { pesan?: string; sukses?: string } | undefined;

const skema = z.object({
  nama: z.string().trim().min(3, "Nama minimal 3 huruf."),
  no_hp: z
    .string()
    .trim()
    .regex(/^(\+?62|0)[0-9]{8,14}$/, "Nomor HP tidak valid. Contoh: 081234567890."),
  kota: z.string().trim().max(80).optional(),
  tgl_lahir: z.string().optional(),
});

export async function simpanProfilAction(
  _sebelumnya: HasilProfil,
  formData: FormData,
): Promise<HasilProfil> {
  const hasil = skema.safeParse({
    nama: formData.get("nama"),
    no_hp: formData.get("no_hp"),
    kota: formData.get("kota") || undefined,
    tgl_lahir: formData.get("tgl_lahir") || undefined,
  });
  if (!hasil.success) return { pesan: hasil.error.issues[0].message };

  const db = await buatKlienServer();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { pesan: "Sesi Anda berakhir. Silakan masuk kembali." };

  // Kolom `peran` sengaja tidak disertakan. Trigger jaga_peran_profil() juga
  // akan menolaknya, tapi lebih baik tidak dikirim sama sekali.
  const { error } = await db
    .from("profiles")
    .update({
      nama: hasil.data.nama,
      no_hp: hasil.data.no_hp,
      kota: hasil.data.kota ?? null,
      tgl_lahir: hasil.data.tgl_lahir || null,
    })
    .eq("id", user.id);

  if (error) return { pesan: error.message };

  revalidatePath("/belajar", "layout");

  // Dipakai saat pendaftar Google diantar ke sini untuk melengkapi nomor
  // WhatsApp: setelah tersimpan, ia diteruskan ke halaman yang semula dituju.
  const tujuan = String(formData.get("next") ?? "");
  if (tujuan.startsWith("/") && !tujuan.startsWith("//")) redirect(tujuan);

  return { sukses: "Profil berhasil diperbarui." };
}
