import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { extname } from "node:path";

const BASE_URL = "https://wow3dprinting.co.kr";
const OUT_DIR = new URL("../output/", import.meta.url);
const MEDIA_DIR = new URL("./media/", OUT_DIR);

function stripTags(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** `<style>` / `<script>` 내부 텍스트는 stripTags로 제거되지 않아 요약에 CSS가 섞이는 문제 방지 */
function stripScriptsAndStyles(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
}

function excerptFromHtml(html, maxLen) {
  const plain = stripTags(stripScriptsAndStyles(html)).replace(/\s+/g, " ").trim();
  if (!plain) return "";
  return plain.length <= maxLen ? plain : `${plain.slice(0, maxLen - 1)}…`;
}

function toSlug(title, fallback) {
  const raw = (title || fallback || "article")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return raw || `article-${Date.now()}`;
}

/** 같은 title 태그를 쓰는 페이지가 많아 slug 충돌이 나지 않도록 URL 기반 해시 접미사를 붙인다. */
function uniqueSlugForUrl(url, title) {
  const idPart = idFrom(url).slice(0, 12);
  let lastSeg = "";
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    lastSeg = parts.pop() || "";
  } catch {
    /* ignore */
  }
  const base = toSlug(title, lastSeg);
  const prefix = base || "item";
  return `${prefix}-${idPart}`;
}

function idFrom(input) {
  return createHash("sha1").update(input).digest("hex").slice(0, 24);
}

function absolutize(url) {
  try {
    return new URL(url, BASE_URL).toString();
  } catch {
    return null;
  }
}

/** www / 비-www 혼용 링크를 동일 사이트로 인식 */
function sameSiteHostname(hostname) {
  const h = String(hostname || "").toLowerCase().replace(/^www\./, "");
  const base = new URL(BASE_URL).hostname.toLowerCase().replace(/^www\./, "");
  return h === base;
}

