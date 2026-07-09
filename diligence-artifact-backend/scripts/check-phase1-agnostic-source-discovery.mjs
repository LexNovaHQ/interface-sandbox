import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

const contract = read("src/phases/01-source-discovery/source-discovery.contract.js");
const runner = read("src/phases/01-source-discovery/source-discovery.runner.js");
const urlService = read("src/phases/01-source-discovery/services/url-manifest.service.js");
const extractionService = read("src/phases/01-source-discovery/services/source-extraction.service.js");
const handoffService = read("src/phases/01-source-discovery/services/source-family-handoff.service.js");
const taxonomy = read("src/phases/01-source-discovery/services/source-discovery-taxonomy.service.js");
const permissions = read("src/runtime/contracts/artifact-permissions.contract.js");
const phaseContracts = read("src/phase-contracts.js");

for (const artifact of ["source_discovery_matrix_manifest", "adapter_expansion_log", "neutral_evidence_bucket_manifest", "legal_doc_inventory", "legal_doc_extraction_index", "legal_doc_lossless_validation_manifest", "post_phase_1_domain_gate_handoff"]) {
  assert.ok(contract.includes(artifact), `contract missing ${artifact}`);
  assert.ok(permissions.includes(artifact), `permissions missing ${artifact}`);
}

for (const file of [contract, urlService, extractionService, handoffService, permissions, phaseContracts]) {
  assert.equal(file.includes("lossless_family__"), false, "Phase 1 active runtime must not mention lossless_family__");
  assert.equal(file.includes("ROOT_FAMILY"), false, "Phase 1 active runtime must not mention ROOT_FAMILY");
  assert.equal(file.includes("T0_ROOT"), false, "Phase 1 active runtime must not mention T/P/D/L root codes");
  assert.equal(file.includes("P1_PRODUCT"), false, "Phase 1 active runtime must not mention T/P/D/L root codes");
  assert.equal(file.includes("D1_SECURITY_TRUST"), false, "Phase 1 active runtime must not mention T/P/D/L root codes");
  assert.equal(file.includes("L1_CORE_TERMS_PRIVACY"), false, "Phase 1 active runtime must not mention T/P/D/L root codes");
}

assert.ok(contract.includes("common agnostic roots + neutral signal buckets + independent legal documents"), "contract must lock agnostic storage taxonomy");
assert.ok(contract.includes("legal_document_blob_merging"), "contract must forbid legal document blob merging");
assert.ok(runner.includes("phase_1_agnostic_bucket_upgrade_wired: true"), "runner must advertise Phase 1 agnostic upgrade");
assert.ok(urlService.includes("common_root"), "URL manifest service must emit common_root rows");
assert.ok(extractionService.includes("lossless_root__"), "extraction service must emit common root artifacts");
assert.ok(extractionService.includes("LEGAL_DOC_LOSSLESS"), "extraction service must emit independent legal docs");
assert.ok(handoffService.includes("common_root_index"), "handoff must expose common root index");
assert.ok(taxonomy.includes("COMMON_ROOTS"), "taxonomy must define common roots");
assert.ok(taxonomy.includes("NEUTRAL_BUCKETS"), "taxonomy must define neutral buckets");
assert.ok(taxonomy.includes("LEGAL_DOC_RULES"), "taxonomy must define legal doc rules");
assert.ok(permissions.includes("LOSSLESS_COMMON_ROOT_ARTIFACT_PATTERN"), "permissions must allow lossless_root artifacts");
assert.ok(permissions.includes("LEGAL_DOC_ARTIFACT_PATTERN"), "permissions must allow legal_doc artifacts");
assert.ok(phaseContracts.includes("dynamic_writes: [LEGAL_DOC_DYNAMIC_ARTIFACT_PATTERN]"), "phase contracts must allow dynamic legal doc writes");
assert.ok(!contract.includes("domain_locking_allowed"), "Phase 1 must not allow domain locking");

console.log("Phase 1 agnostic source discovery no-legacy validator: PASS");
