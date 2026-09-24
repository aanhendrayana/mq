"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { simpanKelasAction, type HasilAdmin } from "@/app/(admin)/admin/kelas/actions";
import type { Course, Program } from "@/lib/database.types";

export function FormKelas({
  kelas,
  program,
}: {
  kelas?: Course;
  program: Pick<Program, "id" | "nama">[];
}) {
  // Sukses dikabarkan lewat toast, bukan Alert di dalam form: setelah simpan,
  // form dipasang ulang (lihat `key` di halaman pemanggil) agar menampilkan
  // nilai yang benar-benar tersimpan — dan remount itu mengosongkan state di
  // sini, sehingga Alert sukses akan langsung hilang begitu muncul.
  const [hasil, kirim, sedang] = useActionState<HasilAdmin, FormData>(
    async (sebelumnya, formData) => {
      const r = await simpanKelasAction(sebelumnya, formData);
      if (r?.sukses) toast.success(r.sukses);
      return r;
    },
    undefined,
  );

  return (
    <form action={kirim} className="space-y-5">
      {kelas && <input type="hidden" name="id" value={kelas.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="judul">Judul kelas</Label>
          <Input id="judul" name="judul" required defaultValue={kelas?.judul ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="program_id">Program</Label>
          <select
            id="program_id"
            name="program_id"
            required
            defaultValue={kelas?.program_id ?? ""}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">— pilih program —</option>
            {program.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Slug, jenjang, subjudul, prasyarat, harga, dan durasi kelas ini
            otomatis mengikuti program yang dipilih — diatur sekali di{" "}
            <Link href="/admin/program" className="text-primary hover:underline">
              Template Program
            </Link>
            .
          </p>
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-lg border p-4">
        <Checkbox
          id="is_published"
          name="is_published"
          value="true"
          defaultChecked={kelas?.is_published ?? false}
        />
        <span>
          <span className="block text-sm font-medium">Terbitkan kelas</span>
          <span className="block text-xs text-muted-foreground">
            Kelas yang terbit muncul di katalog publik dan bisa didaftari.
          </span>
        </span>
      </label>

      {hasil?.pesan && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{hasil.pesan}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" size="lg" disabled={sedang}>
        {sedang && <Loader2 className="size-4 animate-spin" />}
        {kelas ? "Simpan Perubahan" : "Buat Kelas"}
      </Button>
    </form>
  );
}
