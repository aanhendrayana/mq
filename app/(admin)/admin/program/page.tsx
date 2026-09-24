import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { JudulHalaman } from "@/components/dasbor/judul-halaman";
import { wajibAdmin } from "@/lib/auth";
import { buatKlienServer } from "@/lib/db/server";

export const metadata: Metadata = { title: "Template Program" };

export default async function AdminProgramPage() {
  await wajibAdmin();
  const db = await buatKlienServer();

  const [{ data: program }, { data: kelas }, { data: template }] = await Promise.all([
    db.from("programs").select("*").order("urutan"),
    db.from("courses").select("id, program_id"),
    db.from("template_pertemuan").select("id, program_id"),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <JudulHalaman
        judul="Template Program"
        keterangan="Rencana pertemuan (setara RPS) per program — dibuat sekali di sini, berlaku untuk semua kelas & rombel di bawahnya."
      />

      <div className="space-y-3">
        {(program ?? []).map((p) => {
          const jmlKelas = (kelas ?? []).filter((k) => k.program_id === p.id).length;
          const jmlPertemuan = (template ?? []).filter((t) => t.program_id === p.id).length;

          return (
            <Link key={p.id} href={`/admin/program/${p.id}`}>
              <Card className="gap-1.5 p-5 transition-colors hover:bg-accent/50">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-heading font-semibold">{p.nama}</h3>
                  <span className="text-sm text-muted-foreground">
                    {jmlPertemuan > 0
                      ? `${jmlPertemuan} pertemuan direncanakan`
                      : "Belum ada template"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{p.deskripsi}</p>
                <p className="text-xs text-muted-foreground">
                  {jmlKelas} kelas memakai program ini
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
