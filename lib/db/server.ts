import { PostgresClient } from "@/lib/db/klien";

/**
 * Klien PostgreSQL langsung untuk Server Component, Server Action, dan Route Handler.
 */
export async function buatKlienServer(): Promise<PostgresClient> {
  return new PostgresClient();
}
