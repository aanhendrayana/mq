import type { Metadata } from "next";
import { BookOpenCheck, HeartHandshake, ShieldCheck, Target, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TautanTombol } from "@/components/ui/tautan-tombol";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilPengasuh } from "@/lib/pengaturan";
import { inisial } from "@/lib/format";

export const metadata: Metadata = {
  title: "Tentang Kami",
  description:
    "Madrasah Qur'an daring khusus muslimah. Materi video terstruktur dipadukan halaqah setoran bersama ustadzah pembimbing.",
};

const NILAI = [
  {
    ikon: BookOpenCheck,
    judul: "Bacaan yang benar lebih utama daripada bacaan yang cepat",
    isi: "Kami tidak mengejar target selesai. Satu huruf yang dilafalkan dengan benar lebih kami hargai daripada satu juz yang dibaca terburu-buru.",
  },
  {
    ikon: Users,
    judul: "Setiap santriwati didengarkan",
    isi: "Kesalahan makhraj tidak bisa ditemukan lewat video. Karena itu setiap kelas punya halaqah setoran, dan setiap angkatan dibatasi jumlahnya.",
  },
  {
    ikon: HeartHandshake,
    judul: "Tidak ada yang terlambat memulai",
    isi: "Banyak santriwati kami mulai belajar di usia 40, 50, bahkan 60 tahun. Kelas dirancang agar tidak ada yang merasa malu untuk bertanya.",
  },
  {
    ikon: ShieldCheck,
    judul: "Ruang belajar yang menjaga",
    isi: "Seluruh santriwati dan pengajarnya muslimah. Tidak ada laki-laki di kelas maupun di halaqah, sehingga Anda bisa membaca sekeras yang diperlukan tanpa ragu.",
  },
  {
    ikon: Target,
    judul: "Kemajuan yang bisa dilihat",
    isi: "Makhraj, tajwid, kelancaran, dan adab dinilai tiap pertemuan, lalu dirangkum dalam rapor. Santriwati tahu persis di mana letak perbaikannya.",
  },
];

export default async function TentangPage() {
  const supabase = await buatKlienServer();
  const [{ data: pengajar }, pengasuh] = await Promise.all([
    supabase.from("pengajar_publik").select("*").limit(12),
    ambilPengasuh(),
  ]);

  return (
    <>
      <section className="pola-islami border-b bg-secondary/30">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="teks-arab mb-6 text-2xl text-primary/70">
            خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
          </p>
          <h1 className="font-heading text-4xl leading-tight font-bold text-balance">
            Madrasah Qur&apos;an Ummina
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-pretty text-muted-foreground">
            Madrasah Qur&apos;an daring <strong className="font-semibold text-foreground">khusus
            muslimah</strong>. Kami membimbing dari yang belum mengenal huruf
            hingga yang bersiap menjadi ustadzah pengajar.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="font-heading text-2xl font-bold">Mengapa kami ada</h2>
        <div className="mt-5 space-y-4 leading-relaxed text-muted-foreground">
          <p>
            Banyak kaum muslimin sudah bisa membaca Al-Qur&apos;an sejak kecil,
            tetapi tidak pernah ada yang mengoreksi bacaannya sesudah itu.
            Kesalahan kecil pada makhraj atau panjang mad terbawa bertahun-tahun
            tanpa disadari — bukan karena malas belajar, melainkan karena tidak
            ada yang mendengarkan.
          </p>
          <p>
            Kursus daring biasa tidak menyelesaikan masalah ini. Video bisa
            menjelaskan teori tajwid dengan sangat baik, tetapi tidak bisa
            memberi tahu Anda bahwa huruf ذ yang Anda ucapkan terdengar seperti
            ز. Yang dibutuhkan adalah seseorang yang mendengarkan dan
            membetulkan.
          </p>
          <p>
            Karena itu setiap kelas di Madrasah Qur&apos;an Ummina menggabungkan
            dua hal: materi video yang bisa Anda ulang sesuka hati di rumah, dan
            halaqah setoran terjadwal tempat bacaan Anda benar-benar dikoreksi
            oleh ustadzah.
          </p>
          <p>
            Dan kami memilih menjadi madrasah khusus muslimah bukan sekadar
            sebagai aturan, melainkan karena itu yang membuat belajar jadi
            mungkin. Banyak muslimah sungkan mengeraskan bacaannya bila ada
            laki-laki yang mendengar — padahal tanpa mengeraskan bacaan,
            kesalahannya tidak akan pernah ketahuan. Di sini seluruh santriwati
            dan pengajarnya perempuan, jadi tidak ada alasan untuk menahan suara.
          </p>
        </div>
      </section>

      <section className="border-y bg-secondary/30 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="font-heading text-2xl font-bold">Yang kami pegang</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {NILAI.map((n) => (
              <Card key={n.judul} className="gap-3 p-6">
                <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <n.ikon className="size-5" />
                </div>
                <h3 className="font-heading font-semibold">{n.judul}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{n.isi}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {pengasuh && (
        <section className="mx-auto max-w-5xl px-4 pt-16">
          <h2 className="font-heading text-2xl font-bold">Pengasuh madrasah</h2>
          <Card className="mt-6 flex-col gap-5 p-7 sm:flex-row sm:items-start">
            <span className="grid size-20 shrink-0 place-items-center rounded-full bg-primary/10 font-heading text-2xl font-bold text-primary">
              {inisial(pengasuh.nama)}
            </span>
            <div className="min-w-0">
              <h3 className="font-heading text-xl font-bold">{pengasuh.nama}</h3>
              {pengasuh.peran && (
                <p className="mt-0.5 text-sm font-medium text-primary">{pengasuh.peran}</p>
              )}
              {pengasuh.bio && (
                <p className="mt-3 leading-relaxed text-pretty text-muted-foreground">
                  {pengasuh.bio}
                </p>
              )}
            </div>
          </Card>
        </section>
      )}

      {pengajar && pengajar.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="font-heading text-2xl font-bold">Ustadzah pembimbing</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pengajar.map((u) => (
              <Card key={u.id} className="flex-row items-start gap-4 p-5">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary font-semibold text-secondary-foreground">
                  {inisial(u.nama)}
                </span>
                <div className="min-w-0">
                  <h3 className="font-heading font-semibold">{u.nama}</h3>
                  {u.bio && (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {u.bio}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-3xl px-4 pb-20 text-center">
        <h2 className="font-heading text-2xl font-bold">Siap memulai?</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Pilih kelas sesuai kemampuan Anda saat ini. Belum yakin ada di jenjang
          mana? Hubungi kami untuk tes penempatan gratis.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <TautanTombol href="/program" size="lg" className="h-11 px-6">
            Lihat Program
          </TautanTombol>
          <TautanTombol href="/kontak" size="lg" variant="outline" className="h-11 px-6">
            Hubungi Kami
          </TautanTombol>
        </div>
      </section>
    </>
  );
}
