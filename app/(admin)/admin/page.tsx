import type { Metadata } from "next";
import { Award, BookOpen, TrendingUp, Users, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { JudulHalaman } from "@/components/dasbor/judul-halaman";
import { StatusPesananBadge } from "@/components/belajar/status-pesanan";
import { wajibAdmin } from "@/lib/auth";
import { buatKlienServer } from "@/lib/supabase/server";
import { rupiah, tanggal } from "@/lib/format";

export const metadata: Metadata = { title: "Ringkasan" };

export default async function AdminBerandaPage() {
  await wajibAdmin();
  const supabase = await buatKlienServer();

  await supabase.rpc("kadaluarsakan_pesanan");

  const awalBulan = new Date();
  awalBulan.setDate(1);
  awalBulan.setHours(0, 0, 0, 0);

  const [
    { count: perluVerifikasi },
    { count: totalSantri },
    { count: kelasTerbit },
    { count: sertifikatTerbit },
    { data: lunasBulanIni },
    { data: terbaru },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "menunggu_verifikasi"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("peran", "santri"),
    supabase
      .from("courses")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    supabase.from("sertifikat").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("total_bayar")
      .eq("status", "lunas")
      .gte("diverifikasi_at", awalBulan.toISOString()),
    supabase
      .from("orders")
      .select("*, profiles!orders_santri_id_fkey(nama), courses(judul)")
      .order("dibuat_at", { ascending: false })
      .limit(8),
  ]);

  const pemasukan = (lunasBulanIni ?? []).reduce((t, o) => t + o.total_bayar, 0);

  const kartu = [
    {
      ikon: Wallet,
      label: "Perlu diverifikasi",
      nilai: String(perluVerifikasi ?? 0),
      keterangan: "pembayaran menunggu",
      sorot: (perluVerifikasi ?? 0) > 0,
    },
    {
      ikon: TrendingUp,
      label: "Pemasukan bulan ini",
      nilai: rupiah(pemasukan),
      keterangan: `${(lunasBulanIni ?? []).length} pembayaran lunas`,
    },
    { ikon: Users, label: "Santri terdaftar", nilai: String(totalSantri ?? 0), keterangan: "akun santri" },
    { ikon: BookOpen, label: "Kelas terbit", nilai: String(kelasTerbit ?? 0), keterangan: "tampil di katalog" },
    { ikon: Award, label: "Sertifikat terbit", nilai: String(sertifikatTerbit ?? 0), keterangan: "sejak awal" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <JudulHalaman
        judul="Ringkasan"
        keterangan="Keadaan madrasah hari ini."
        aksi={
          <TautanTombol href="/admin/pembayaran">
            <Wallet className="size-4" />
            Verifikasi Pembayaran
          </TautanTombol>
        }
      />

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kartu.map((k) => (
          <Card
            key={k.label}
            className={`gap-1 p-5 ${k.sorot ? "border-emas/50 bg-emas/5" : ""}`}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <k.ikon className="size-4" />
              {k.label}
            </div>
            <p className="font-heading text-2xl font-bold tabular-nums">{k.nilai}</p>
            <p className="text-xs text-muted-foreground">{k.keterangan}</p>
          </Card>
        ))}
      </div>

      <h2 className="font-heading mb-3 text-lg font-semibold">Pesanan terbaru</h2>
      <div className="space-y-2">
        {(terbaru ?? []).length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Belum ada pesanan.
          </Card>
        ) : (
          (terbaru ?? []).map((o) => (
            <Card key={o.id} className="flex-row flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {o.profiles?.nama} — {o.courses?.judul}
                </p>
                <p className="text-xs text-muted-foreground">
                  {o.nomor_invoice} · {tanggal(o.dibuat_at)}
                </p>
              </div>
              <span className="text-sm font-medium tabular-nums">
                {rupiah(o.total_bayar)}
              </span>
              <StatusPesananBadge status={o.status} />
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
