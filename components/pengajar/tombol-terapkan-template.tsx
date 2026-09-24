"use client";

import { useTransition } from "react";
import { ListChecks, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { terapkanTemplateAction } from "@/app/(pengajar)/pengajar/batch/[id]/actions";

/** Hanya tampil untuk admin/Ummi Rifa (dicek di halaman pemanggil). */
export function TombolTerapkanTemplate({ batchId }: { batchId: string }) {
  const [sedang, mulai] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={sedang}
      onClick={() => {
        if (
          !confirm(
            "Salin rencana pertemuan dari template program ke rombel ini? Pertemuan yang nomornya sudah ada tidak akan ditimpa.",
          )
        )
          return;
        mulai(async () => {
          const h = await terapkanTemplateAction(batchId);
          if (h?.pesan) toast.error(h.pesan);
          else if (h?.sukses) toast.success(h.sukses);
        });
      }}
    >
      {sedang ? <Loader2 className="size-4 animate-spin" /> : <ListChecks className="size-4" />}
      Terapkan Template
    </Button>
  );
}
