"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { daftarAction, type HasilForm } from "@/app/(auth)/actions";
import { GalatGoogle, PemisahAtau, TombolGoogle } from "@/components/auth/tombol-google";

export function FormDaftar({ tujuan, galatGoogle }: { tujuan?: string; galatGoogle?: string }) {
  const [hasil, kirim, sedang] = useActionState<HasilForm, FormData>(daftarAction, undefined);

  if (hasil?.sukses) {
    return (
      <Card className="p-2">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <CheckCircle2 className="size-12 text-primary" />
          <h1 className="font-heading text-xl font-semibold">Satu langkah lagi</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{hasil.sukses}</p>
          <Link href="/masuk" className="text-sm font-medium text-primary hover:underline">
            Kembali ke halaman masuk
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-2">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Daftar Akun</CardTitle>
        <CardDescription>
          Gratis. Anda baru membayar saat memilih kelas.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <GalatGoogle kode={galatGoogle} />
          <TombolGoogle asal="/daftar" tujuan={tujuan} label="Daftar dengan Google" />
          <PemisahAtau teks="atau daftar dengan email" />
        </div>

        <form action={kirim} className="mt-4 space-y-4">
          {tujuan && <input type="hidden" name="next" value={tujuan} />}

          <div className="space-y-2">
            <Label htmlFor="nama">Nama Lengkap</Label>
            <Input
              id="nama"
              name="nama"
              autoComplete="name"
              required
              placeholder="Nama sesuai yang ingin tertera di sertifikat"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="nama@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="no_hp">Nomor WhatsApp</Label>
            <Input
              id="no_hp"
              name="no_hp"
              type="tel"
              autoComplete="tel"
              required
              placeholder="081234567890"
            />
            <p className="text-xs text-muted-foreground">
              Dipakai admin untuk mengabari verifikasi pembayaran dan jadwal halaqah.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sandi">Kata Sandi</Label>
            <Input
              id="sandi"
              name="sandi"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
            <p className="text-xs text-muted-foreground">Minimal 8 karakter.</p>
          </div>

          {hasil?.pesan && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{hasil.pesan}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" size="lg" disabled={sedang} className="h-11 w-full">
            {sedang && <Loader2 className="size-4 animate-spin" />}
            Buat Akun
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link href="/masuk" className="font-medium text-primary hover:underline">
              Masuk di sini
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
