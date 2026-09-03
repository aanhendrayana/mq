"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ubahPeranAction } from "@/app/(admin)/admin/pengguna/actions";
import type { Peran } from "@/lib/konstanta";

export function PemilihPeran({
  penggunaId,
  peran,
  diriSendiri,
}: {
  penggunaId: string;
  peran: Peran;
  diriSendiri: boolean;
}) {
  const [sedang, mulai] = useTransition();

  if (diriSendiri) {
    return <span className="text-sm text-muted-foreground">Akun Anda</span>;
  }

  return (
    <span className="inline-flex items-center gap-2">
      {sedang && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
      <select
        value={peran}
        disabled={sedang}
        aria-label="Ubah peran pengguna"
        onChange={(e) => {
          const baru = e.target.value as Peran;
          mulai(async () => {
            const h = await ubahPeranAction(penggunaId, baru);
            if (h?.pesan) toast.error(h.pesan);
            else if (h?.sukses) toast.success(h.sukses);
          });
        }}
        className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="santri">Santriwati</option>
        <option value="ustadz">Ustadzah</option>
        <option value="admin">Admin</option>
      </select>
    </span>
  );
}
