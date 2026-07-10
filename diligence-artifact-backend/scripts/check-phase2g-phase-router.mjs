import assert from "node:assert/strict";
import {
  PHASE_ROUTING_ARTIFACT_NAMES,
  INTERNAL_JOB_WRITE_PERMISSIONS,
  TARGET_PROFILE_SOURCE_ARTIFACT_NAMES,
  DOMAIN_DERIVATION_SOURCE_ROOT_ARTIFACT_NAMES,
  ACTIVITY_PROFILE_SOURCE_ARTIFACT_NAMES,
  DATA_PROVENANCE_SOURCE_ARTIFACT_NAMES,
  DOMAIN_CONTROL_OBLIGATION_SOURCE_ARTIFACT_NAMES,
  LEGAL_GOVERNANCE_SOURCE_ARTIFACT_NAMES
} from "../src/runtime/contracts/artifact-permissions.contract.js";
import { PIPELINE_CONTRACTS, INTERNAL_PIPELINE_JOB_IDS, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";
import { CENTRAL_PHASES } from "../src/runtime/contracts/central-phase.contract.js";
import { P2G_PHASE_ROUTER_CONTRACT, P2G_PHASE_ROUTING_ARTIFACTS, P2G_ROUTE_BUCKETS, P2G_ROUTING_DOCTRINE, P2G_NO_FALLBACK_DOCTRINE, PHASE_ROUTE_BUCKET_IDS } from "../src/phases/02-cartography-index/phase-routing.contract.js";
import { buildPhaseRoutingManifest, buildPhaseRouteValidationManifest } from "../src/phases/02-cartography-index/services/phase-routing-manifest.builder.js";
import { validatePhaseRoutingManifest, validatePhaseRouteValidationManifest } from "../src/phases/02-cartography-index/validators/phase-routing-manifest.validator.js";

assert.deepEqual(PHASE_ROUTING_ARTIFACT_NAMES, ["phase_routing_manifest", "phase_route_validation_manifest"]);
assert.deepEqual(INTERNAL_JOB_WRITE_PERMISSIONS.P2G_PHASE_ROUTER, PHASE_ROUTING_ARTIFACT_NAMES);
assert.ok(INTERNAL_PIPELINE_JOB_IDS.includes("P2G_PHASE_ROUTER"));
assert.equal(PIPELINE_CONTRACTS.P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX.next, "P2G_PHASE_ROUTER");
assert.equal(PIPELINE_CONTRACTS.P2G_PHASE_ROUTER.next, "P2_INDEX_COMPILER_VALIDATION");
assert.deepEqual(PIPELINE_CONTRACTS.P2G_PHASE_ROUTER.writes, PHASE_ROUTING_ARTIFACT_NAMES);
assert.equal(PIPELINE_CONTRACTS.P2G_PHASE_ROUTER.lossless_evidence_is_primary, true);
assert.equal(PIPELINE_CONTRACTS.P2G_PHASE_ROUTER.index_navigation_mandatory, true);
assert.equal(PIPELINE_CONTRACTS.P2G_PHASE_ROUTER.direct_lossless_fallback_framing_forbidden, true);
for (const artifact of PHASE_ROUTING_ARTIFACT_NAMES) {
  assert.ok(PIPELINE_CONTRACTS.P2_INDEX_COMPILER_VALIDATION.reads.includes(artifact), `P2_INDEX must read ${artifact}`);
  assert.equal(PIPELINE_CONTRACTS.P2_INDEX_COMPILER_VALIDATION.writes.includes(artifact), false, `P2_INDEX must not write ${artifact}`);
}
assert.deepEqual(CENTRAL_PHASES.find((phase) => phase.sequence === 2).internal_jobs.filter((id) => id.startsWith("P2") || id === "M9"), ["P2_SOURCE_INVENTORY_CARTOGRAPHY", "P2_LOCATOR_SPINE", "P2_PROFILE_ROUTE_MATRIX", "P2_SEMANTIC_NAVIGATION_OVERLAY", "M9", "P2A_TARGET_PROFILE_SOURCE_INDEX", "P2B_DOMAIN_DERIVATION_SOURCE_INDEX", "P2C_ACTIVITY_PROFILE_SOURCE_INDEX", "P2D_DATA_PRIVACY_NAVIGATION_INDEX", "P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX", "P2G_PHASE_ROUTER", "P2_INDEX_COMPILER_VALIDATION"]);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2g_phase_router_declared, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2g_phase_router_runtime_wired, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2g_lossless_evidence_primary, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2g_index_navigation_mandatory, true);

