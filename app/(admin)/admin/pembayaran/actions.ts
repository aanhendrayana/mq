"use server";

import { revalidatePath } from "next/cache";
import { buatKlienServer } from "@/lib/supabase/server";
import { buatKlienAdmin } from "@/lib/supabase/admin";
import { wajibAdmin } from "@/lib/auth";

export type HasilVerifikasi = { pesan?: string; sukses?: string } | undefined;

/**
 * Menyetujui pembayaran.
 *
 * Pekerjaan sebenarnya ada di fungsi database `setujui_pesanan()`: menandai
 * lunas dan membuka akses kelas harus terjadi dalam satu transaksi, supaya
 * tidak pernah ada santriwati yang sudah dinyatakan lunas tapi tidak bisa masuk
 * kelas. Fungsi itu juga memeriksa ulang bahwa pemanggilnya admin.
 */
export async function setujuiPesananAction(
  _sebelumnya: HasilVerifikasi,
  formData: FormData,
): Promise<HasilVerifikasi> {
  await wajibAdmin();
  const orderId = String(formData.get("order_id") ?? "");

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("setujui_pesanan", { p_order: orderId });
  if (error) return { pesan: error.message };

  revalidatePath("/admin/pembayaran");
  revalidatePath("/admin");
  return { sukses: "Pembayaran disetujui dan akses kelas dibuka." };
}

export async function tolakPesananAction(
  _sebelumnya: HasilVerifikasi,
  formData: FormData,
): Promise<HasilVerifikasi> {
  await wajibAdmin();
  const orderId = String(formData.get("order_id") ?? "");
  const alasan = String(formData.get("alasan") ?? "").trim();

  if (alasan.length < 5) {
    return { pesan: "Tuliskan alasan penolakan agar santriwati tahu apa yang harus diperbaiki." };
  }

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("tolak_pesanan", {
    p_order: orderId,
    p_alasan: alasan,
  });
  if (error) return { pesan: error.message };

  revalidatePath("/admin/pembayaran");
  return { sukses: "Pembayaran ditolak. Santriwati dapat mengunggah ulang buktinya." };
}

/**
 * URL bertanda tangan untuk melihat bukti transfer.
 *
 * Bucket `bukti-bayar` privat dan policy-nya hanya mengizinkan pemilik berkas.
 * Admin karena itu memakai klien service_role — SETELAH `wajibAdmin()`
 * memastikan pemanggilnya memang admin. URL berlaku 10 menit saja.
 */
export async function urlBuktiAction(path: string): Promise<string | null> {
  await wajibAdmin();
  const admin = buatKlienAdmin();
  const { data } = await admin.storage.from("bukti-bayar").createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}
