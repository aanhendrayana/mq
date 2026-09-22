"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { buatTokenSesi, pasangCookieSesi, hapusCookieSesi } from "@/lib/auth/session";

export type HasilForm = { pesan?: string; sukses?: string } | undefined;

const skemaMasuk = z.object({
  email: z.string().email({ message: "Alamat email tidak valid." }),
  sandi: z.string().min(1, "Kata sandi wajib diisi."),
});

const skemaDaftar = z.object({
  nama: z.string().trim().min(3, "Nama minimal 3 huruf."),
  email: z.string().email({ message: "Alamat email tidak valid." }),
  no_hp: z
    .string()
    .trim()
    .regex(/^(\+?62|0)[0-9]{8,14}$/, "Nomor HP tidak valid. Contoh: 081234567890."),
  sandi: z.string().min(8, "Kata sandi minimal 8 karakter."),
});

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

  const email = hasil.data.email.toLowerCase().trim();
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return { pesan: "Email atau kata sandi salah." };
  }

  const cocok = await bcrypt.compare(hasil.data.sandi, user.passwordHash);
  if (!cocok) {
    return { pesan: "Email atau kata sandi salah." };
  }

  const token = await buatTokenSesi({
    id: user.id,
    email: user.email,
    peran: user.peran,
  });

  await pasangCookieSesi(token);

  revalidatePath("/", "layout");
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

  const email = hasil.data.email.toLowerCase().trim();
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    return { pesan: "Email ini sudah terdaftar. Silakan masuk." };
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(hasil.data.sandi, salt);

  const [newUser] = await db
    .insert(users)
    .values({
      nama: hasil.data.nama,
      email,
      noHp: hasil.data.no_hp,
      passwordHash,
      peran: "santri",
    })
    .returning();

  const token = await buatTokenSesi({
    id: newUser.id,
    email: newUser.email,
    peran: newUser.peran,
  });

  await pasangCookieSesi(token);

  revalidatePath("/", "layout");
  const tujuan = String(formData.get("next") ?? "") || "/belajar";
  redirect(tujuan);
}

export async function lupaSandiAction(
  _sebelumnya: HasilForm,
  formData: FormData,
): Promise<HasilForm> {
  const emailVal = z.string().email().safeParse(formData.get("email"));
  if (!emailVal.success) return { pesan: "Alamat email tidak valid." };

  return {
    sukses:
      "Bila email tersebut terdaftar, kami sudah mencatat permohonan pemulihan kata sandi Anda.",
  };
}

export async function keluarAction() {
  await hapusCookieSesi();
  revalidatePath("/", "layout");
  redirect("/");
}
