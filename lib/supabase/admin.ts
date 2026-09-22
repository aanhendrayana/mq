import "server-only";
import { PostgresClient } from "@/lib/db/klien";

/**
 * Klien PostgreSQL admin untuk operasi latar dan upload berkas privat.
 */
export function buatKlienAdmin() {
  return new PostgresClient();
}
