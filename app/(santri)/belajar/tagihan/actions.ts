"use server";

import { revalidatePath } from "next/cache";
import { buatKlienServer } from "@/lib/supabase/server";

export type HasilUnggah = { pesan?: string; sukses?: string } | undefined;

const MAKS_BYTE = 5 * 1024 * 1024;
const TIPE_DIIZINKAN = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

/**
 * Mengunggah bukti transfer lalu menandai pesanan menunggu verifikasi.
 *
 * Berkas masuk ke bucket privat `bukti-bayar` dengan path `<user_id>/<invoice>`,
 * karena policy storage menentukan pemilik berkas dari folder pertama.
 */
export async function unggahBuktiAction(
  _sebelumnya: HasilUnggah,
  formData: FormData,
): Promise<HasilUnggah> {
  const orderId = String(formData.get("order_id") ?? "");
  const invoice = String(formData.get("invoice") ?? "");
  const namaPengirim = String(formData.get("nama_pengirim") ?? "").trim();
  const catatan = String(formData.get("catatan") ?? "").trim();
  const berkas = formData.get("bukti");

  if (!(berkas instanceof File) || berkas.size === 0) {
    return { pesan: "Pilih berkas bukti transfer terlebih dahulu." };
  }
  if (berkas.size > MAKS_BYTE) {
    return { pesan: "Ukuran berkas melebihi 5 MB. Kecilkan dulu gambarnya." };
  }
  if (!TIPE_DIIZINKAN.includes(berkas.type)) {
    return { pesan: "Format tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF." };
  }
  if (!namaPengirim) {
    return { pesan: "Isi nama pemilik rekening pengirim." };
  }

  const supabase = await buatKlienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { pesan: "Sesi Anda berakhir. Silakan masuk kembali." };

  const ekstensi = berkas.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/${invoice}.${ekstensi}`;

  const { error: galatUnggah } = await supabase.storage
    .from("bukti-bayar")
    .upload(path, berkas, { upsert: true, contentType: berkas.type });

  if (galatUnggah) {
    return { pesan: `Gagal mengunggah berkas: ${galatUnggah.message}` };
  }

  const { error } = await supabase.rpc("unggah_bukti", {
    p_order: orderId,
    p_path: path,
    p_nama_pengirim: namaPengirim,
    p_catatan: catatan || null,
  });

  if (error) return { pesan: error.message };

  revalidatePath(`/belajar/tagihan/${invoice}`);
  revalidatePath("/belajar/tagihan");
  revalidatePath("/belajar");
  return {
    sukses:
      "Bukti transfer terkirim. Admin akan memverifikasi maksimal 1×24 jam, dan Anda akan dikabari lewat WhatsApp.",
  };
}
