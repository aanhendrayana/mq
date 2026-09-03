/**
 * Pemeriksa UI di browser sungguhan.
 *
 *   node scripts/periksa-ui.mjs <email> <sandi> [alamat]
 *
 * Membuka halaman sebagai pengguna yang sudah masuk, mengklik menu akun, lalu
 * melaporkan SETIAP galat konsol, galat halaman, dan permintaan jaringan yang
 * gagal. Dibuat karena bug interaksi (dropdown, pemutar video, kiriman form)
 * tidak pernah terlihat dari pemeriksaan HTML lewat curl.
 */
import { chromium } from "playwright";
import { createServerClient } from "@supabase/ssr";

const [email, sandi, alamat = "http://localhost:3100/"] = process.argv.slice(2);
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Masuk lewat @supabase/ssr agar cookie-nya persis seperti buatan aplikasi. */
async function kukiUntuk(email, sandi) {
  const toko = new Map();
  const supabase = createServerClient(SUPABASE_URL, ANON, {
    cookies: {
      getAll: () => [...toko].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => toko.set(name, value)),
    },
  });
  const { error } = await supabase.auth.signInWithPassword({ email, password: sandi });
  if (error) throw new Error(`Gagal masuk: ${error.message}`);
  return [...toko].map(([name, value]) => ({
    name,
    value,
    domain: "localhost",
    path: "/",
  }));
}

const browser = await chromium.launch();
const konteks = await browser.newContext({ viewport: { width: 1280, height: 900 } });
if (email) await konteks.addCookies(await kukiUntuk(email, sandi));

const halaman = await konteks.newPage();
const galat = [];
halaman.on("console", (m) => {
  if (m.type() === "error") galat.push(`[konsol] ${m.text()}`);
});
halaman.on("pageerror", (e) => galat.push(`[halaman] ${e.message}\n${e.stack ?? ""}`));
halaman.on("requestfailed", (r) =>
  galat.push(`[jaringan] ${r.method()} ${r.url()} — ${r.failure()?.errorText}`),
);
halaman.on("crash", () => galat.push("[FATAL] tab browser crash"));

console.log(`Membuka ${alamat}${email ? ` sebagai ${email}` : " sebagai tamu"}`);
await halaman.goto(alamat, { waitUntil: "networkidle" });

// Klik menu akun (avatar) dan lihat apakah isinya muncul.
const pemicu = halaman.locator('[aria-haspopup="menu"]').first();
const adaPemicu = (await pemicu.count()) > 0;
if (adaPemicu) {
  console.log("Mengklik menu akun...");
  await pemicu.click({ timeout: 5000 }).catch((e) => galat.push(`[klik] ${e.message}`));
  await halaman.waitForTimeout(1200);

  const isiTerlihat = await halaman
    .getByText("Keluar", { exact: true })
    .first()
    .isVisible()
    .catch(() => false);
  console.log(`Isi menu terlihat: ${isiTerlihat ? "YA" : "TIDAK"}`);
} else {
  console.log('Pemicu menu akun ("Menu akun") tidak ditemukan di halaman ini.');
}

await halaman.screenshot({ path: process.env.TANGKAPAN ?? "/tmp/ui.png", fullPage: false });

console.log(`\n=== ${galat.length} galat ===`);
for (const g of galat.slice(0, 12)) console.log(g.slice(0, 6000) + "\n");

await browser.close();
process.exit(galat.length ? 1 : 0);