assert.equal(P2G_PHASE_ROUTER_CONTRACT.designation, "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY");
assert.equal(P2G_PHASE_ROUTER_CONTRACT.doctrine.lossless_evidence_is_primary, true);
assert.equal(P2G_PHASE_ROUTER_CONTRACT.doctrine.index_navigation_mandatory, true);
assert.equal(P2G_PHASE_ROUTER_CONTRACT.doctrine.direct_lossless_fallback_framing_forbidden, true);
assert.equal(P2G_ROUTING_DOCTRINE, "LOSSLESS_EVIDENCE_IS_PRIMARY_AND_MUST_BE_NAVIGATED_THROUGH_INDEX");
assert.equal(P2G_NO_FALLBACK_DOCTRINE, "DIRECT_LOSSLESS_EVIDENCE_IS_NOT_FALLBACK");
assert.equal(P2G_ROUTE_BUCKETS.length, 6);

const expectedEvidenceByBucket = Object.freeze({
  [PHASE_ROUTE_BUCKET_IDS.targetProfile]: TARGET_PROFILE_SOURCE_ARTIFACT_NAMES,
  [PHASE_ROUTE_BUCKET_IDS.domainDerivation]: DOMAIN_DERIVATION_SOURCE_ROOT_ARTIFACT_NAMES,
  [PHASE_ROUTE_BUCKET_IDS.activityProfile]: ACTIVITY_PROFILE_SOURCE_ARTIFACT_NAMES,
  [PHASE_ROUTE_BUCKET_IDS.dataPrivacy]: DATA_PROVENANCE_SOURCE_ARTIFACT_NAMES,
  [PHASE_ROUTE_BUCKET_IDS.domainControlObligation]: DOMAIN_CONTROL_OBLIGATION_SOURCE_ARTIFACT_NAMES,
  [PHASE_ROUTE_BUCKET_IDS.legalCartographySignals]: LEGAL_GOVERNANCE_SOURCE_ARTIFACT_NAMES
});

for (const bucket of P2G_ROUTE_BUCKETS) {
  assert.ok(expectedEvidenceByBucket[bucket.bucket_id], `unknown bucket ${bucket.bucket_id}`);
  assert.deepEqual(bucket.primary_lossless_evidence, expectedEvidenceByBucket[bucket.bucket_id]);
  assert.ok(bucket.required_index_artifacts.length >= 1, `${bucket.bucket_id} must have required index`);
  assert.equal(bucket.lossless_evidence_primary, true, `${bucket.bucket_id} lossless must be primary`);
  assert.equal(bucket.index_navigation_mandatory, true, `${bucket.bucket_id} index navigation must be mandatory`);
  assert.equal(bucket.direct_lossless_as_fallback_allowed, false, `${bucket.bucket_id} fallback framing must be forbidden`);
  assert.equal(bucket.free_corpus_read_allowed, false, `${bucket.bucket_id} free corpus read forbidden`);
  assert.equal(bucket.navigation_rule, P2G_ROUTING_DOCTRINE);
  for (const profile of bucket.allowed_preceding_derived_profiles || []) assert.equal(String(profile).includes("forensics"), false, `${bucket.bucket_id} must not allow forensics profile input ${profile}`);
}

const output = buildPhaseRoutingManifest({ runId: "TEST-RUN", artifacts: { target_profile_source_index: {}, domain_derivation_source_index: {}, activity_profile_source_index: {}, data_privacy_navigation_index: {}, domain_control_obligation_navigation_index: {}, legal_cartography_index: {}, legal_signal_derivation_profile: {} } });
const manifest = output.phase_routing_manifest;
assert.equal(manifest.artifact_type, P2G_PHASE_ROUTING_ARTIFACTS.manifest);
assert.equal(manifest.doctrine.lossless_evidence_is_primary, true);
assert.equal(manifest.doctrine.index_role, "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE");
assert.equal(manifest.doctrine.direct_lossless_as_fallback_allowed, false);
assert.equal(manifest.route_buckets.length, 6);
const validation = validatePhaseRoutingManifest(manifest);
assert.equal(validation.ok, true);
const validationManifest = buildPhaseRouteValidationManifest({ phaseRoutingManifest: output, validation }).phase_route_validation_manifest;
assert.equal(validatePhaseRouteValidationManifest(validationManifest).ok, true);
const serialized = JSON.stringify(manifest);
for (const forbidden of ["LOSSLESS_EVIDENCE_IS_FALLBACK", "fallback_allowed\":true", "direct_lossless_as_fallback_allowed\":true", "free_corpus_read_allowed\":true"]) assert.equal(serialized.includes(forbidden), false, `forbidden fallback/free-read marker: ${forbidden}`);
console.log("Phase 2G phase router: PASS");
