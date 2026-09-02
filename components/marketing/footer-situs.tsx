import Link from "next/link";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { ambilKontak } from "@/lib/pengaturan";
import { buatKlienServer } from "@/lib/supabase/server";
import { SITUS } from "@/lib/konstanta";

/** Lucide sudah tidak menyediakan ikon merek, jadi digambar sendiri. */
function IkonInstagram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

export async function FooterSitus() {
  const kontak = await ambilKontak();
  const supabase = await buatKlienServer();
  const { data: program } = await supabase
    .from("programs")
    .select("slug, nama")
    .order("urutan");

  return (
    <footer className="mt-24 border-t bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            {SITUS.deskripsi}
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Program</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {program?.map((p) => (
              <li key={p.slug}>
                <Link href={`/program?kategori=${p.slug}`} className="hover:text-foreground">
                  {p.nama}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Madrasah</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/tentang" className="hover:text-foreground">Tentang Kami</Link></li>
            <li><Link href="/program" className="hover:text-foreground">Semua Kelas</Link></li>
            <li><Link href="/cek-sertifikat" className="hover:text-foreground">Cek Keaslian Sertifikat</Link></li>
            <li><Link href="/kontak" className="hover:text-foreground">Hubungi Kami</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Kontak</h3>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li>
              <a
                href={`https://wa.me/${kontak.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-foreground"
              >
                <MessageCircle className="size-4 shrink-0" />
                WhatsApp
              </a>
            </li>
            <li>
              <a href={`mailto:${kontak.email}`} className="flex items-center gap-2 hover:text-foreground">
                <Mail className="size-4 shrink-0" />
                {kontak.email}
              </a>
            </li>
            <li>
              <a
                href={`https://instagram.com/${kontak.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-foreground"
              >
                <IkonInstagram className="size-4 shrink-0" />
                @{kontak.instagram}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              {kontak.alamat}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {SITUS.nama}. Seluruh hak cipta dilindungi.
        </div>
      </div>
    </footer>
  );
}
