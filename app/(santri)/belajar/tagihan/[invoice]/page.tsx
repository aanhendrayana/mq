import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Hourglass,
  MessageCircle,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { JudulHalaman } from "@/components/dasbor/judul-halaman";
import { KartuTransfer } from "@/components/belajar/kartu-transfer";
import { FormBukti } from "@/components/belajar/form-bukti";
import { StatusPesananBadge } from "@/components/belajar/status-pesanan";
import { wajibMasuk } from "@/lib/auth";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilKontak, ambilRekening } from "@/lib/pengaturan";
import { jarakWaktu, rupiah, tanggalJam } from "@/lib/format";

export const metadata: Metadata = { title: "Tagihan" };

export default async function DetailTagihanPage({
  params,
}: PageProps<"/belajar/tagihan/[invoice]">) {
  const { invoice } = await params;
  const pengguna = await wajibMasuk();
  const supabase = await buatKlienServer();

  // Tandai dulu pesanan yang lewat batas waktu, supaya status yang tampil di
  // halaman ini selalu jujur tanpa perlu penjadwal terpisah.
  await supabase.rpc("kadaluarsakan_pesanan");

  const { data: pesanan } = await supabase
    .from("orders")
    .select("*, courses(judul, slug, jenjang), batches(nama, jadwal_ringkas)")
    .eq("nomor_invoice", invoice)
    .eq("santri_id", pengguna.id)
    .maybeSingle();

  if (!pesanan) notFound();

  const [rekening, kontak] = await Promise.all([ambilRekening(), ambilKontak()]);
  const bisaBayar =
    pesanan.status === "menunggu_bayar" ||
    pesanan.status === "menunggu_verifikasi" ||
    pesanan.status === "ditolak";

  const pesanWa = encodeURIComponent(
    `Assalamu'alaikum, saya ${pengguna.profil.nama} ingin menanyakan pembayaran invoice ${pesanan.nomor_invoice}.`,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <JudulHalaman
        judul={`Invoice ${pesanan.nomor_invoice}`}
        keterangan={pesanan.courses?.judul}
        aksi={<StatusPesananBadge status={pesanan.status} />}
      />

      {/* ------------------------------------------------------ Status ringkas */}
      {pesanan.status === "lunas" && (
        <Alert className="mb-6 border-success/40 bg-success/10">
          <CheckCircle2 className="size-4 text-success" />
          <AlertTitle>Pembayaran diterima</AlertTitle>
          <AlertDescription>
            Akses kelas sudah dibuka. Selamat belajar, semoga Allah memberkahi.
          </AlertDescription>
        </Alert>
      )}

      {pesanan.status === "menunggu_verifikasi" && (
        <Alert className="mb-6 border-emas/40 bg-emas/10">
          <Hourglass className="size-4" />
          <AlertTitle>Bukti transfer sedang diperiksa</AlertTitle>
          <AlertDescription>
            Admin memverifikasi maksimal 1×24 jam. Anda akan dikabari lewat
            WhatsApp begitu akses dibuka.
          </AlertDescription>
        </Alert>
      )}

      {pesanan.status === "ditolak" && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="size-4" />
          <AlertTitle>Bukti transfer ditolak</AlertTitle>
          <AlertDescription>
            {pesanan.alasan_tolak ?? "Silakan periksa kembali bukti transfer Anda."}
            {" "}Anda masih bisa mengunggah ulang bukti yang benar di bawah.
          </AlertDescription>
        </Alert>
      )}

      {pesanan.status === "kadaluarsa" && (
        <Alert className="mb-6">
          <Clock className="size-4" />
          <AlertTitle>Tagihan kedaluwarsa</AlertTitle>
          <AlertDescription>
            Batas waktu pembayaran sudah lewat. Silakan mendaftar ulang dari
            halaman kelas untuk mendapat tagihan baru.
          </AlertDescription>
        </Alert>
      )}

      {pesanan.status === "menunggu_bayar" && (
        <Alert className="mb-6 border-warning/40 bg-warning/10">
          <Clock className="size-4" />
          <AlertTitle>Selesaikan pembayaran {jarakWaktu(pesanan.kadaluarsa_at)}</AlertTitle>
          <AlertDescription>
            Batas akhir {tanggalJam(pesanan.kadaluarsa_at)}. Lewat dari itu,
            tagihan hangus dan Anda perlu mendaftar ulang.
          </AlertDescription>
        </Alert>
      )}

      {/* ------------------------------------------------------------- Rincian */}
      <Card className="mb-6 gap-0 p-5">
        <h3 className="font-heading mb-3 font-semibold">Rincian tagihan</h3>
        <dl className="space-y-2.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Kelas</dt>
            <dd className="text-right font-medium">{pesanan.courses?.judul}</dd>
          </div>
          {pesanan.batches && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Angkatan</dt>
              <dd className="text-right font-medium">
                {pesanan.batches.nama}
                {pesanan.batches.jadwal_ringkas && (
                  <span className="block text-xs font-normal text-muted-foreground">
                    {pesanan.batches.jadwal_ringkas}
                  </span>
                )}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Harga kelas</dt>
            <dd className="tabular-nums">{rupiah(pesanan.harga)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Kode unik</dt>
            <dd className="tabular-nums">{pesanan.kode_unik}</dd>
          </div>
        </dl>
        <Separator className="my-4" />
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-medium">Total transfer</span>
          <span className="font-heading text-xl font-bold tabular-nums text-primary">
            {rupiah(pesanan.total_bayar)}
          </span>
        </div>
      </Card>

      {/* ------------------------------------------------ Instruksi & unggahan */}
      {bisaBayar && (
        <div className="space-y-6">
          <KartuTransfer rekening={rekening} total={pesanan.total_bayar} />

          <Card className="gap-4 p-5">
            <h3 className="font-heading font-semibold">
              {pesanan.bukti_url ? "Ganti bukti transfer" : "Unggah bukti transfer"}
            </h3>
            <FormBukti
              orderId={pesanan.id}
              invoice={pesanan.nomor_invoice}
              namaAwal={pesanan.nama_pengirim ?? pengguna.profil.nama}
              sudahAdaBukti={Boolean(pesanan.bukti_url)}
            />
          </Card>
        </div>
      )}

      {pesanan.status === "lunas" && pesanan.courses && (
        <TautanTombol href={`/belajar/${pesanan.courses.slug}`} size="lg" className="h-11 w-full">
          Mulai Belajar
        </TautanTombol>
      )}

      <p className="mt-8 flex flex-wrap items-center justify-center gap-1.5 text-center text-sm text-muted-foreground">
        Ada kendala pembayaran?
        <a
          href={`https://wa.me/${kontak.whatsapp}?text=${pesanWa}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          <MessageCircle className="size-3.5" />
          Hubungi admin lewat WhatsApp
        </a>
      </p>
    </div>
  );
}
