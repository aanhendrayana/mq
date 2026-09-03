"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  simpanPengaturanAction,
  type HasilPengaturan,
} from "@/app/(admin)/admin/pengaturan/actions";
import type { Hero, Kontak, Rekening } from "@/lib/pengaturan";

export function FormPengaturan({
  kontak,
  rekening,
  hero,
  statistik,
}: {
  kontak: Kontak;
  rekening: Rekening;
  hero: Hero;
  statistik: Record<string, string>;
}) {
  const [hasil, kirim, sedang] = useActionState<HasilPengaturan, FormData>(
    simpanPengaturanAction,
    undefined,
  );

  return (
    <form action={kirim} className="space-y-6">
      <Card className="gap-4 p-6">
        <h2 className="font-heading font-semibold">Kontak</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="wa">Nomor WhatsApp</Label>
            <Input id="wa" name="wa" required defaultValue={kontak.whatsapp} />
            <p className="text-xs text-muted-foreground">
              Boleh diisi 08… — akan dinormalkan menjadi 62… secara otomatis.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required defaultValue={kontak.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input id="instagram" name="instagram" defaultValue={kontak.instagram} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alamat">Alamat</Label>
            <Input id="alamat" name="alamat" defaultValue={kontak.alamat} />
          </div>
        </div>
      </Card>

      <Card className="gap-4 p-6">
        <div>
          <h2 className="font-heading font-semibold">Rekening pembayaran</h2>
          <p className="text-sm text-muted-foreground">
            Ditampilkan pada halaman tagihan santriwati. Periksa dua kali — kesalahan
            di sini membuat uang santriwati masuk ke rekening yang salah.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="bank">Bank</Label>
            <Input id="bank" name="bank" required defaultValue={rekening.bank} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="no_rek">Nomor rekening</Label>
            <Input id="no_rek" name="no_rek" required defaultValue={rekening.nomor} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="atas_nama">Atas nama</Label>
            <Input id="atas_nama" name="atas_nama" required defaultValue={rekening.atas_nama} />
          </div>
        </div>
      </Card>

      <Card className="gap-4 p-6">
        <h2 className="font-heading font-semibold">Halaman depan</h2>
        <div className="space-y-2">
          <Label htmlFor="hero_judul">Judul utama</Label>
          <Input id="hero_judul" name="hero_judul" required defaultValue={hero.judul} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hero_subjudul">Subjudul</Label>
          <Textarea
            id="hero_subjudul"
            name="hero_subjudul"
            rows={3}
            required
            defaultValue={hero.subjudul}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hero_cta">Teks tombol utama</Label>
            <Input id="hero_cta" name="hero_cta" required defaultValue={hero.cta} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero_catatan">Label kecil di atas judul</Label>
            <Input id="hero_catatan" name="hero_catatan" defaultValue={hero.catatan} />
          </div>
        </div>
      </Card>

      <Card className="gap-4 p-6">
        <div>
          <h2 className="font-heading font-semibold">Angka di halaman depan</h2>
          <p className="text-sm text-muted-foreground">
            Diisi manual sebagai teks bebas (mis. &ldquo;1.200+&rdquo;). Isi
            sesuai keadaan sebenarnya — angka yang dilebih-lebihkan merusak
            kepercayaan calon santriwati.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="stat_santri">Santriwati</Label>
            <Input id="stat_santri" name="stat_santri" defaultValue={statistik.santriwati ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stat_pengajar">Pengajar</Label>
            <Input
              id="stat_pengajar"
              name="stat_pengajar"
              defaultValue={statistik.pengajar ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stat_kelas">Kelas</Label>
            <Input id="stat_kelas" name="stat_kelas" defaultValue={statistik.kelas ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stat_kepuasan">Kepuasan</Label>
            <Input
              id="stat_kepuasan"
              name="stat_kepuasan"
              defaultValue={statistik.kepuasan ?? ""}
            />
          </div>
        </div>
      </Card>

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
        Simpan Pengaturan
      </Button>
    </form>
  );
}
