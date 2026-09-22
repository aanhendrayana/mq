import { PostgresClient } from "@/lib/db/klien";

/**
 * Klien PostgreSQL langsung untuk operasi level admin / service role.
 */
export function buatKlienAdmin(): PostgresClient {
  return new PostgresClient();
}
