import { NextResponse, type NextRequest } from "next/server";
import { buatKlienServer } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Titik pendaratan tautan email Supabase (konfirmasi pendaftaran, atur ulang
 * kata sandi, undangan). Menukar token pada URL menjadi sesi, lalu mengantar
 * pengguna ke halaman tujuan.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/belajar";

  const supabase = await buatKlienServer();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(
    `${origin}/masuk?galat=${encodeURIComponent(
      "Tautan konfirmasi tidak berlaku atau sudah kedaluwarsa. Silakan minta tautan baru.",
    )}`,
  );
}
