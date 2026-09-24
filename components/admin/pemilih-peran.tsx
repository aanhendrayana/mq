"use client";

import { useTransition } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ubahPeranAction } from "@/app/(admin)/admin/pengguna/actions";
import { LABEL_PERAN, PERAN, type Peran } from "@/lib/konstanta";

const PILIHAN: Peran[] = [PERAN.TAMU, PERAN.SANTRI, PERAN.USTADZ, PERAN.UMMI, PERAN.ADMIN];

export function PemilihPeran({
  penggunaId,
  peranList,
  diriSendiri,
}: {
  penggunaId: string;
  peranList: Peran[];
  diriSendiri: boolean;
}) {
  const [sedang, mulai] = useTransition();

  if (diriSendiri) {
    return <span className="text-sm text-muted-foreground">Akun Anda</span>;
  }

  function toggle(peran: Peran, aktif: boolean) {
    mulai(async () => {
      const h = await ubahPeranAction(penggunaId, peran, aktif);
      if (h?.pesan) toast.error(h.pesan);
      else if (h?.sukses) toast.success(h.sukses);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={sedang}
        aria-label="Ubah peran pengguna"
        className="flex min-h-8 items-center gap-1.5 rounded-lg border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
      >
        {sedang && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
        <span className="flex flex-wrap gap-1">
          {peranList.length === 0 ? (
            <Badge variant="outline" className="font-normal text-muted-foreground">
              {LABEL_PERAN.tamu}
            </Badge>
          ) : (
            peranList.map((p) => (
              <Badge key={p} variant="secondary" className="font-normal">
                {LABEL_PERAN[p]}
              </Badge>
            ))
          )}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {PILIHAN.map((p) => (
          <DropdownMenuCheckboxItem
            key={p}
            checked={peranList.includes(p)}
            onCheckedChange={(v) => toggle(p, v)}
          >
            {LABEL_PERAN[p]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
