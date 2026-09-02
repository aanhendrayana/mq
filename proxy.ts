import { NextResponse, type NextRequest } from "next/server";
import { segarkanSesi } from "@/lib/supabase/proxy";

/** Awalan rute yang butuh login, beserta peran yang diizinkan. */
const RUTE_TERKUNCI: { awalan: string; peran: string[] }[] = [
  { awalan: "/admin", peran: ["admin"] },
  { awalan: "/pengajar", peran: ["ustadz", "admin"] },
  { awalan: "/belajar", peran: ["santri", "ustadz", "admin"] },
];

const RUTE_TAMU = ["/masuk", "/daftar", "/lupa-sandi"];

export async function proxy(request: NextRequest) {
  const { response, supabase, user } = await segarkanSesi(request);
  const path = request.nextUrl.pathname;
  const terkunci = RUTE_TERKUNCI.find((r) => path.startsWith(r.awalan));

  if (terkunci && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/masuk";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }

  if (user && (terkunci || RUTE_TAMU.includes(path))) {
    const { data: profil } = await supabase
      .from("profiles")
      .select("peran")
      .eq("id", user.id)
      .single();
    const peran = profil?.peran ?? "santri";
    const beranda =
      peran === "admin" ? "/admin" : peran === "ustadz" ? "/pengajar" : "/belajar";

    // Sudah masuk tapi membuka halaman login → antar ke berandanya.
    if (RUTE_TAMU.includes(path)) {
      const url = request.nextUrl.clone();
      url.pathname = request.nextUrl.searchParams.get("next") ?? beranda;
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (terkunci && !terkunci.peran.includes(peran)) {
      const url = request.nextUrl.clone();
      url.pathname = beranda;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Semua rute kecuali berkas statis dan gambar. Proxy tetap dijalankan di
     * rute publik karena tugas utamanya menyegarkan token sesi Supabase.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
