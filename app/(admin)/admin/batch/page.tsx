import type { Metadata } from "next";
import { Plus, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { JudulHalaman } from "@/components/dasbor/judul-halaman";
import { DialogBatch } from "@/components/admin/dialog-batch";
import { DaftarRombel } from "@/components/admin/daftar-rombel";
import { wajibAdmin } from "@/lib/auth";
import { buatKlienServer } from "@/lib/db/server";

export const metadata: Metadata = { title: "Rombel" };

export default async function AdminBatchPage() {
  await wajibAdmin();
  const db = await buatKlienServer();

  // Peran sekarang tabel terpisah: cari dulu id akun yang boleh membimbing
  // (ustadzah, ummi, admin), baru ambil nama-namanya.
  const { data: tagPengajar } = await db
    .from("pengguna_peran")
    .select("pengguna_id")
    .in("peran", ["ustadz", "ummi", "admin"]);
  const idPengajar = [...new Set((tagPengajar ?? []).map((t) => t.pengguna_id))];

  const [{ data: batches }, { data: kelas }, { data: pengajar }, { data: enroll }] =
    await Promise.all([
      db
        .from("batches")
        .select("*, courses(judul), profiles(nama)")
        .order("tgl_mulai", { ascending: false }),
      db.from("courses").select("id, judul").order("urutan"),
      idPengajar.length
        ? db.from("profiles").select("id, nama").in("id", idPengajar).order("nama")
        : Promise.resolve({ data: [] as { id: string; nama: string }[], error: null }),
      db
        .from("enrollments")
        .select("id, santri_id, batch_id, course_id, status, profiles(nama)")
        .neq("status", "berhenti"),
    ]);

  // Santriwati yang sudah membayar tapi belum punya rombel — kalau dibiarkan,
  // mereka tidak akan pernah melihat jadwal halaqah.
  const belumDitempatkan = (enroll ?? []).filter((e) => !e.batch_id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <JudulHalaman
        judul="Rombel"
        keterangan="Kelompok halaqah beserta pembimbing, jadwal, dan kuotanya."
        aksi={
          <DialogBatch
            kelas={kelas ?? []}
            pengajar={pengajar ?? []}
            pemicu={
              <>
                <Plus className="size-4" />
                Rombel Baru
              </>
            }
          />
        }
      />

      {belumDitempatkan.length > 0 && (
        <Card className="mb-8 gap-3 border-emas/50 bg-emas/5 p-5">
          <h2 className="font-heading flex items-center gap-2 font-semibold">
            <UserRound className="size-4" />
            {belumDitempatkan.length} santriwati belum ditempatkan di rombel
          </h2>
          <p className="text-sm text-muted-foreground">
            Mereka sudah punya akses materi, tetapi belum melihat jadwal halaqah
            mana pun. Tempatkan lewat tombol pada rombel yang sesuai di bawah.
          </p>
          <ul className="space-y-1 text-sm">
            {belumDitempatkan.map((e) => (
              <li key={e.id} className="text-muted-foreground">
                {e.profiles?.nama} —{" "}
                {(kelas ?? []).find((k) => k.id === e.course_id)?.judul}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <DaftarRombel
        batches={batches ?? []}
        kelas={kelas ?? []}
        pengajar={pengajar ?? []}
        enroll={enroll ?? []}
      />
    </div>
  );
}
