import { existsSync, readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const activeScriptEntrypoints = discoverActiveScriptEntrypoints(packageJson.scripts || {});
const activeTestSupport = await listFiles("scripts/test-support", ".mjs");
const productionFiles = [
  "server.js",
  ...(await listFiles("src", ".js")),
  ...(await listFiles("public", ".js"))
].filter((file) => existsSync(path.join(root, file)));

for (const file of activeScriptEntrypoints) {
  if (!existsSync(path.join(root, file))) throw new Error(`ACTIVE_SCRIPT_ENTRYPOINT_MISSING:${file}`);
}

const files = [...new Set([...productionFiles, ...activeScriptEntrypoints, ...activeTestSupport])].sort();
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
  production_files_checked: productionFiles.length,
  active_test_entrypoints_checked: activeScriptEntrypoints.length,
  active_test_support_files_checked: activeTestSupport.length,
  files_checked: files.length,
  excluded_from_blocking_gate: [
    "manual audit scripts",
    "unreferenced historical acceptance scripts",
    "one-time applicators"
  ]
}, null, 2));

function discoverActiveScriptEntrypoints(scripts) {
  const files = [];
  const pattern = /(?:^|(?:&&|\|\||;)\s*)node\s+(?!--check\b)([^\s;&|]+\.mjs)(?=\s|$|[;&|])/g;
  for (const [scriptName, command] of Object.entries(scripts)) {
    if (scriptName.startsWith("audit:")) continue;
    let match;
    while ((match = pattern.exec(command)) !== null) files.push(normalize(match[1]));
  }
  return [...new Set(files)].sort();
}

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
    if (entry.isFile() && entry.name.endsWith(extension)) files.push(normalize(relativePath));
  }
  return files.sort();
}

function normalize(value) {
  return String(value).replaceAll("\\", "/").replace(/^\.\//, "");
}
