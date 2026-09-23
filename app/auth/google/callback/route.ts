import { randomBytes, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { buatTokenSesi, NAMA_COOKIE_SESI } from "@/lib/auth/session";
import {
  asalAman,
  COOKIE_GOOGLE_ASAL,
  COOKIE_GOOGLE_NONCE,
  COOKIE_GOOGLE_STATE,
  COOKIE_GOOGLE_TUJUAN,
  COOKIE_GOOGLE_VERIFIER,
  COOKIE_SEMENTARA_GOOGLE,
  tujuanAman,
} from "@/lib/auth/google";

const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

function sama(a: string, b: string): boolean {
  const kiri = Buffer.from(a);
  const kanan = Buffer.from(b);
  return kiri.length === kanan.length && timingSafeEqual(kiri, kanan);
}

function hapusCookieOAuth(response: NextResponse) {
  for (const nama of COOKIE_SEMENTARA_GOOGLE) {
    response.cookies.set(nama, "", { path: "/", maxAge: 0 });
  }
}

/** Kembali ke halaman tempat pengguna menekan tombol Google, membawa pesan galat. */
function responsGagal(request: NextRequest, kode: string) {
  const asal = asalAman(request.cookies.get(COOKIE_GOOGLE_ASAL)?.value);
  const kembali = new URL(asal, request.url);
  kembali.searchParams.set("error", kode);
  const tujuan = tujuanAman(request.cookies.get(COOKIE_GOOGLE_TUJUAN)?.value);
  if (tujuan !== "/belajar") kembali.searchParams.set("next", tujuan);
  const response = NextResponse.redirect(kembali);
  hapusCookieOAuth(response);
  return response;
}

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("error")) {
    return responsGagal(request, "google_dibatalkan");
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const stateCookie = request.cookies.get(COOKIE_GOOGLE_STATE)?.value;
  const verifier = request.cookies.get(COOKIE_GOOGLE_VERIFIER)?.value;
  const nonce = request.cookies.get(COOKIE_GOOGLE_NONCE)?.value;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!code || !state || !stateCookie || !verifier || !nonce || !clientId || !clientSecret) {
    return responsGagal(request, "google_gagal");
  }
  if (!sama(state, stateCookie)) return responsGagal(request, "google_gagal");

  try {
    const asalSitus = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const callback = new URL("/auth/google/callback", asalSitus).toString();
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callback,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) return responsGagal(request, "google_gagal");

    const token = (await tokenResponse.json()) as { id_token?: string };
    if (!token.id_token) return responsGagal(request, "google_gagal");

    const { payload } = await jwtVerify(token.id_token, googleJwks, {
      audience: clientId,
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      algorithms: ["RS256"],
    });
    if (payload.nonce !== nonce) return responsGagal(request, "google_gagal");

    // Tanpa email terverifikasi, siapa pun bisa mengaku-aku alamat orang lain
    // dan mengambil alih akun yang sudah terdaftar dengan email yang sama.
    if (payload.email_verified !== true) {
      return responsGagal(request, "google_email_belum_terverifikasi");
    }

    const email = typeof payload.email === "string" ? payload.email.toLowerCase().trim() : "";
    const nama = typeof payload.name === "string" ? payload.name.trim() : "";
    const avatarUrl = typeof payload.picture === "string" ? payload.picture : null;
    if (!email || !nama) return responsGagal(request, "google_gagal");

    let user = await db.query.users.findFirst({ where: eq(users.email, email) });
    const penggunaBaru = !user;

    if (!user) {
      // Akun Google tidak punya kata sandi. Diisi hash acak yang tidak pernah
      // diberitahukan ke siapa pun, supaya kolomnya tetap terisi dan tidak ada
      // sandi kosong yang bisa ditebak.
      const passwordHash = await bcrypt.hash(randomBytes(48).toString("base64url"), 10);
      [user] = await db
        .insert(users)
        .values({ nama, email, avatarUrl, passwordHash, peran: "santri" })
        .returning();
    } else if (!user.avatarUrl && avatarUrl) {
      // Akun lama yang baru pertama kali memakai Google: pinjam fotonya saja.
      // Nama tidak ditimpa karena nama di sini yang tercetak di sertifikat.
      [user] = await db
        .update(users)
        .set({ avatarUrl, diubahAt: new Date() })
        .where(eq(users.id, user.id))
        .returning();
    }

    const sesi = await buatTokenSesi({ id: user.id, email: user.email, peran: user.peran });
    const tujuan = tujuanAman(request.cookies.get(COOKIE_GOOGLE_TUJUAN)?.value);

    // Google tidak memberi nomor WhatsApp, padahal admin memakainya untuk
    // mengabari verifikasi pembayaran dan jadwal halaqah. Pendaftar baru
    // diantar ke profil untuk melengkapinya dulu.
    const berikutnya = new URL(penggunaBaru ? "/belajar/profil" : tujuan, request.url);
    if (penggunaBaru) {
      berikutnya.searchParams.set("lengkapi", "1");
      if (tujuan !== "/belajar") berikutnya.searchParams.set("next", tujuan);
    }

    const response = NextResponse.redirect(berikutnya);
    response.cookies.set(NAMA_COOKIE_SESI, sesi, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    hapusCookieOAuth(response);
    return response;
  } catch {
    return responsGagal(request, "google_gagal");
  }
}