function isSameSiteUrl(url) {
  try {
    return sameSiteHostname(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** 큐·visited 일관성: 호스트는 비-www, 끝 슬래시 제거(루트만 '/') */
function normalizeSiteUrl(url) {
  const u = new URL(url);
  u.hostname = u.hostname.replace(/^www\./i, "");
  if (u.pathname.length > 1 && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
  return u.toString();
}

/** 크롤 대상에서 제외 (CSS/JS/폰트·이미지 직링크 등) */
function isSkippableAsset(url) {
  try {
    const p = new URL(url).pathname.toLowerCase();
    return /\.(css|js|mjs|map|woff2?|ttf|eot|svg|ico|png|jpe?g|gif|webp|mp4|webm|pdf|zip)(\?|$)/i.test(
      p
    );
  } catch {
    return true;
  }
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${url}: ${res.status}`);
  return await res.text();
}

async function fetchBytes(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image fetch failed ${url}: ${res.status}`);
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  const bytes = new Uint8Array(await res.arrayBuffer());
  return { bytes, contentType };
}

/** robots.txt 의 Sitemap: 에서 URL 목록을 가져온다 */
async function fetchSitemapUrls() {
  const out = [];
  try {
    const robots = await fetchText(`${BASE_URL}/robots.txt`);
    const sm = robots.match(/Sitemap:\s*(\S+)/i);
    if (!sm) return out;
    const xml = await fetchText(sm[1].trim());
    for (const m of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)) {
      out.push(m[1].trim());
    }
  } catch (e) {
    console.warn("sitemap:", e?.message || e);
  }
  return out;
}

function extractLinks(html) {
  const links = new Set();
  const regex = /href="([^"#]+)"/g;
  let m = regex.exec(html);
  while (m) {
    const abs = absolutize(m[1]);
    if (abs && isSameSiteUrl(abs) && !isSkippableAsset(abs)) links.add(normalizeSiteUrl(abs));
    m = regex.exec(html);
  }
  return [...links];
}

function extractTitle(html) {
  const og =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  if (og?.[1]) {
    const t = stripTags(og[1]).trim();
    if (t && !/^untitled$/i.test(t)) return t;
  }
  const tw = html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i);
  if (tw?.[1]) {
    const t = stripTags(tw[1]).trim();
    if (t && !/^untitled$/i.test(t)) return t;
  }
  const m = html.match(/<title[^>]*>(.*?)<\/title>/is);
  let t = m ? stripTags(m[1]).trim() : "";
  if (t && !/^untitled$/i.test(t) && t.length > 1) return t;
  const h1 = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
  if (h1?.[1]) {
    const h = stripTags(h1[1]).trim();
    if (h) return h;
  }
  const entry = html.match(/class=["'][^"']*entry-title[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i);
  if (entry?.[1]) {
    const e = stripTags(entry[1]).trim();
    if (e) return e;
  }
  return t || "Untitled";
}

function extractBody(html) {
  const article = html.match(/<article[\s\S]*?<\/article>/i);
  if (article) return article[0];
  const main = html.match(/<main[\s\S]*?<\/main>/i);
  if (main) return main[0];
  const body = html.match(/<body[\s\S]*?<\/body>/i);
  return body ? body[0] : html;
}

function extractImageUrls(html) {
  const urls = [];
  const regex = /<img[^>]+src="([^"]+)"/gi;
  let m = regex.exec(html);
  while (m) {
    const abs = absolutize(m[1]);
    if (abs) urls.push(abs);
    m = regex.exec(html);
  }
  return [...new Set(urls)];
}

function classify(url, html) {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, "") || "/";
    if (path === "/") return "page";
    if (isSkippableAsset(url)) return "page";
  } catch {
    /* ignore */
  }
  const lower = url.toLowerCase();
  if (/(about|contact|history|biography|client|portfolio|intro|config)/.test(lower)) return "page";
  if (/property=["']og:type["'][^>]+content=["']article["']/i.test(html)) return "article";
  if (/<article[\s>]/i.test(html)) return "article";
  if (/\/(news|blog|press|board|post|forum)\/[^/]+/i.test(lower)) return "article";
  return "page";
}

function detectCategory(item) {
  const text = `${item.source_url} ${item.title} ${item.body_html}`.toLowerCase();
  if (/photo|포토|gallery|image/.test(text)) return { slug: "photo-news", name: "포토 뉴스", id: "c_photo" };
  return { slug: "news", name: "메인 뉴스", id: "c_news" };
}

function dedupeArticles(items, logs) {
  const bySignature = new Map();
  const result = [];
  let duplicateCount = 0;
  for (const item of items) {
    const signature = createHash("sha1")
      .update(`${item.title}|${stripTags(item.body_html).slice(0, 220)}`)
      .digest("hex");
    if (bySignature.has(signature)) {
      duplicateCount += 1;
      logs.push({
        level: "info",
        url: item.source_url,
        message: `duplicate article skipped (same content as ${bySignature.get(signature).source_url})`
      });
      continue;
    }
    bySignature.set(signature, item);
    result.push(item);
  }
  return { articles: result, duplicateCount };
}

function imageExt(imageUrl, contentType) {
  const path = new URL(imageUrl).pathname;
  const fromPath = extname(path).toLowerCase();
  if (fromPath && fromPath.length <= 5) return fromPath;
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("webp")) return ".webp";
  if (contentType.includes("gif")) return ".gif";
  return ".jpg";
}

async function mirrorImagesInBody(bodyHtml, logs, mediaManifest) {
  let nextBody = bodyHtml;
  const urls = extractImageUrls(bodyHtml);
  for (const imageUrl of urls) {
    try {
      const { bytes, contentType } = await fetchBytes(imageUrl);
      const fileId = idFrom(imageUrl);
      const ext = imageExt(imageUrl, contentType);
      const fileName = `${fileId}${ext}`;
      const localPath = new URL(`./${fileName}`, MEDIA_DIR);
      const r2Key = `imported/${fileName}`;
      await writeFile(localPath, bytes);
      nextBody = nextBody.replaceAll(imageUrl, `/media/${r2Key}`);
      mediaManifest.push({
        id: fileId,
        source_url: imageUrl,
        r2_key: r2Key,
        mime_type: contentType,
        local_file: `media/${fileName}`
      });
    } catch (error) {
      logs.push({ level: "warn", url: imageUrl, message: `image mirror failed: ${String(error)}` });
    }
  }
  return nextBody;
}

