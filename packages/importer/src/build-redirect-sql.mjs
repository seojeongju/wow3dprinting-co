import { readFile, writeFile } from "node:fs/promises";

const OUTPUT_DIR = new URL("../output/", import.meta.url);

async function run() {
  const redirects = JSON.parse(await readFile(new URL("./redirects.json", OUTPUT_DIR), "utf-8"));
  const lines = [];
  for (const row of redirects) {
    const source = String(row.source_path).replace(/'/g, "''");
    const target = String(row.target_path).replace(/'/g, "''");
    const status = Number(row.status_code || 301);
    lines.push(
      `INSERT INTO redirects (source_path, target_path, status_code) VALUES ('${source}', '${target}', ${status}) ON CONFLICT(source_path) DO UPDATE SET target_path = excluded.target_path, status_code = excluded.status_code;`
    );
  }
  await writeFile(new URL("./redirects.sql", OUTPUT_DIR), lines.join("\n"));
  console.log("redirects.sql 생성 완료");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
