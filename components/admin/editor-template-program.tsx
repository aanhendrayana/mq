"use client";

import { useActionState, useState, useTransition } from "react";
import { AlertCircle, CalendarDays, Loader2, Paperclip, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditorLampiran } from "@/components/dasbor/editor-lampiran";
import {
  hapusTemplateBabAction,
  hapusTemplatePertemuanAction,
  simpanTemplateBabAction,
  simpanTemplatePertemuanAction,
  type HasilTemplate,
} from "@/app/(admin)/admin/program/[id]/actions";
import type { TemplateBab, TemplatePertemuan } from "@/lib/database.types";
import type { LampiranPertemuan } from "@/lib/lampiran";

export type BabTemplate = TemplateBab & { pertemuan: TemplatePertemuan[] };

/* ------------------------------------------------------------ Dialog bab --- */

function DialogBab({
  programId,
  bab,
  urutanBerikut,
  buka,
  setBuka,
}: {
  programId: string;
  bab?: TemplateBab;
  urutanBerikut: number;
  buka: boolean;
  setBuka: (v: boolean) => void;
}) {
  const [hasil, kirim, sedang] = useActionState<HasilTemplate, FormData>(
    async (sebelumnya, formData) => {
      const r = await simpanTemplateBabAction(sebelumnya, formData);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{bab ? "Ubah Bab" : "Tambah Bab"}</DialogTitle>
          <DialogDescription>
            Bab mengelompokkan rencana pertemuan — sama seperti bab mengelompokkan
            pelajaran pada materi video.
          </DialogDescription>
        </DialogHeader>

        <form action={kirim} className="space-y-4">
          <input type="hidden" name="program_id" value={programId} />
          {bab && <input type="hidden" name="id" value={bab.id} />}

          <div className="grid grid-cols-[90px_1fr] gap-4">
            <div className="space-y-2">
              <Label htmlFor="urutan-bab">Urutan</Label>
              <Input
                id="urutan-bab"
                name="urutan"
                type="number"
                min={0}
                required
                defaultValue={bab?.urutan ?? urutanBerikut}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="judul-bab">Judul bab</Label>
              <Input id="judul-bab" name="judul" required defaultValue={bab?.judul ?? ""} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ringkasan-bab">Ringkasan</Label>
            <Textarea
              id="ringkasan-bab"
              name="ringkasan"
              rows={2}
              defaultValue={bab?.ringkasan ?? ""}
            />
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

/* -------------------------------------------------------- Dialog pertemuan --- */

function DialogPertemuan({
  programId,
  babId,
  pertemuan,
  pertemuanBerikut,
  buka,
  setBuka,
}: {
  programId: string;
  babId: string;
  pertemuan?: TemplatePertemuan;
  pertemuanBerikut: number;
  buka: boolean;
  setBuka: (v: boolean) => void;
}) {
  const [hasil, kirim, sedang] = useActionState<HasilTemplate, FormData>(
    async (sebelumnya, formData) => {
      const r = await simpanTemplatePertemuanAction(sebelumnya, formData);
      if (r?.sukses) {
        toast.success(r.sukses);
        setBuka(false);
      }
      return r;
    },
    undefined,
  );
  const [lampiran, setLampiran] = useState<LampiranPertemuan[]>(pertemuan?.lampiran ?? []);

  return (
    <Dialog open={buka} onOpenChange={setBuka}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{pertemuan ? "Ubah Rencana Pertemuan" : "Tambah Rencana Pertemuan"}</DialogTitle>
          <DialogDescription>
            Berlaku untuk semua kelas & rombel di bawah program ini, begitu
            admin menekan &ldquo;Terapkan Template&rdquo; pada rombelnya.
          </DialogDescription>
        </DialogHeader>

        <form action={kirim} className="space-y-4">
          <input type="hidden" name="program_id" value={programId} />
          <input type="hidden" name="bab_id" value={babId} />
          {pertemuan && <input type="hidden" name="id" value={pertemuan.id} />}

          <div className="grid grid-cols-[100px_1fr] gap-4">
            <div className="space-y-2">
              <Label htmlFor="pertemuan_ke">Ke-</Label>
              <Input
                id="pertemuan_ke"
                name="pertemuan_ke"
                type="number"
                min={1}
                required
                defaultValue={pertemuan?.pertemuan_ke ?? pertemuanBerikut}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="judul">Judul pertemuan</Label>
              <Input
                id="judul"
                name="judul"
                required
                defaultValue={pertemuan?.judul ?? ""}
                placeholder="Makhraj huruf halqi"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="materi">Materi</Label>
            <Input
              id="materi"
              name="materi"
              defaultValue={pertemuan?.materi ?? ""}
              placeholder="QS. An-Naba 1–20"
            />
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
              defaultValue={pertemuan?.durasi_menit ?? 60}
              className="max-w-32"
            />
          </div>

          <input type="hidden" name="lampiran_json" value={JSON.stringify(lampiran)} />
          <EditorLampiran lampiran={lampiran} setLampiran={setLampiran} />

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

/* --------------------------------------------------------------- Editor ---- */

export function EditorTemplateProgram({
  programId,
  bab,
}: {
  programId: string;
  bab: BabTemplate[];
}) {
  const [dialogBab, setDialogBab] = useState<{ buka: boolean; bab?: TemplateBab }>({
    buka: false,
  });
  const [dialogPert, setDialogPert] = useState<{
    buka: boolean;
    babId: string;
    pertemuan?: TemplatePertemuan;
    urutan: number;
  }>({ buka: false, babId: "", urutan: 0 });
  const [sedangHapus, mulaiHapus] = useTransition();

  // Nomor pertemuan wajib unik SE-PROGRAM (bukan cuma se-bab), karena inilah
  // yang jadi pertemuan_ke sesi_halaqah nanti — jadi "berikutnya" dihitung
  // lintas semua bab, bukan cuma bab yang sedang dibuka.
  const pertemuanBerikut = Math.max(
    1,
    ...bab.flatMap((b) => b.pertemuan.map((p) => p.pertemuan_ke + 1)),
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogBab({ buka: true })}>
          <Plus className="size-4" />
          Tambah Bab
        </Button>
      </div>

      {bab.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Belum ada bab. Tambahkan bab pertama, lalu isi rencana pertemuannya.
        </Card>
      ) : (
        bab.map((b, i) => (
          <Card key={b.id} className="gap-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Bab {i + 1}</p>
                <h3 className="font-heading font-semibold">{b.judul}</h3>
                {b.ringkasan && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{b.ringkasan}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Ubah bab"
                  onClick={() => setDialogBab({ buka: true, bab: b })}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Hapus bab"
                  disabled={sedangHapus}
                  onClick={() =>
                    mulaiHapus(async () => {
                      const h = await hapusTemplateBabAction(b.id, programId);
                      if (h?.pesan) toast.error(h.pesan);
                      else if (h?.sukses) toast.success(h.sukses);
                    })
                  }
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            </div>

            <ul className="divide-y rounded-lg border">
              {b.pertemuan.length === 0 ? (
                <li className="p-4 text-center text-xs text-muted-foreground">
                  Belum ada rencana pertemuan di bab ini.
                </li>
              ) : (
                b.pertemuan.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 p-3">
                    <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      Pertemuan {p.pertemuan_ke}: {p.judul}
                    </span>
                    {p.materi && (
                      <span className="max-w-40 truncate text-xs text-muted-foreground">
                        {p.materi}
                      </span>
                    )}
                    {p.lampiran.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Paperclip className="size-3.5" />
                        {p.lampiran.length}
                      </span>
                    )}
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {p.durasi_menit} menit
                    </span>

                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Ubah pertemuan"
                      onClick={() =>
                        setDialogPert({
                          buka: true,
                          babId: b.id,
                          pertemuan: p,
                          urutan: p.pertemuan_ke,
                        })
                      }
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Hapus pertemuan"
                      disabled={sedangHapus}
                      onClick={() =>
                        mulaiHapus(async () => {
                          const h = await hapusTemplatePertemuanAction(p.id, programId);
                          if (h?.pesan) toast.error(h.pesan);
                          else if (h?.sukses) toast.success(h.sukses);
                        })
                      }
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </li>
                ))
              )}
            </ul>

            <Button
              size="sm"
              variant="outline"
              className="w-fit"
              onClick={() =>
                setDialogPert({ buka: true, babId: b.id, urutan: pertemuanBerikut })
              }
            >
              <Plus className="size-4" />
              Tambah Pertemuan
            </Button>
          </Card>
        ))
      )}

      <DialogBab
        programId={programId}
        bab={dialogBab.bab}
        urutanBerikut={bab.length + 1}
        buka={dialogBab.buka}
        setBuka={(v) => setDialogBab((s) => ({ ...s, buka: v }))}
      />

      {dialogPert.babId && (
        <DialogPertemuan
          key={dialogPert.pertemuan?.id ?? `baru-${dialogPert.babId}`}
          programId={programId}
          babId={dialogPert.babId}
          pertemuan={dialogPert.pertemuan}
          pertemuanBerikut={dialogPert.urutan}
          buka={dialogPert.buka}
          setBuka={(v) => setDialogPert((s) => ({ ...s, buka: v }))}
        />
      )}
    </div>
  );
}
