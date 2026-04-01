import { access, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../../../", import.meta.url);
const OUTPUT_DIR = new URL("../output/", import.meta.url);
const APP_WEB_DIR = new URL("../../../apps/web/", import.meta.url);

function parseArgs(argv) {
  const args = {
    dbName: "wow3dprinting_news",
    bucket: "wow3dprinting-media",
    projectName: "wow3dprinting-news",
    healthUrl: "",
    skipUpload: false
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--db-name" && argv[i + 1]) args.dbName = argv[i + 1];
    if (token === "--bucket" && argv[i + 1]) args.bucket = argv[i + 1];
    if (token === "--project-name" && argv[i + 1]) args.projectName = argv[i + 1];
    if (token === "--health-url" && argv[i + 1]) args.healthUrl = argv[i + 1];
    if (token === "--skip-upload") args.skipUpload = true;
  }
  return args;
}

function run(command, args, cwdUrl) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      cwd: fileURLToPath(cwdUrl ? new URL(".", cwdUrl) : new URL(".", ROOT))
    });
    child.on("close", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`${command} ${args.join(" ")} failed with ${code}`));
    });
  });
}

async function ensureFile(pathUrl, label) {
  try {
    await access(pathUrl);
  } catch {
    throw new Error(`필수 파일 누락: ${label}`);
  }
}

async function inferHealthUrl(projectName) {
  return `https://${projectName}.pages.dev/api/health`;
}

async function healthCheck(url) {
  const res = await fetch(url, { method: "GET" });
  const text = await res.text();
  if (!res.ok) throw new Error(`health check failed: ${res.status} ${text}`);
  let payload = {};
  try {
    payload = JSON.parse(text);
  } catch {
    payload = { raw: text };
  }
  if (payload && payload.ok === false) throw new Error(`health check returned not ok: ${text}`);
}

async function runPipeline(args) {
  console.log("== Preflight checks ==");
  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error("CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID 환경변수가 필요합니다.");
  }
  await ensureFile(new URL("./load-d1.sql", OUTPUT_DIR), "packages/importer/output/load-d1.sql");
  await ensureFile(new URL("./r2-upload-commands.ps1", OUTPUT_DIR), "packages/importer/output/r2-upload-commands.ps1");
  await ensureFile(new URL("./public/index.html", APP_WEB_DIR), "apps/web/public/index.html");
  const wranglerToml = await readFile(new URL("./wrangler.toml", APP_WEB_DIR), "utf-8");
  if (wranglerToml.includes("REPLACE_D1_DATABASE_ID")) {
    throw new Error("apps/web/wrangler.toml의 database_id를 실제 값으로 교체해야 합니다.");
  }

  console.log("== Optional R2 upload ==");
  if (!args.skipUpload) {
    await run("node", ["src/upload-r2.mjs", "--bucket", args.bucket, "--execute"], new URL("../", import.meta.url));
  } else {
    console.log("skip-upload enabled");
  }

  console.log("== Apply D1 (chunked remote) ==");
  await run("node", ["src/apply-d1-remote.mjs", "--db-name", args.dbName], new URL("../", import.meta.url));

  console.log("== Deploy Pages ==");
  await run(
    "wrangler",
    ["pages", "deploy", "public", "--project-name", args.projectName],
    APP_WEB_DIR
  );

  const healthUrl = args.healthUrl || (await inferHealthUrl(args.projectName));
  console.log(`== Health check: ${healthUrl} ==`);
  await healthCheck(healthUrl);
  console.log("배포 및 헬스체크 완료");
}

const args = parseArgs(process.argv.slice(2));
runPipeline(args).catch((error) => {
  console.error(error);
  process.exit(1);
});
