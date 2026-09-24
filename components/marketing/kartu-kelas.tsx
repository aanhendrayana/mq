import Link from "next/link";
import { BookOpen, Clock, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { durasi, rupiah } from "@/lib/format";
import type { KelasRingkas } from "@/lib/kelas";

export function KartuKelas({ kelas }: { kelas: KelasRingkas }) {
  const harga = kelas.programs?.harga ?? 0;
  const hargaCoret = kelas.programs?.harga_coret ?? null;
  const diskon =
    hargaCoret && hargaCoret > harga ? Math.round((1 - harga / hargaCoret) * 100) : null;

  return (
    <Card className="group flex flex-col overflow-hidden p-0 transition-shadow hover:shadow-md">
      <Link href={`/program/${kelas.programs?.slug ?? ""}`} className="flex flex-1 flex-col">
        <div className="pola-islami relative aspect-16/9 overflow-hidden bg-secondary">
          {kelas.programs?.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={kelas.programs.thumbnail_url}
              alt=""
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex size-full items-center justify-center p-6">
              <span className="teks-arab text-center text-3xl text-primary/40">
                ٱقْرَأْ
              </span>
            </div>
          )}
          {diskon && (
            <Badge className="absolute top-3 left-3 bg-emas text-emas-foreground hover:bg-emas">
              Hemat {diskon}%
            </Badge>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center gap-1.5">
            {kelas.programs && (
              <Badge variant="secondary" className="font-normal">
                {kelas.programs.nama}
              </Badge>
            )}
            {kelas.programs?.jenjang && (
              <Badge variant="outline" className="font-normal">
                {kelas.programs.jenjang}
              </Badge>
            )}
          </div>

          <h3 className="font-heading text-lg leading-snug font-semibold group-hover:text-primary">
            {kelas.judul}
          </h3>

          {kelas.programs?.subjudul && (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {kelas.programs.subjudul}
            </p>
          )}

          <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1.5 pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-3.5" />
              {kelas.jumlah_pelajaran} pelajaran
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {durasi(kelas.total_detik)}
            </span>
            {kelas.programs?.durasi_pekan && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                {kelas.programs.durasi_pekan} pekan
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2 border-t pt-3">
            <span className="font-heading text-xl font-bold text-primary">
              {harga === 0 ? "Gratis" : rupiah(harga)}
            </span>
            {hargaCoret && hargaCoret > harga && (
              <span className="text-sm text-muted-foreground line-through">
                {rupiah(hargaCoret)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}
