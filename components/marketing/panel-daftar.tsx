"use client";

import { useActionState, useState } from "react";
import { AlertCircle, ArrowRight, CalendarClock, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { rupiah, tanggal } from "@/lib/format";
import { cn } from "@/lib/utils";
import { daftarKelasAction, type HasilDaftar } from "@/app/(marketing)/program/[slug]/actions";
import type { Batch, Course } from "@/lib/database.types";

export type RombelTersedia = Pick<
  Batch,
  "id" | "nama" | "tgl_mulai" | "jadwal_ringkas" | "kuota" | "status"
> & { sisa: number };

type Props = {
  kelas: Course & { slug: string; harga: number };
  rombel: RombelTersedia[];
  /** Status pengguna terhadap kelas ini, dihitung di server. */
  keadaan:
    | { jenis: "tamu" }
    | { jenis: "terdaftar" }
    | { jenis: "menunggu"; invoice: string }
    | { jenis: "belum" };
};

export function PanelDaftar({ kelas, rombel, keadaan }: Props) {
  const tersedia = rombel.filter((a) => a.sisa > 0);
  const [dipilih, setDipilih] = useState<string>(tersedia[0]?.id ?? "");
  const [hasil, kirim, sedangKirim] = useActionState<HasilDaftar, FormData>(
    daftarKelasAction,
    undefined,
  );

  if (keadaan.jenis === "terdaftar") {
    return (
      <TautanTombol href={`/belajar/${kelas.slug}`} size="lg" className="h-12 w-full text-base">
        Lanjutkan Belajar
        <ArrowRight className="size-4" />
      </TautanTombol>
    );
  }

  if (keadaan.jenis === "menunggu") {
    return (
      <div className="space-y-3">
        <Alert>
          <AlertCircle className="size-4" />
          <AlertDescription>
            Anda sudah punya tagihan untuk kelas ini yang belum selesai.
          </AlertDescription>
        </Alert>
        <TautanTombol
          href={`/belajar/tagihan/${keadaan.invoice}`}
          size="lg"
          className="h-12 w-full text-base"
        >
          Lihat Tagihan
        </TautanTombol>
      </div>
    );
  }

  return (
    <form action={kirim} className="space-y-4">
      <input type="hidden" name="course_id" value={kelas.id} />
      <input type="hidden" name="slug" value={kelas.slug} />
      <input type="hidden" name="batch_id" value={dipilih} />

      {tersedia.length > 0 ? (
        <fieldset className="space-y-2">
          <Label className="text-sm font-medium">Pilih rombel</Label>
          <div className="space-y-2">
            {tersedia.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setDipilih(a.id)}
                aria-pressed={dipilih === a.id}
                className={cn(
                  "w-full rounded-lg border p-3 text-left transition-colors",
                  dipilih === a.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:border-primary/40 hover:bg-accent/50",
                )}
              >
                <span className="block text-sm font-medium">{a.nama}</span>
                <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  {a.tgl_mulai && (
                    <span className="flex items-center gap-1">
                      <CalendarClock className="size-3" />
                      Mulai {tanggal(a.tgl_mulai)}
                    </span>
                  )}
                  {a.jadwal_ringkas && <span>{a.jadwal_ringkas}</span>}
                  <span className="flex items-center gap-1">
                    <Users className="size-3" />
                    Sisa {a.sisa} kursi
                  </span>
                </span>
              </button>
            ))}
          </div>
        </fieldset>
      ) : (
        <Alert>
          <AlertCircle className="size-4" />
          <AlertDescription>
            Belum ada rombel yang dibuka. Anda tetap bisa mendaftar untuk
            mengakses materi video; jadwal halaqah akan diinfokan admin.
          </AlertDescription>
        </Alert>
      )}

      {hasil?.pesan && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{hasil.pesan}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" size="lg" disabled={sedangKirim} className="h-12 w-full text-base">
        {sedangKirim && <Loader2 className="size-4 animate-spin" />}
        {keadaan.jenis === "tamu" ? "Masuk & Daftar" : "Daftar Sekarang"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Pembayaran melalui transfer bank, diverifikasi admin maksimal 1×24 jam.
        Total {rupiah(kelas.harga)} + kode unik.
      </p>
    </form>
  );
}
