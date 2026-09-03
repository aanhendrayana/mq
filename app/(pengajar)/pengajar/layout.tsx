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
            { href: "/pengajar", label: "Angkatan Saya", ikon: "users", persis: true },
            { href: "/pengajar/jadwal", label: "Jadwal Mengajar", ikon: "calendar" },
            { href: "/pengajar/santri", label: "Santriwati Bimbingan", ikon: "topi-wisuda" },
          ],
        },
      ]}
    >
      {children}
    </KerangkaDasbor>
  );
}