async function run() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(MEDIA_DIR, { recursive: true });

  const visited = new Set();
  const seedUrls = [BASE_URL, ...(await fetchSitemapUrls())];
  let extraSeed = "";
  try {
    extraSeed = await readFile(new URL("../url-seed.txt", import.meta.url), "utf-8");
  } catch {
    /* optional */
  }
  for (const line of extraSeed.split("\n")) {
    const t = line.trim();
    if (t && !t.startsWith("#")) {
      try {
        seedUrls.push(new URL(t, BASE_URL).toString());
      } catch {
        /* ignore */
      }
    }
  }
  const queue = [...new Set(seedUrls.map((u) => normalizeSiteUrl(u)))];
  const pageResults = [];
  const logs = [];
  const mediaManifest = [];

  while (queue.length > 0 && visited.size < 400) {
    const raw = queue.shift();
    if (!raw) continue;
    const url = normalizeSiteUrl(raw);
    if (visited.has(url)) continue;
    visited.add(url);
    if (isSkippableAsset(url)) continue;

    try {
      const html = await fetchText(url);
      const links = extractLinks(html);
      for (const link of links) {
        if (!visited.has(link) && !queue.includes(link)) queue.push(link);
      }

      const kind = classify(url, html);
      const title = extractTitle(html);
      const bodyHtml = extractBody(html);
      const replacedBodyHtml = await mirrorImagesInBody(bodyHtml, logs, mediaManifest);
      const images = extractImageUrls(replacedBodyHtml);
      const slug = uniqueSlugForUrl(url, title);

      pageResults.push({
        id: idFrom(url),
        type: kind,
        source_url: url,
        slug,
        title,
        summary: excerptFromHtml(replacedBodyHtml, 180),
        body_html: replacedBodyHtml,
        published_at: new Date().toISOString(),
        image_urls: images,
        hero_image_r2_key: images[0]?.startsWith("/media/") ? images[0].replace("/media/", "") : null
      });

      logs.push({ level: "info", url, message: `parsed ${kind}` });
    } catch (error) {
      logs.push({ level: "error", url, message: String(error) });
    }
  }

  const rawArticles = pageResults.filter((x) => x.type === "article");
  const deduped = dedupeArticles(rawArticles, logs);
  const articles = deduped.articles.map((item) => {
    const category = detectCategory(item);
    return {
      ...item,
      category_id: category.id,
      category_slug: category.slug,
      category_name: category.name
    };
  });
  const pages = pageResults.filter((x) => x.type === "page");
  const redirects = pageResults
    .map((x) => ({
      source_path: new URL(x.source_url).pathname || "/",
      target_path: x.type === "article" ? `/news/${x.slug}` : `/${x.slug}`,
      status_code: 301
    }))
    .filter((r) => r.source_path !== "/" && r.source_path !== "");

  await writeFile(new URL("./articles.ndjson", OUT_DIR), articles.map((x) => JSON.stringify(x)).join("\n"));
  await writeFile(new URL("./pages.ndjson", OUT_DIR), pages.map((x) => JSON.stringify(x)).join("\n"));
  await writeFile(new URL("./media-assets.ndjson", OUT_DIR), mediaManifest.map((x) => JSON.stringify(x)).join("\n"));
  await writeFile(new URL("./redirects.json", OUT_DIR), JSON.stringify(redirects, null, 2));
  await writeFile(new URL("./import-logs.json", OUT_DIR), JSON.stringify(logs, null, 2));

  console.log(`parsed pages: ${pageResults.length}`);
  console.log(`articles: ${articles.length}, pages: ${pages.length}`);
  console.log(`duplicates skipped: ${deduped.duplicateCount}`);
  console.log(`media mirrored: ${mediaManifest.length}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
