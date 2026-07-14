import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { EXECUTION_OUTCOMES, shouldBlockRun } from "../src/runtime/contracts/execution-outcome.contract.js";

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const retiredToken = ["REPAIR", "REQUIRED"].join("_");
const binaryExtensions = new Set([".docx", ".zip", ".png", ".jpg", ".jpeg", ".gif", ".pdf", ".woff", ".woff2", ".ttf", ".ico"]);
const ignoredDirectories = new Set(["node_modules", ".git"]);
const residues = [];

walk(backendRoot);
assert.deepEqual(residues, [], `RETIRED_STATUS_TOKEN_PRESENT:${JSON.stringify(residues.slice(0, 50))}`);
assert.equal(shouldBlockRun(EXECUTION_OUTCOMES.CRITICAL_FAILURE), true);
assert.equal(shouldBlockRun(EXECUTION_OUTCOMES.REINVESTIGATION_REQUIRED), false);
assert.equal(shouldBlockRun(EXECUTION_OUTCOMES.TECHNICAL_RETRY_REQUIRED), false);
assert.equal(shouldBlockRun(EXECUTION_OUTCOMES.LIMITATION), false);

console.log("Repair-required retirement: PASS");
console.log(JSON.stringify({
  retired_token_absent: true,
  critical_failure_blocks: true,
  reinvestigation_blocks: false,
  technical_retry_blocks: false,
  limitation_blocks: false
}, null, 2));

function walk(directory) {
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) continue;
    const absolute = join(directory, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) {
      walk(absolute);
      continue;
    }
    if (!stat.isFile() || binaryExtensions.has(extname(entry).toLowerCase())) continue;
    let text;
    try { text = readFileSync(absolute, "utf8"); }
    catch { continue; }
    if (!text.includes(retiredToken)) continue;
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      if (lines[index].includes(retiredToken)) residues.push({ path: relative(backendRoot, absolute), line: index + 1 });
    }
  }
}
