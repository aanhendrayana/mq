import type { Metadata } from "next";
import { CalendarDays, ClipboardCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { JudulHalaman, KeadaanKosong } from "@/components/dasbor/judul-halaman";
import { wajibPengajar } from "@/lib/auth";
import { idRombelBimbingan } from "@/lib/pengajar";
import { buatKlienServer } from "@/lib/db/server";
import { jarakWaktu, tanggalJam } from "@/lib/format";
import { waktuPermintaan } from "@/lib/waktu";

export const metadata: Metadata = { title: "Jadwal Mengajar" };

export default async function JadwalPengajarPage() {
  const pengguna = await wajibPengajar();
  const db = await buatKlienServer();

  const idBimbingan = await idRombelBimbingan(pengguna);
  let qSesi = db.from("sesi_halaqah").select("*, batches(id, nama, courses(judul))").order("mulai_at");
  if (idBimbingan) {
    qSesi = qSesi.in(
      "batch_id",
      idBimbingan.length ? idBimbingan : ["00000000-0000-0000-0000-000000000000"],
    );
  }
  const { data: sesi } = await qSesi;

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
        keterangan="Seluruh pertemuan dari rombel yang Anda bimbing."
      />

      <h2 className="font-heading mb-3 text-lg font-semibold">Akan datang</h2>
      {mendatang.length === 0 ? (
        <KeadaanKosong
          ikon={CalendarDays}
          judul="Tidak ada pertemuan terjadwal"
          keterangan="Tambahkan pertemuan dari halaman rombel agar santriwati melihat jadwalnya."
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
