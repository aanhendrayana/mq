import Link from "next/link";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { Logo } from "@/components/marketing/logo";

export default function TidakDitemukan() {
  return (
    <div className="pola-islami flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <div>
        <p className="font-heading text-6xl font-bold text-primary/30">404</p>
        <h1 className="font-heading mt-3 text-2xl font-bold">Halaman tidak ditemukan</h1>
        <p className="mt-3 max-w-md leading-relaxed text-muted-foreground">
          Halaman yang Anda cari tidak ada, sudah dipindahkan, atau memang bukan
          untuk akun Anda.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <TautanTombol href="/">Kembali ke Beranda</TautanTombol>
        <TautanTombol href="/program" variant="outline">
          Lihat Program
        </TautanTombol>
      </div>
      <Link href="/belajar" className="text-sm text-muted-foreground hover:text-foreground">
        Menuju dasbor belajar
      </Link>
    </div>
  );
}
