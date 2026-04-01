import { readFile, writeFile, mkdir } from "node:fs/promises";

const OUTPUT_DIR = new URL("../output/", import.meta.url);
const WEB_PUBLIC_DIR = new URL("../../../apps/web/public/", import.meta.url);
const BASE_DOMAIN = "https://wow3dprinting.co.kr";

async function readNdjson(fileUrl) {
  const text = await readFile(fileUrl, "utf-8");
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function escapeXml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function run() {
  const articles = await readNdjson(new URL("./articles.ndjson", OUTPUT_DIR)).catch(() => []);
  const pages = await readNdjson(new URL("./pages.ndjson", OUTPUT_DIR)).catch(() => []);

  const urls = [
    { loc: `${BASE_DOMAIN}/`, lastmod: new Date().toISOString() },
    ...articles.map((a) => ({ loc: `${BASE_DOMAIN}/news/${a.slug}`, lastmod: a.published_at || new Date().toISOString() })),
    ...pages.map((p) => ({ loc: `${BASE_DOMAIN}/${p.slug}`, lastmod: p.published_at || new Date().toISOString() }))
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${escapeXml(u.lastmod)}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>
`;

  const robots = `User-agent: *
Allow: /

Sitemap: ${BASE_DOMAIN}/sitemap.xml
`;

  await mkdir(WEB_PUBLIC_DIR, { recursive: true });
  await writeFile(new URL("./sitemap.xml", OUTPUT_DIR), sitemap);
  await writeFile(new URL("./robots.txt", OUTPUT_DIR), robots);
  await writeFile(new URL("./sitemap.xml", WEB_PUBLIC_DIR), sitemap);
  await writeFile(new URL("./robots.txt", WEB_PUBLIC_DIR), robots);
  console.log("sitemap.xml, robots.txt 생성 완료");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
