"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { buatKlienServer } from "@/lib/supabase/server";
import { SITUS } from "@/lib/konstanta";

export type HasilForm = { pesan?: string; sukses?: string } | undefined;

const skemaMasuk = z.object({
  email: z.email({ message: "Alamat email tidak valid." }),
  sandi: z.string().min(1, "Kata sandi wajib diisi."),
});

const skemaDaftar = z.object({
  nama: z.string().trim().min(3, "Nama minimal 3 huruf."),
  email: z.email({ message: "Alamat email tidak valid." }),
  no_hp: z
    .string()
    .trim()
    .regex(/^(\+?62|0)[0-9]{8,14}$/, "Nomor HP tidak valid. Contoh: 081234567890."),
  sandi: z.string().min(8, "Kata sandi minimal 8 karakter."),
});

/**
 * Menerjemahkan pesan galat Supabase ke bahasa Indonesia.
 * Sengaja tidak membedakan "email tidak terdaftar" dari "sandi salah", supaya
 * halaman masuk tidak bisa dipakai memeriksa email siapa saja yang terdaftar.
 */
function terjemahkanGalat(pesan: string): string {
  const p = pesan.toLowerCase();
  if (p.includes("invalid login credentials")) return "Email atau kata sandi salah.";
  if (p.includes("email not confirmed"))
    return "Email belum dikonfirmasi. Silakan periksa kotak masuk Anda.";
  if (p.includes("user already registered") || p.includes("already been registered"))
    return "Email ini sudah terdaftar. Silakan masuk.";
  if (p.includes("rate limit") || p.includes("too many"))
    return "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.";
  if (p.includes("password")) return "Kata sandi tidak memenuhi syarat.";
  return pesan;
}

export async function masukAction(
  _sebelumnya: HasilForm,
  formData: FormData,
): Promise<HasilForm> {
  const hasil = skemaMasuk.safeParse({
    email: formData.get("email"),
    sandi: formData.get("sandi"),
  });
  if (!hasil.success) {
    return { pesan: hasil.error.issues[0].message };
  }

  const supabase = await buatKlienServer();
  const { error } = await supabase.auth.signInWithPassword({
    email: hasil.data.email,
    password: hasil.data.sandi,
  });
  if (error) return { pesan: terjemahkanGalat(error.message) };

  revalidatePath("/", "layout");
  // Middleware yang menentukan beranda sesuai peran, jadi cukup arahkan ke
  // tujuan yang diminta atau ke /belajar sebagai titik netral.
  const tujuan = String(formData.get("next") ?? "") || "/belajar";
  redirect(tujuan);
}

export async function daftarAction(
  _sebelumnya: HasilForm,
  formData: FormData,
): Promise<HasilForm> {
  const hasil = skemaDaftar.safeParse({
    nama: formData.get("nama"),
    email: formData.get("email"),
    no_hp: formData.get("no_hp"),
    sandi: formData.get("sandi"),
  });
  if (!hasil.success) return { pesan: hasil.error.issues[0].message };

  const supabase = await buatKlienServer();
  const { data, error } = await supabase.auth.signUp({
    email: hasil.data.email,
    password: hasil.data.sandi,
    options: {
      // Peran TIDAK dikirim dari sini. Trigger handle_new_user() selalu
      // menetapkan 'santri'; metadata dari klien tidak dipercaya.
      data: { nama: hasil.data.nama, no_hp: hasil.data.no_hp },
      emailRedirectTo: `${SITUS.url}/auth/konfirmasi`,
    },
  });
  if (error) return { pesan: terjemahkanGalat(error.message) };

  // Bila konfirmasi email diaktifkan, sesi masih kosong sampai tautan diklik.
  if (!data.session) {
    return {
      sukses:
        "Pendaftaran berhasil. Kami mengirim tautan konfirmasi ke email Anda — silakan periksa kotak masuk (dan folder spam).",
    };
  }

  revalidatePath("/", "layout");
  const tujuan = String(formData.get("next") ?? "") || "/belajar";
  redirect(tujuan);
}

export async function lupaSandiAction(
  _sebelumnya: HasilForm,
  formData: FormData,
): Promise<HasilForm> {
  const email = z.email().safeParse(formData.get("email"));
  if (!email.success) return { pesan: "Alamat email tidak valid." };

  const supabase = await buatKlienServer();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${SITUS.url}/auth/konfirmasi?next=/belajar/profil`,
  });
  if (error) return { pesan: terjemahkanGalat(error.message) };

  // Jawaban yang sama diberikan baik email terdaftar maupun tidak.
  return {
    sukses:
      "Bila email tersebut terdaftar, kami sudah mengirimkan tautan untuk mengatur ulang kata sandi.",
  };
}

export async function keluarAction() {
  const supabase = await buatKlienServer();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
