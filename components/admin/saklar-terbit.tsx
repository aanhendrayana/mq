"use client";

import { useTransition } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ubahTerbitAction } from "@/app/(admin)/admin/kelas/actions";

export function SaklarTerbit({ id, terbit }: { id: string; terbit: boolean }) {
  const [sedang, mulai] = useTransition();

  return (
    <Button
      size="sm"
      variant={terbit ? "secondary" : "outline"}
      disabled={sedang}
      onClick={() =>
        mulai(async () => {
          const hasil = await ubahTerbitAction(id, !terbit);
          if (hasil?.pesan) toast.error(hasil.pesan);
          else if (hasil?.sukses) toast.success(hasil.sukses);
        })
      }
    >
      {sedang ? (
        <Loader2 className="size-4 animate-spin" />
      ) : terbit ? (
        <Eye className="size-4" />
      ) : (
        <EyeOff className="size-4" />
      )}
      {terbit ? "Terbit" : "Draf"}
    </Button>
  );
}
