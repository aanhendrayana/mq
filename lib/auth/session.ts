import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const KUNCI_RAHASIA = new TextEncoder().encode(
  process.env.AUTH_SECRET || "1cc13c80c46047f066addca0d6d3b1fe8f5705774573a927cda6b9974fa684cc"
);

export const NAMA_COOKIE_SESI = "mq_session";
const DURASI_DETIK = 60 * 60 * 24 * 7; // 7 hari

export type PayloadSesi = {
  id: string;
  email: string;
  peran: "santri" | "ustadz" | "admin";
};

/**
 * Membuat token JWT bertanda tangan untuk sesi pengguna.
 */
export async function buatTokenSesi(payload: PayloadSesi): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(KUNCI_RAHASIA);
}

/**
 * Memverifikasi keabsahan token JWT sesi.
 */
export async function verifikasiTokenSesi(token: string): Promise<PayloadSesi | null> {
  try {
    const { payload } = await jwtVerify(token, KUNCI_RAHASIA);
    return payload as unknown as PayloadSesi;
  } catch {
    return null;
  }
}

/**
 * Menyimpan cookie sesi di respons HTTP.
 */
export async function pasangCookieSesi(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(NAMA_COOKIE_SESI, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURASI_DETIK,
  });
}

/**
 * Menghapus cookie sesi saat keluar (logout).
 */
export async function hapusCookieSesi(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(NAMA_COOKIE_SESI, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Mengambil token sesi dari cookie yang sedang aktif.
 */
export async function ambilTokenDariCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(NAMA_COOKIE_SESI)?.value ?? null;
}
