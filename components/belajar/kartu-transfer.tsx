"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { angka } from "@/lib/format";
import type { Rekening } from "@/lib/pengaturan";

function BarisSalin({ label, nilai, tebal }: { label: string; nilai: string; tebal?: boolean }) {
  const [tersalin, setTersalin] = useState(false);

  async function salin() {
    try {
      await navigator.clipboard.writeText(nilai);
      setTersalin(true);
      setTimeout(() => setTersalin(false), 2000);
    } catch {
      // Clipboard bisa ditolak browser (mis. konteks tidak aman). Diamkan saja:
      // nomornya tetap terbaca dan bisa disalin manual.
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <span
          className={
            tebal
              ? "font-heading text-lg font-bold tabular-nums text-primary"
              : "font-medium tabular-nums"
          }
        >
          {nilai}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={salin}
          aria-label={`Salin ${label}`}
        >
          {tersalin ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
        </Button>
      </span>
    </div>
  );
}

export function KartuTransfer({
  rekening,
  total,
}: {
  rekening: Rekening;
  total: number;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-heading mb-2 font-semibold">Rekening tujuan</h3>
      <BarisSalin label="Bank" nilai={rekening.bank} />
      <BarisSalin label="Nomor rekening" nilai={rekening.nomor} />
      <BarisSalin label="Atas nama" nilai={rekening.atas_nama} />
      <BarisSalin label="Jumlah transfer" nilai={`Rp ${angka(total)}`} tebal />

      <p className="mt-4 rounded-lg bg-warning/10 p-3 text-xs leading-relaxed text-foreground">
        <strong>Transfer tepat sampai digit terakhir.</strong> Tiga angka
        terakhir adalah kode unik Anda — itulah yang dipakai admin untuk
        mencocokkan pembayaran Anda di mutasi rekening. Nominal yang dibulatkan
        akan memperlambat verifikasi.
      </p>
    </div>
  );
}
