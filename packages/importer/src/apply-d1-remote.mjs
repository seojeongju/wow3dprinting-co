import { mkdir, writeFile, rm } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const OUTPUT_DIR = new URL("../output/", import.meta.url);
const TEMP_DIR = new URL("./d1-temp/", import.meta.url);
const DEFAULT_CONFIG = fileURLToPath(new URL("../../../apps/web/wrangler.toml", import.meta.url));

/** 원격 D1 단일 업로드 SQL 파일 상한(대략). 초과 시 파일을 쪼갠다. */
const MAX_SQL_FILE_BYTES = 350_000;
const BODY_CHUNK_SIZE = 6000;

function parseArgs(argv) {
  const args = {
    dbName: "wow3dprinting_news",
    config: DEFAULT_CONFIG,
    fresh: false
  };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--db-name" && argv[i + 1]) args.dbName = argv[i + 1];
    if (argv[i] === "--config" && argv[i + 1]) args.config = argv[i + 1];
    if (argv[i] === "--fresh") args.fresh = true;
  }
  return args;
}

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

function runWrangler(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("wrangler", args, { stdio: "inherit", shell: true });
    child.on("close", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`wrangler failed with ${code}`));
    });
  });
}

async function executeSqlFile(dbName, configPath, sqlPath) {
  await runWrangler([
    "d1",
    "execute",
    dbName,
    "--remote",
    `--file=${sqlPath}`,
    "--config",
    configPath
  ]);
}

let fileCounter = 0;

async function writeSqlBatch(dbName, configPath, statements) {
  if (statements.length === 0) return;
  const sql = statements.join("\n");
  const name = `${String(fileCounter++).padStart(5, "0")}.sql`;
  const path = fileURLToPath(new URL(name, TEMP_DIR));
  await writeFile(path, sql, "utf-8");
  await executeSqlFile(dbName, configPath, path);
}

/**
 * 문장 배열을 MAX_SQL_FILE_BYTES 이하 크기로 나눠 순차 실행한다.
 */
async function flushInBatches(dbName, configPath, statements) {
  let batch = [];
  let batchBytes = 0;
  const sepBytes = Buffer.byteLength("\n", "utf8");

  for (const stmt of statements) {
    const stmtBytes = Buffer.byteLength(stmt, "utf8");
    const add = batch.length === 0 ? stmtBytes : batchBytes + sepBytes + stmtBytes;
    if (add > MAX_SQL_FILE_BYTES && batch.length > 0) {
      await writeSqlBatch(dbName, configPath, batch);
      batch = [stmt];
      batchBytes = stmtBytes;
    } else {
      batch.push(stmt);
      batchBytes = add;
    }
  }
  await writeSqlBatch(dbName, configPath, batch);
}

function chunkText(text, size) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  await rm(TEMP_DIR, { recursive: true, force: true });
  await mkdir(TEMP_DIR, { recursive: true });
  fileCounter = 0;

  const articles = await readNdjson(new URL("./articles.ndjson", OUTPUT_DIR)).catch(() => []);
  const pages = await readNdjson(new URL("./pages.ndjson", OUTPUT_DIR)).catch(() => []);
  const media = await readNdjson(new URL("./media-assets.ndjson", OUTPUT_DIR)).catch(() => []);
  const redirects = JSON.parse(await readFile(new URL("./redirects.json", OUTPUT_DIR), "utf-8")).filter(Boolean);

  const categoryMap = new Map();
  categoryMap.set("c_news", { id: "c_news", slug: "news", name: "메인 뉴스" });
  categoryMap.set("c_photo", { id: "c_photo", slug: "photo-news", name: "포토 뉴스" });
  for (const a of articles) {
    if (a.category_id && a.category_slug && a.category_name) {
      categoryMap.set(a.category_id, { id: a.category_id, slug: a.category_slug, name: a.category_name });
    }
  }

  if (args.fresh) {
    await flushInBatches(args.dbName, args.config, [
      "DELETE FROM article_tags;",
      "DELETE FROM articles;",
      "DELETE FROM pages;",
      "DELETE FROM media_assets;",
      "DELETE FROM redirects;"
    ]);
  }

  await flushInBatches(args.dbName, args.config, [
    `INSERT OR IGNORE INTO categories (id, slug, name) VALUES ${[...categoryMap.values()]
      .map((c) => `(${esc(c.id)}, ${esc(c.slug)}, ${esc(c.name)})`)
      .join(", ")};`,
    "INSERT OR IGNORE INTO authors (id, name, bio) VALUES ('a_default', '기본 작성자', '자동 이관 기본 작성자');"
  ]);

  for (const p of pages) {
    const html = p.body_html || "";
    const stmts = [
      `INSERT INTO pages (id, slug, title, content_html, published_at, updated_at) VALUES (${esc(
        p.id
      )}, ${esc(p.slug)}, ${esc(p.title)}, '', ${esc(
        p.published_at
      )}, CURRENT_TIMESTAMP) ON CONFLICT(slug) DO UPDATE SET title=excluded.title, content_html='', published_at=excluded.published_at, updated_at=CURRENT_TIMESTAMP;`
    ];
    for (const part of chunkText(html, BODY_CHUNK_SIZE)) {
      stmts.push(`UPDATE pages SET content_html = content_html || ${esc(part)} WHERE id = ${esc(p.id)};`);
    }
    await flushInBatches(args.dbName, args.config, stmts);
  }

  const mediaStmts = media.map(
    (m) =>
      `INSERT INTO media_assets (id, r2_key, mime_type, source_url) VALUES (${esc(m.id)}, ${esc(
        m.r2_key
      )}, ${esc(m.mime_type)}, ${esc(m.source_url)}) ON CONFLICT(r2_key) DO UPDATE SET mime_type=excluded.mime_type, source_url=excluded.source_url;`
  );
  await flushInBatches(args.dbName, args.config, mediaStmts);

  for (const a of articles) {
    const body = a.body_html || "";
    const stmts = [
      `INSERT INTO articles (id, slug, title, summary, body_html, status, author_id, category_id, hero_image_r2_key, source_url, published_at, updated_at) VALUES (${esc(
        a.id
      )}, ${esc(a.slug)}, ${esc(a.title)}, ${esc(a.summary)}, '', 'published', 'a_default', ${esc(
        a.category_id || "c_news"
      )}, ${esc(a.hero_image_r2_key)}, ${esc(a.source_url)}, ${esc(
        a.published_at
      )}, CURRENT_TIMESTAMP) ON CONFLICT(slug) DO UPDATE SET title=excluded.title, summary=excluded.summary, body_html='', source_url=excluded.source_url, published_at=excluded.published_at, updated_at=CURRENT_TIMESTAMP;`
    ];
    for (const part of chunkText(body, BODY_CHUNK_SIZE)) {
      stmts.push(`UPDATE articles SET body_html = body_html || ${esc(part)} WHERE id = ${esc(a.id)};`);
    }
    await flushInBatches(args.dbName, args.config, stmts);
  }

  const redirectStmts = redirects.map(
    (r) =>
      `INSERT INTO redirects (source_path, target_path, status_code) VALUES (${esc(r.source_path)}, ${esc(
        r.target_path
      )}, ${Number(r.status_code || 301)}) ON CONFLICT(source_path) DO UPDATE SET target_path=excluded.target_path, status_code=excluded.status_code;`
  );
  await flushInBatches(args.dbName, args.config, redirectStmts);

  console.log(`원격 D1 적재 완료 (배치 SQL 파일 ${fileCounter}개)`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
