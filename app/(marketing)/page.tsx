import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  MessagesSquare,
  Quote,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { KartuKelas } from "@/components/marketing/kartu-kelas";
import { daftarKelas } from "@/lib/kelas";
import { ambilPengaturan, type Hero, type LangkahAlur } from "@/lib/pengaturan";
import { db } from "@/lib/db";
import { programs, testimoni, faq } from "@/lib/db/schema";
import { eq, isNull, and, asc } from "drizzle-orm";
import { inisial } from "@/lib/format";

const KEUNGGULAN = [
  {
    ikon: Video,
    judul: "Materi video yang bisa diulang",
    isi: "Setiap huruf dan hukum bacaan dijelaskan pelan dalam video pendek. Tertinggal? Putar ulang sebanyak yang Anda perlukan, tanpa sungkan.",
  },
  {
    ikon: Users,
    judul: "Halaqah setoran bersama ustadzah",
    isi: "Membaca Al-Qur'an tidak cukup dari menonton. Dua kali sepekan Anda menyetorkan bacaan langsung dan dikoreksi saat itu juga.",
  },
  {
    ikon: ShieldCheck,
    judul: "Rapor tahsin yang terukur",
    isi: "Makhraj, tajwid, kelancaran, dan adab dinilai tiap pertemuan. Anda tahu persis bagian mana yang masih perlu diperbaiki.",
  },
  {
    ikon: MessagesSquare,
    judul: "Ruang belajar sesama muslimah",
    isi: "Seluruh santriwati dan pengajarnya perempuan, kelompoknya kecil, dan pembimbingnya tetap sepanjang program. Anda bisa membaca dengan tenang tanpa sungkan.",
  },
];

