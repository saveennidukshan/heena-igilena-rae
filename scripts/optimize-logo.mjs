// Optimises the raw ~4.5MB logo into a shipped webp + png and builds a default OG image.
// Run: npm run optimize:logo  (re-run if the source logo changes)
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const assets = path.resolve(here, "../src/assets");
const publicDir = path.resolve(here, "../public");
const src = path.join(assets, "logo-original.png");

const trimmed = () => sharp(src).trim();

// Retina-ish webp (primary) + png fallback.
await trimmed()
  .resize({ width: 1400, withoutEnlargement: true })
  .webp({ quality: 82 })
  .toFile(path.join(assets, "logo.webp"));

await trimmed()
  .resize({ width: 1100, withoutEnlargement: true })
  .png({ compressionLevel: 9 })
  .toFile(path.join(assets, "logo.png"));

// Default Open Graph image: logo centred on the night-sky colour.
const logoForOg = await trimmed()
  .resize({ width: 1000, height: 480, fit: "inside", withoutEnlargement: true })
  .png()
  .toBuffer();

await sharp({
  create: { width: 1200, height: 630, channels: 4, background: "#0b132b" },
})
  .composite([{ input: logoForOg, gravity: "center" }])
  .png()
  .toFile(path.join(publicDir, "og-default.png"));

console.log("Logo optimised -> src/assets/logo.webp, logo.png; public/og-default.png");
