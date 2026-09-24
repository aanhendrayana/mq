import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarPlus, ClipboardCheck, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { JudulHalaman } from "@/components/dasbor/judul-halaman";
import { DialogSesi } from "@/components/pengajar/dialog-sesi";
import { TombolTerapkanTemplate } from "@/components/pengajar/tombol-terapkan-template";
import { aksesPenuhPengajaran, wajibPembimbingRombel } from "@/lib/pengajar";
import { buatKlienServer } from "@/lib/db/server";
import { tanggalJam } from "@/lib/format";
import { waktuPermintaan } from "@/lib/waktu";

export const metadata: Metadata = { title: "Kelola Rombel" };

export default async function DetailBatchPage({
  params,
}: PageProps<"/pengajar/batch/[id]">) {
  const { id } = await params;
  const pengguna = await wajibPembimbingRombel(id);
  const aksesPenuh = aksesPenuhPengajaran(pengguna);
  const db = await buatKlienServer();

  const { data: batch } = await db
    .from("batches")
    .select("*, courses(judul, jenjang)")
    .eq("id", id)
    .maybeSingle();
  if (!batch) notFound();

  const [{ data: enroll }, { data: sesi }] = await Promise.all([
    db
      .from("enrollments")
      .select("id, santri_id, status, profiles(nama, no_hp, kota)")
      .eq("batch_id", id)
      .neq("status", "berhenti"),
    db.from("sesi_halaqah").select("*").eq("batch_id", id).order("mulai_at"),
  ]);

  const { data: kehadiran } = (sesi ?? []).length
    ? await db
        .from("kehadiran")
        .select("sesi_id, santri_id, status")
        .in(
          "sesi_id",
          (sesi ?? []).map((s) => s.id),
        )
    : { data: [] };

  const sekarang = (await waktuPermintaan()).getTime();
  const pertemuanBerikut = Math.max(
    1,
    ...(sesi ?? []).map((s) => s.pertemuan_ke + 1),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <TautanTombol href="/pengajar" variant="ghost" size="sm" className="mb-4 -ml-2">
        <ArrowLeft className="size-4" />
        Rombel Saya
      </TautanTombol>

      <JudulHalaman
        judul={batch.nama}
        keterangan={`${batch.courses?.judul}${batch.jadwal_ringkas ? ` · ${batch.jadwal_ringkas}` : ""}`}
        aksi={
          <div className="flex flex-wrap gap-2">
            {aksesPenuh && <TombolTerapkanTemplate batchId={batch.id} />}
            <DialogSesi
              batchId={batch.id}
              pertemuanBerikut={pertemuanBerikut}
              pemicu={
                <>
                  <CalendarPlus className="size-4" />
                  Tambah Pertemuan
                </>
              }
            />
          </div>
        }
      />

      {/* ---------------------------------------------------------- Pertemuan */}
      <h2 className="font-heading mb-3 text-lg font-semibold">Pertemuan</h2>
      {!sesi || sesi.length === 0 ? (
        <Card className="mb-10 p-8 text-center text-sm text-muted-foreground">
          Belum ada pertemuan. Tambahkan pertemuan pertama agar santriwati melihat
          jadwalnya di dasbor mereka.
        </Card>
      ) : (
        <div className="mb-10 space-y-2">
          {sesi.map((s) => {
            const lewat = new Date(s.mulai_at).getTime() < sekarang;
            const tercatat = (kehadiran ?? []).filter((k) => k.sesi_id === s.id).length;
            return (
              <Card key={s.id} className="flex-row flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                    Pertemuan {s.pertemuan_ke}: {s.judul}
                    {s.template_pertemuan_id && (
                      <Badge variant="outline" className="font-normal text-muted-foreground">
                        Dari template
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tanggalJam(s.mulai_at)} · {s.durasi_menit} menit
                    {s.materi && ` · ${s.materi}`}
                  </p>
                </div>

                {lewat ? (
                  tercatat > 0 ? (
                    <Badge variant="outline" className="border-success/40 bg-success/15 text-success">
                      Absensi tercatat
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-warning/40 bg-warning/15">
                      Belum diabsen
                    </Badge>
                  )
                ) : (
                  <Badge variant="secondary">Akan datang</Badge>
                )}

                <div className="flex gap-2">
                  <DialogSesi
                    batchId={batch.id}
                    pertemuanBerikut={s.pertemuan_ke}
                    sesi={s}
                    terkunci={Boolean(s.template_pertemuan_id) && !aksesPenuh}
                    pemicu="Ubah"
                    varian="outline"
                  />
                  <TautanTombol href={`/pengajar/batch/${batch.id}/sesi/${s.id}`} size="sm">
                    <ClipboardCheck className="size-4" />
                    Absen &amp; Nilai
                  </TautanTombol>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* -------------------------------------------------------------- Santriwati */}
      <h2 className="font-heading mb-3 flex items-center gap-2 text-lg font-semibold">
        <Users className="size-5" />
        Santriwati ({enroll?.length ?? 0} dari {batch.kuota})
      </h2>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Tempat Lahir</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead className="text-right">Kehadiran</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(enroll ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Belum ada santriwati di rombel ini.
                  </TableCell>
                </TableRow>
              ) : (
                (enroll ?? []).map((e) => {
                  const sesiLewat = (sesi ?? []).filter(
                    (s) => new Date(s.mulai_at).getTime() < sekarang,
                  ).length;
                  const hadir = (kehadiran ?? []).filter(
                    (k) => k.santri_id === e.santri_id && k.status === "hadir",
                  ).length;
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.profiles?.nama}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {e.profiles?.kota ?? "—"}
                      </TableCell>
                      <TableCell>
                        {e.profiles?.no_hp ? (
                          <a
                            href={`https://wa.me/${e.profiles.no_hp.replace(/\D/g, "").replace(/^0/, "62")}`}
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
                      <TableCell className="text-right tabular-nums">
                        {hadir}/{sesiLewat}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
