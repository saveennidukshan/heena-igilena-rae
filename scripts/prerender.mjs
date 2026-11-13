// Post-build: emit dist/<slug>/index.html with per-guest <title> + OG/Twitter meta so
// shared links preview nicely and deep links serve prebuilt HTML. Runs in `npm run build`.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, "../dist");

const tpl = await fs.readFile(path.join(dist, "index.html"), "utf8");
const { guests } = await import(pathToFileURL(path.resolve(here, "../src/config/guests.ts")).href);
const { event } = await import(pathToFileURL(path.resolve(here, "../src/config/event.ts")).href);

// Vercel provides VERCEL_URL automatically at build — no manual BASE_URL needed.
const origin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function setMeta(html, kind, key, value) {
  const re = new RegExp(`(<meta ${kind}="${key}" content=")(.*?)(")`, "s");
  if (re.test(html)) return html.replace(re, `$1${esc(value)}$3`);
  return html.replace("</head>", `  <meta ${kind}="${key}" content="${esc(value)}" />\n  </head>`);
}

function render(title, description, url) {
  let html = tpl.replace(/<title>.*?<\/title>/s, `<title>${esc(title)}</title>`);
  html = setMeta(html, "name", "description", description);
  html = setMeta(html, "property", "og:title", title);
  html = setMeta(html, "property", "og:description", description);
  html = setMeta(html, "name", "twitter:title", title);
  html = setMeta(html, "name", "twitter:description", description);
  if (url) html = setMeta(html, "property", "og:url", url);
  return html;
}

let count = 0;
for (const g of guests) {
  const title = `${g.name} — ${event.name}`;
  const description = `${g.name}, you're invited to ${event.name} (${event.themeLabel}).`;
  const url = origin ? `${origin}/${g.slug}` : "";
  const dir = path.join(dist, g.slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "index.html"), render(title, description, url));
  count++;
}

console.log(`✓ Prerendered ${count} per-guest pages into dist/<slug>/index.html`);
