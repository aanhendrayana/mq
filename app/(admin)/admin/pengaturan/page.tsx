import type { Metadata } from "next";
import { JudulHalaman } from "@/components/dasbor/judul-halaman";
import { FormPengaturan } from "@/components/admin/form-pengaturan";
import { wajibAdmin } from "@/lib/auth";
import { ambilKontak, ambilPengaturan, ambilRekening, type Hero } from "@/lib/pengaturan";

export const metadata: Metadata = { title: "Pengaturan Situs" };

export default async function AdminPengaturanPage() {
  await wajibAdmin();

  const [kontak, rekening, sisa] = await Promise.all([
    ambilKontak(),
    ambilRekening(),
    ambilPengaturan("hero", "statistik"),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <JudulHalaman
        judul="Pengaturan Situs"
        keterangan="Semua yang di halaman ini berubah langsung di situs tanpa perlu deploy ulang."
      />

      <FormPengaturan
        kontak={kontak}
        rekening={rekening}
        hero={sisa.hero as Hero}
        statistik={(sisa.statistik ?? {}) as Record<string, string>}
      />
    </div>
  );
}
