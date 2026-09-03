"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ASPEK_NILAI, predikat } from "@/lib/konstanta";
import { cn } from "@/lib/utils";
import {
  simpanPenilaianAction,
  type HasilAksi,
} from "@/app/(pengajar)/pengajar/batch/[id]/actions";
import type { StatusKehadiran } from "@/lib/database.types";

export type BarisSantri = {
  santri_id: string;
  enrollment_id: string;
  nama: string;
  status: StatusKehadiran;
  nilai_makhraj: number;
  nilai_tajwid: number;
  nilai_kelancaran: number;
  nilai_adab: number;
  materi: string;
  catatan_ustadz: string;
  /** True bila baris ini sudah pernah dinilai sebelumnya. */
  sudahDinilai: boolean;
};

const PILIHAN_HADIR: { nilai: StatusKehadiran; label: string; kelas: string }[] = [
  { nilai: "hadir", label: "Hadir", kelas: "data-[aktif=true]:bg-success data-[aktif=true]:text-white" },
  { nilai: "izin", label: "Izin", kelas: "data-[aktif=true]:bg-warning data-[aktif=true]:text-white" },
  { nilai: "sakit", label: "Sakit", kelas: "data-[aktif=true]:bg-warning data-[aktif=true]:text-white" },
  { nilai: "alpa", label: "Alpa", kelas: "data-[aktif=true]:bg-destructive data-[aktif=true]:text-white" },
];

export function TabelPenilaian({
  sesiId,
  batchId,
  materiSesi,
  awal,
}: {
  sesiId: string;
  batchId: string;
  materiSesi: string;
  awal: BarisSantri[];
}) {
  const [baris, setBaris] = useState<BarisSantri[]>(awal);
  const [disentuh, setDisentuh] = useState<Set<string>>(
    new Set(awal.filter((b) => b.sudahDinilai).map((b) => b.santri_id)),
  );
  const [hasil, kirim, sedang] = useActionState<HasilAksi, FormData>(
    simpanPenilaianAction,
    undefined,
  );

  function ubah(id: string, patch: Partial<BarisSantri>) {
    setBaris((s) => s.map((b) => (b.santri_id === id ? { ...b, ...patch } : b)));
    if (
      Object.keys(patch).some((k) => k.startsWith("nilai_") || k === "catatan_ustadz")
    ) {
      setDisentuh((s) => new Set(s).add(id));
    }
  }

  const muatan = baris.map((b) => ({
    santri_id: b.santri_id,
    enrollment_id: b.enrollment_id,
    status: b.status,
    nilai_makhraj: b.nilai_makhraj,
    nilai_tajwid: b.nilai_tajwid,
    nilai_kelancaran: b.nilai_kelancaran,
    nilai_adab: b.nilai_adab,
    materi: b.materi || materiSesi,
    catatan_ustadz: b.catatan_ustadz,
    nilai_diisi: disentuh.has(b.santri_id),
  }));

  return (
    <form action={kirim} className="space-y-4">
      <input type="hidden" name="sesi_id" value={sesiId} />
      <input type="hidden" name="batch_id" value={batchId} />
      <input type="hidden" name="baris" value={JSON.stringify(muatan)} />

      {baris.map((b) => {
        const rata =
          (b.nilai_makhraj + b.nilai_tajwid + b.nilai_kelancaran + b.nilai_adab) / 4;
        const dinilai = disentuh.has(b.santri_id) && b.status === "hadir";

        return (
          <Card key={b.santri_id} className="gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-heading font-semibold">{b.nama}</h3>

              <div className="flex gap-1" role="group" aria-label={`Kehadiran ${b.nama}`}>
                {PILIHAN_HADIR.map((p) => (
                  <button
                    key={p.nilai}
                    type="button"
                    data-aktif={b.status === p.nilai}
                    onClick={() => ubah(b.santri_id, { status: p.nilai })}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent",
                      p.kelas,
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {b.status === "hadir" ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {ASPEK_NILAI.map((a) => (
                    <div key={a.kunci} className="space-y-1.5">
                      <label
                        htmlFor={`${b.santri_id}-${a.kunci}`}
                        className="text-xs font-medium"
                        title={a.keterangan}
                      >
                        {a.label}
                      </label>
                      <Input
                        id={`${b.santri_id}-${a.kunci}`}
                        type="number"
                        min={0}
                        max={100}
                        inputMode="numeric"
                        value={b[a.kunci]}
                        onChange={(e) =>
                          ubah(b.santri_id, {
                            [a.kunci]: Math.max(
                              0,
                              Math.min(100, Number(e.target.value) || 0),
                            ),
                          } as Partial<BarisSantri>)
                        }
                        className="tabular-nums"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor={`${b.santri_id}-materi`} className="text-xs font-medium">
                      Materi setoran
                    </label>
                    <Input
                      id={`${b.santri_id}-materi`}
                      value={b.materi}
                      placeholder={materiSesi || "QS. An-Naba 1–20"}
                      onChange={(e) => ubah(b.santri_id, { materi: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor={`${b.santri_id}-catatan`} className="text-xs font-medium">
                      Catatan untuk santriwati
                    </label>
                    <Textarea
                      id={`${b.santri_id}-catatan`}
                      rows={2}
                      value={b.catatan_ustadz}
                      placeholder="Mis. huruf ط masih tertukar dengan ت, perbanyak latihan."
                      onChange={(e) => ubah(b.santri_id, { catatan_ustadz: e.target.value })}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {dinilai ? (
                    <>
                      Rata-rata{" "}
                      <span className="font-semibold tabular-nums text-foreground">
                        {rata.toFixed(1)}
                      </span>{" "}
                      · {predikat(rata)}
                    </>
                  ) : (
                    "Ubah salah satu nilai untuk menyimpan penilaian santriwati ini."
                  )}
                </p>
              </>
            ) : (
              <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                Santriwati tidak hadir, jadi tidak ada nilai setoran yang disimpan —
                rata-rata rapornya tidak akan terpengaruh.
              </p>
            )}
          </Card>
        );
      })}

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

      <div className="sticky bottom-4 flex justify-end">
        <Button type="submit" size="lg" disabled={sedang} className="h-11 shadow-lg">
          {sedang ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Simpan Absensi &amp; Nilai
        </Button>
      </div>
    </form>
  );
}
