import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { JudulHalaman, KeadaanKosong } from "@/components/dasbor/judul-halaman";
import { StatusPesananBadge } from "@/components/belajar/status-pesanan";
import { wajibMasuk } from "@/lib/auth";
import { buatKlienServer } from "@/lib/db/server";
import { rupiah, tanggal } from "@/lib/format";

export const metadata: Metadata = { title: "Tagihan" };

export default async function DaftarTagihanPage() {
  const pengguna = await wajibMasuk();
  const db = await buatKlienServer();

  await db.rpc("kadaluarsakan_pesanan");

  const { data: pesanan } = await db
    .from("orders")
    .select("*, courses(judul, jenjang)")
    .eq("santri_id", pengguna.id)
    .order("dibuat_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <JudulHalaman
        judul="Tagihan"
        keterangan="Riwayat pendaftaran dan status pembayaran Anda."
      />

      {!pesanan || pesanan.length === 0 ? (
        <KeadaanKosong
          ikon={Receipt}
          judul="Belum ada tagihan"
          keterangan="Tagihan muncul di sini setelah Anda mendaftar ke sebuah kelas."
          aksi={<TautanTombol href="/program">Lihat Katalog Kelas</TautanTombol>}
        />
      ) : (
        <div className="space-y-3">
          {pesanan.map((p) => (
            <Card key={p.id} className="flex-row flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{p.courses?.judul ?? "Kelas"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {p.nomor_invoice} · {tanggal(p.dibuat_at)}
                </p>
              </div>
              <span className="font-medium tabular-nums">{rupiah(p.total_bayar)}</span>
              <StatusPesananBadge status={p.status} />
              <TautanTombol
                href={`/belajar/tagihan/${p.nomor_invoice}`}
                size="sm"
                variant="outline"
              >
                Detail
              </TautanTombol>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
