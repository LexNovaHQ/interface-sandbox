import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AGENT_1A_ARTIFACT_NAMES,
  AGENT_1B_REQUIRED_ARTIFACT_NAMES,
  AGENT_1B_OPTIONAL_ROOT_ARTIFACT_NAMES,
  COMMON_ROOT_CODES,
  LOSSLESS_COMMON_ROOT_ARTIFACT_NAMES,
  SOURCE_DISCOVERY_HANDOFF_ARTIFACT_NAMES,
  LEGAL_DOC_DYNAMIC_PERMISSION
} from "../src/runtime/contracts/artifact-permissions.contract.js";
import { PIPELINE_CONTRACTS } from "../src/runtime/contracts/pipeline.contract.js";
import { buildSourceFamilyHandoffArtifact } from "../src/phases/01-source-discovery/services/source-family-handoff.service.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const freezePath = path.join(ROOT, "src/phases/01-source-discovery/contracts/PHASE1_PUBLIC_CONTRACT_FREEZE_v1.json");
const freeze = JSON.parse(fs.readFileSync(freezePath, "utf8"));

assert.equal(freeze.freeze_id, "PHASE1_PUBLIC_CONTRACT_FREEZE_v1");
assert.equal(freeze.status, "LOCKED_BEFORE_UNIVERSAL_DEDUPE_REBUILD");

assert.deepEqual(AGENT_1A_ARTIFACT_NAMES, freeze.agent_1a_required_writes, "AGENT_1A public writes drifted");
assert.deepEqual(AGENT_1B_REQUIRED_ARTIFACT_NAMES, freeze.agent_1b_required_writes, "AGENT_1B required public writes drifted");
assert.deepEqual(SOURCE_DISCOVERY_HANDOFF_ARTIFACT_NAMES, freeze.m6_required_writes, "M6 public writes drifted");
assert.deepEqual(COMMON_ROOT_CODES, freeze.common_root_codes, "17-root public identity drifted");
assert.deepEqual(LOSSLESS_COMMON_ROOT_ARTIFACT_NAMES, COMMON_ROOT_CODES.map((root) => `lossless_root__${root}`), "root artifact identities drifted");
assert.deepEqual(AGENT_1B_OPTIONAL_ROOT_ARTIFACT_NAMES, LOSSLESS_COMMON_ROOT_ARTIFACT_NAMES, "AGENT_1B root write permissions drifted");
assert.equal(LEGAL_DOC_DYNAMIC_PERMISSION, freeze.dynamic_patterns.legal_document, "dynamic legal-document permission drifted");

for (let index = 0; index < freeze.job_sequence.length - 1; index += 1) {
  const jobId = freeze.job_sequence[index];
  const expectedNext = freeze.job_sequence[index + 1];
  assert.equal(PIPELINE_CONTRACTS[jobId]?.next, expectedNext, `${jobId}.next drifted`);
  assert.equal(freeze.job_next[jobId], expectedNext, `${jobId} freeze sequence is internally inconsistent`);
}

for (const [jobId, requiredReads] of Object.entries(freeze.downstream_required_read_subsets)) {
  const actualReads = new Set(PIPELINE_CONTRACTS[jobId]?.reads || []);
  for (const artifact of requiredReads) {
    assert.ok(actualReads.has(artifact), `${jobId} no longer reads frozen Phase 1 artifact ${artifact}`);
  }
}

for (const [jobId, requiredPatterns] of Object.entries(freeze.dynamic_read_requirements)) {
  const actualPatterns = new Set(PIPELINE_CONTRACTS[jobId]?.dynamic_reads || []);
  for (const pattern of requiredPatterns) {
    assert.ok(actualPatterns.has(pattern), `${jobId} no longer accepts frozen dynamic read ${pattern}`);
  }
}

const projected = buildSourceFamilyHandoffArtifact({
  run: { run_id: "RB00-CONTRACT-FIXTURE", root_url: "https://example.test/", target: "https://example.test/" },
  artifacts: buildMinimalPhase1Artifacts()
});

assertRequiredFields(projected.source_discovery_handoff, freeze.handoff_required_top_level_fields.source_discovery_handoff, "source_discovery_handoff");
assertRequiredFields(projected.post_phase_1_domain_gate_handoff, freeze.handoff_required_top_level_fields.post_phase_1_domain_gate_handoff, "post_phase_1_domain_gate_handoff");

