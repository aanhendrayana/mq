import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Cek Keaslian Sertifikat",
  description:
    "Periksa keaslian sertifikat kelulusan Madrasah Qur'an Ummina dengan memasukkan kode verifikasi yang tertera pada sertifikat.",
};

async function cariSertifikat(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "").trim();
  if (token) redirect(`/cek-sertifikat/${encodeURIComponent(token)}`);
}

export default function CekSertifikatPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="mb-8 text-center">
        <ShieldCheck className="mx-auto mb-4 size-12 text-primary" />
        <h1 className="font-heading text-3xl font-bold">Cek Keaslian Sertifikat</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Masukkan kode verifikasi yang tertera pada sertifikat, atau pindai kode
          QR-nya untuk langsung membuka halaman verifikasi.
        </p>
      </div>

      <Card className="p-6">
        <form action={cariSertifikat} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Kode verifikasi</Label>
            <Input
              id="token"
              name="token"
              required
              placeholder="Mis. 3f9a1c7e2b8d4a6f0c1e5b93"
              autoComplete="off"
              className="font-mono"
            />
          </div>
          <Button type="submit" size="lg" className="h-11 w-full">
            Periksa Sertifikat
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm leading-relaxed text-muted-foreground">
        Halaman ini terbuka untuk umum. Sertifikat yang sah akan menampilkan nama
        pemilik, kelas yang ditempuh, predikat, dan tanggal terbitnya.
      </p>
    </div>
  );
}
