import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(backendRoot, "..");

const retiredPaths = [
  "src/qualified-review-system/branch.js",
  "src/qualified-review-system/handoff.js",
  "src/qualified-review-system/index.js",
  "src/qualified-review-system/matrix-artifact-compiler.js",
  "src/qualified-review-system/normalized-selector.js",
  "src/qualified-review-system/qr-validator.js",
  "src/qualified-review-system/question-map.js",
  "src/qualified-review-system/qualified-review-matrix-loader.js",
  "src/qualified-review-system/renderer.js",
  "src/qualified-review-system/matrix/qualified-review-matrix.yml",
  "public/interface-diligence/diligence-system/qualified-review-system/qualified-review-backend-sync.js"
];

for (const path of retiredPaths) {
  assert.equal(existsSync(resolve(backendRoot, path)), false, `LEGACY_QR_PATH_PRESENT:${path}`);
}

const requiredAuthorityPaths = [
  "src/phases/13-qualified-review/qualified-review.runner.js",
  "src/phases/14-qualified-review-submission/qualified-review-submission.compiler.v2.js",
  "src/phases/15-diligence-qa-complete/diligence-qa-complete.runner.v2.js",
  "src/phases/16-assembly-engine/assembly-engine.runner.js",
  "src/runtime/contracts/phase13-runtime.contract.js",
  "src/runtime/contracts/phase14-submission-runtime.contract.js",
  "src/runtime/contracts/phase15-diligence-qa-runtime.contract.js",
  "src/runtime/contracts/phase16-assembly-runtime.contract.js",
  "references/registry/qr/v2_1/QR_Registry_Catalog_v2.yml",
  "references/registry/qr/v2_1/QR_Registry_Validation_Report.md",
  "references/document-templates/ai/v2_1/TEMPLATE_MANIFEST.yml"
];

for (const path of requiredAuthorityPaths) {
  assert.equal(existsSync(resolve(backendRoot, path)), true, `ACTIVE_QR_AUTHORITY_MISSING:${path}`);
}

const activeRoots = [
  "src/runtime",
  "src/phases/13-qualified-review",
  "src/phases/14-qualified-review-submission",
  "src/phases/15-diligence-qa-complete",
  "src/phases/16-assembly-engine",
  "public/interface-diligence/diligence-system/qualified-review.html",
  "public/interface-diligence/diligence-system/qualified-review-system"
];

const forbiddenPatterns = [
  ["LEGACY_MATRIX_FILENAME", /qualified-review-matrix\.yml/],
  ["LEGACY_MATRIX_LOADER", /loadQualifiedReviewMatrix/],
  ["LEGACY_MATRIX_COMPILER", /buildQualifiedReviewMatrixArtifacts/],
  ["LEGACY_79_ROW_CONTRACT", /(?:79\s+(?:questions|rows)|\/79\b|QR-079)/i],
  ["LEGACY_NORMALIZED_SECTION_QR_SOURCE", /normalized_section__/],
  ["LEGACY_VAULT_PAYLOAD_QR_CONTRACT", /(?:vault_payload_contract|writes_to_vault_payload)/],
  ["LEGACY_PER_QUESTION_CONFIRMATION", /(?:confirm row|per-question matrix submission)/i]
];

const scannedFiles = [];
for (const root of activeRoots) collectFiles(resolve(backendRoot, root), scannedFiles);
for (const file of scannedFiles) {
  const path = relative(repoRoot, file).replaceAll("\\", "/");
  const source = readFileSync(file, "utf8");
  for (const [code, pattern] of forbiddenPatterns) {
    assert.equal(pattern.test(source), false, `${code}:${path}`);
  }
  assert.equal(/from\s+["'][^"']*qualified-review-system\/(?:branch|handoff|renderer|question-map|qr-validator|matrix-artifact-compiler|qualified-review-matrix-loader|normalized-selector)\.js["']/.test(source), false, `LEGACY_QR_IMPORT:${path}`);
}

const publicHtml = read("public/interface-diligence/diligence-system/qualified-review.html");
assert.match(publicHtml, /qualified-review-system\/qualified-review\.js/);
assert.doesNotMatch(publicHtml, /qualified-review-backend-sync\.js/);

const publicRoutes = read("src/runtime/routes/public.routes.js");
assert.match(publicRoutes, /qualified-review\/:run_id\/draft/);
assert.match(publicRoutes, /sections\/:section_id\/attestation/);
assert.match(publicRoutes, /qualified-review\/:run_id\/submit/);
assert.match(publicRoutes, /qualified-review\/:run_id\/responses[\s\S]*status\(410\)/);
assert.doesNotMatch(publicRoutes, /question_responses/);

const runtimeMain = read("src/runtime/main.js");
assert.doesNotMatch(runtimeMain, /qualified-review-system/);

console.log("Phase 13 legacy retirement: PASS");
console.log(JSON.stringify({
  retired_path_count: retiredPaths.length,
  active_authority_path_count: requiredAuthorityPaths.length,
  scanned_active_file_count: scannedFiles.length,
  legacy_matrix_removed: true,
  legacy_backend_sync_removed: true,
  retired_responses_endpoint_tombstoned: true,
  active_authority: "QR_BRIDGE_REGISTRY_V2_1_SECTION_ATTESTED_RUNTIME"
}, null, 2));

function read(path) {
  return readFileSync(resolve(backendRoot, path), "utf8");
}

function collectFiles(path, out) {
  if (!existsSync(path)) return;
  const stat = statSync(path);
  if (stat.isFile()) {
    if (/\.(?:js|mjs|cjs|html|md|ya?ml|json)$/i.test(path)) out.push(path);
    return;
  }
  for (const entry of readdirSync(path)) collectFiles(resolve(path, entry), out);
}
