import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();

const files = [
  "server.js",
  ...(await listFiles("src", ".js")),
  ...(await listFiles("public", ".js")),
  ...(await listFiles("scripts", ".mjs")),
];

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: root,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function listFiles(directory, extension) {
  const entries = await readdir(path.join(root, directory), {
    withFileTypes: true,
  });

  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(relativePath, extension)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(extension)) {
      files.push(relativePath);
    }
  }

  return files.sort();
}
