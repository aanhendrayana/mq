import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { KartuKelas } from "@/components/marketing/kartu-kelas";
import { daftarKelas } from "@/lib/kelas";
import { buatKlienServer } from "@/lib/db/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Program & Kelas",
  description:
    "Semua kelas Madrasah Qur'an Ummina: tahsin berjenjang, iqro untuk pemula, tahfidz, dan kelas guru bersertifikasi.",
};

export default async function KatalogPage({ searchParams }: PageProps<"/program">) {
  const { kategori } = await searchParams;
  const terpilih = typeof kategori === "string" ? kategori : undefined;

  const db = await buatKlienServer();
  const [{ data: program }, kelas] = await Promise.all([
    db.from("programs").select("*").order("urutan"),
    daftarKelas({ program: terpilih }),
  ]);

  const aktif = program?.find((p) => p.slug === terpilih);

  return (
    <>
      <section className="pola-islami border-b bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h1 className="font-heading text-4xl font-bold">
            {aktif ? aktif.nama : "Program & Kelas"}
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-pretty text-muted-foreground">
            {aktif?.deskripsi ??
              "Pilih kelas sesuai kemampuan Anda saat ini. Belum yakin ada di jenjang mana? Hubungi kami untuk tes penempatan gratis."}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <nav className="flex flex-wrap gap-2" aria-label="Saring berdasarkan program">
          <Link href="/program">
            <Badge
              variant={terpilih ? "outline" : "default"}
              className={cn("cursor-pointer px-4 py-2 text-sm font-normal")}
            >
              Semua
            </Badge>
          </Link>
          {program?.map((p) => (
            <Link key={p.id} href={`/program?kategori=${p.slug}`}>
              <Badge
                variant={terpilih === p.slug ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm font-normal"
              >
                {p.nama}
              </Badge>
            </Link>
          ))}
        </nav>

        {kelas.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {kelas.map((k) => (
              <KartuKelas key={k.id} kelas={k} />
            ))}
          </div>
        ) : (
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <SearchX className="size-10 text-muted-foreground" />
            <p className="font-medium">Belum ada kelas pada program ini</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Angkatan berikutnya sedang disiapkan. Silakan lihat program lain
              atau hubungi kami untuk diberi tahu saat dibuka.
            </p>
            <Link href="/program" className="mt-2 text-sm font-medium text-primary hover:underline">
              Lihat semua kelas
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
