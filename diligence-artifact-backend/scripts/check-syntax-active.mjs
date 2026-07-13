import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const files = [
  "server.js",
  ...(await listFiles("src", ".js")),
  ...(await listFiles("public", ".js"))
].filter((file) => existsSync(path.join(root, file)));

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: root,
    stdio: "inherit"
  });

  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(JSON.stringify({
  check: "active production syntax",
  status: "PASS",
  files_checked: files.length,
  excluded_from_blocking_gate: ["scripts/**/*.mjs", "one-time applicators", "historical acceptance scripts"]
}, null, 2));

async function listFiles(directory, extension) {
  const absoluteDirectory = path.join(root, directory);
  if (!existsSync(absoluteDirectory)) return [];

  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(relativePath, extension)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(extension)) files.push(relativePath);
  }

  return files.sort();
}
