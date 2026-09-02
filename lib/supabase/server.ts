import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

/**
 * Klien Supabase untuk Server Component, Server Action, dan Route Handler.
 * Tetap memakai anon key sehingga RLS berlaku penuh untuk pengguna yang masuk.
 */
export async function buatKlienServer() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component tidak boleh menulis cookie. Aman diabaikan:
            // middleware.ts sudah menyegarkan sesi pada setiap permintaan.
          }
        },
      },
    },
  );
}
