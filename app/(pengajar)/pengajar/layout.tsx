import { CalendarDays, GraduationCap, Users } from "lucide-react";
import { KerangkaDasbor } from "@/components/dasbor/kerangka";
import { wajibPengajar } from "@/lib/auth";

export default async function PengajarLayout({ children }: LayoutProps<"/pengajar">) {
  const pengguna = await wajibPengajar();

  return (
    <KerangkaDasbor
      pengguna={pengguna}
      judulPanel="Panel Pengajar"
      nav={[
        {
          item: [
            { href: "/pengajar", label: "Angkatan Saya", ikon: Users, persis: true },
            { href: "/pengajar/jadwal", label: "Jadwal Mengajar", ikon: CalendarDays },
            { href: "/pengajar/santri", label: "Santri Bimbingan", ikon: GraduationCap },
          ],
        },
      ]}
    >
      {children}
    </KerangkaDasbor>
  );
}
