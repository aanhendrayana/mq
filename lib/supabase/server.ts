import { PostgresClient } from "@/lib/db/klien";

/**
 * Klien PostgreSQL langsung untuk Server Component, Server Action, dan Route Handler.
 * Berjalan langsung di atas database PostgreSQL tanpa perantara Supabase.
 */
export async function buatKlienServer() {
  return new PostgresClient();
}
