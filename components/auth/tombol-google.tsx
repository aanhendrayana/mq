import { AlertCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { pesanGalatGoogle } from "@/lib/auth/google";

function IkonGoogle() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.5Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.3l-3.3-2.6c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.7A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-3.9V7.4H3a10 10 0 0 0 0 9.3L6.4 14Z" />
      <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.8 9.8 0 0 0 3 7.4l3.4 2.7C7.2 7.7 9.4 5.9 12 5.9Z" />
    </svg>
  );
}

/** Peringatan kegagalan alur Google, bila halaman dibuka dengan ?error=... */
export function GalatGoogle({ kode }: { kode?: string }) {
  if (!kode) return null;
  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertDescription>{pesanGalatGoogle(kode)}</AlertDescription>
    </Alert>
  );
}

/**
 * Tombol menuju alur OAuth Google. Sengaja tautan biasa, bukan tombol form:
 * alurnya adalah navigasi penuh ke Google, bukan pengiriman data.
 *
 * `asal` menentukan halaman yang dituju kembali bila alurnya gagal, dan
 * `tujuan` halaman yang dibuka setelah berhasil masuk.
 */
export function TombolGoogle({
  asal,
  tujuan,
  label,
}: {
  asal: "/masuk" | "/daftar";
  tujuan?: string;
  label: string;
}) {
  const query = new URLSearchParams({ asal });
  if (tujuan) query.set("next", tujuan);

  return (
    <a
      href={`/auth/google?${query.toString()}`}
      className={buttonVariants({ variant: "outline", size: "lg", className: "h-11 w-full gap-3" })}
    >
      <IkonGoogle />
      {label}
    </a>
  );
}

/** Garis pemisah "atau ..." antara tombol Google dan form email. */
export function PemisahAtau({ teks }: { teks: string }) {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground">{teks}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
