import { format, formatDistanceToNowStrict } from "date-fns";
import { id as localeId } from "date-fns/locale";

const ZONA = "Asia/Jakarta";

/** Rp 450.000 */
export function rupiah(nilai: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(nilai);
}

/** "450.137" — untuk menonjolkan nominal transfer beserta kode uniknya. */
export function angka(nilai: number): string {
  return new Intl.NumberFormat("id-ID").format(nilai);
}

/** 3 September 2026 */
export function tanggal(nilai: string | Date): string {
  return format(new Date(nilai), "d MMMM yyyy", { locale: localeId });
}

/** Rabu, 3 September 2026 · 19.30 WIB */
export function tanggalJam(nilai: string | Date): string {
  const d = new Date(nilai);
  const hari = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: ZONA,
  }).format(d);
  const jam = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ZONA,
  }).format(d);
  return `${hari} · ${jam} WIB`;
}

/** 19.30 WIB */
export function jam(nilai: string | Date): string {
  return (
    new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: ZONA,
    }).format(new Date(nilai)) + " WIB"
  );
}

/** "3 hari lagi" / "2 jam lalu" */
export function jarakWaktu(nilai: string | Date): string {
  const d = new Date(nilai);
  const lampau = d.getTime() < Date.now();
  const jarak = formatDistanceToNowStrict(d, { locale: localeId });
  return lampau ? `${jarak} lalu` : `${jarak} lagi`;
}

/** 1320 detik → "22 menit"; 4500 → "1 jam 15 menit" */
export function durasi(detik: number): string {
  if (!detik) return "—";
  const j = Math.floor(detik / 3600);
  const m = Math.round((detik % 3600) / 60);
  if (j === 0) return `${m} menit`;
  return m === 0 ? `${j} jam` : `${j} jam ${m} menit`;
}

/** 1320 detik → "22:00" untuk label di pemutar video */
export function jamTayang(detik: number): string {
  const m = Math.floor(detik / 60);
  const s = Math.floor(detik % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function inisial(nama: string): string {
  return nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((k) => k[0]?.toUpperCase() ?? "")
    .join("");
}

/** Menormalkan nomor HP Indonesia ke format wa.me: 08... → 628... */
export function nomorWa(nomor: string): string {
  const bersih = nomor.replace(/\D/g, "");
  if (bersih.startsWith("62")) return bersih;
  if (bersih.startsWith("0")) return `62${bersih.slice(1)}`;
  return bersih;
}
