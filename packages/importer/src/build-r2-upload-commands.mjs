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

async function run() {
  const media = await readNdjson(new URL("./media-assets.ndjson", OUTPUT_DIR)).catch(() => []);
  const lines = [];
  for (const m of media) {
    lines.push(
      `wrangler r2 object put wow3dprinting-media/${m.r2_key} --remote --file "packages/importer/output/${m.local_file}" --content-type "${m.mime_type}"`
    );
  }
  await writeFile(new URL("./r2-upload-commands.ps1", OUTPUT_DIR), lines.join("\n"));
  console.log("r2-upload-commands.ps1 생성 완료");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
