"use client";

import { useTransition } from "react";
import { Loader2, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { tempatkanSantriAction } from "@/app/(admin)/admin/batch/actions";

export function TombolTempatkan({
  enrollmentId,
  batchId,
  keluarkan,
}: {
  enrollmentId: string;
  /** null berarti mengeluarkan santri dari angkatannya. */
  batchId: string | null;
  keluarkan?: boolean;
}) {
  const [sedang, mulai] = useTransition();

  return (
    <Button
      size="sm"
      variant={keluarkan ? "ghost" : "outline"}
      disabled={sedang}
      onClick={() =>
        mulai(async () => {
          const h = await tempatkanSantriAction(enrollmentId, batchId);
          if (h?.pesan) toast.error(h.pesan);
          else if (h?.sukses) toast.success(h.sukses);
        })
      }
    >
      {sedang ? (
        <Loader2 className="size-4 animate-spin" />
      ) : keluarkan ? (
        <UserMinus className="size-4" />
      ) : (
        <UserPlus className="size-4" />
      )}
      {keluarkan ? "Keluarkan" : "Tempatkan"}
    </Button>
  );
}
