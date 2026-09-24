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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EditorLampiran } from "@/components/dasbor/editor-lampiran";
import { simpanSesiAction, type HasilAksi } from "@/app/(pengajar)/pengajar/batch/[id]/actions";
import type { SesiHalaqah } from "@/lib/database.types";
import type { LampiranPertemuan } from "@/lib/lampiran";

/** Pecah timestamptz menjadi tanggal & jam Jakarta untuk mengisi form. */
function pecahWaktuJakarta(iso: string): { tanggal: string; jam: string } {
  const f = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  // Locale "sv-SE" menghasilkan "2026-09-03 19:30" — format yang langsung
  // cocok dengan input type="date" dan type="time".
  const [tanggal, jam] = f.format(new Date(iso)).split(" ");
  return { tanggal, jam };
}

export function DialogSesi({
  batchId,
  pertemuanBerikut,
  sesi,
  /** true bila sesi ini salinan template & pengguna bukan admin/Ummi Rifa —
   * judul, materi, dan nomor urut terkunci, cuma jadwal & link yang boleh diubah. */
  terkunci = false,
  pemicu,
  varian,
}: {
  batchId: string;
  pertemuanBerikut: number;
  sesi?: SesiHalaqah;
  terkunci?: boolean;
  pemicu: React.ReactNode;
  varian?: "outline";
}) {
  const [buka, setBuka] = useState(false);
  // Dialog ditutup di dalam aksi, bukan lewat useEffect yang mengintai hasil:
  // menutupnya di sini adalah reaksi terhadap satu peristiwa yang jelas, dan
  // tidak memicu render berantai.
  const [hasil, kirim, sedang] = useActionState<HasilAksi, FormData>(
    async (sebelumnya, formData) => {
      const r = await simpanSesiAction(sebelumnya, formData);
      if (r?.sukses) {
        toast.success(r.sukses);
        setBuka(false);
      }
      return r;
    },
    undefined,
  );

  const awal = sesi ? pecahWaktuJakarta(sesi.mulai_at) : { tanggal: "", jam: "19:30" };
  const [lampiran, setLampiran] = useState<LampiranPertemuan[]>(sesi?.lampiran ?? []);

  return (
    <Dialog open={buka} onOpenChange={setBuka}>
      <DialogTrigger className={buttonVariants({ size: "sm", variant: varian })}>
        {pemicu}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{sesi ? "Ubah Pertemuan" : "Tambah Pertemuan"}</DialogTitle>
          <DialogDescription>
            {terkunci
              ? "Judul & materi mengikuti template program, tidak bisa diubah dari sini. Anda hanya mengatur jadwal dan link vicon."
              : "Waktu yang Anda isi dibaca sebagai Waktu Indonesia Barat (WIB)."}
          </DialogDescription>
        </DialogHeader>

        <form action={kirim} className="space-y-4">
          <input type="hidden" name="batch_id" value={batchId} />
          {sesi && <input type="hidden" name="sesi_id" value={sesi.id} />}

          <div className="grid grid-cols-[100px_1fr] gap-4">
            <div className="space-y-2">
              <Label htmlFor="pertemuan_ke">Ke-</Label>
              <Input
                id="pertemuan_ke"
                name="pertemuan_ke"
                type="number"
                min={1}
                required
                readOnly={terkunci}
                className={terkunci ? "bg-muted text-muted-foreground" : undefined}
                defaultValue={sesi?.pertemuan_ke ?? pertemuanBerikut}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="judul">Judul pertemuan</Label>
              <Input
                id="judul"
                name="judul"
                required
                readOnly={terkunci}
                className={terkunci ? "bg-muted text-muted-foreground" : undefined}
                defaultValue={sesi?.judul ?? ""}
                placeholder="Setoran makhraj huruf halqi"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal</Label>
              <Input id="tanggal" name="tanggal" type="date" required defaultValue={awal.tanggal} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jam">Jam (WIB)</Label>
              <Input id="jam" name="jam" type="time" required defaultValue={awal.jam} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durasi_menit">Durasi (menit)</Label>
              <Input
                id="durasi_menit"
                name="durasi_menit"
                type="number"
                min={15}
                max={300}
                required
                defaultValue={sesi?.durasi_menit ?? 60}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link_meeting">Tautan pertemuan</Label>
            <Input
              id="link_meeting"
              name="link_meeting"
              type="url"
              defaultValue={sesi?.link_meeting ?? ""}
              placeholder="https://meet.google.com/abc-defg-hij"
            />
            <p className="text-xs text-muted-foreground">
              Tautan baru terlihat santriwati 15 menit sebelum pertemuan dimulai.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="materi">Materi setoran</Label>
            <Input
              id="materi"
              name="materi"
              readOnly={terkunci}
              className={terkunci ? "bg-muted text-muted-foreground" : undefined}
              defaultValue={sesi?.materi ?? ""}
              placeholder="QS. An-Naba 1–20"
            />
          </div>

          <input type="hidden" name="lampiran_json" value={JSON.stringify(lampiran)} />
          <EditorLampiran lampiran={lampiran} setLampiran={setLampiran} disabled={terkunci} />

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
