"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { masukAction, type HasilForm } from "@/app/(auth)/actions";

export function FormMasuk({ tujuan }: { tujuan?: string }) {
  const [hasil, kirim, sedang] = useActionState<HasilForm, FormData>(masukAction, undefined);

  return (
    <Card className="p-2">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Masuk</CardTitle>
        <CardDescription>
          Lanjutkan belajar di Madrasah Qur&apos;an Ummina.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={kirim} className="space-y-4">
          {tujuan && <input type="hidden" name="next" value={tujuan} />}

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
            <div className="flex items-center justify-between">
              <Label htmlFor="sandi">Kata Sandi</Label>
              <Link href="/lupa-sandi" className="text-xs text-primary hover:underline">
                Lupa kata sandi?
              </Link>
            </div>
            <Input
              id="sandi"
              name="sandi"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {hasil?.pesan && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{hasil.pesan}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" size="lg" disabled={sedang} className="h-11 w-full">
            {sedang && <Loader2 className="size-4 animate-spin" />}
            Masuk
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link href="/daftar" className="font-medium text-primary hover:underline">
              Daftar sekarang
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
