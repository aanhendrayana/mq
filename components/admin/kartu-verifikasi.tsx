"use client";

import { useActionState, useState } from "react";
import {
  AlertCircle,
  Check,
  ExternalLink,
  FileImage,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { StatusPesananBadge } from "@/components/belajar/status-pesanan";
import {
  setujuiPesananAction,
  tolakPesananAction,
  urlBuktiAction,
  type HasilVerifikasi,
} from "@/app/(admin)/admin/pembayaran/actions";
import { angka, rupiah, tanggalJam } from "@/lib/format";
import type { StatusPesanan } from "@/lib/database.types";

export type PesananVerifikasi = {
  id: string;
  nomor_invoice: string;
  status: StatusPesanan;
  harga: number;
  kode_unik: number;
  total_bayar: number;
  bukti_url: string | null;
  nama_pengirim: string | null;
  catatan_santri: string | null;
  alasan_tolak: string | null;
  dibuat_at: string;
  nama_santri: string;
  no_hp: string | null;
  judul_kelas: string;
  nama_angkatan: string | null;
};

export function KartuVerifikasi({ pesanan }: { pesanan: PesananVerifikasi }) {
  const [urlBukti, setUrlBukti] = useState<string | null>(null);
  const [memuatBukti, setMemuatBukti] = useState(false);
  const [dialogTolak, setDialogTolak] = useState(false);

  const [, kirimSetuju, sedangSetuju] = useActionState<HasilVerifikasi, FormData>(
    async (sebelumnya, formData) => {
      const r = await setujuiPesananAction(sebelumnya, formData);
      if (r?.sukses) toast.success(r.sukses);
      if (r?.pesan) toast.error(r.pesan);
      return r;
    },
    undefined,
  );
  const [hasilTolak, kirimTolak, sedangTolak] = useActionState<HasilVerifikasi, FormData>(
    async (sebelumnya, formData) => {
      const r = await tolakPesananAction(sebelumnya, formData);
      if (r?.sukses) {
        toast.success(r.sukses);
        setDialogTolak(false);
      }
      return r;
    },
    undefined,
  );

  async function lihatBukti() {
    if (!pesanan.bukti_url) return;
    setMemuatBukti(true);
    const url = await urlBuktiAction(pesanan.bukti_url);
    setMemuatBukti(false);
    if (url) setUrlBukti(url);
    else toast.error("Gagal membuka bukti transfer.");
  }

  return (
    <Card className="gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading font-semibold">{pesanan.nama_santri}</h3>
          <p className="text-sm text-muted-foreground">{pesanan.judul_kelas}</p>
          {pesanan.nama_angkatan && (
            <p className="text-xs text-muted-foreground">{pesanan.nama_angkatan}</p>
          )}
        </div>
        <StatusPesananBadge status={pesanan.status} />
      </div>

      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Invoice</dt>
          <dd className="font-mono text-xs">{pesanan.nomor_invoice}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Dibuat</dt>
          <dd className="text-right text-xs">{tanggalJam(pesanan.dibuat_at)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Harga + kode unik</dt>
          <dd className="tabular-nums">
            {angka(pesanan.harga)} + {pesanan.kode_unik}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Harus masuk</dt>
          <dd className="font-semibold tabular-nums text-primary">
            {rupiah(pesanan.total_bayar)}
          </dd>
        </div>
        {pesanan.nama_pengirim && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Pengirim</dt>
            <dd className="text-right">{pesanan.nama_pengirim}</dd>
          </div>
        )}
        {pesanan.no_hp && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">WhatsApp</dt>
            <dd>
              <a
                href={`https://wa.me/${pesanan.no_hp.replace(/\D/g, "").replace(/^0/, "62")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {pesanan.no_hp}
              </a>
            </dd>
          </div>
        )}
      </dl>

      {pesanan.catatan_santri && (
        <p className="rounded-lg bg-secondary/50 p-3 text-sm">
          <span className="font-medium">Catatan santri: </span>
          {pesanan.catatan_santri}
        </p>
      )}

      {pesanan.alasan_tolak && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            Pernah ditolak: {pesanan.alasan_tolak}
          </AlertDescription>
        </Alert>
      )}

      {/* Bukti transfer dibuka lewat URL bertanda tangan berumur 10 menit,
          bukan URL publik permanen. */}
      {pesanan.bukti_url ? (
        urlBukti ? (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urlBukti}
              alt={`Bukti transfer ${pesanan.nomor_invoice}`}
              className="max-h-96 w-full rounded-lg border object-contain"
            />
            <a
              href={urlBukti}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="size-3" />
              Buka ukuran penuh
            </a>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={lihatBukti} disabled={memuatBukti}>
            {memuatBukti ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileImage className="size-4" />
            )}
            Lihat Bukti Transfer
          </Button>
        )
      ) : (
        <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          Santri belum mengunggah bukti transfer.
        </p>
      )}

      <div className="flex flex-wrap gap-2 border-t pt-4">
        <form action={kirimSetuju}>
          <input type="hidden" name="order_id" value={pesanan.id} />
          <Button type="submit" disabled={sedangSetuju || pesanan.status === "lunas"}>
            {sedangSetuju ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Setujui &amp; Buka Akses
          </Button>
        </form>

        <Button
          variant="outline"
          onClick={() => setDialogTolak(true)}
          disabled={pesanan.status === "lunas"}
        >
          <X className="size-4" />
          Tolak
        </Button>
      </div>

      <Dialog open={dialogTolak} onOpenChange={setDialogTolak}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak pembayaran</DialogTitle>
            <DialogDescription>
              Alasan ini ditampilkan kepada santri di halaman tagihannya, jadi
              tulis yang jelas dan bisa ditindaklanjuti.
            </DialogDescription>
          </DialogHeader>

          <form action={kirimTolak} className="space-y-4">
            <input type="hidden" name="order_id" value={pesanan.id} />
            <Textarea
              name="alasan"
              rows={3}
              required
              placeholder="Mis. Nominal transfer Rp 450.000, seharusnya Rp 450.137 termasuk kode unik."
            />
            {hasilTolak?.pesan && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{hasilTolak.pesan}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogTolak(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={sedangTolak}>
                {sedangTolak && <Loader2 className="size-4 animate-spin" />}
                Tolak Pembayaran
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
