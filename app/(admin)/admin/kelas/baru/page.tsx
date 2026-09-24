import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { JudulHalaman } from "@/components/dasbor/judul-halaman";
import { FormKelas } from "@/components/admin/form-kelas";
import { wajibAdmin } from "@/lib/auth";
import { buatKlienServer } from "@/lib/db/server";

export const metadata: Metadata = { title: "Kelas Baru" };

export default async function KelasBaruPage() {
  await wajibAdmin();
  const db = await buatKlienServer();
  const [{ data: program }, { data: kelasAda }] = await Promise.all([
    db.from("programs").select("id, nama").order("urutan"),
    db.from("courses").select("id, program_id, judul"),
  ]);

  // Satu program cuma boleh punya satu kelas — program yang sudah terhubung
  // ke kelas (dan template-nya) tidak ditawarkan lagi di sini, supaya admin
  // tidak membuat kelas duplikat tanpa sadar.
  const idProgramTerpakai = new Set((kelasAda ?? []).map((k) => k.program_id));
  const programTersedia = (program ?? []).filter((p) => !idProgramTerpakai.has(p.id));
  const programTerpakai = (program ?? [])
    .filter((p) => idProgramTerpakai.has(p.id))
    .map((p) => ({
      ...p,
      kelas: (kelasAda ?? []).find((k) => k.program_id === p.id)!,
    }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <TautanTombol href="/admin/kelas" variant="ghost" size="sm" className="mb-4 -ml-2">
        <ArrowLeft className="size-4" />
        Kelas & Materi
      </TautanTombol>

      <JudulHalaman
        judul="Kelas Baru"
        keterangan="Isi data kelas dulu; bab dan pelajaran ditambahkan setelah kelas tersimpan."
      />

      {programTersedia.length > 0 ? (
        <Card className="p-6">
          <FormKelas program={programTersedia} />
        </Card>
      ) : (
        <Card className="p-6 text-sm text-muted-foreground">
          Semua program sudah punya kelas masing-masing. Kelola materinya
          langsung lewat daftar di bawah, atau buat program baru dulu di{" "}
          <TautanTombol href="/admin/program" variant="link" className="h-auto p-0 align-baseline">
            Template Program
          </TautanTombol>
          .
        </Card>
      )}

      {programTerpakai.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Program yang sudah punya kelas
          </h2>
          <div className="space-y-2">
            {programTerpakai.map((p) => (
              <Card
                key={p.id}
                className="flex-row flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium">{p.nama}</p>
                  <p className="text-xs text-muted-foreground">
                    Sudah terhubung ke kelas &ldquo;{p.kelas.judul}&rdquo; dan
                    template materinya.
                  </p>
                </div>
                <TautanTombol
                  href={`/admin/kelas/${p.kelas.id}`}
                  size="sm"
                  variant="outline"
                >
                  Kelola
                  <ArrowRight className="size-4" />
                </TautanTombol>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
