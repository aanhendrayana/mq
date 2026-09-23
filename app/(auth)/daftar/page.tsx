import type { Metadata } from "next";
import { FormDaftar } from "@/components/auth/form-daftar";

export const metadata: Metadata = { title: "Daftar Akun" };

export default async function DaftarPage({ searchParams }: PageProps<"/daftar">) {
  const { next, error } = await searchParams;
  return (
    <FormDaftar
      tujuan={typeof next === "string" ? next : undefined}
      galatGoogle={typeof error === "string" ? error : undefined}
    />
  );
}
