"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { simpanBatchAction, type HasilBatch } from "@/app/(admin)/admin/batch/actions";
import type { Batch } from "@/lib/database.types";

const gayaSelect =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function DialogBatch({
  kelas,
  pengajar,
  batch,
  pemicu,
  varian,
}: {
  kelas: { id: string; judul: string }[];
  pengajar: { id: string; nama: string }[];
  batch?: Batch;
  pemicu: React.ReactNode;
  varian?: "outline";
}) {
  const [buka, setBuka] = useState(false);
  const [hasil, kirim, sedang] = useActionState<HasilBatch, FormData>(
    async (sebelumnya, formData) => {
      const r = await simpanBatchAction(sebelumnya, formData);
      if (r?.sukses) {
        toast.success(r.sukses);
        setBuka(false);
      }
      return r;
    },
    undefined,
  );

  return (
    <Dialog open={buka} onOpenChange={setBuka}>
      <DialogTrigger className={buttonVariants({ size: "sm", variant: varian })}>
        {pemicu}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{batch ? "Ubah Rombel" : "Rombel Baru"}</DialogTitle>
          <DialogDescription>
            Rombel yang berstatus &ldquo;pendaftaran&rdquo; atau
            &ldquo;berjalan&rdquo; muncul sebagai pilihan saat santriwati mendaftar.
          </DialogDescription>
        </DialogHeader>

        <form action={kirim} className="space-y-4">
          {batch && <input type="hidden" name="id" value={batch.id} />}

          <div className="space-y-2">
            <Label htmlFor="course_id">Kelas</Label>
            <select
              id="course_id"
              name="course_id"
              required
              defaultValue={batch?.course_id ?? ""}
              className={gayaSelect}
            >
              <option value="">— pilih kelas —</option>
              {kelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.judul}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nama">Nama rombel</Label>
            <Input
              id="nama"
              name="nama"
              required
              defaultValue={batch?.nama ?? ""}
              placeholder="Tahsin Dasar — Rombel 5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ustadz_id">Ustadzah pembimbing</Label>
            <select
              id="ustadz_id"
              name="ustadz_id"
              defaultValue={batch?.ustadz_id ?? ""}
              className={gayaSelect}
            >
              <option value="">— belum ditentukan —</option>
              {pengajar.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nama}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Hanya pembimbing yang dipilih di sini yang bisa mengabsen dan
              menilai santriwati rombel ini.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tgl_mulai">Mulai</Label>
              <Input
                id="tgl_mulai"
                name="tgl_mulai"
                type="date"
                defaultValue={batch?.tgl_mulai ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tgl_selesai">Selesai</Label>
              <Input
                id="tgl_selesai"
                name="tgl_selesai"
                type="date"
                defaultValue={batch?.tgl_selesai ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kuota">Kuota santriwati</Label>
              <Input
                id="kuota"
                name="kuota"
                type="number"
                min={1}
                required
                defaultValue={batch?.kuota ?? 15}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={batch?.status ?? "draf"}
                className={gayaSelect}
              >
                <option value="draf">Draf</option>
                <option value="pendaftaran">Pendaftaran dibuka</option>
                <option value="berjalan">Sedang berjalan</option>
                <option value="selesai">Selesai</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jadwal_ringkas">Jadwal ringkas</Label>
            <Input
              id="jadwal_ringkas"
              name="jadwal_ringkas"
              defaultValue={batch?.jadwal_ringkas ?? ""}
              placeholder="Senin & Rabu, 19.30 WIB"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="catatan">Catatan internal</Label>
            <Textarea id="catatan" name="catatan" rows={2} defaultValue={batch?.catatan ?? ""} />
          </div>

          {hasil?.pesan && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{hasil.pesan}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBuka(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={sedang}>
              {sedang && <Loader2 className="size-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