for (const root of freeze.common_root_codes) {
  const rootEntry = projected.source_discovery_handoff.common_root_index[root];
  assert.ok(rootEntry, `source_discovery_handoff missing frozen common root ${root}`);
  assertRequiredFields(rootEntry, freeze.common_root_entry_required_fields, `common_root_index.${root}`);
}

const sourceRef = projected.source_discovery_handoff.common_root_index.product_service.primary[0];
assert.ok(sourceRef, "contract fixture failed to emit a canonical source reference");
assertRequiredFields(sourceRef, freeze.canonical_source_reference_required_fields, "canonical source reference");

assert.equal(freeze.non_impact_guards.rename_existing_public_artifact, false);
assert.equal(freeze.non_impact_guards.remove_existing_public_field_used_downstream, false);
assert.equal(freeze.non_impact_guards.change_phase_job_id, false);
assert.equal(freeze.non_impact_guards.change_job_sequence, false);
assert.equal(freeze.non_impact_guards.change_17_root_identity, false);
assert.equal(freeze.non_impact_guards.change_dynamic_legal_document_pattern, false);
assert.equal(freeze.non_impact_guards.require_downstream_consumer_edit_for_phase1_rebuild, false);
assert.equal(freeze.non_impact_guards.allow_compatibility_projection, true);

console.log(JSON.stringify({
  check: "phase1 public contract freeze",
  status: "PASS",
  freeze_id: freeze.freeze_id,
  base_commit: freeze.base_commit,
  fixed_public_artifacts: freeze.agent_1a_required_writes.length + freeze.agent_1b_required_writes.length + freeze.m6_required_writes.length,
  common_roots: freeze.common_root_codes.length,
  downstream_jobs_guarded: Object.keys(freeze.downstream_required_read_subsets).length
}, null, 2));

function buildMinimalPhase1Artifacts() {
  const row = {
    source_id: "product_service.SRC.001",
    manifest_id: "product_service.URL.001",
    common_root: "product_service",
    root_traversal_policy: "PRIMARY_FULL_EXTRACT",
    canonical_url: "https://example.test/product",
    fetch_url: "https://example.test/product",
    url: "https://example.test/product",
    route_type: "product_root",
    route_type_aliases: [],
    materiality: "product_activity",
    admission_tier: "PRIMARY",
    extraction_decision: "EXTRACT",
    neutral_buckets: ["product_activity_sources"],
    source_signal_roles: ["PRODUCT_ACTIVITY_SIGNAL"],
    technical_route_shape: null,
    api_data_flow_signal: { present: false, basis: [] },
    legal_doc_candidate: false,
    legal_doc_type: "other",
    legal_doc_artifact_hint: "legal_doc_other",
    extraction_status: "FETCHED",
    sha256: "fixture-sha256",
    content_type: "text/html",
    final_url: "https://example.test/product"
  };
  return {
    deduped_url_manifest: {
      target_url: "https://example.test/",
      manifest_sources: [{ ...row, priority_route_found_by: "ROOT", tier_reason: "fixture" }]
    },
    source_family_index: {
      discovered_source_index: [row],
      manifest_only_index: [],
      metadata_only_index: [],
      failed_source_index: [],
      missing_limited_primary_sources: [],
      root_artifact_manifest: {
        product_service: {
          status: "SINGLE",
          virtual_artifact_name: "lossless_root__product_service",
          required_artifacts: ["lossless_root__product_service"],
          shard_count: 1,
          complete: true
        }
      }
    },
    lossless_root__product_service: {
      artifact_name: "lossless_root__product_service",
      common_root: "product_service",
      storage_mode: "SINGLE",
      sources: [{ ...row, lossless_text: "Contract fixture source text." }]
    },
    legal_doc_inventory: { documents_found: [] },
    neutral_evidence_bucket_manifest: { buckets: { product_activity_sources: { priority: "PRIMARY", sources: [] } } }
  };
}

function assertRequiredFields(value, fields, label) {
  assert.ok(value && typeof value === "object", `${label} missing`);
  for (const field of fields) assert.ok(Object.hasOwn(value, field), `${label} missing frozen field ${field}`);
}
