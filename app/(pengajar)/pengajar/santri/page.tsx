import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JudulHalaman, KeadaanKosong } from "@/components/dasbor/judul-halaman";
import { wajibPengajar } from "@/lib/auth";
import { buatKlienServer } from "@/lib/supabase/server";
import { nomorWa } from "@/lib/format";

export const metadata: Metadata = { title: "Santri Bimbingan" };

export default async function SantriBimbinganPage() {
  await wajibPengajar();
  const supabase = await buatKlienServer();

  // RLS sudah membatasi ke angkatan yang dibimbing pengguna ini.
  const { data: enroll } = await supabase
    .from("enrollments")
    .select("id, santri_id, status, profiles(nama, no_hp, kota), courses(judul), batches(nama)")
    .neq("status", "berhenti");

  const idSantri = [...new Set((enroll ?? []).map((e) => e.santri_id))];

  const { data: penilaian } = idSantri.length
    ? await supabase
        .from("penilaian_setoran")
        .select("santri_id, enrollment_id, nilai_rata")
        .in("santri_id", idSantri)
    : { data: [] };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <JudulHalaman
        judul="Santri Bimbingan"
        keterangan="Seluruh santri dari angkatan yang Anda bimbing, beserta rata-rata nilai setorannya."
      />

      {!enroll || enroll.length === 0 ? (
        <KeadaanKosong
          ikon={GraduationCap}
          judul="Belum ada santri"
          keterangan="Santri akan muncul di sini setelah admin menempatkan mereka di angkatan Anda."
        />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Angkatan</TableHead>
                  <TableHead className="text-right">Setoran</TableHead>
                  <TableHead className="text-right">Rata-rata</TableHead>
                  <TableHead>WhatsApp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enroll.map((e) => {
                  const milik = (penilaian ?? []).filter((p) => p.enrollment_id === e.id);
                  const rata = milik.length
                    ? milik.reduce((a, b) => a + Number(b.nilai_rata), 0) / milik.length
                    : null;
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.profiles?.nama}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {e.courses?.judul}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {e.batches?.nama ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{milik.length}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {rata === null ? "—" : rata.toFixed(1)}
                      </TableCell>
                      <TableCell>
                        {e.profiles?.no_hp ? (
                          <a
                            href={`https://wa.me/${nomorWa(e.profiles.no_hp)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {e.profiles.no_hp}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
