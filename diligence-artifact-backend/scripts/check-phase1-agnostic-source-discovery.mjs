import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

const contract = read("src/phases/01-source-discovery/source-discovery.contract.js");
const runner = read("src/phases/01-source-discovery/source-discovery.runner.js");
const urlJob = read("src/phases/01-source-discovery/jobs/url-manifest.job.js");
const extractionJob = read("src/phases/01-source-discovery/jobs/source-extraction.job.js");
const handoffJob = read("src/phases/01-source-discovery/jobs/source-family-handoff.job.js");
const upgrade = read("src/phases/01-source-discovery/services/phase1-agnostic-upgrade.service.js");
const permissions = read("src/runtime/contracts/artifact-permissions.contract.js");
const phaseContracts = read("src/phase-contracts.js");

for (const artifact of [
  "source_discovery_matrix_manifest",
  "adapter_expansion_log",
  "neutral_evidence_bucket_manifest",
  "legal_doc_inventory",
  "legal_doc_extraction_index",
  "legal_doc_lossless_validation_manifest",
  "post_phase_1_domain_gate_handoff"
]) {
  assert.ok(contract.includes(artifact), `contract missing ${artifact}`);
  assert.ok(permissions.includes(artifact), `permissions missing ${artifact}`);
}

assert.ok(contract.includes("common agnostic roots + neutral signal buckets + independent legal documents"), "contract must lock agnostic storage taxonomy");
assert.ok(contract.includes("legal_document_blob_merging"), "contract must forbid legal document blob merging");
assert.ok(runner.includes("phase_1_agnostic_bucket_upgrade_wired: true"), "runner must advertise Phase 1 agnostic upgrade");
assert.ok(urlJob.includes("buildPhase1UrlManifestUpgradeArtifacts"), "URL manifest job must emit upgraded control artifacts");
assert.ok(extractionJob.includes("buildPhase1ExtractionUpgradeArtifacts"), "extraction job must emit common roots and legal docs");
assert.ok(handoffJob.includes("buildPhase1HandoffUpgradeArtifacts"), "handoff job must emit post phase 1 domain gate handoff");
assert.ok(upgrade.includes("COMMON_ROOTS"), "upgrade service must define common roots");
assert.ok(upgrade.includes("NEUTRAL_BUCKETS"), "upgrade service must define neutral buckets");
assert.ok(upgrade.includes("LEGAL_DOC_RULES"), "upgrade service must define legal doc rules");
assert.ok(upgrade.includes("one legal document source only"), "legal doc artifacts must be document-granular");
assert.ok(permissions.includes("LOSSLESS_COMMON_ROOT_ARTIFACT_PATTERN"), "permissions must allow lossless_root artifacts");
assert.ok(permissions.includes("LEGAL_DOC_ARTIFACT_PATTERN"), "permissions must allow legal_doc artifacts");
assert.ok(phaseContracts.includes("dynamic_writes: [LEGAL_DOC_DYNAMIC_ARTIFACT_PATTERN]"), "phase contracts must allow dynamic legal doc writes");
assert.ok(!contract.includes("domain_locking_allowed"), "Phase 1 must not allow domain locking");

console.log("Phase 1 agnostic source discovery validator: PASS");
