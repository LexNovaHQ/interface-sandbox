import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceDir = path.join(root, "data", "runtime");
const targetDir = path.join(root, "runtime-api", "data", "runtime");
const requiredFiles = ["registry.runtime.json", "registry_key.runtime.json"];

fs.mkdirSync(targetDir, { recursive: true });

for (const file of requiredFiles) {
  const source = path.join(sourceDir, file);
  const target = path.join(targetDir, file);
  if (!fs.existsSync(source)) {
    throw new Error(`Required runtime registry artifact missing: ${source}`);
  }
  fs.copyFileSync(source, target);
  const stats = fs.statSync(target);
  if (!stats.size) throw new Error(`Copied runtime registry artifact is empty: ${target}`);
  console.log(JSON.stringify({ ok: true, artifact: file, target, bytes: stats.size }));
}
