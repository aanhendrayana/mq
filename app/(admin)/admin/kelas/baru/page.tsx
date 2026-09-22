import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { JudulHalaman } from "@/components/dasbor/judul-halaman";
import { FormKelas } from "@/components/admin/form-kelas";
import { wajibAdmin } from "@/lib/auth";
import { buatKlienServer } from "@/lib/db/server";

export const metadata: Metadata = { title: "Kelas Baru" };

export default async function KelasBaruPage() {
  await wajibAdmin();
  const db = await buatKlienServer();
  const { data: program } = await db.from("programs").select("id, nama").order("urutan");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <TautanTombol href="/admin/kelas" variant="ghost" size="sm" className="mb-4 -ml-2">
        <ArrowLeft className="size-4" />
        Kelas & Materi
      </TautanTombol>

      <JudulHalaman
        judul="Kelas Baru"
        keterangan="Isi data kelas dulu; bab dan pelajaran ditambahkan setelah kelas tersimpan."
      />

      <Card className="p-6">
        <FormKelas program={program ?? []} />
      </Card>
    </div>
  );
}
