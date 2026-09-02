"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { lupaSandiAction, type HasilForm } from "@/app/(auth)/actions";

export function FormLupaSandi() {
  const [hasil, kirim, sedang] = useActionState<HasilForm, FormData>(
    lupaSandiAction,
    undefined,
  );

  return (
    <Card className="p-2">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Lupa Kata Sandi</CardTitle>
        <CardDescription>
          Masukkan email Anda, kami kirimkan tautan untuk mengatur ulang sandi.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={kirim} className="space-y-4">
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

          {hasil?.pesan && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{hasil.pesan}</AlertDescription>
            </Alert>
          )}

          {hasil?.sukses && (
            <Alert>
              <CheckCircle2 className="size-4" />
              <AlertDescription>{hasil.sukses}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" size="lg" disabled={sedang} className="h-11 w-full">
            {sedang && <Loader2 className="size-4 animate-spin" />}
            Kirim Tautan
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/masuk" className="font-medium text-primary hover:underline">
              Kembali ke halaman masuk
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
