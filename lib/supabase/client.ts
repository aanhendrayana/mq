import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/** Klien Supabase untuk Client Component. Memakai anon key + RLS. */
export function buatKlienBrowser() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
