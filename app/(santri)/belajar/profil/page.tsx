import type { Metadata } from "next";
import { Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { JudulHalaman } from "@/components/dasbor/judul-halaman";
import { FormProfil } from "@/components/belajar/form-profil";
import { wajibMasuk } from "@/lib/auth";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilPage({ searchParams }: PageProps<"/belajar/profil">) {
  const { lengkapi, next } = await searchParams;
  const pengguna = await wajibMasuk();

  // Pendaftar lewat Google diantar ke sini: Google tidak memberi nomor
  // WhatsApp, padahal admin memakainya untuk verifikasi pembayaran.
  const perluDilengkapi = lengkapi === "1" && !pengguna.profil.no_hp;
  const tujuan = typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
    ? next
    : undefined;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <JudulHalaman
        judul="Profil Saya"
        keterangan="Pastikan data Anda benar — nama di sini yang akan tercetak di sertifikat."
      />

      {perluDilengkapi && (
        <Alert className="mb-5">
          <Info className="size-4" />
          <AlertDescription>
            Akun Anda sudah aktif. Tinggal lengkapi nomor WhatsApp — dipakai admin untuk
            mengabari verifikasi pembayaran dan jadwal halaqah.
          </AlertDescription>
        </Alert>
      )}

      <Card className="gap-5 p-6">
        <div className="space-y-1">
          <p className="text-sm font-medium">Email</p>
          <p className="text-sm text-muted-foreground">{pengguna.email}</p>
          <p className="text-xs text-muted-foreground">
            Email tidak dapat diubah sendiri. Hubungi admin bila perlu diganti.
          </p>
        </div>

        <hr />

        <FormProfil key={pengguna.profil.diubah_at} profil={pengguna.profil} tujuan={tujuan} />
      </Card>
    </div>
  );
}
