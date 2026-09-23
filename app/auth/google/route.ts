import { randomBytes, createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  asalAman,
  COOKIE_GOOGLE_ASAL,
  COOKIE_GOOGLE_NONCE,
  COOKIE_GOOGLE_STATE,
  COOKIE_GOOGLE_TUJUAN,
  COOKIE_GOOGLE_VERIFIER,
  tujuanAman,
  UMUR_COOKIE_OAUTH,
} from "@/lib/auth/google";

function base64Url(buffer: Buffer): string {
  return buffer.toString("base64url");
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const tujuan = tujuanAman(request.nextUrl.searchParams.get("next"));
  const asal = asalAman(request.nextUrl.searchParams.get("asal"));

  if (!clientId || !clientSecret) {
    const kembali = new URL(asal, request.url);
    kembali.searchParams.set("error", "google_belum_dikonfigurasi");
    if (tujuan !== "/belajar") kembali.searchParams.set("next", tujuan);
    return NextResponse.redirect(kembali);
  }

  const state = base64Url(randomBytes(32));
  const verifier = base64Url(randomBytes(48));
  const nonce = base64Url(randomBytes(32));
  const challenge = base64Url(createHash("sha256").update(verifier).digest());
  const asalSitus = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const callback = new URL("/auth/google/callback", asalSitus).toString();

  const otorisasi = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  otorisasi.searchParams.set("client_id", clientId);
  otorisasi.searchParams.set("redirect_uri", callback);
  otorisasi.searchParams.set("response_type", "code");
  otorisasi.searchParams.set("scope", "openid email profile");
  otorisasi.searchParams.set("state", state);
  otorisasi.searchParams.set("nonce", nonce);
  otorisasi.searchParams.set("code_challenge", challenge);
  otorisasi.searchParams.set("code_challenge_method", "S256");
  otorisasi.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(otorisasi);
  const opsiCookie = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: UMUR_COOKIE_OAUTH,
  };
  response.cookies.set(COOKIE_GOOGLE_STATE, state, opsiCookie);
  response.cookies.set(COOKIE_GOOGLE_VERIFIER, verifier, opsiCookie);
  response.cookies.set(COOKIE_GOOGLE_NONCE, nonce, opsiCookie);
  response.cookies.set(COOKIE_GOOGLE_TUJUAN, tujuan, opsiCookie);
  response.cookies.set(COOKIE_GOOGLE_ASAL, asal, opsiCookie);
  return response;
}
