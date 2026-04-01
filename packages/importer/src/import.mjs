import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { extname } from "node:path";

const BASE_URL = "https://wow3dprinting.co.kr";
const OUT_DIR = new URL("../output/", import.meta.url);
const MEDIA_DIR = new URL("./media/", OUT_DIR);

function stripTags(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
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

function extractLinks(html) {
  const links = new Set();
  const regex = /href="([^"#]+)"/g;
  let m = regex.exec(html);
  while (m) {
    const abs = absolutize(m[1]);
    if (abs && abs.startsWith(BASE_URL)) links.add(abs);
    m = regex.exec(html);
  }
  return [...links];
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>(.*?)<\/title>/is);
  return m ? stripTags(m[1]) : "Untitled";
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
  const lower = url.toLowerCase();
  if (/(about|contact|history|biography|client)/.test(lower)) return "page";
  if (/<article/i.test(html) || /news|title|category/i.test(html)) return "article";
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
  const queue = [BASE_URL];
  const pageResults = [];
  const logs = [];
  const mediaManifest = [];

  while (queue.length > 0 && visited.size < 400) {
    const url = queue.shift();
    if (!url || visited.has(url)) continue;
    visited.add(url);

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
        summary: stripTags(replacedBodyHtml).slice(0, 180),
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
  const redirects = pageResults.map((x) => ({
    source_path: new URL(x.source_url).pathname || "/",
    target_path: x.type === "article" ? `/news/${x.slug}` : `/${x.slug}`,
    status_code: 301
  }));

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
