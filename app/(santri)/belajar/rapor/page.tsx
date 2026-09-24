import type { Metadata } from "next";
import { ChartLine, MessageSquareQuote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JudulHalaman, KeadaanKosong } from "@/components/dasbor/judul-halaman";
import { GrafikRapor, type TitikRapor } from "@/components/belajar/grafik-rapor";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { eq, inArray } from "drizzle-orm";
import { wajibMasuk } from "@/lib/auth";
import { buatKlienServer } from "@/lib/db/server";
import { db as drizzleDb } from "@/lib/db";
import { courses, programs } from "@/lib/db/schema";
import { ASPEK_NILAI, predikat } from "@/lib/konstanta";
import { tanggal } from "@/lib/format";
import type { PenilaianSetoran, RingkasanCapaian } from "@/lib/database.types";

export const metadata: Metadata = { title: "Rapor Tahsin" };

function rata(nilai: number[]): number {
  if (!nilai.length) return 0;
  return Math.round((nilai.reduce((a, b) => a + b, 0) / nilai.length) * 10) / 10;
}

export default async function RaporPage() {
  const pengguna = await wajibMasuk();
  const db = await buatKlienServer();

  const { data: enroll } = await db
    .from("enrollments")
    .select("id, course_id, courses(judul)")
    .eq("santri_id", pengguna.id)
    .neq("status", "berhenti");

  // Jenjang kini di level program — shim `courses(...)` tidak mendukung embed
  // berjenjang, jadi diambil terpisah lewat drizzle.
  const idKelas = [...new Set((enroll ?? []).map((e) => e.course_id))];
  const jenjangRows = idKelas.length
    ? await drizzleDb
        .select({ courseId: courses.id, jenjang: programs.jenjang })
        .from(courses)
        .innerJoin(programs, eq(courses.programId, programs.id))
        .where(inArray(courses.id, idKelas))
    : [];
  const petaJenjang = new Map(jenjangRows.map((r) => [r.courseId, r.jenjang]));

  const { data: penilaian } = await db
    .from("penilaian_setoran")
    .select("*")
    .eq("santri_id", pengguna.id)
    .order("tanggal");

  // Satu panggilan per kelas; jumlah kelas seorang santriwati selalu kecil.
  const capaian = new Map<string, RingkasanCapaian>();
  for (const e of enroll ?? []) {
    const { data } = await db.rpc("ringkasan_capaian", {
      p_santri: pengguna.id,
      p_course: e.course_id,
    });
    if (data) capaian.set(e.course_id, data);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <JudulHalaman
        judul="Rapor Tahsin"
        keterangan="Perkembangan bacaan Anda dari pertemuan ke pertemuan, dinilai langsung oleh ustadzah pembimbing."
      />

      {!enroll || enroll.length === 0 ? (
        <KeadaanKosong
          ikon={ChartLine}
          judul="Belum ada rapor"
          keterangan="Rapor terbentuk setelah Anda mengikuti kelas dan menyetorkan bacaan di halaqah."
          aksi={<TautanTombol href="/program">Lihat Katalog Kelas</TautanTombol>}
        />
      ) : (
        <div className="space-y-12">
          {enroll.map((e) => {
            const milik = (penilaian ?? []).filter(
              (p) => p.enrollment_id === e.id,
            ) as PenilaianSetoran[];
            const c = capaian.get(e.course_id);

            const data: TitikRapor[] = milik.map((p, i) => ({
              label: `#${i + 1}`,
              tanggal: p.tanggal,
              materi: p.materi,
              nilai_makhraj: p.nilai_makhraj,
              nilai_tajwid: p.nilai_tajwid,
              nilai_kelancaran: p.nilai_kelancaran,
              nilai_adab: p.nilai_adab,
            }));

            const rataAspek = ASPEK_NILAI.map((a) => ({
              ...a,
              nilai: rata(milik.map((p) => p[a.kunci])),
            }));
            const rataKeseluruhan = rata(milik.map((p) => Number(p.nilai_rata)));

            return (
              <section key={e.id}>
                <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-xl font-bold">{e.courses?.judul}</h2>
                    {petaJenjang.get(e.course_id) && (
                      <p className="text-sm text-muted-foreground">{petaJenjang.get(e.course_id)}</p>
                    )}
                  </div>
                  {milik.length > 0 && (
                    <Badge variant="secondary" className="text-sm">
                      {predikat(rataKeseluruhan)}
                    </Badge>
                  )}
                </header>

                {/* -------------------------------------------- Ringkasan angka */}
                {c && (
                  <div className="mb-6 grid gap-3 sm:grid-cols-3">
                    <Card className="gap-1 p-4">
                      <p className="text-xs text-muted-foreground">Materi tuntas</p>
                      <p className="font-heading text-2xl font-bold tabular-nums">
                        {c.progres_persen}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.pelajaran_selesai} dari {c.total_pelajaran} pelajaran
                      </p>
                    </Card>
                    <Card className="gap-1 p-4">
                      <p className="text-xs text-muted-foreground">Rata-rata setoran</p>
                      <p className="font-heading text-2xl font-bold tabular-nums">
                        {c.nilai_rata ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        dari {c.jumlah_penilaian} penilaian
                      </p>
                    </Card>
                    <Card className="gap-1 p-4">
                      <p className="text-xs text-muted-foreground">Kehadiran halaqah</p>
                      <p className="font-heading text-2xl font-bold tabular-nums">
                        {c.kehadiran_persen}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        hadir {c.hadir} dari {c.sesi_lewat} pertemuan
                      </p>
                    </Card>
                  </div>
                )}

                {milik.length === 0 ? (
                  <Card className="p-8 text-center text-sm text-muted-foreground">
                    Belum ada penilaian setoran untuk kelas ini. Nilai akan muncul
                    setelah Anda mengikuti halaqah dan menyetorkan bacaan.
                  </Card>
                ) : (
                  <>
                    {/* --------------------------------------- Rata per aspek */}
                    <Card className="mb-6 gap-4 p-5">
                      <h3 className="font-heading font-semibold">Rata-rata per aspek</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {rataAspek.map((a) => (
                          <div key={a.kunci} className="space-y-1.5">
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="text-sm font-medium">{a.label}</span>
                              <span className="font-heading text-lg font-bold tabular-nums">
                                {a.nilai}
                              </span>
                            </div>
                            <Progress value={a.nilai} className="h-2" />
                            <p className="text-xs text-muted-foreground">{a.keterangan}</p>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* ------------------------------------------------ Grafik */}
                    {milik.length >= 2 && (
                      <Card className="mb-6 gap-2 p-5">
                        <h3 className="font-heading font-semibold">
                          Perkembangan dari pertemuan ke pertemuan
                        </h3>
                        <p className="mb-2 text-xs text-muted-foreground">
                          Skala 0–100 pada setiap aspek.
                        </p>
                        <GrafikRapor data={data} />
                      </Card>
                    )}

                    {/* ------------------------------------------- Tabel nilai */}
                    <Card className="mb-6 gap-3 p-5">
                      <h3 className="font-heading font-semibold">Rincian tiap setoran</h3>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tanggal</TableHead>
                              <TableHead>Materi</TableHead>
                              {ASPEK_NILAI.map((a) => (
                                <TableHead key={a.kunci} className="text-right">
                                  {a.label}
                                </TableHead>
                              ))}
                              <TableHead className="text-right">Rata</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {milik.map((p) => (
                              <TableRow key={p.id}>
                                <TableCell className="whitespace-nowrap">
                                  {tanggal(p.tanggal)}
                                </TableCell>
                                <TableCell className="max-w-48 truncate">
                                  {p.materi ?? "—"}
                                </TableCell>
                                {ASPEK_NILAI.map((a) => (
                                  <TableCell key={a.kunci} className="text-right tabular-nums">
                                    {p[a.kunci]}
                                  </TableCell>
                                ))}
                                <TableCell className="text-right font-semibold tabular-nums">
                                  {Number(p.nilai_rata).toFixed(1)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </Card>

                    {/* ---------------------------------------- Catatan ustadzah */}
                    {milik.some((p) => p.catatan_ustadz) && (
                      <Card className="gap-3 p-5">
                        <h3 className="font-heading flex items-center gap-2 font-semibold">
                          <MessageSquareQuote className="size-4" />
                          Catatan ustadzah
                        </h3>
                        <ul className="space-y-3">
                          {milik
                            .filter((p) => p.catatan_ustadz)
                            .reverse()
                            .map((p) => (
                              <li key={p.id} className="border-l-2 border-primary/30 pl-3">
                                <p className="text-sm leading-relaxed">{p.catatan_ustadz}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {tanggal(p.tanggal)}
                                  {p.materi && ` · ${p.materi}`}
                                </p>
                              </li>
                            ))}
                        </ul>
                      </Card>
                    )}
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
