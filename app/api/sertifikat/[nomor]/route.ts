import { NextResponse } from "next/server";
import { buatKlienServer } from "@/lib/db/server";
import { buatPdfSertifikat } from "@/lib/sertifikat-pdf";
import { ambilPengasuh } from "@/lib/pengaturan";

// @react-pdf/renderer butuh API Node, tidak bisa berjalan di Edge Runtime.
export const runtime = "nodejs";

/**
 * Mengunduh PDF sertifikat.
 *
 * Nomor sertifikat memuat garis miring ("MQU/TSND/2026/0001"), yang tidak bisa
 * dipakai apa adanya di path URL — jadi di tautan garis miringnya diganti tanda
 * hubung dan dikembalikan di sini.
 *
 * Akses dibatasi RLS: `select` di bawah hanya menemukan baris milik pengguna
 * yang sedang masuk (atau apa pun bila dia admin).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ nomor: string }> },
) {
  const { nomor } = await params;
  const nomorAsli = decodeURIComponent(nomor).replaceAll("-", "/");

  const db = await buatKlienServer();
  const { data } = await db
    .from("sertifikat")
    // `sertifikat` punya dua FK ke profiles (santri_id & diterbitkan_oleh),
    // jadi nama FK-nya harus disebut agar PostgREST tidak menolak ambigu.
    .select("*, profiles!sertifikat_santri_id_fkey(nama), courses(judul, jenjang)")
    .eq("nomor", nomorAsli)
    .maybeSingle();

  if (!data) {
    return new NextResponse("Sertifikat tidak ditemukan.", { status: 404 });
  }

  // Blok tanda tangan menyebut pengasuh madrasah yang sedang menjabat, dibaca
  // dari pengaturan situs agar bisa diperbarui admin tanpa deploy ulang.
  const pengasuh = await ambilPengasuh();

  const pdf = await buatPdfSertifikat({
    nomor: data.nomor,
    namaSantri: data.profiles?.nama ?? "—",
    judulKelas: data.courses?.judul ?? "—",
    jenjang: data.courses?.jenjang ?? null,
    predikat: data.predikat,
    nilaiRata: data.nilai_rata === null ? null : Number(data.nilai_rata),
    tglTerbit: data.tgl_terbit,
    tokenVerifikasi: data.token_verifikasi,
    penandatangan: {
      nama: pengasuh?.nama ?? "Pimpinan Madrasah",
      peran: pengasuh?.peran ?? "Madrasah Qur'an Ummina",
    },
  });

  const namaBerkas = `Sertifikat-${data.nomor.replaceAll("/", "-")}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${namaBerkas}"`,
      // Sertifikat bisa diterbitkan ulang; jangan biarkan versi lama tersangkut
      // di cache peramban atau CDN.
      "Cache-Control": "private, no-store",
    },
  });
}
