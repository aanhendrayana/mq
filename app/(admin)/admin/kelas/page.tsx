import type { Metadata } from "next";
import { BookOpen, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { JudulHalaman, KeadaanKosong } from "@/components/dasbor/judul-halaman";
import { SaklarTerbit } from "@/components/admin/saklar-terbit";
import { wajibAdmin } from "@/lib/auth";
import { buatKlienServer } from "@/lib/supabase/server";
import { rupiah } from "@/lib/format";

export const metadata: Metadata = { title: "Kelas & Materi" };

export default async function AdminKelasPage() {
  await wajibAdmin();
  const supabase = await buatKlienServer();

  const { data: kelas } = await supabase
    .from("courses")
    .select("*, programs(nama)")
    .order("urutan");

  const { data: pelajaran } = await supabase.from("lessons").select("course_id");
  const { data: enroll } = await supabase.from("enrollments").select("course_id");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <JudulHalaman
        judul="Kelas & Materi"
        keterangan="Kelola kelas yang dijual beserta bab dan pelajarannya."
        aksi={
          <TautanTombol href="/admin/kelas/baru">
            <Plus className="size-4" />
            Kelas Baru
          </TautanTombol>
        }
      />

      {!kelas || kelas.length === 0 ? (
        <KeadaanKosong
          ikon={BookOpen}
          judul="Belum ada kelas"
          keterangan="Buat kelas pertama agar katalog di halaman depan terisi."
          aksi={<TautanTombol href="/admin/kelas/baru">Buat Kelas</TautanTombol>}
        />
      ) : (
        <div className="space-y-3">
          {kelas.map((k) => {
            const jumlahPelajaran = (pelajaran ?? []).filter(
              (p) => p.course_id === k.id,
            ).length;
            const jumlahSantri = (enroll ?? []).filter((e) => e.course_id === k.id).length;

            return (
              <Card key={k.id} className="flex-row flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{k.judul}</p>
                    {k.jenjang && (
                      <Badge variant="outline" className="text-xs font-normal">
                        {k.jenjang}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {k.programs?.nama} · {jumlahPelajaran} pelajaran · {jumlahSantri} santriwati ·{" "}
                    {rupiah(k.harga)}
                  </p>
                </div>

                <SaklarTerbit id={k.id} terbit={k.is_published} />

                <TautanTombol href={`/admin/kelas/${k.id}`} size="sm" variant="outline">
                  Kelola
                </TautanTombol>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
