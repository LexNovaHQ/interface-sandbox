import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expected = Object.freeze([
  ["CO_P12_01_CERTIFIED.json", "co_p12_01_certified_receipt.v1"],
  ["CO_P12_02_CERTIFIED.json", "co_p12_02_certified_receipt.v1"],
  ["CO_P12_03_CERTIFIED.json", "co_p12_03_certified_receipt.v1"],
  ["CO_P12_04_CERTIFIED.json", "co_p12_04_certified_receipt.v1"],
  ["CO_P12_05_CERTIFIED.json", "co_p12_05_certified_receipt.v1"]
]);

const receipts = expected.map(([filename, schemaVersion]) => {
  const receiptPath = path.join(root, "receipts", filename);
  const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
  assert.equal(receipt.schema_version, schemaVersion, `${filename}: schema_version`);
  assert.equal(receipt.status, "PASS", `${filename}: status`);
  assert.equal(Number(receipt.exit_code), 0, `${filename}: exit_code`);
  assert.equal(receipt.target_branch, "domain-gate-v0-preflight", `${filename}: target_branch`);
  assert.ok(String(receipt.run_id || "").trim(), `${filename}: run_id`);
  assert.ok(String(receipt.certified_at || "").trim(), `${filename}: certified_at`);
  return {
    filename,
    schema_version: receipt.schema_version,
    status: receipt.status,
    run_id: receipt.run_id,
    certified_at: receipt.certified_at
  };
});

console.log(JSON.stringify({
  audit: "Phase 12 migration receipts",
  status: "PASS",
  blocking_gate: false,
  receipt_count: receipts.length,
  receipts
}, null, 2));
