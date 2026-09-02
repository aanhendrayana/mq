import type { Metadata } from "next";
import { FormMasuk } from "@/components/auth/form-masuk";

export const metadata: Metadata = { title: "Masuk" };

export default async function MasukPage({ searchParams }: PageProps<"/masuk">) {
  const { next } = await searchParams;
  return <FormMasuk tujuan={typeof next === "string" ? next : undefined} />;
}