export default async function BerandaPage() {
  const [kelas, pengaturan, program, daftarTestimoni, daftarFaq] =
    await Promise.all([
      daftarKelas({ batas: 6 }),
      ambilPengaturan("hero", "statistik", "alur_belajar"),
      db.select().from(programs).orderBy(asc(programs.urutan)),
      db
        .select()
        .from(testimoni)
        .where(eq(testimoni.isPublished, true))
        .orderBy(asc(testimoni.urutan))
        .limit(3),
      db
        .select()
        .from(faq)
        .where(and(isNull(faq.courseId), eq(faq.isPublished, true)))
        .orderBy(asc(faq.urutan)),
    ]);

  const hero = pengaturan.hero as Hero;
  const statistik = (pengaturan.statistik ?? {}) as Record<string, string>;
  const alur = (pengaturan.alur_belajar ?? []) as LangkahAlur[];

  // Hanya angka yang benar-benar diisi admin yang ditampilkan.
  const angkaTampil = (
    [
      ["santri", "Santriwati terdaftar"],
      ["pengajar", "Ustadzah pembimbing"],
      ["kelas", "Kelas tersedia"],
      ["kepuasan", "Kepuasan santriwati"],
    ] as const
  )
    .map(([kunci, label]) => [kunci, label, statistik[kunci]?.trim()] as const)
    .filter(([, , nilai]) => Boolean(nilai));

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="pola-islami relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-linear-to-b from-secondary/60 via-background to-background" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1.5">
              <Sparkles className="size-3.5 text-emas" />
              {hero.catatan}
            </Badge>

            <p className="teks-arab mb-6 text-2xl text-primary/70 sm:text-3xl">
              وَرَتِّلِ ٱلْقُرْءَانَ تَرْتِيلًا
            </p>

            <h1 className="font-heading text-4xl leading-[1.15] font-bold text-balance sm:text-5xl">
              {hero.judul}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">
              {hero.subjudul}
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <TautanTombol href="/program" size="lg" className="h-12 px-7 text-base">
                {hero.cta}
                <ArrowRight className="size-4" />
              </TautanTombol>
              <TautanTombol
                href="/tentang"
                size="lg"
                variant="outline"
                className="h-12 px-7 text-base"
              >
                Kenali Madrasah Kami
              </TautanTombol>
            </div>
          </div>

          {angkaTampil.length > 0 && (
            /* Flex, bukan grid 4 kolom: admin boleh mengosongkan salah satu
               angka untuk menyembunyikannya, dan grid berkolom tetap akan
               menyisakan sel kosong yang membuat barisnya timpang. */
            <dl className="mx-auto mt-16 flex max-w-3xl flex-wrap justify-center gap-x-14 gap-y-8">
              {angkaTampil.map(([kunci, label, nilai]) => (
                <div key={kunci} className="min-w-32 text-center">
                  <dt className="font-heading text-3xl font-bold text-primary">{nilai}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{label}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      {/* ----------------------------------------------------------- Keunggulan */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold text-balance sm:text-4xl">
            Kursus video saja tidak cukup untuk memperbaiki bacaan
          </h2>
          <p className="mt-4 leading-relaxed text-pretty text-muted-foreground">
            Kesalahan makhraj hampir selalu luput kalau tidak ada yang
            mendengarkan. Karena itu setiap kelas di sini menggabungkan materi
            mandiri dengan halaqah setoran bersama ustadzah.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {KEUNGGULAN.map((k) => (
            <Card key={k.judul} className="gap-3 p-6">
              <div className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
                <k.ikon className="size-5" />
              </div>
              <h3 className="font-heading text-lg font-semibold">{k.judul}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{k.isi}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------- Program */}
      {program && program.length > 0 && (
        <section className="border-y bg-secondary/30 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-heading text-3xl font-bold">Pilih titik mulai Anda</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Empat jalur belajar, dari yang belum mengenal huruf hingga yang
              bersiap menjadi pengajar.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {program.map((p) => (
                <Link
                  key={p.id}
                  href={`/program?kategori=${p.slug}`}
                  className="group rounded-xl border bg-card p-6 transition-colors hover:border-primary/40 hover:bg-card"
                >
                  <h3 className="font-heading text-lg font-semibold group-hover:text-primary">
                    {p.nama}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {p.deskripsi}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    Lihat kelas
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- Kelas */}
      {kelas.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-3xl font-bold">Kelas yang sedang dibuka</h2>
              <p className="mt-3 text-muted-foreground">
                Pendaftaran angkatan baru dibuka setiap awal bulan.
              </p>
            </div>
            <TautanTombol href="/program" variant="outline">
              Semua Kelas
              <ArrowRight className="size-4" />
            </TautanTombol>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {kelas.map((k) => (
              <KartuKelas key={k.id} kelas={k} />
            ))}
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------------- Alur */}
      {alur.length > 0 && (
        <section className="border-y bg-primary text-primary-foreground">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="font-heading text-3xl font-bold">Bagaimana belajarnya?</h2>
            <p className="mt-3 max-w-2xl text-primary-foreground/80">
              Lima langkah, dari mendaftar sampai menerima sertifikat.
            </p>

            <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
              {alur.map((l, i) => (
                <li key={l.judul} className="relative">
                  <span className="font-heading mb-3 grid size-10 place-items-center rounded-full bg-primary-foreground/15 text-lg font-bold">
                    {i + 1}
                  </span>
                  <h3 className="font-heading font-semibold">{l.judul}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-primary-foreground/75">
                    {l.isi}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ Testimoni */}
      {daftarTestimoni && daftarTestimoni.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="font-heading text-3xl font-bold">Kata santriwati kami</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {daftarTestimoni.map((t) => (
              <Card key={t.id} className="gap-4 p-6">
                <Quote className="size-7 text-emas" />
                <p className="flex-1 leading-relaxed text-pretty">{t.isi}</p>
                <div className="flex items-center gap-3 border-t pt-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                    {inisial(t.nama)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{t.nama}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.keterangan}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ FAQ */}
      {daftarFaq && daftarFaq.length > 0 && (
        <section className="border-t bg-secondary/30 py-20">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="font-heading text-center text-3xl font-bold">
              Pertanyaan yang sering diajukan
            </h2>
            <Accordion className="mt-10">
              {daftarFaq.map((f) => (
                <AccordionItem key={f.id} value={f.id}>
                  <AccordionTrigger className="text-left text-base font-medium">
                    {f.pertanyaan}
                  </AccordionTrigger>
                  <AccordionContent className="leading-relaxed text-muted-foreground">
                    {f.jawaban}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Card className="pola-islami items-center gap-5 p-10 text-center sm:p-16">
          <CheckCircle2 className="size-10 text-primary" />
          <h2 className="font-heading max-w-2xl text-3xl font-bold text-balance sm:text-4xl">
            Tidak ada kata terlambat untuk memperbaiki bacaan
          </h2>
          <p className="max-w-xl leading-relaxed text-pretty text-muted-foreground">
            Banyak santriwati kami baru mulai di usia 40, 50, bahkan 60 tahun. Yang
            dibutuhkan hanya kemauan dan pembimbing yang sabar.
          </p>
          <TautanTombol href="/program" size="lg" className="mt-2 h-12 px-8 text-base">
            Mulai Belajar Sekarang
            <ArrowRight className="size-4" />
          </TautanTombol>
        </Card>
      </section>
    </>
  );
}
