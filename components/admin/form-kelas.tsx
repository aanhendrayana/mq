"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [hasil, kirim, sedang] = useActionState<HasilAdmin, FormData>(
    simpanKelasAction,
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug URL</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={kelas?.slug ?? ""}
            placeholder="dikosongkan = dibuat dari judul"
          />
          <p className="text-xs text-muted-foreground">
            Menjadi alamat halaman: /program/<em>slug</em>. Hindari mengubahnya
            setelah kelas dipromosikan — tautan lama akan mati.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jenjang">Jenjang</Label>
          <Input
            id="jenjang"
            name="jenjang"
            defaultValue={kelas?.jenjang ?? ""}
            placeholder="Dasar / Menengah / Jilid 3"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subjudul">Subjudul</Label>
        <Input
          id="subjudul"
          name="subjudul"
          defaultValue={kelas?.subjudul ?? ""}
          placeholder="Satu kalimat penjelas yang muncul di kartu katalog"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="deskripsi">Deskripsi lengkap</Label>
        <Textarea
          id="deskripsi"
          name="deskripsi"
          rows={5}
          defaultValue={kelas?.deskripsi ?? ""}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="apa_yang_dipelajari">Yang akan dikuasai</Label>
          <Textarea
            id="apa_yang_dipelajari"
            name="apa_yang_dipelajari"
            rows={5}
            defaultValue={(kelas?.apa_yang_dipelajari ?? []).join("\n")}
            placeholder="Satu poin per baris"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="untuk_siapa">Cocok untuk</Label>
          <Textarea
            id="untuk_siapa"
            name="untuk_siapa"
            rows={5}
            defaultValue={(kelas?.untuk_siapa ?? []).join("\n")}
            placeholder="Satu poin per baris"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prasyarat">Prasyarat</Label>
        <Textarea
          id="prasyarat"
          name="prasyarat"
          rows={2}
          defaultValue={kelas?.prasyarat ?? ""}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="harga">Harga (Rp)</Label>
          <Input
            id="harga"
            name="harga"
            type="number"
            min={0}
            required
            defaultValue={kelas?.harga ?? 0}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="harga_coret">Harga coret (Rp)</Label>
          <Input
            id="harga_coret"
            name="harga_coret"
            type="number"
            min={0}
            defaultValue={kelas?.harga_coret ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="durasi_pekan">Durasi (pekan)</Label>
          <Input
            id="durasi_pekan"
            name="durasi_pekan"
            type="number"
            min={1}
            defaultValue={kelas?.durasi_pekan ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="urutan">Urutan tampil</Label>
          <Input
            id="urutan"
            name="urutan"
            type="number"
            min={0}
            defaultValue={kelas?.urutan ?? 0}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="thumbnail_url">URL gambar sampul</Label>
        <Input
          id="thumbnail_url"
          name="thumbnail_url"
          type="url"
          defaultValue={kelas?.thumbnail_url ?? ""}
          placeholder="https://..."
        />
        <p className="text-xs text-muted-foreground">
          Unggah gambarnya ke bucket <code>materi</code> di Supabase Storage,
          lalu tempel URL publiknya di sini.
        </p>
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
      {hasil?.sukses && (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertDescription>{hasil.sukses}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" size="lg" disabled={sedang}>
        {sedang && <Loader2 className="size-4 animate-spin" />}
        {kelas ? "Simpan Perubahan" : "Buat Kelas"}
      </Button>
    </form>
  );
}
