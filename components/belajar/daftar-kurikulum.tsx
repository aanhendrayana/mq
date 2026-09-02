import Link from "next/link";
import { CheckCircle2, Circle, FileText, PlayCircle } from "lucide-react";
import { jamTayang } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BabBelajar } from "@/lib/kelas-santri";

export function DaftarKurikulum({
  bab,
  slugKelas,
  slugAktif,
}: {
  bab: BabBelajar[];
  slugKelas: string;
  slugAktif?: string;
}) {
  return (
    <div className="space-y-6">
      {bab.map((b, i) => {
        const selesai = b.pelajaran.filter((p) => p.selesai).length;
        return (
          <section key={b.id}>
            <header className="mb-2 px-1">
              <p className="text-xs font-medium text-muted-foreground">
                Bab {i + 1} · {selesai}/{b.pelajaran.length} selesai
              </p>
              <h3 className="font-heading text-sm font-semibold">{b.judul}</h3>
            </header>

            <ul className="space-y-0.5">
              {b.pelajaran.map((p) => {
                const aktif = p.slug === slugAktif;
                return (
                  <li key={p.id}>
                    <Link
                      href={`/belajar/${slugKelas}/${p.slug}`}
                      aria-current={aktif ? "page" : undefined}
                      className={cn(
                        "flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                        aktif
                          ? "bg-primary/10 font-medium text-primary"
                          : "hover:bg-accent/60",
                      )}
                    >
                      {p.selesai ? (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                      ) : p.tipe === "teks" ? (
                        <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      ) : aktif ? (
                        <PlayCircle className="mt-0.5 size-4 shrink-0" />
                      ) : (
                        <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="flex-1 leading-snug">{p.judul}</span>
                      {p.durasi_detik > 0 && (
                        <span className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                          {jamTayang(p.durasi_detik)}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
