"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { simpanProfilAction, type HasilProfil } from "@/app/(santri)/belajar/profil/actions";
import type { Profile } from "@/lib/database.types";

export function FormProfil({ profil }: { profil: Profile }) {
  const [hasil, kirim, sedang] = useActionState<HasilProfil, FormData>(
    simpanProfilAction,
    undefined,
  );

  return (
    <form action={kirim} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="nama">Nama Lengkap</Label>
        <Input id="nama" name="nama" required defaultValue={profil.nama} />
        <p className="text-xs text-muted-foreground">
          Nama ini yang akan tercetak di sertifikat kelulusan Anda.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="no_hp">Nomor WhatsApp</Label>
          <Input
            id="no_hp"
            name="no_hp"
            type="tel"
            required
            defaultValue={profil.no_hp ?? ""}
            placeholder="081234567890"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="kota">Kota</Label>
          <Input id="kota" name="kota" defaultValue={profil.kota ?? ""} placeholder="Bandung" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tgl_lahir">Tanggal Lahir</Label>
          <Input
            id="tgl_lahir"
            name="tgl_lahir"
            type="date"
            defaultValue={profil.tgl_lahir ?? ""}
          />
        </div>
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

      <Button type="submit" disabled={sedang}>
        {sedang && <Loader2 className="size-4 animate-spin" />}
        Simpan Perubahan
      </Button>
    </form>
  );
}
