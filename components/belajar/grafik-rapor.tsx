"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ASPEK_NILAI } from "@/lib/konstanta";

export type TitikRapor = {
  label: string;
  tanggal: string;
  materi: string | null;
  nilai_makhraj: number;
  nilai_tajwid: number;
  nilai_kelancaran: number;
  nilai_adab: number;
};

/**
 * Warna seri diambil dari palet kategorikal yang sudah divalidasi
 * (lightness band, chroma floor, pemisahan buta warna, kontras).
 * Slot 1–4: biru, jingga, aqua, kuning. Jangan diganti tanpa memvalidasi ulang.
 *
 * Di mode terang, aqua & kuning berada di bawah kontras 3:1 terhadap latar —
 * karena itu halaman ini WAJIB tetap menyertakan tabel nilai di bawah grafik
 * sebagai jalur baca alternatif.
 */
const SERI = [
  { kunci: "nilai_makhraj", label: "Makhraj", warna: "var(--seri-1)" },
  { kunci: "nilai_tajwid", label: "Tajwid", warna: "var(--seri-2)" },
  { kunci: "nilai_kelancaran", label: "Kelancaran", warna: "var(--seri-3)" },
  { kunci: "nilai_adab", label: "Adab", warna: "var(--seri-4)" },
] as const;

type PropsTooltip = {
  active?: boolean;
  payload?: { dataKey?: string | number; value?: number; color?: string }[];
  label?: string | number;
};

function IsiTooltip({ active, payload, label }: PropsTooltip) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-popover-foreground">{label}</p>
      <ul className="space-y-1">
        {payload.map((p) => {
          const seri = SERI.find((s) => s.kunci === p.dataKey);
          return (
            <li key={String(p.dataKey)} className="flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ background: p.color }}
                aria-hidden
              />
              <span className="flex-1 text-muted-foreground">{seri?.label}</span>
              <span className="font-medium tabular-nums text-popover-foreground">
                {p.value}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function GrafikRapor({ data }: { data: TitikRapor[] }) {
  return (
    <div className="viz-rapor">
      <style>{`
        .viz-rapor {
          --seri-1: #2a78d6;
          --seri-2: #eb6834;
          --seri-3: #1baf7a;
          --seri-4: #eda100;
        }
        :root:not([data-theme="light"]) .dark .viz-rapor,
        .dark .viz-rapor {
          --seri-1: #3987e5;
          --seri-2: #d95926;
          --seri-3: #199e70;
          --seri-4: #c98500;
        }
      `}</style>

      {/* Legenda selalu ada untuk >= 2 seri: identitas tidak boleh bergantung
          pada warna saja. Teks memakai token teks, bukan warna seri. */}
      <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-2">
        {SERI.map((s) => (
          <li key={s.kunci} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className="h-0.5 w-4 shrink-0 rounded-full"
              style={{ background: s.warna }}
              aria-hidden
            />
            {s.label}
          </li>
        ))}
      </ul>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
          <CartesianGrid
            stroke="var(--border)"
            strokeWidth={1}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            content={<IsiTooltip />}
            cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
          />
          {SERI.map((s) => (
            <Line
              key={s.kunci}
              type="monotone"
              dataKey={s.kunci}
              name={s.label}
              stroke={s.warna}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              // Cincin 2px berwarna latar agar titik tetap terbaca saat garis
              // saling bersilangan.
              dot={{ r: 4, fill: s.warna, stroke: "var(--card)", strokeWidth: 2 }}
              activeDot={{ r: 5, fill: s.warna, stroke: "var(--card)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <p className="sr-only">
        Grafik perkembangan nilai setoran pada empat aspek:{" "}
        {ASPEK_NILAI.map((a) => a.label).join(", ")}. Nilai lengkap tiap
        pertemuan tersedia pada tabel di bawah grafik.
      </p>
    </div>
  );
}
