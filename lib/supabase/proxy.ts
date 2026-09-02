import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

/**
 * Menyegarkan token sesi Supabase dan mengembalikan pengguna yang sedang masuk.
 *
 * Objek `response` yang dikembalikan HARUS ikut dikirim (atau cookie-nya
 * disalin), kalau tidak token yang baru disegarkan akan hilang dan pengguna
 * terlempar keluar secara acak.
 */
export async function segarkanSesi(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Jangan diganti getSession(): nilainya berasal dari cookie yang bisa
  // dipalsukan. getUser() memvalidasi token ke server Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, supabase, user };
}
