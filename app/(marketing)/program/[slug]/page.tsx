import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  Check,
  CircleCheck,
  Clock,
  FileText,
  Info,
  Lock,
  PlayCircle,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PanelDaftar, type RombelTersedia } from "@/components/marketing/panel-daftar";
import { kurikulumPublik } from "@/lib/kelas";
import { buatKlienServer } from "@/lib/db/server";
import { durasi, inisial, jamTayang, rupiah } from "@/lib/format";

async function ambilKelas(slug: string) {
  const db = await buatKlienServer();
  const { data: program } = await db
    .from("programs")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!program) return null;

  const { data: course } = await db
    .from("courses")
    .select("*")
    .eq("program_id", program.id)
    .eq("is_published", true)
    .maybeSingle();
  if (!course) return null;

  return {
    ...course,
    slug: program.slug,
    jenjang: program.jenjang,
    subjudul: program.subjudul,
    prasyarat: program.prasyarat,
    harga: program.harga,
    harga_coret: program.harga_coret,
    durasi_pekan: program.durasi_pekan,
    programs: {
      slug: program.slug,
      nama: program.nama,
      deskripsi_lengkap: program.deskripsi_lengkap,
      apa_yang_dipelajari: program.apa_yang_dipelajari as string[],
      untuk_siapa: program.untuk_siapa as string[],
      thumbnail_url: program.thumbnail_url,
    },
  };
}

export async function generateMetadata({
  params,
}: PageProps<"/program/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const kelas = await ambilKelas(slug);
  if (!kelas) return { title: "Kelas tidak ditemukan" };
  return {
    title: kelas.judul,
    description: kelas.subjudul ?? kelas.programs?.deskripsi_lengkap?.slice(0, 160) ?? undefined,
  };
}

