import { Badge } from "@/components/ui/badge";
import type { StatusPesanan } from "@/lib/database.types";

const GAYA: Record<StatusPesanan, { label: string; kelas: string }> = {
  menunggu_bayar: {
    label: "Menunggu Pembayaran",
    kelas: "bg-warning/15 text-warning-foreground border-warning/40",
  },
  menunggu_verifikasi: {
    label: "Menunggu Verifikasi",
    kelas: "bg-emas/15 text-emas-foreground border-emas/40",
  },
  lunas: {
    label: "Lunas",
    kelas: "bg-success/15 text-success border-success/40",
  },
  ditolak: {
    label: "Ditolak",
    kelas: "bg-destructive/10 text-destructive border-destructive/40",
  },
  kadaluarsa: {
    label: "Kedaluwarsa",
    kelas: "bg-muted text-muted-foreground border-border",
  },
};

export function StatusPesananBadge({ status }: { status: StatusPesanan }) {
  const g = GAYA[status];
  return (
    <Badge variant="outline" className={g.kelas}>
      {g.label}
    </Badge>
  );
}
