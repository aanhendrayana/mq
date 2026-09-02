import type { Metadata } from "next";
import { CalendarDays, ClipboardCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { JudulHalaman, KeadaanKosong } from "@/components/dasbor/judul-halaman";
import { wajibPengajar } from "@/lib/auth";
import { buatKlienServer } from "@/lib/supabase/server";
import { jarakWaktu, tanggalJam } from "@/lib/format";
import { waktuPermintaan } from "@/lib/waktu";

export const metadata: Metadata = { title: "Jadwal Mengajar" };

export default async function JadwalPengajarPage() {
  await wajibPengajar();
  const supabase = await buatKlienServer();

  const { data: sesi } = await supabase
    .from("sesi_halaqah")
    .select("*, batches(id, nama, courses(judul))")
    .order("mulai_at");

  const sekarang = (await waktuPermintaan()).getTime();
  const mendatang = (sesi ?? []).filter((s) => new Date(s.mulai_at).getTime() >= sekarang);
  const perluDiabsen = (sesi ?? [])
    .filter((s) => new Date(s.mulai_at).getTime() < sekarang)
    .reverse()
    .slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <JudulHalaman
        judul="Jadwal Mengajar"
        keterangan="Seluruh pertemuan dari angkatan yang Anda bimbing."
      />

      <h2 className="font-heading mb-3 text-lg font-semibold">Akan datang</h2>
      {mendatang.length === 0 ? (
        <KeadaanKosong
          ikon={CalendarDays}
          judul="Tidak ada pertemuan terjadwal"
          keterangan="Tambahkan pertemuan dari halaman angkatan agar santri melihat jadwalnya."
        />
      ) : (
        <div className="mb-10 space-y-2">
          {mendatang.map((s) => (
            <Card key={s.id} className="flex-row flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">
                  {s.batches?.courses?.judul} · {s.batches?.nama}
                </p>
                <p className="text-sm font-medium">
                  Pertemuan {s.pertemuan_ke}: {s.judul}
                </p>
                <p className="text-xs text-muted-foreground">{tanggalJam(s.mulai_at)}</p>
              </div>
              <Badge variant="secondary">{jarakWaktu(s.mulai_at)}</Badge>
              {s.batches && (
                <TautanTombol
                  href={`/pengajar/batch/${s.batches.id}/sesi/${s.id}`}
                  size="sm"
                  variant="outline"
                >
                  Buka
                </TautanTombol>
              )}
            </Card>
          ))}
        </div>
      )}

      {perluDiabsen.length > 0 && (
        <>
          <h2 className="font-heading mb-3 text-lg font-semibold">Pertemuan yang sudah lewat</h2>
          <div className="space-y-2">
            {perluDiabsen.map((s) => (
              <Card key={s.id} className="flex-row flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{s.batches?.nama}</p>
                  <p className="text-sm font-medium">
                    Pertemuan {s.pertemuan_ke}: {s.judul}
                  </p>
                  <p className="text-xs text-muted-foreground">{tanggalJam(s.mulai_at)}</p>
                </div>
                {s.batches && (
                  <TautanTombol
                    href={`/pengajar/batch/${s.batches.id}/sesi/${s.id}`}
                    size="sm"
                  >
                    <ClipboardCheck className="size-4" />
                    Absen &amp; Nilai
                  </TautanTombol>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
