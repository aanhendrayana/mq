"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  simpanDetailProgramAction,
  type HasilTemplate,
} from "@/app/(admin)/admin/program/[id]/actions";
import type { Program } from "@/lib/database.types";

export function FormDetailProgram({ program }: { program: Program }) {
  // Sukses dikabarkan lewat toast, bukan Alert di dalam form: lihat alasan
  // yang sama di FormKelas — form dipasang ulang lewat `key` di pemanggil.
  const [hasil, kirim, sedang] = useActionState<HasilTemplate, FormData>(
    async (sebelumnya, formData) => {
      const r = await simpanDetailProgramAction(sebelumnya, formData);
      if (r?.sukses) toast.success(r.sukses);
      return r;
    },
    undefined,
  );

  return (
    <form action={kirim} className="space-y-5">
      <input type="hidden" name="id" value={program.id} />

      <p className="text-sm text-muted-foreground">
        Isian di bawah ini dipakai bersama oleh <strong>kelas</strong> di
        bawah program &ldquo;{program.nama}&rdquo; — cukup diisi sekali di
        sini, kelas tidak perlu mengisi ulang.
      </p>

      <div className="space-y-2">
        <Label htmlFor="subjudul">Subjudul</Label>
        <Input
          id="subjudul"
          name="subjudul"
          defaultValue={program.subjudul ?? ""}
          placeholder="Satu kalimat penjelas yang muncul di kartu katalog"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="jenjang">Jenjang</Label>
          <Input
            id="jenjang"
            name="jenjang"
            defaultValue={program.jenjang ?? ""}
            placeholder="Dasar / Menengah / Jilid 3"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="durasi_pekan">Durasi (pekan)</Label>
          <Input
            id="durasi_pekan"
            name="durasi_pekan"
            type="number"
            min={1}
            defaultValue={program.durasi_pekan ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prasyarat">Prasyarat</Label>
        <Textarea
          id="prasyarat"
          name="prasyarat"
          rows={2}
          defaultValue={program.prasyarat ?? ""}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="harga">Harga (Rp)</Label>
          <Input
            id="harga"
            name="harga"
            type="number"
            min={0}
            required
            defaultValue={program.harga}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="harga_coret">Harga coret (Rp)</Label>
          <Input
            id="harga_coret"
            name="harga_coret"
            type="number"
            min={0}
            defaultValue={program.harga_coret ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deskripsi_lengkap">Deskripsi lengkap</Label>
        <Textarea
          id="deskripsi_lengkap"
          name="deskripsi_lengkap"
          rows={5}
          defaultValue={program.deskripsi_lengkap ?? ""}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="apa_yang_dipelajari">Yang akan dikuasai</Label>
          <Textarea
            id="apa_yang_dipelajari"
            name="apa_yang_dipelajari"
            rows={5}
            defaultValue={(program.apa_yang_dipelajari ?? []).join("\n")}
            placeholder="Satu poin per baris"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="untuk_siapa">Cocok untuk</Label>
          <Textarea
            id="untuk_siapa"
            name="untuk_siapa"
            rows={5}
            defaultValue={(program.untuk_siapa ?? []).join("\n")}
            placeholder="Satu poin per baris"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="thumbnail_url">URL gambar sampul</Label>
        <Input
          id="thumbnail_url"
          name="thumbnail_url"
          type="url"
          defaultValue={program.thumbnail_url ?? ""}
          placeholder="https://..."
        />
        <p className="text-xs text-muted-foreground">
          Masukkan URL gambar/thumbnail (misal dari CDN atau hosting berkas).
        </p>
      </div>

      {hasil?.pesan && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{hasil.pesan}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" size="lg" disabled={sedang}>
        {sedang && <Loader2 className="size-4 animate-spin" />}
        Simpan Perubahan
      </Button>
    </form>
  );
}
