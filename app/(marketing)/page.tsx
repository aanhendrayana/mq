import Link from "next/link";
import Image from "next/image";
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
    <div className="landing-page">
      <section className="landing-hero relative isolate overflow-hidden border-b">
        <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-5 pt-12 pb-10 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:pt-16 lg:pb-14">
          <div className="relative z-10">
            <p className="landing-eyebrow mb-6 flex items-center gap-2">
              <span className="h-px w-7 bg-current" aria-hidden="true" />
              MADRASAH QURAN NURUL MUSTHOFA · PERUM SAFIRA
            </p>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-3.5 py-2 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" aria-hidden="true" />
              {hero.catatan}
            </span>
            <h1 className="font-heading max-w-xl text-[2.6rem] leading-[1.2] font-medium tracking-tight text-[#173f36] sm:text-5xl lg:text-[3.45rem]">
              {hero.judul}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-[#5c6c63] sm:text-lg">
              {hero.subjudul}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TautanTombol href="/program" size="lg" className="h-12 gap-3 rounded-full px-7 shadow-lg shadow-primary/10">
                {hero.cta}<ArrowRight className="size-4" />
              </TautanTombol>
              <TautanTombol href="/tentang" size="lg" variant="outline" className="h-12 rounded-full border-primary/20 bg-transparent px-6 text-primary">
                Kenali Madrasah Kami
              </TautanTombol>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-xs text-[#5c6c63]">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-primary" />Khusus muslimah</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-primary" />Belajar dari rumah</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-primary" />Dibimbing ustadzah</span>
            </div>
          </div>

          <div className="landing-illustration relative mx-auto w-full max-w-[520px]">
            <Image
              src="/images/mq-nurul-musthofa-transparan.png"
              alt="Logo Madrasah Quran Nurul Musthofa Perum Safira dengan ilustrasi akhwat sedang mengaji"
              width={1254}
              height={1254}
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 520px, 45vw"
              preload
              unoptimized
              className="h-auto w-full object-contain"
            />
          </div>
        </div>
        <div className="relative border-t border-[#d8cba9]/45 bg-white/40 px-5 py-7 text-center">
          <p lang="ar" className="teks-arab text-2xl text-[#235347] sm:text-3xl">وَرَتِّلِ ٱلْقُرْءَانَ تَرْتِيلًا</p>
          <p className="mt-1 text-xs tracking-wide text-[#6d7568]">“Dan bacalah Al-Qur’an itu dengan perlahan-lahan.” <span className="whitespace-nowrap">— QS. Al-Muzzammil: 4</span></p>
        </div>
      </section>

      {angkaTampil.length > 0 && (
        <section aria-label="Madrasah dalam angka" className="border-b bg-[#173f36] text-white">
          <dl className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-20 gap-y-8 px-5 py-9">
            {angkaTampil.map(([kunci, label, nilai]) => (
              <div key={kunci} className="min-w-32 text-center">
                <dt className="font-heading text-3xl font-medium text-[#e5ce92]">{nilai}</dt>
                <dd className="mt-2 text-xs text-white/75">{label}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* ----------------------------------------------------------- Keunggulan */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="landing-eyebrow mb-4">MENGAPA BELAJAR BERSAMA KAMI</p>
          <h2 className="font-heading text-3xl font-bold text-balance sm:text-4xl">
            Bimbingan yang dekat,
            langkah belajar yang terarah
          </h2>
          <p className="mt-4 leading-relaxed text-pretty text-muted-foreground">
            Kesalahan makhraj hampir selalu luput kalau tidak ada yang
            mendengarkan. Karena itu setiap kelas di sini menggabungkan materi
            mandiri dengan halaqah setoran bersama ustadzah.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {KEUNGGULAN.map((k) => (
            <Card key={k.judul} className="landing-feature gap-4 rounded-2xl border-primary/10 p-6 shadow-none">
              <div className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
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
              Pilihan jalur belajar, dari yang belum mengenal huruf hingga yang
              bersiap menjadi pengajar.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {program.map((p) => (
                <Link
                  key={p.id}
                  href={`/program?kategori=${p.slug}`}
                  className="group rounded-2xl border border-primary/15 bg-card p-7 transition-colors hover:border-primary/50 hover:bg-secondary/30"
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
                Pendaftaran rombel baru dibuka setiap awal bulan.
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
              Langkah demi langkah, dari mendaftar sampai menerima sertifikat.
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
        <Card className="landing-cta relative overflow-hidden items-center gap-5 rounded-[2rem] border-[#d8cba9] p-8 text-center shadow-none sm:p-16">
          <CheckCircle2 className="size-10 text-primary" />
          <h2 className="font-heading max-w-2xl text-3xl font-bold text-balance sm:text-4xl">
            Tidak ada kata terlambat untuk memperbaiki bacaan
          </h2>
          <p className="max-w-xl leading-relaxed text-pretty text-muted-foreground">
            Mulai dari kemampuan Anda hari ini. Luangkan waktu untuk belajar,
            bersama pembimbing yang mendampingi setiap langkah perbaikan bacaan.
          </p>
          <TautanTombol href="/program" size="lg" className="mt-2 h-12 rounded-full px-8 text-base">
            Mulai Belajar Sekarang
            <ArrowRight className="size-4" />
          </TautanTombol>
        </Card>
      </section>
    </div>
  );
}
