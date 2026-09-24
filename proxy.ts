import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { NAMA_COOKIE_SESI, type PayloadSesi } from "@/lib/auth/session";
import { berandaUntukPeran, type Peran } from "@/lib/konstanta";

const KUNCI_RAHASIA = new TextEncoder().encode(
  process.env.AUTH_SECRET || "1cc13c80c46047f066addca0d6d3b1fe8f5705774573a927cda6b9974fa684cc"
);

/**
 * Awalan rute yang butuh login, beserta peran yang diizinkan. Cukup punya
 * salah satu (pengguna bisa berperan ganda, mis. Ustadzah + Santri).
 */
const RUTE_TERKUNCI: { awalan: string; peran: Peran[] }[] = [
  { awalan: "/admin", peran: ["admin", "ummi"] },
  { awalan: "/pengajar", peran: ["ustadz", "admin", "ummi"] },
  { awalan: "/belajar", peran: ["tamu", "santri", "ustadz", "admin", "ummi"] },
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
    const peranList: Peran[] = user.peranList?.length ? user.peranList : ["tamu"];
    const beranda = berandaUntukPeran(peranList);

    // Sudah login tapi membuka halaman tamu (masuk/daftar) → antar ke berandanya
    if (RUTE_TAMU.includes(path)) {
      const url = request.nextUrl.clone();
      url.pathname = request.nextUrl.searchParams.get("next") ?? beranda;
      url.search = "";
      return NextResponse.redirect(url);
    }

    // Tidak satu pun peran pengguna diizinkan membuka segmen ini
    if (terkunci && !terkunci.peran.some((p) => peranList.includes(p))) {
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
