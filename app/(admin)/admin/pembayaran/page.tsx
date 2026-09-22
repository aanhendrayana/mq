import type { Metadata } from "next";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JudulHalaman, KeadaanKosong } from "@/components/dasbor/judul-halaman";
import { KartuVerifikasi, type PesananVerifikasi } from "@/components/admin/kartu-verifikasi";
import { StatusPesananBadge } from "@/components/belajar/status-pesanan";
import { wajibAdmin } from "@/lib/auth";
import { buatKlienServer } from "@/lib/db/server";
import { rupiah, tanggal } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StatusPesanan } from "@/lib/database.types";

export const metadata: Metadata = { title: "Verifikasi Pembayaran" };

const SARINGAN: { kunci: string; label: string; status: StatusPesanan[] }[] = [
  { kunci: "perlu", label: "Perlu diverifikasi", status: ["menunggu_verifikasi"] },
  { kunci: "menunggu", label: "Menunggu bayar", status: ["menunggu_bayar"] },
  { kunci: "lunas", label: "Lunas", status: ["lunas"] },
  { kunci: "batal", label: "Ditolak & kedaluwarsa", status: ["ditolak", "kadaluarsa"] },
];

export default async function PembayaranPage({
  searchParams,
}: PageProps<"/admin/pembayaran">) {
  await wajibAdmin();
  const { saring } = await searchParams;
  const kunci = typeof saring === "string" ? saring : "perlu";
  const aktif = SARINGAN.find((s) => s.kunci === kunci) ?? SARINGAN[0];

  const db = await buatKlienServer();
  await db.rpc("kadaluarsakan_pesanan");

  const { data } = await db
    .from("orders")
    .select("*, profiles!orders_santri_id_fkey(nama, no_hp), courses(judul), batches(nama)")
    .in("status", aktif.status)
    .order("dibuat_at", { ascending: false });

  const pesanan: PesananVerifikasi[] = (data ?? []).map((o) => ({
    id: o.id,
    nomor_invoice: o.nomor_invoice,
    status: o.status,
    harga: o.harga,
    kode_unik: o.kode_unik,
    total_bayar: o.total_bayar,
    bukti_url: o.bukti_url,
    nama_pengirim: o.nama_pengirim,
    catatan_santri: o.catatan_santri,
    alasan_tolak: o.alasan_tolak,
    dibuat_at: o.dibuat_at,
    nama_santri: o.profiles?.nama ?? "(tanpa nama)",
    no_hp: o.profiles?.no_hp ?? null,
    judul_kelas: o.courses?.judul ?? "—",
    nama_angkatan: o.batches?.nama ?? null,
  }));

  // Daftar yang butuh tindakan ditampilkan sebagai kartu penuh (dengan bukti
  // dan tombol); sisanya cukup baris ringkas agar halaman tetap terbaca.
  const perluTindakan = aktif.kunci === "perlu";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <JudulHalaman
        judul="Verifikasi Pembayaran"
        keterangan="Cocokkan nominal beserta kode uniknya dengan mutasi rekening sebelum menyetujui."
      />

      <nav className="mb-6 flex flex-wrap gap-2">
        {SARINGAN.map((s) => (
          <Link key={s.kunci} href={`/admin/pembayaran?saring=${s.kunci}`}>
            <Badge
              variant={s.kunci === aktif.kunci ? "default" : "outline"}
              className={cn("cursor-pointer px-3 py-1.5 font-normal")}
            >
              {s.label}
            </Badge>
          </Link>
        ))}
      </nav>

      {pesanan.length === 0 ? (
        <KeadaanKosong
          ikon={Wallet}
          judul="Tidak ada yang perlu diproses"
          keterangan={
            aktif.kunci === "perlu"
              ? "Semua pembayaran sudah diverifikasi. Alhamdulillah."
              : "Tidak ada pesanan pada saringan ini."
          }
        />
      ) : perluTindakan ? (
        <div className="space-y-4">
          {pesanan.map((p) => (
            <KartuVerifikasi key={p.id} pesanan={p} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {pesanan.map((p) => (
            <Card key={p.id} className="flex-row flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {p.nama_santri} — {p.judul_kelas}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {p.nomor_invoice} · {tanggal(p.dibuat_at)}
                </p>
              </div>
              <span className="text-sm font-medium tabular-nums">
                {rupiah(p.total_bayar)}
              </span>
              <StatusPesananBadge status={p.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
