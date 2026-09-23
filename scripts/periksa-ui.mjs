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
import { SignJWT } from "jose";

const [email, sandi, alamat = "http://localhost:3000/"] = process.argv.slice(2);
const KUNCI_RAHASIA = new TextEncoder().encode(
  process.env.AUTH_SECRET || "1cc13c80c46047f066addca0d6d3b1fe8f5705774573a927cda6b9974fa684cc"
);

/** Buat token sesi JWT mq_session langsung. */
async function kukiUntuk(email, sandi) {
  const jwt = await new SignJWT({
    sub: "admin-id",
    email: email || "admin@nurulmusthofa.id",
    peran: "admin",
    nama: "Administrator",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(KUNCI_RAHASIA);

  return [
    {
      name: "mq_session",
      value: jwt,
      domain: "localhost",
      path: "/",
    },
  ];
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
