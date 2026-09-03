"use client";

import { useState, useTransition } from "react";
import { Award, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { terbitkanSertifikatAction } from "@/app/(admin)/admin/sertifikat/actions";

export function TombolTerbitkan({
  santriId,
  courseId,
  namaSantri,
  memenuhiSyarat,
}: {
  santriId: string;
  courseId: string;
  namaSantri: string;
  memenuhiSyarat: boolean;
}) {
  const [sedang, mulai] = useTransition();
  const [dialogPaksa, setDialogPaksa] = useState(false);

  function terbitkan(paksa: boolean) {
    mulai(async () => {
      const h = await terbitkanSertifikatAction(santriId, courseId, paksa);
      if (h?.pesan) toast.error(h.pesan);
      else if (h?.sukses) {
        toast.success(h.sukses);
        setDialogPaksa(false);
      }
    });
  }

  if (memenuhiSyarat) {
    return (
      <Button size="sm" disabled={sedang} onClick={() => terbitkan(false)}>
        {sedang ? <Loader2 className="size-4 animate-spin" /> : <Award className="size-4" />}
        Terbitkan
      </Button>
    );
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setDialogPaksa(true)}>
        Terbitkan Manual
      </Button>

      <Dialog open={dialogPaksa} onOpenChange={setDialogPaksa}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terbitkan tanpa memenuhi syarat?</DialogTitle>
            <DialogDescription>
              {namaSantri} belum memenuhi seluruh syarat kelulusan.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <TriangleAlert className="size-4" />
            <AlertDescription>
              Sertifikat yang terbit dapat diverifikasi publik dan menjadi
              pernyataan resmi madrasah. Terbitkan manual hanya bila
              penilaiannya memang dilakukan di luar sistem — misalnya santriwati
              pindahan yang sudah ditashih langsung.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogPaksa(false)}>
              Batal
            </Button>
            <Button disabled={sedang} onClick={() => terbitkan(true)}>
              {sedang && <Loader2 className="size-4 animate-spin" />}
              Ya, Terbitkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
