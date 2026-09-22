import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { NAMA_COOKIE_SESI, type PayloadSesi } from "@/lib/auth/session";

const KUNCI_RAHASIA = new TextEncoder().encode(
  process.env.AUTH_SECRET || "1cc13c80c46047f066addca0d6d3b1fe8f5705774573a927cda6b9974fa684cc"
);

/** Awalan rute yang butuh login, beserta peran yang diizinkan. */
const RUTE_TERKUNCI: { awalan: string; peran: string[] }[] = [
  { awalan: "/admin", peran: ["admin"] },
  { awalan: "/pengajar", peran: ["ustadz", "admin"] },
  { awalan: "/belajar", peran: ["santri", "ustadz", "admin"] },
];

const RUTE_TAMU = ["/masuk", "/daftar", "/lupa-sandi"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get(NAMA_COOKIE_SESI)?.value;

  let user: PayloadSesi | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, KUNCI_RAHASIA);
      user = payload as unknown as PayloadSesi;
    } catch {
      user = null;
    }
  }

  const terkunci = RUTE_TERKUNCI.find((r) => path.startsWith(r.awalan));

  // Belum login tapi mencoba membuka rute privat
  if (terkunci && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/masuk";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }

  // Sudah login
  if (user) {
    const peran = user.peran ?? "santri";
    const beranda =
      peran === "admin" ? "/admin" : peran === "ustadz" ? "/pengajar" : "/belajar";

    // Sudah login tapi membuka halaman tamu (masuk/daftar) → antar ke berandanya
    if (RUTE_TAMU.includes(path)) {
      const url = request.nextUrl.clone();
      url.pathname = request.nextUrl.searchParams.get("next") ?? beranda;
      url.search = "";
      return NextResponse.redirect(url);
    }

    // Role tidak diizinkan membuka segmen tertentu
    if (terkunci && !terkunci.peran.includes(peran)) {
      const url = request.nextUrl.clone();
      url.pathname = beranda;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Semua rute kecuali berkas statis dan gambar.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
