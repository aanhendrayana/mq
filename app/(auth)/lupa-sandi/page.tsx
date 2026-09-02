import type { Metadata } from "next";
import { FormLupaSandi } from "@/components/auth/form-lupa-sandi";

export const metadata: Metadata = { title: "Lupa Kata Sandi" };

export default function LupaSandiPage() {
  return <FormLupaSandi />;
}
