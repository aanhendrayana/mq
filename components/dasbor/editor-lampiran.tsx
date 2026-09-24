"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LABEL_TIPE_LAMPIRAN,
  PETUNJUK_TIPE_LAMPIRAN,
  TIPE_LAMPIRAN,
  type LampiranPertemuan,
} from "@/lib/lampiran";

const gayaSelect =
  "h-9 shrink-0 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60";

/**
 * Daftar lampiran (video YouTube, PDF, slide, audio, gambar) untuk satu
 * pertemuan — dipakai di dialog rencana pertemuan (admin) maupun dialog
 * sesi (ustadzah, kalau sesinya bukan salinan template).
 *
 * Komponen terkendali: parent memegang state-nya dan menaruh hasilnya di
 * input hidden `lampiran_json` (JSON.stringify) supaya ikut terkirim
 * bersama form biasa, tanpa server action terpisah.
 */
export function EditorLampiran({
  lampiran,
  setLampiran,
  disabled,
}: {
  lampiran: LampiranPertemuan[];
  setLampiran: (v: LampiranPertemuan[]) => void;
  disabled?: boolean;
}) {
  function ubah(i: number, patch: Partial<LampiranPertemuan>) {
    setLampiran(lampiran.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function hapus(i: number) {
    setLampiran(lampiran.filter((_, idx) => idx !== i));
  }
  function tambah() {
    setLampiran([...lampiran, { tipe: "youtube", url: "", nama: "" }]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Lampiran (opsional)</Label>
        {!disabled && (
          <Button type="button" size="sm" variant="outline" onClick={tambah}>
            <Plus className="size-3.5" />
            Tambah Lampiran
          </Button>
        )}
      </div>

      {lampiran.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Video YouTube, PDF, slide, audio, atau gambar yang bisa langsung
          dibuka (diputar) di aplikasi santriwati — bukan sekadar tautan unduh.
        </p>
      )}

      {lampiran.map((l, i) => (
        <div key={i} className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <select
              value={l.tipe}
              disabled={disabled}
              onChange={(e) =>
                ubah(i, { tipe: e.target.value as LampiranPertemuan["tipe"] })
              }
              className={gayaSelect}
            >
              {TIPE_LAMPIRAN.map((t) => (
                <option key={t} value={t}>
                  {LABEL_TIPE_LAMPIRAN[t]}
                </option>
              ))}
            </select>
            <Input
              value={l.nama}
              disabled={disabled}
              onChange={(e) => ubah(i, { nama: e.target.value })}
              placeholder="Nama lampiran, mis. Slide Bab 1"
              className="flex-1"
            />
            {!disabled && (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Hapus lampiran"
                onClick={() => hapus(i)}
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            )}
          </div>
          <Input
            value={l.url}
            disabled={disabled}
            onChange={(e) => ubah(i, { url: e.target.value })}
            placeholder="https://..."
          />
          <p className="text-xs text-muted-foreground">
            {PETUNJUK_TIPE_LAMPIRAN[l.tipe]}
          </p>
        </div>
      ))}
    </div>
  );
}
