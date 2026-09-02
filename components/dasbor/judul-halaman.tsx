export function JudulHalaman({
  judul,
  keterangan,
  aksi,
}: {
  judul: string;
  keterangan?: string;
  aksi?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-heading text-2xl font-bold tracking-tight">{judul}</h1>
        {keterangan && (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{keterangan}</p>
        )}
      </div>
      {aksi && <div className="flex shrink-0 gap-2">{aksi}</div>}
    </div>
  );
}

export function KeadaanKosong({
  ikon: Ikon,
  judul,
  keterangan,
  aksi,
}: {
  ikon: React.ComponentType<{ className?: string }>;
  judul: string;
  keterangan: string;
  aksi?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
      <Ikon className="size-10 text-muted-foreground" />
      <h2 className="font-heading text-lg font-semibold">{judul}</h2>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{keterangan}</p>
      {aksi && <div className="mt-2">{aksi}</div>}
    </div>
  );
}
