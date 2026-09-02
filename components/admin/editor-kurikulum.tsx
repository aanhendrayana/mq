"use client";

import { useActionState, useState, useTransition } from "react";
import {
  AlertCircle,
  Eye,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  hapusModulAction,
  hapusPelajaranAction,
  simpanModulAction,
  simpanPelajaranAction,
  type HasilAdmin,
} from "@/app/(admin)/admin/kelas/actions";
import { jamTayang } from "@/lib/format";
import type { Lesson, Modul } from "@/lib/database.types";

export type BabAdmin = Modul & { pelajaran: Lesson[] };

/* ------------------------------------------------------------ Dialog bab --- */

function DialogModul({
  courseId,
  modul,
  urutanBerikut,
  buka,
  setBuka,
}: {
  courseId: string;
  modul?: Modul;
  urutanBerikut: number;
  buka: boolean;
  setBuka: (v: boolean) => void;
}) {
  const [hasil, kirim, sedang] = useActionState<HasilAdmin, FormData>(
    async (sebelumnya, formData) => {
      const r = await simpanModulAction(sebelumnya, formData);
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
          <DialogTitle>{modul ? "Ubah Bab" : "Tambah Bab"}</DialogTitle>
          <DialogDescription>
            Bab mengelompokkan pelajaran dan tampil di kurikulum halaman penjualan.
          </DialogDescription>
        </DialogHeader>

        <form action={kirim} className="space-y-4">
          <input type="hidden" name="course_id" value={courseId} />
          {modul && <input type="hidden" name="id" value={modul.id} />}

          <div className="grid grid-cols-[90px_1fr] gap-4">
            <div className="space-y-2">
              <Label htmlFor="urutan-bab">Urutan</Label>
              <Input
                id="urutan-bab"
                name="urutan"
                type="number"
                min={0}
                required
                defaultValue={modul?.urutan ?? urutanBerikut}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="judul-bab">Judul bab</Label>
              <Input id="judul-bab" name="judul" required defaultValue={modul?.judul ?? ""} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ringkasan-bab">Ringkasan</Label>
            <Textarea
              id="ringkasan-bab"
              name="ringkasan"
              rows={2}
              defaultValue={modul?.ringkasan ?? ""}
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

/* ------------------------------------------------------ Dialog pelajaran --- */

function DialogPelajaran({
  courseId,
  moduleId,
  pelajaran,
  urutanBerikut,
  buka,
  setBuka,
}: {
  courseId: string;
  moduleId: string;
  pelajaran?: Lesson;
  urutanBerikut: number;
  buka: boolean;
  setBuka: (v: boolean) => void;
}) {
  const [hasil, kirim, sedang] = useActionState<HasilAdmin, FormData>(
    async (sebelumnya, formData) => {
      const r = await simpanPelajaranAction(sebelumnya, formData);
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{pelajaran ? "Ubah Pelajaran" : "Tambah Pelajaran"}</DialogTitle>
          <DialogDescription>
            Tempel URL YouTube apa pun — sistem mengambil ID videonya sendiri.
          </DialogDescription>
        </DialogHeader>

        <form action={kirim} className="space-y-4">
          <input type="hidden" name="course_id" value={courseId} />
          <input type="hidden" name="module_id" value={moduleId} />
          {pelajaran && <input type="hidden" name="id" value={pelajaran.id} />}

          <div className="grid grid-cols-[90px_1fr] gap-4">
            <div className="space-y-2">
              <Label htmlFor="urutan-pel">Urutan</Label>
              <Input
                id="urutan-pel"
                name="urutan"
                type="number"
                min={0}
                required
                defaultValue={pelajaran?.urutan ?? urutanBerikut}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="judul-pel">Judul pelajaran</Label>
              <Input
                id="judul-pel"
                name="judul"
                required
                defaultValue={pelajaran?.judul ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug-pel">Slug URL</Label>
            <Input
              id="slug-pel"
              name="slug"
              defaultValue={pelajaran?.slug ?? ""}
              placeholder="dikosongkan = dibuat dari judul"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipe-pel">Tipe</Label>
              <select
                id="tipe-pel"
                name="tipe"
                defaultValue={pelajaran?.tipe ?? "video"}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="video">Video</option>
                <option value="teks">Teks / bacaan</option>
                <option value="audio">Audio</option>
                <option value="tugas">Tugas</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider-pel">Penyedia video</Label>
              <select
                id="provider-pel"
                name="video_provider"
                defaultValue={pelajaran?.video_provider ?? "youtube"}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="youtube">YouTube</option>
                <option value="bunny">Bunny.net (belum aktif)</option>
                <option value="supabase">Supabase Storage (belum aktif)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-pel">URL atau ID video</Label>
            <Input
              id="video-pel"
              name="video_id"
              defaultValue={pelajaran?.video_id ?? ""}
              placeholder="https://youtu.be/xxxxxxxxxxx"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="durasi-pel">Durasi (menit)</Label>
            <Input
              id="durasi-pel"
              name="durasi_menit"
              type="number"
              min={0}
              step="0.5"
              required
              defaultValue={pelajaran ? pelajaran.durasi_detik / 60 : 0}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="konten-pel">Catatan pelajaran</Label>
            <Textarea
              id="konten-pel"
              name="konten_md"
              rows={4}
              defaultValue={pelajaran?.konten_md ?? ""}
            />
          </div>

          <label className="flex items-start gap-3 rounded-lg border p-3">
            <Checkbox
              name="is_preview"
              value="true"
              defaultChecked={pelajaran?.is_preview ?? false}
            />
            <span>
              <span className="block text-sm font-medium">Jadikan pratinjau gratis</span>
              <span className="block text-xs text-muted-foreground">
                Bisa ditonton siapa saja tanpa membeli. Pakai untuk 1–2 pelajaran
                pembuka sebagai contoh kualitas materi.
              </span>
            </span>
          </label>

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

export function EditorKurikulum({
  courseId,
  bab,
}: {
  courseId: string;
  bab: BabAdmin[];
}) {
  const [dialogBab, setDialogBab] = useState<{ buka: boolean; modul?: Modul }>({
    buka: false,
  });
  const [dialogPel, setDialogPel] = useState<{
    buka: boolean;
    moduleId: string;
    pelajaran?: Lesson;
    urutan: number;
  }>({ buka: false, moduleId: "", urutan: 0 });
  const [sedangHapus, mulaiHapus] = useTransition();

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
          Belum ada bab. Tambahkan bab pertama, lalu isi pelajarannya.
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
                  onClick={() => setDialogBab({ buka: true, modul: b })}
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
                      const h = await hapusModulAction(b.id, courseId);
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
              {b.pelajaran.length === 0 ? (
                <li className="p-4 text-center text-xs text-muted-foreground">
                  Belum ada pelajaran di bab ini.
                </li>
              ) : (
                b.pelajaran.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 p-3">
                    {p.tipe === "teks" ? (
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <Video className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm">{p.judul}</span>

                    {p.is_preview && (
                      <Badge variant="secondary" className="gap-1 text-[11px]">
                        <Eye className="size-3" />
                        Pratinjau
                      </Badge>
                    )}
                    {!p.video_id && p.tipe === "video" && (
                      <Badge variant="outline" className="border-warning/40 bg-warning/15 text-[11px]">
                        Video kosong
                      </Badge>
                    )}
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {p.durasi_detik ? jamTayang(p.durasi_detik) : "—"}
                    </span>

                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Ubah pelajaran"
                      onClick={() =>
                        setDialogPel({
                          buka: true,
                          moduleId: b.id,
                          pelajaran: p,
                          urutan: p.urutan,
                        })
                      }
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Hapus pelajaran"
                      disabled={sedangHapus}
                      onClick={() =>
                        mulaiHapus(async () => {
                          const h = await hapusPelajaranAction(p.id, courseId);
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
                setDialogPel({
                  buka: true,
                  moduleId: b.id,
                  urutan: b.pelajaran.length + 1,
                })
              }
            >
              <Plus className="size-4" />
              Tambah Pelajaran
            </Button>
          </Card>
        ))
      )}

      <DialogModul
        courseId={courseId}
        modul={dialogBab.modul}
        urutanBerikut={bab.length + 1}
        buka={dialogBab.buka}
        setBuka={(v) => setDialogBab((s) => ({ ...s, buka: v }))}
      />

      {dialogPel.moduleId && (
        <DialogPelajaran
          key={dialogPel.pelajaran?.id ?? `baru-${dialogPel.moduleId}`}
          courseId={courseId}
          moduleId={dialogPel.moduleId}
          pelajaran={dialogPel.pelajaran}
          urutanBerikut={dialogPel.urutan}
          buka={dialogPel.buka}
          setBuka={(v) => setDialogPel((s) => ({ ...s, buka: v }))}
        />
      )}
    </div>
  );
}
