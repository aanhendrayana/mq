import { penggunaSekarang } from "@/lib/auth";
import fs from "fs";
import path from "path";
import postgres from "postgres";
import type { Database } from "@/lib/database.types";

const connectionString =
  process.env.DATABASE_URL || "postgresql://aanhendrayana@localhost:5432/mq_ummina";

const globalForSql = globalThis as unknown as {
  sql: postgres.Sql | undefined;
};

export const sql = globalForSql.sql ?? postgres(connectionString, { prepare: false });
if (process.env.NODE_ENV !== "production") globalForSql.sql = sql;

type TablesAndViews = Database["public"]["Tables"] & Database["public"]["Views"];

type Filter = {
  type: "eq" | "neq" | "in" | "is" | "not_is" | "gte" | "lte" | "gt" | "lt" | "ilike" | "order" | "limit";
  col: string;
  val?: any;
  asc?: boolean;
};

export class TableQueryBuilder<Row = any> implements PromiseLike<{ data: (Row & Record<string, any>)[]; error: any; count?: number | null }> {
  private tableName: string;
  private operation: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private selectCols: string = "*";
  private countOpt?: string;
  private isHead: boolean = false;
  private insertData?: any;
  private updateData?: any;
  private filters: Filter[] = [];
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = "*", options?: { count?: string; head?: boolean }) {
    this.operation = "select";
    this.selectCols = columns;
    if (options?.count) this.countOpt = options.count;
    if (options?.head) this.isHead = true;
    return this;
  }

  insert(data: any) {
    this.operation = "insert";
    this.insertData = data;
    return this;
  }

  update(data: any) {
    this.operation = "update";
    this.updateData = data;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  upsert(data: any, _options?: any) {
    this.operation = "upsert";
    this.insertData = data;
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ type: "eq", col, val });
    return this;
  }

  neq(col: string, val: any) {
    this.filters.push({ type: "neq", col, val });
    return this;
  }

  in(col: string, val: any[]) {
    this.filters.push({ type: "in", col, val });
    return this;
  }

  is(col: string, val: any) {
    this.filters.push({ type: "is", col, val });
    return this;
  }

  not(col: string, operator: string, val: any) {
    if (operator === "is" && val === null) {
      this.filters.push({ type: "not_is", col, val });
    } else {
      this.filters.push({ type: "neq", col, val });
    }
    return this;
  }

  gte(col: string, val: any) {
    this.filters.push({ type: "gte", col, val });
    return this;
  }

  lte(col: string, val: any) {
    this.filters.push({ type: "lte", col, val });
    return this;
  }

  gt(col: string, val: any) {
    this.filters.push({ type: "gt", col, val });
    return this;
  }

  lt(col: string, val: any) {
    this.filters.push({ type: "lt", col, val });
    return this;
  }

  ilike(col: string, val: any) {
    this.filters.push({ type: "ilike", col, val });
    return this;
  }

  order(col: string, options?: { ascending?: boolean }) {
    this.filters.push({ type: "order", col, asc: options?.ascending ?? true });
    return this;
  }

  limit(n: number) {
    this.filters.push({ type: "limit", col: "", val: n });
    return this;
  }

  single(): Promise<{ data: Row & Record<string, any>; error: any }> {
    this.isSingle = true;
    return this.execute() as Promise<{ data: Row & Record<string, any>; error: any }>;
  }

  maybeSingle(): Promise<{ data: (Row & Record<string, any>) | null; error: any }> {
    this.isMaybeSingle = true;
    return this.execute() as Promise<{ data: (Row & Record<string, any>) | null; error: any }>;
  }

  then<TResult1 = { data: (Row & Record<string, any>)[]; error: any; count?: number | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: (Row & Record<string, any>)[]; error: any; count?: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled as any, onrejected);
  }

  private async execute(): Promise<{ data: any; error: any; count?: number | null }> {
    try {
      let table = this.tableName;
      if (table === "profiles") table = "users";

      const whereClauses: string[] = [];
      const values: any[] = [];
      let valIdx = 1;

      for (const f of this.filters) {
        if (f.type === "eq") {
          whereClauses.push(`"${f.col}" = $${valIdx++}`);
          values.push(f.val);
        } else if (f.type === "neq") {
          whereClauses.push(`"${f.col}" <> $${valIdx++}`);
          values.push(f.val);
        } else if (f.type === "gte") {
          whereClauses.push(`"${f.col}" >= $${valIdx++}`);
          values.push(f.val);
        } else if (f.type === "lte") {
          whereClauses.push(`"${f.col}" <= $${valIdx++}`);
          values.push(f.val);
        } else if (f.type === "gt") {
          whereClauses.push(`"${f.col}" > $${valIdx++}`);
          values.push(f.val);
        } else if (f.type === "lt") {
          whereClauses.push(`"${f.col}" < $${valIdx++}`);
          values.push(f.val);
        } else if (f.type === "ilike") {
          whereClauses.push(`"${f.col}" ILIKE $${valIdx++}`);
          values.push(f.val);
        } else if (f.type === "in") {
          const arr = Array.isArray(f.val) ? f.val : [f.val];
          if (arr.length === 0) {
            whereClauses.push("1=0");
          } else {
            const placeholders = arr.map(() => `$${valIdx++}`).join(", ");
            whereClauses.push(`"${f.col}" IN (${placeholders})`);
            values.push(...arr);
          }
        } else if (f.type === "is") {
          if (f.val === null) whereClauses.push(`"${f.col}" IS NULL`);
          else {
            whereClauses.push(`"${f.col}" IS $${valIdx++}`);
            values.push(f.val);
          }
        } else if (f.type === "not_is") {
          whereClauses.push(`"${f.col}" IS NOT NULL`);
        }
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

      const orderFilters = this.filters.filter((f) => f.type === "order");
      const orderSql =
        orderFilters.length > 0
          ? `ORDER BY ${orderFilters
              .map((f) => `"${f.col}" ${f.asc ? "ASC" : "DESC"}`)
              .join(", ")}`
          : "";

      const limitFilter = this.filters.find((f) => f.type === "limit");
      const limitSql = limitFilter ? `LIMIT ${limitFilter.val}` : "";

      // 1. SELECT
      if (this.operation === "select") {
        if (this.isHead) {
          const countQuery = `SELECT count(*)::int as count FROM "${table}" ${whereSql}`;
          const res = await sql.unsafe(countQuery, values);
          return { data: null, error: null, count: res[0]?.count ?? 0 };
        }

        let selectSql = "*";
        if (this.selectCols && this.selectCols !== "*") {
          const cleaned = this.selectCols.replace(/[a-zA-Z0-9_]+(!inner)?\([^)]*\)/g, "").trim();
          const cols = cleaned
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean)
            .map((c) => (c === "*" ? "*" : `"${c}"`));

          if (cols.length > 0) selectSql = cols.join(", ");
        }

        const query = `SELECT ${selectSql} FROM "${table}" ${whereSql} ${orderSql} ${limitSql}`;
        const rows = (await sql.unsafe(query, values)) as any[];

        // Relational embedding (courses, batches, profiles, programs)
        if (rows.length > 0 && this.selectCols) {
          // Embed courses
          if (this.selectCols.includes("courses(") || this.selectCols.includes("courses.*")) {
            const courseIds = [...new Set(rows.map((r) => r.course_id || r.id).filter(Boolean))];
            if (courseIds.length > 0) {
              const cRows = await sql`SELECT * FROM courses WHERE id IN ${sql(courseIds)};`;
              const cMap = new Map(cRows.map((c) => [c.id, c]));
              rows.forEach((r) => {
                r.courses = cMap.get(r.course_id) || null;
              });
            }
          }

          // Embed batches
          if (this.selectCols.includes("batches(")) {
            const batchIds = [...new Set(rows.map((r) => r.batch_id || r.id).filter(Boolean))];
            if (batchIds.length > 0) {
              const bRows = await sql`SELECT * FROM batches WHERE id IN ${sql(batchIds)};`;
              const bMap = new Map(bRows.map((b) => [b.id, b]));
              rows.forEach((r) => {
                r.batches = bMap.get(r.batch_id) || null;
              });
            }
          }

          // Embed profiles
          if (this.selectCols.includes("profiles(")) {
            const userIds = [
              ...new Set(
                rows.map((r) => r.santri_id || r.ustadz_id || r.user_id || r.diverifikasi_oleh || r.id).filter(Boolean)
              ),
            ];
            if (userIds.length > 0) {
              const uRows = await sql`SELECT * FROM users WHERE id IN ${sql(userIds)};`;
              const uMap = new Map(uRows.map((u) => [u.id, u]));
              rows.forEach((r) => {
                r.profiles = uMap.get(r.santri_id || r.ustadz_id || r.user_id || r.diverifikasi_oleh || r.id) || null;
              });
            }
          }

          // Embed programs
          if (this.selectCols.includes("programs(") || this.selectCols.includes("programs!inner(")) {
            const progIds = [...new Set(rows.map((r) => r.program_id || r.id).filter(Boolean))];
            if (progIds.length > 0) {
              const pRows = await sql`SELECT * FROM programs WHERE id IN ${sql(progIds)};`;
              const pMap = new Map(pRows.map((p) => [p.id, p]));
              rows.forEach((r) => {
                r.programs = pMap.get(r.program_id) || null;
              });
            }
          }
        }

        let count: number | null = null;
        if (this.countOpt) {
          const countRes = await sql.unsafe(`SELECT count(*)::int as count FROM "${table}" ${whereSql}`, values);
          count = countRes[0]?.count ?? 0;
        }

        if (this.isSingle) {
          if (rows.length === 0) return { data: null, error: { message: "Row not found" } };
          return { data: rows[0], error: null, count };
        }

        if (this.isMaybeSingle) {
          return { data: rows[0] ?? null, error: null, count };
        }

        return { data: rows, error: null, count };
      }

      // 2. INSERT
      if (this.operation === "insert") {
        const rowsToInsert = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
        if (rowsToInsert.length === 0) return { data: [], error: null };

        const insertedRows: any[] = [];
        for (const row of rowsToInsert) {
          const keys = Object.keys(row);
          const cols = keys.map((k) => `"${k}"`).join(", ");
          const placeholders = keys.map(() => `$${valIdx++}`).join(", ");
          values.push(...Object.values(row));
          const query = `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) RETURNING *`;
          const res = await sql.unsafe(query, values);
          insertedRows.push(res[0]);
        }

        const data = Array.isArray(this.insertData) ? insertedRows : insertedRows[0];
        if (this.isSingle) {
          return { data: insertedRows[0] ?? null, error: null };
        }
        return { data, error: null };
      }

      // 3. UPDATE
      if (this.operation === "update") {
        const keys = Object.keys(this.updateData);
        if (keys.length === 0) return { data: [], error: null };

        const setClauses: string[] = [];
        const updateValues: any[] = [];
        let uValIdx = 1;

        for (const k of keys) {
          setClauses.push(`"${k}" = $${uValIdx++}`);
          updateValues.push(this.updateData[k]);
        }

        const combinedValues = [...updateValues];
        const whereClausesUpdate = whereClauses.map((clause) => {
          return clause.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + updateValues.length}`);
        });
        combinedValues.push(...values);

        const whereSqlUpdate = whereClausesUpdate.length > 0 ? `WHERE ${whereClausesUpdate.join(" AND ")}` : "";
        const query = `UPDATE "${table}" SET ${setClauses.join(", ")} ${whereSqlUpdate} RETURNING *`;
        const rows = await sql.unsafe(query, combinedValues);

        return { data: rows, error: null };
      }

      // 4. DELETE
      if (this.operation === "delete") {
        const query = `DELETE FROM "${table}" ${whereSql} RETURNING *`;
        const rows = await sql.unsafe(query, values);
        return { data: rows, error: null };
      }

      // 5. UPSERT
      if (this.operation === "upsert") {
        const row = Array.isArray(this.insertData) ? this.insertData[0] : this.insertData;
        const keys = Object.keys(row);
        const cols = keys.map((k) => `"${k}"`).join(", ");
        const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(", ");
        const pkey = table === "pengaturan" || table === "pengaturan_situs" ? "kunci" : "id";

        const updateSet = keys
          .filter((k) => k !== pkey)
          .map((k) => `"${k}" = EXCLUDED."${k}"`)
          .join(", ");

        const query = `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) ON CONFLICT ("${pkey}") DO UPDATE SET ${updateSet} RETURNING *`;
        const rows = await sql.unsafe(query, Object.values(row));
        return { data: rows, error: null };
      }

      return { data: null, error: null };
    } catch (err: any) {
      console.error(`[DB Error ${this.tableName}]`, err);
      return { data: null, error: { message: err?.message || String(err) } };
    }
  }
}

class StorageClient {
  private bucket: string;

  constructor(bucket: string) {
    this.bucket = bucket;
  }

  async upload(
    destPath: string,
    file: Buffer | ArrayBuffer | Blob | Uint8Array,
    _options?: { upsert?: boolean; contentType?: string }
  ): Promise<{ data: { path: string } | null; error: any }> {
    try {
      const fullDir = path.join(process.cwd(), "public", "uploads", this.bucket, path.dirname(destPath));
      fs.mkdirSync(fullDir, { recursive: true });

      const fullFilePath = path.join(process.cwd(), "public", "uploads", this.bucket, destPath);
      const buffer =
        file instanceof Buffer
          ? file
          : file instanceof Uint8Array
          ? Buffer.from(file)
          : file instanceof ArrayBuffer
          ? Buffer.from(file)
          : Buffer.from(await (file as Blob).arrayBuffer());

      fs.writeFileSync(fullFilePath, buffer);
      return { data: { path: destPath }, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }

  async createSignedUrl(
    filePath: string,
    _expiresIn: number = 600
  ): Promise<{ data: { signedUrl: string } | null; error: any }> {
    return {
      data: {
        signedUrl: `/api/bukti-bayar/${filePath}`,
      },
      error: null,
    };
  }
}

export class PostgresClient {
  from<T extends keyof TablesAndViews>(tableName: T): TableQueryBuilder<TablesAndViews[T]["Row"]> {
    return new TableQueryBuilder<TablesAndViews[T]["Row"]>(tableName as string);
  }

  storage = {
    from: (bucket: string) => new StorageClient(bucket),
  };

  auth = {
    getUser: async () => {
      const pengguna = await penggunaSekarang();
      if (!pengguna) return { data: { user: null }, error: null };
      return {
        data: {
          user: {
            id: pengguna.id,
            email: pengguna.email,
            user_metadata: {
              nama: pengguna.profil.nama,
              no_hp: pengguna.profil.no_hp,
            },
          },
        },
        error: null,
      };
    },
  };

  async rpc(fnName: string, params: Record<string, any> = {}): Promise<{ data: any; error: any }> {
    try {
      const pengguna = await penggunaSekarang();

      // 1. kadaluarsakan_pesanan
      if (fnName === "kadaluarsakan_pesanan") {
        const res = await sql`
          UPDATE orders
          SET status = 'kadaluarsa'
          WHERE status = 'menunggu_bayar'
            AND kadaluarsa_at < NOW()
          RETURNING id;
        `;
        return { data: res.length, error: null };
      }

      // 2. buat_pesanan
      if (fnName === "buat_pesanan") {
        if (!pengguna) return { data: null, error: { message: "Harus masuk terlebih dahulu" } };
        const p_course = params.p_course;
        const p_batch = params.p_batch || null;

        const courseRes = await sql`SELECT harga FROM courses WHERE id = ${p_course} AND is_published = true;`;
        if (courseRes.length === 0) {
          return { data: null, error: { message: "Kelas tidak ditemukan atau belum terbit" } };
        }

        const harga = courseRes[0].harga;
        const kodeUnik = Math.floor(Math.random() * 899) + 100;
        const totalBayar = harga + kodeUnik;

        const seqRes = await sql`SELECT nextval('public.seq_invoice')::text as num;`;
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const invoiceNum = `INV-${dateStr}-${seqRes[0].num.padStart(4, "0")}`;

        const kadaluarsaAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const orderRes = await sql`
          INSERT INTO orders (
            nomor_invoice, santri_id, course_id, batch_id,
            harga, kode_unik, total_bayar, status, kadaluarsa_at
          ) VALUES (
            ${invoiceNum}, ${pengguna.id}, ${p_course}, ${p_batch},
            ${harga}, ${kodeUnik}, ${totalBayar}, 'menunggu_bayar', ${kadaluarsaAt}
          ) RETURNING *;
        `;

        return { data: orderRes[0], error: null };
      }

      // 3. unggah_bukti
      if (fnName === "unggah_bukti") {
        const { p_order, p_path, p_bukti_url, p_nama_pengirim, p_catatan } = params;
        const buktiPath = p_bukti_url || p_path;
        const res = await sql`
          UPDATE orders
          SET bukti_url = ${buktiPath},
              nama_pengirim = ${p_nama_pengirim},
              catatan_santri = ${p_catatan || null},
              status = 'menunggu_verifikasi'
          WHERE id = ${p_order}
          RETURNING *;
        `;
        return { data: res[0], error: null };
      }

      // 4. setujui_pesanan
      if (fnName === "setujui_pesanan") {
        if (!pengguna || pengguna.profil.peran !== "admin") {
          return { data: null, error: { message: "Hanya admin yang boleh memverifikasi pembayaran" } };
        }
        const p_order = params.p_order;

        const orderRes = await sql`SELECT * FROM orders WHERE id = ${p_order};`;
        if (orderRes.length === 0) return { data: null, error: { message: "Pesanan tidak ditemukan" } };
        const o = orderRes[0];

        await sql`
          UPDATE orders
          SET status = 'lunas',
              diverifikasi_oleh = ${pengguna.id},
              diverifikasi_at = NOW(),
              alasan_tolak = NULL
          WHERE id = ${p_order};
        `;

        const enrollRes = await sql`
          INSERT INTO enrollments (santri_id, course_id, batch_id, status)
          VALUES (${o.santri_id}, ${o.course_id}, ${o.batch_id}, 'aktif')
          ON CONFLICT (santri_id, course_id) DO UPDATE
            SET status = 'aktif',
                batch_id = COALESCE(EXCLUDED.batch_id, enrollments.batch_id)
          RETURNING *;
        `;

        return { data: enrollRes[0], error: null };
      }

      // 5. tolak_pesanan
      if (fnName === "tolak_pesanan") {
        if (!pengguna || pengguna.profil.peran !== "admin") {
          return { data: null, error: { message: "Hanya admin yang boleh menolak pembayaran" } };
        }
        const { p_order, p_alasan } = params;
        await sql`
          UPDATE orders
          SET status = 'ditolak',
              alasan_tolak = ${p_alasan},
              diverifikasi_oleh = ${pengguna.id},
              diverifikasi_at = NOW()
          WHERE id = ${p_order};
        `;
        return { data: true, error: null };
      }

      // 6. ringkasan_capaian
      if (fnName === "ringkasan_capaian") {
        const { p_santri, p_course } = params;
        const totalPelajaranRes = await sql`SELECT count(*)::int as count FROM lessons WHERE course_id = ${p_course};`;
        const selesaiRes = await sql`
          SELECT count(*)::int as count FROM progres_pelajaran
          WHERE santri_id = ${p_santri} AND course_id = ${p_course} AND selesai_at IS NOT NULL;
        `;
        const total = totalPelajaranRes[0]?.count ?? 0;
        const selesai = selesaiRes[0]?.count ?? 0;

        const enrollRes = await sql`SELECT batch_id FROM enrollments WHERE santri_id = ${p_santri} AND course_id = ${p_course} LIMIT 1;`;
        const batchId = enrollRes[0]?.batch_id;

        const nilaiRes = await sql`
          SELECT round(avg(nilai_rata), 2) as rata, count(*)::int as jml
          FROM penilaian_setoran
          WHERE santri_id = ${p_santri};
        `;

        let sesiLewat = 0;
        let hadir = 0;
        if (batchId) {
          const sesiRes = await sql`
            SELECT count(*)::int as count FROM sesi_halaqah WHERE batch_id = ${batchId} AND mulai_at < NOW();
          `;
          sesiLewat = sesiRes[0]?.count ?? 0;

          const hadirRes = await sql`
            SELECT count(*)::int as count FROM kehadiran k
            JOIN sesi_halaqah s ON s.id = k.sesi_id
            WHERE s.batch_id = ${batchId} AND s.mulai_at < NOW() AND k.santri_id = ${p_santri} AND k.status = 'hadir';
          `;
          hadir = hadirRes[0]?.count ?? 0;
        }

        const data = {
          total_pelajaran: total,
          pelajaran_selesai: selesai,
          progres_persen: total === 0 ? 0 : Math.round((selesai * 100) / total),
          jumlah_penilaian: nilaiRes[0]?.jml ?? 0,
          nilai_rata: nilaiRes[0]?.rata ? Number(nilaiRes[0].rata) : null,
          sesi_lewat: sesiLewat,
          hadir: hadir,
          kehadiran_persen: sesiLewat === 0 ? 0 : Math.round((hadir * 100) / sesiLewat),
        };
        return { data, error: null };
      }

      // 7. terbitkan_sertifikat
      if (fnName === "terbitkan_sertifikat") {
        if (!pengguna || pengguna.profil.peran !== "admin") {
          return { data: null, error: { message: "Hanya admin yang boleh menerbitkan sertifikat" } };
        }
        const { p_santri, p_course, p_rekap } = params;
        const enrollRes = await sql`SELECT batch_id FROM enrollments WHERE santri_id = ${p_santri} AND course_id = ${p_course} LIMIT 1;`;
        const batchId = enrollRes[0]?.batch_id ?? null;

        const seqRes = await sql`SELECT nextval('public.seq_sertifikat')::text as num;`;
        const year = new Date().getFullYear();
        const nomor = `MQ/${year}/${seqRes[0].num.padStart(4, "0")}`;

        const token = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

        const certRes = await sql`
          INSERT INTO sertifikat (
            nomor, token_verifikasi, santri_id, course_id, batch_id,
            nilai_rata, predikat, rekap_nilai, diterbitkan_oleh
          ) VALUES (
            ${nomor}, ${token}, ${p_santri}, ${p_course}, ${batchId},
            ${p_rekap?.nilai_rata ?? null}, ${p_rekap?.predikat ?? "Mumtaz"}, ${JSON.stringify(p_rekap || {})}, ${pengguna.id}
          ) RETURNING *;
        `;
        return { data: certRes[0], error: null };
      }

      // 8. cek_sertifikat
      if (fnName === "cek_sertifikat") {
        const { p_token } = params;
        const res = await sql`
          SELECT s.nomor, s.token_verifikasi, s.predikat, s.tgl_terbit,
                 u.nama as nama_santri, c.judul as judul_kelas, c.jenjang
          FROM sertifikat s
          JOIN users u ON u.id = s.santri_id
          JOIN courses c ON c.id = s.course_id
          WHERE s.token_verifikasi = ${p_token}
          LIMIT 1;
        `;
        if (res.length === 0) return { data: [], error: { message: "Sertifikat tidak ditemukan" } };
        return { data: res, error: null };
      }

      return { data: null, error: { message: `Fungsi ${fnName} tidak dikenali` } };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }
}
