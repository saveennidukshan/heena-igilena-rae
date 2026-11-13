// Generates one QR code (PNG + SVG) per guest, encoding <domain>/<slug>.
// Run AFTER deploy, passing your live domain:
//   node scripts/generate-qr.mjs https://your-domain.vercel.app
// No BASE_URL is baked into the app; the domain is only this CLI argument.
import QRCode from "qrcode";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

const base = process.argv[2];
if (!base || !/^https?:\/\//.test(base)) {
  console.error("Usage: node scripts/generate-qr.mjs <https://your-domain>");
  console.error("Example: node scripts/generate-qr.mjs https://invitation-.vercel.app");
  process.exit(1);
}
const origin = base.replace(/\/+$/, "");

const guestsUrl = pathToFileURL(path.resolve(here, "../src/config/guests.ts")).href;
const { guests } = await import(guestsUrl);

const outDir = path.resolve(here, "../qrcodes");
await fs.mkdir(outDir, { recursive: true });

const opts = { margin: 2, color: { dark: "#0b132b", light: "#ffffff" } };
const rows = [];
for (const g of guests) {
  const url = `${origin}/${g.slug}`;
  await QRCode.toFile(path.join(outDir, `${g.slug}.png`), url, { ...opts, width: 1024 });
  await fs.writeFile(path.join(outDir, `${g.slug}.svg`), await QRCode.toString(url, { ...opts, type: "svg" }));
  rows.push(`  ${g.slug.padEnd(16)} ${g.name.padEnd(20)} ${url}`);
}

console.log(`\nGuest${" ".repeat(12)}Name${" ".repeat(17)}URL`);
console.log(rows.join("\n"));
console.log(`\n✓ ${guests.length} QR codes (PNG + SVG) written to qrcodes/`);
