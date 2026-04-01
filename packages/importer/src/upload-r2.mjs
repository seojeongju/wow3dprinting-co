import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OUTPUT_DIR = new URL("../output/", import.meta.url);

async function readNdjson(fileUrl) {
  const text = await readFile(fileUrl, "utf-8");
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function parseArgs(argv) {
  const args = {
    bucket: "wow3dprinting-media",
    execute: false,
    limit: 0
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--execute") args.execute = true;
    if (token === "--bucket" && argv[i + 1]) args.bucket = argv[i + 1];
    if (token === "--limit" && argv[i + 1]) args.limit = Number(argv[i + 1]) || 0;
  }
  return args;
}

function runCommand(command, commandArgs) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, commandArgs, { stdio: "inherit", shell: true });
    child.on("close", (code) => {
      if (code === 0) resolvePromise(undefined);
      else rejectPromise(new Error(`${command} exited with ${code}`));
    });
  });
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const media = await readNdjson(new URL("./media-assets.ndjson", OUTPUT_DIR)).catch(() => []);
  const selected = args.limit > 0 ? media.slice(0, args.limit) : media;

  if (selected.length === 0) {
    console.log("업로드할 미디어가 없습니다.");
    return;
  }

  console.log(`target bucket: ${args.bucket}`);
  console.log(`items: ${selected.length}`);
  console.log(`mode: ${args.execute ? "execute" : "dry-run"}`);

  for (const m of selected) {
    const localFile = resolve(fileURLToPath(new URL(`./${m.local_file}`, OUTPUT_DIR)));
    const commandArgs = [
      "r2",
      "object",
      "put",
      `${args.bucket}/${m.r2_key}`,
      "--remote",
      "--file",
      localFile,
      "--content-type",
      m.mime_type
    ];

    if (!args.execute) {
      console.log(`wrangler ${commandArgs.join(" ")}`);
      continue;
    }

    await runCommand("wrangler", commandArgs);
  }

  console.log("R2 업로드 처리 완료");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
