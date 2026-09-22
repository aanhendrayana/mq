import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JudulHalaman } from "@/components/dasbor/judul-halaman";
import { PemilihPeran } from "@/components/admin/pemilih-peran";
import { wajibAdmin } from "@/lib/auth";
import { buatKlienServer } from "@/lib/db/server";
import { nomorWa, tanggal } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pengguna" };

const SARINGAN = [
  { kunci: "semua", label: "Semua" },
  { kunci: "santri", label: "Santriwati" },
  { kunci: "ustadz", label: "Ustadzah" },
  { kunci: "admin", label: "Admin" },
];

export default async function AdminPenggunaPage({
  searchParams,
}: PageProps<"/admin/pengguna">) {
  const admin = await wajibAdmin();
  const { peran } = await searchParams;
  const saring = typeof peran === "string" ? peran : "semua";

  const db = await buatKlienServer();

  let q = db.from("profiles").select("*").order("dibuat_at", { ascending: false });
  if (saring !== "semua") q = q.eq("peran", saring as "santri" | "ustadz" | "admin");
  const { data: pengguna } = await q;

  const { data: enroll } = await db.from("enrollments").select("santri_id");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <JudulHalaman
        judul="Pengguna"
        keterangan="Semua akun terdaftar. Naikkan peran seseorang menjadi ustadzah agar bisa membimbing angkatan."
      />

      <nav className="mb-6 flex flex-wrap gap-2">
        {SARINGAN.map((s) => (
          <Link key={s.kunci} href={`/admin/pengguna?peran=${s.kunci}`}>
            <Badge
              variant={s.kunci === saring ? "default" : "outline"}
              className={cn("cursor-pointer px-3 py-1.5 font-normal")}
            >
              {s.label}
            </Badge>
          </Link>
        ))}
      </nav>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Kota</TableHead>
                <TableHead className="text-right">Kelas</TableHead>
                <TableHead>Bergabung</TableHead>
                <TableHead>Peran</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(pengguna ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Tidak ada pengguna pada saringan ini.
                  </TableCell>
                </TableRow>
              ) : (
                (pengguna ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nama || "(tanpa nama)"}</TableCell>
                    <TableCell>
                      {p.no_hp ? (
                        <a
                          href={`https://wa.me/${nomorWa(p.no_hp)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {p.no_hp}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.kota ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(enroll ?? []).filter((e) => e.santri_id === p.id).length}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {tanggal(p.dibuat_at)}
                    </TableCell>
                    <TableCell>
                      <PemilihPeran
                        penggunaId={p.id}
                        peran={p.peran}
                        diriSendiri={p.id === admin.id}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