export default async function DetailKelasPage({ params }: PageProps<"/program/[slug]">) {
  const { slug } = await params;
  const kelas = await ambilKelas(slug);
  if (!kelas) notFound();

  const db = await buatKlienServer();
  const {
    data: { user },
  } = await db.auth.getUser();

  const [bab, { data: rombelMentah }, { data: faq }, { data: testimoni }] =
    await Promise.all([
      kurikulumPublik(kelas.id),
      db
        .from("batches")
        .select("id, nama, tgl_mulai, jadwal_ringkas, kuota, status, ustadz_id")
        .eq("course_id", kelas.id)
        .in("status", ["pendaftaran", "berjalan"])
        .order("tgl_mulai"),
      db
        .from("faq")
        .select("*")
        .eq("course_id", kelas.id)
        .eq("is_published", true)
        .order("urutan"),
      db
        .from("testimoni")
        .select("*")
        .eq("course_id", kelas.id)
        .eq("is_published", true)
        .order("urutan"),
    ]);

  // Sisa kursi dihitung dari pendaftaran yang sudah aktif (bukan dari pesanan
  // yang belum dibayar), agar kursi tidak "terkunci" oleh pesanan yang hangus.
  const idRombel = (rombelMentah ?? []).map((a) => a.id);
  const { data: terisi } = idRombel.length
    ? await db
        .from("enrollments")
        .select("batch_id")
        .in("batch_id", idRombel)
        .neq("status", "berhenti")
    : { data: [] };

  const rombel: RombelTersedia[] = (rombelMentah ?? []).map((a) => ({
    ...a,
    sisa: Math.max(0, a.kuota - (terisi ?? []).filter((e) => e.batch_id === a.id).length),
  }));

  const idUstadz = [...new Set((rombelMentah ?? []).map((a) => a.ustadz_id).filter(Boolean))];
  const { data: pengajar } = idUstadz.length
    ? await db.from("pengajar_publik").select("*").in("id", idUstadz as string[])
    : { data: [] };

  // Keadaan pengguna terhadap kelas ini menentukan tombol apa yang tampil.
  let keadaan: Parameters<typeof PanelDaftar>[0]["keadaan"] = { jenis: "tamu" };
  if (user) {
    const [{ data: enroll }, { data: pesanan }] = await Promise.all([
      db
        .from("enrollments")
        .select("id")
        .eq("santri_id", user.id)
        .eq("course_id", kelas.id)
        .maybeSingle(),
      db
        .from("orders")
        .select("nomor_invoice, status")
        .eq("santri_id", user.id)
        .eq("course_id", kelas.id)
        .in("status", ["menunggu_bayar", "menunggu_verifikasi"])
        .maybeSingle(),
    ]);
    keadaan = enroll
      ? { jenis: "terdaftar" }
      : pesanan
        ? { jenis: "menunggu", invoice: pesanan.nomor_invoice }
        : { jenis: "belum" };
  }

  const semuaPelajaran = bab.flatMap((b) => b.pelajaran);
  const totalDetik = semuaPelajaran.reduce((t, p) => t + p.durasi_detik, 0);
  const dipelajari: string[] = kelas.programs?.apa_yang_dipelajari ?? [];
  const untukSiapa: string[] = kelas.programs?.untuk_siapa ?? [];

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="pola-islami border-b bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/program" className="hover:text-foreground">Program</Link>
            <span>/</span>
            {kelas.programs && (
              <>
                <Link
                  href={`/program?kategori=${kelas.programs.slug}`}
                  className="hover:text-foreground"
                >
                  {kelas.programs.nama}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-foreground">{kelas.judul}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                {kelas.programs && <Badge variant="secondary">{kelas.programs.nama}</Badge>}
                {kelas.jenjang && <Badge variant="outline">{kelas.jenjang}</Badge>}
              </div>

              <h1 className="font-heading text-4xl leading-tight font-bold text-balance">
                {kelas.judul}
              </h1>

              {kelas.subjudul && (
                <p className="mt-4 text-lg leading-relaxed text-pretty text-muted-foreground">
                  {kelas.subjudul}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="size-4" />
                  {semuaPelajaran.length} pelajaran
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" />
                  {durasi(totalDetik)} materi video
                </span>
                {kelas.durasi_pekan && (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-4" />
                    {kelas.durasi_pekan} pekan halaqah
                  </span>
                )}
              </div>
            </div>

            {/* Panel harga & pendaftaran */}
            <div className="lg:row-span-2">
              <Card className="gap-5 p-6 lg:sticky lg:top-24">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-heading text-3xl font-bold text-primary">
                    {kelas.harga === 0 ? "Gratis" : rupiah(kelas.harga)}
                  </span>
                  {kelas.harga_coret && kelas.harga_coret > kelas.harga && (
                    <span className="text-muted-foreground line-through">
                      {rupiah(kelas.harga_coret)}
                    </span>
                  )}
                </div>

                <PanelDaftar kelas={kelas} rombel={rombel} keadaan={keadaan} />

                <Separator />

                <ul className="space-y-2.5 text-sm">
                  {[
                    "Akses materi video selamanya",
                    "Halaqah setoran bersama ustadzah",
                    "Rapor penilaian bacaan",
                    "Sertifikat kelulusan",
                    "Tanya-jawab dengan pembimbing",
                  ].map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1fr_360px]">
        <div className="space-y-12">
          {/* -------------------------------------------------- Yang dipelajari */}
          {dipelajari.length > 0 && (
            <section>
              <h2 className="font-heading text-2xl font-bold">Yang akan Anda kuasai</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {dipelajari.map((d) => (
                  <li key={d} className="flex gap-2.5 text-sm leading-relaxed">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {d}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ------------------------------------------------------- Deskripsi */}
          {kelas.programs?.deskripsi_lengkap && (
            <section>
              <h2 className="font-heading text-2xl font-bold">Tentang kelas ini</h2>
              <p className="mt-4 leading-relaxed text-pretty whitespace-pre-line text-muted-foreground">
                {kelas.programs.deskripsi_lengkap}
              </p>
            </section>
          )}

          {/* ------------------------------------------------------- Kurikulum */}
          {bab.length > 0 && (
            <section>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-heading text-2xl font-bold">Kurikulum</h2>
                <p className="text-sm text-muted-foreground">
                  {bab.length} bab · {semuaPelajaran.length} pelajaran · {durasi(totalDetik)}
                </p>
              </div>

              <Accordion
                multiple
                defaultValue={bab.slice(0, 1).map((b) => b.id)}
                className="mt-5 rounded-xl border px-4"
              >
                {bab.map((b, i) => (
                  <AccordionItem key={b.id} value={b.id}>
                    <AccordionTrigger className="text-left">
                      <span>
                        <span className="text-sm text-muted-foreground">Bab {i + 1}</span>
                        <span className="block font-heading font-semibold">{b.judul}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      {b.ringkasan && (
                        <p className="mb-3 text-sm text-muted-foreground">{b.ringkasan}</p>
                      )}
                      <ul className="space-y-0.5">
                        {b.pelajaran.map((p) => (
                          <li
                            key={p.id}
                            className="flex items-center gap-3 rounded-md px-2 py-2 text-sm"
                          >
                            {p.is_preview ? (
                              <PlayCircle className="size-4 shrink-0 text-primary" />
                            ) : p.tipe === "teks" ? (
                              <FileText className="size-4 shrink-0 text-muted-foreground" />
                            ) : (
                              <Lock className="size-4 shrink-0 text-muted-foreground" />
                            )}
                            <span className="flex-1">{p.judul}</span>
                            {p.is_preview && (
                              <Badge variant="secondary" className="text-[11px]">
                                Pratinjau
                              </Badge>
                            )}
                            {p.durasi_detik > 0 && (
                              <span className="text-xs tabular-nums text-muted-foreground">
                                {jamTayang(p.durasi_detik)}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}

          {/* -------------------------------------------------------- Rombel */}
          {rombel.length > 0 && (
            <section>
              <h2 className="font-heading text-2xl font-bold">Jadwal halaqah</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Setoran bacaan dilakukan berkelompok sesuai rombel, dengan
                ustadzah pembimbing yang tetap sepanjang program.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {rombel.map((a) => (
                  <Card key={a.id} className="gap-2 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-heading font-semibold">{a.nama}</h3>
                      <Badge variant={a.sisa > 0 ? "secondary" : "outline"}>
                        {a.sisa > 0 ? `Sisa ${a.sisa}` : "Penuh"}
                      </Badge>
                    </div>
                    <dl className="space-y-1 text-sm text-muted-foreground">
                      {a.jadwal_ringkas && (
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="size-3.5" />
                          {a.jadwal_ringkas}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Users className="size-3.5" />
                        Kuota {a.kuota} santriwati
                      </div>
                    </dl>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* -------------------------------------------------------- Pengajar */}
          {pengajar && pengajar.length > 0 && (
            <section>
              <h2 className="font-heading text-2xl font-bold">Ustadzah pembimbing</h2>
              <div className="mt-5 space-y-4">
                {pengajar.map((u) => (
                  <Card key={u.id} className="flex-row items-start gap-4 p-5">
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary font-semibold text-secondary-foreground">
                      {inisial(u.nama)}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-heading font-semibold">{u.nama}</h3>
                      {u.bio && (
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {u.bio}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* ------------------------------------------------------ Prasyarat */}
          {kelas.prasyarat && (
            <section>
              <h2 className="font-heading text-2xl font-bold">Prasyarat</h2>
              <Card className="mt-4 flex-row items-start gap-3 p-5">
                <Info className="mt-0.5 size-5 shrink-0 text-primary" />
                <p className="text-sm leading-relaxed">{kelas.prasyarat}</p>
              </Card>
            </section>
          )}

          {/* ------------------------------------------------------ Untuk siapa */}
          {untukSiapa.length > 0 && (
            <section>
              <h2 className="font-heading text-2xl font-bold">Kelas ini cocok untuk</h2>
              <ul className="mt-4 space-y-2.5">
                {untukSiapa.map((u) => (
                  <li key={u} className="flex gap-2.5 text-sm leading-relaxed">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {u}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ------------------------------------------------------- Testimoni */}
          {testimoni && testimoni.length > 0 && (
            <section>
              <h2 className="font-heading text-2xl font-bold">Kata alumni</h2>
              <div className="mt-5 space-y-4">
                {testimoni.map((t) => (
                  <Card key={t.id} className="gap-3 p-6">
                    <p className="leading-relaxed text-pretty">{t.isi}</p>
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">
                        {inisial(t.nama)}
                      </span>
                      <div className="text-sm">
                        <p className="font-semibold">{t.nama}</p>
                        <p className="text-xs text-muted-foreground">{t.keterangan}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* ------------------------------------------------------------- FAQ */}
          {faq && faq.length > 0 && (
            <section>
              <h2 className="font-heading text-2xl font-bold">Pertanyaan seputar kelas ini</h2>
              <Accordion className="mt-5 rounded-xl border px-4">
                {faq.map((f) => (
                  <AccordionItem key={f.id} value={f.id}>
                    <AccordionTrigger className="text-left font-medium">
                      {f.pertanyaan}
                    </AccordionTrigger>
                    <AccordionContent className="leading-relaxed text-muted-foreground">
                      {f.jawaban}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
