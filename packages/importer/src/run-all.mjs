import { spawn } from "node:child_process";

function runStep(title, command, args) {
  return new Promise((resolve, reject) => {
    console.log(`\n== ${title} ==`);
    const child = spawn(command, args, { stdio: "inherit", shell: true });
    child.on("close", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`${title} 실패 (exit ${code})`));
    });
  });
}

async function run() {
  await runStep("Import", "node", ["src/import.mjs"]);
  await runStep("QA Report", "node", ["src/qa-report.mjs"]);
  await runStep("Build D1 SQL", "node", ["src/build-d1-load-sql.mjs"]);
  await runStep("Build Redirect SQL", "node", ["src/build-redirect-sql.mjs"]);
  await runStep("Build SEO Files", "node", ["src/build-seo-files.mjs"]);
  await runStep("Build R2 Upload Commands", "node", ["src/build-r2-upload-commands.mjs"]);
  console.log("\n전체 파이프라인 완료");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
