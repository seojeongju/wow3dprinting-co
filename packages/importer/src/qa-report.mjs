import { readFile, writeFile } from "node:fs/promises";

const OUTPUT_DIR = new URL("../output/", import.meta.url);

async function readNdjson(path) {
  const text = await readFile(path, "utf-8");
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function run() {
  const articles = await readNdjson(new URL("./articles.ndjson", OUTPUT_DIR)).catch(() => []);
  const pages = await readNdjson(new URL("./pages.ndjson", OUTPUT_DIR)).catch(() => []);
  const redirects = JSON.parse(await readFile(new URL("./redirects.json", OUTPUT_DIR), "utf-8")).filter(Boolean);
  const logs = JSON.parse(await readFile(new URL("./import-logs.json", OUTPUT_DIR), "utf-8")).filter(Boolean);

  const errors = logs.filter((x) => x.level === "error");
  const missingBody = [...articles, ...pages].filter((x) => !x.body_html || x.body_html.length < 20);
  const missingTitle = [...articles, ...pages].filter((x) => !x.title || x.title.length < 2);
  const duplicateSlugCount =
    articles.length -
    new Set(
      articles.map((x) => x.slug).filter(Boolean)
    ).size;
  const byCategory = articles.reduce((acc, item) => {
    const key = item.category_slug || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const report = {
    generated_at: new Date().toISOString(),
    totals: {
      articles: articles.length,
      pages: pages.length,
      redirects: redirects.length
    },
    quality: {
      error_count: errors.length,
      missing_body_count: missingBody.length,
      missing_title_count: missingTitle.length,
      duplicate_slug_count: duplicateSlugCount
    },
    category_distribution: byCategory,
    seo: {
      sitemap_candidates: [...articles, ...pages].length,
      redirects_ready: redirects.length
    },
    samples: {
      error_samples: errors.slice(0, 20),
      missing_body_samples: missingBody.slice(0, 20).map((x) => ({ source_url: x.source_url, slug: x.slug })),
      missing_title_samples: missingTitle.slice(0, 20).map((x) => ({ source_url: x.source_url, slug: x.slug }))
    }
  };

  await writeFile(new URL("./qa-report.json", OUTPUT_DIR), JSON.stringify(report, null, 2));
  console.log("qa-report.json 생성 완료");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
