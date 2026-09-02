"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { unggahBuktiAction, type HasilUnggah } from "@/app/(santri)/belajar/tagihan/actions";

export function FormBukti({
  orderId,
  invoice,
  namaAwal,
  sudahAdaBukti,
}: {
  orderId: string;
  invoice: string;
  namaAwal: string;
  sudahAdaBukti: boolean;
}) {
  const [hasil, kirim, sedang] = useActionState<HasilUnggah, FormData>(
    unggahBuktiAction,
    undefined,
  );

  if (hasil?.sukses) {
    return (
      <Alert>
        <CheckCircle2 className="size-4" />
        <AlertDescription>{hasil.sukses}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={kirim} className="space-y-4">
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="invoice" value={invoice} />

      <div className="space-y-2">
        <Label htmlFor="nama_pengirim">Nama pemilik rekening pengirim</Label>
        <Input
          id="nama_pengirim"
          name="nama_pengirim"
          required
          defaultValue={namaAwal}
          placeholder="Nama yang tertera di rekening pengirim"
        />
        <p className="text-xs text-muted-foreground">
          Isi sesuai nama di rekening yang dipakai transfer, meski berbeda dengan nama Anda.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bukti">Bukti transfer</Label>
        <Input
          id="bukti"
          name="bukti"
          type="file"
          required
          accept="image/png,image/jpeg,image/webp,application/pdf"
        />
        <p className="text-xs text-muted-foreground">
          Tangkapan layar mutasi atau struk. JPG, PNG, WEBP, atau PDF, maksimal 5 MB.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="catatan">Catatan untuk admin (opsional)</Label>
        <Textarea id="catatan" name="catatan" rows={2} placeholder="Mis. transfer dari rekening suami" />
      </div>

      {hasil?.pesan && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{hasil.pesan}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" size="lg" disabled={sedang} className="h-11 w-full">
        {sedang ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {sudahAdaBukti ? "Ganti Bukti Transfer" : "Kirim Bukti Transfer"}
      </Button>
    </form>
  );
}
