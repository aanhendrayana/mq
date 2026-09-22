import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ambilKontak } from "@/lib/pengaturan";
import { buatKlienServer } from "@/lib/db/server";

export const metadata: Metadata = {
  title: "Hubungi Kami",
  description:
    "Hubungi Madrasah Qur'an Ummina untuk tes penempatan gratis, pertanyaan seputar kelas, atau kendala pembayaran.",
};

export default async function KontakPage() {
  const kontak = await ambilKontak();
  const db = await buatKlienServer();
  const { data: faq } = await db
    .from("faq")
    .select("*")
    .is("course_id", null)
    .eq("is_published", true)
    .order("urutan");

  const pesanAwal = encodeURIComponent(
    "Assalamu'alaikum, saya ingin bertanya tentang kelas di MQ Ummina.",
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold">Hubungi Kami</h1>
        <p className="mt-4 leading-relaxed text-pretty text-muted-foreground">
          Ingin tes penempatan gratis, menanyakan jadwal angkatan berikutnya,
          atau ada kendala pembayaran? Silakan hubungi kami — jalur tercepat
          lewat WhatsApp.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <a
          href={`https://wa.me/${kontak.whatsapp}?text=${pesanAwal}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group"
        >
          <Card className="h-full gap-2 p-6 transition-colors group-hover:border-primary/40">
            <MessageCircle className="size-6 text-primary" />
            <h2 className="font-heading font-semibold">WhatsApp</h2>
            <p className="text-sm text-muted-foreground">
              Dibalas pada jam kerja, 08.00–20.00 WIB.
            </p>
            <span className="mt-1 text-sm font-medium text-primary">
              Mulai percakapan →
            </span>
          </Card>
        </a>

        <a href={`mailto:${kontak.email}`} className="group">
          <Card className="h-full gap-2 p-6 transition-colors group-hover:border-primary/40">
            <Mail className="size-6 text-primary" />
            <h2 className="font-heading font-semibold">Email</h2>
            <p className="text-sm text-muted-foreground">{kontak.email}</p>
            <span className="mt-1 text-sm font-medium text-primary">Kirim email →</span>
          </Card>
        </a>
      </div>

      <Card className="mt-4 flex-row items-start gap-3 p-6">
        <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <h2 className="font-heading font-semibold">Sekretariat</h2>
          <p className="text-sm text-muted-foreground">{kontak.alamat}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Seluruh kegiatan belajar berlangsung daring; kunjungan ke
            sekretariat mohon membuat janji terlebih dahulu.
          </p>
        </div>
      </Card>

      {faq && faq.length > 0 && (
        <section className="mt-14">
          <h2 className="font-heading text-2xl font-bold">
            Mungkin pertanyaan Anda sudah terjawab
          </h2>
          <Accordion className="mt-6 rounded-xl border px-4">
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
  );
}
