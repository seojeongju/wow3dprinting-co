import { readFile, writeFile } from "node:fs/promises";

const OUTPUT_DIR = new URL("../output/", import.meta.url);

async function readNdjson(fileUrl) {
  const text = await readFile(fileUrl, "utf-8");
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function esc(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function run() {
  const articles = await readNdjson(new URL("./articles.ndjson", OUTPUT_DIR)).catch(() => []);
  const pages = await readNdjson(new URL("./pages.ndjson", OUTPUT_DIR)).catch(() => []);
  const media = await readNdjson(new URL("./media-assets.ndjson", OUTPUT_DIR)).catch(() => []);
  const redirects = JSON.parse(await readFile(new URL("./redirects.json", OUTPUT_DIR), "utf-8")).filter(Boolean);

  // D1 remote execute는 BEGIN/COMMIT 트랜잭션을 허용하지 않으므로 개별 문장만 출력한다.
  const sql = [];

  const categoryMap = new Map();
  categoryMap.set("c_news", { id: "c_news", slug: "news", name: "메인 뉴스" });
  categoryMap.set("c_photo", { id: "c_photo", slug: "photo-news", name: "포토 뉴스" });
  for (const a of articles) {
    if (a.category_id && a.category_slug && a.category_name) {
      categoryMap.set(a.category_id, { id: a.category_id, slug: a.category_slug, name: a.category_name });
    }
  }
  sql.push(
    `INSERT OR IGNORE INTO categories (id, slug, name) VALUES ${[...categoryMap.values()]
      .map((c) => `(${esc(c.id)}, ${esc(c.slug)}, ${esc(c.name)})`)
      .join(", ")};`
  );
  sql.push(
    "INSERT OR IGNORE INTO authors (id, name, bio) VALUES ('a_default', '기본 작성자', '자동 이관 기본 작성자');"
  );

  for (const p of pages) {
    sql.push(
      `INSERT INTO pages (id, slug, title, content_html, published_at, updated_at) VALUES (${esc(
        p.id
      )}, ${esc(p.slug)}, ${esc(p.title)}, ${esc(p.body_html)}, ${esc(
        p.published_at
      )}, CURRENT_TIMESTAMP) ON CONFLICT(slug) DO UPDATE SET title=excluded.title, content_html=excluded.content_html, published_at=excluded.published_at, updated_at=CURRENT_TIMESTAMP;`
    );
  }

  for (const m of media) {
    sql.push(
      `INSERT INTO media_assets (id, r2_key, mime_type, source_url) VALUES (${esc(m.id)}, ${esc(
        m.r2_key
      )}, ${esc(m.mime_type)}, ${esc(m.source_url)}) ON CONFLICT(r2_key) DO UPDATE SET mime_type=excluded.mime_type, source_url=excluded.source_url;`
    );
  }

  for (const a of articles) {
    sql.push(
      `INSERT INTO articles (id, slug, title, summary, body_html, status, author_id, category_id, hero_image_r2_key, source_url, published_at, updated_at) VALUES (${esc(
        a.id
      )}, ${esc(a.slug)}, ${esc(a.title)}, ${esc(a.summary)}, ${esc(
        a.body_html
      )}, 'published', 'a_default', ${esc(a.category_id || "c_news")}, ${esc(a.hero_image_r2_key)}, ${esc(a.source_url)}, ${esc(
        a.published_at
      )}, CURRENT_TIMESTAMP) ON CONFLICT(slug) DO UPDATE SET title=excluded.title, summary=excluded.summary, body_html=excluded.body_html, source_url=excluded.source_url, published_at=excluded.published_at, updated_at=CURRENT_TIMESTAMP;`
    );
  }

  for (const r of redirects) {
    sql.push(
      `INSERT INTO redirects (source_path, target_path, status_code) VALUES (${esc(r.source_path)}, ${esc(
        r.target_path
      )}, ${Number(r.status_code || 301)}) ON CONFLICT(source_path) DO UPDATE SET target_path=excluded.target_path, status_code=excluded.status_code;`
    );
  }

  await writeFile(new URL("./load-d1.sql", OUTPUT_DIR), sql.join("\n"));
  console.log("load-d1.sql 생성 완료");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
