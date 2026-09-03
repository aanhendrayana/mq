import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { JudulHalaman } from "@/components/dasbor/judul-halaman";
import { FormProfil } from "@/components/belajar/form-profil";
import { wajibMasuk } from "@/lib/auth";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilPage() {
  const pengguna = await wajibMasuk();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <JudulHalaman
        judul="Profil Saya"
        keterangan="Pastikan data Anda benar — nama di sini yang akan tercetak di sertifikat."
      />

      <Card className="gap-5 p-6">
        <div className="space-y-1">
          <p className="text-sm font-medium">Email</p>
          <p className="text-sm text-muted-foreground">{pengguna.email}</p>
          <p className="text-xs text-muted-foreground">
            Email tidak dapat diubah sendiri. Hubungi admin bila perlu diganti.
          </p>
        </div>

        <hr />

        <FormProfil key={pengguna.profil.diubah_at} profil={pengguna.profil} />
      </Card>
    </div>
  );
}
