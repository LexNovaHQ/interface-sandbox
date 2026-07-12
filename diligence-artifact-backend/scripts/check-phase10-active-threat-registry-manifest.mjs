import assert from "node:assert/strict";
import { artifactMatchesPhase10ExecutionFingerprint, buildActiveThreatRegistryManifest, isCurrentActiveThreatRegistryManifest, resolveActiveThreatRegistryContext, stampPhase10ExecutionMetadata } from "../src/phases/10-exposure-profile/active-threat-registry-manifest.js";
import { AGENT_IDS, M11_STATIC_ARTIFACT_NAMES, assertCanWriteArtifact, assertInternalJobCanWriteArtifact } from "../src/runtime/contracts/artifact-permissions.contract.js";
import { getCentralPhase } from "../src/runtime/contracts/central-phase.contract.js";
import { getPipelineContract } from "../src/runtime/contracts/pipeline.contract.js";

const phase5 = {
  target_feature_profile: {
    mounted_taxonomy_ref: { primary_package_id: "ai-governance", primary_key_version: "v4.0", overlays: [] },
    activities: [{
      activity_reference: "ACT-001",
      primary_classification: { package_id: "ai-governance", archetype_codes: ["UNI"], surface_context_tokens: [], archetype_derivation_basis: [], surface_derivation_basis: [] },
      overlay_classifications: []
    }]
  }
};
const artifacts = {
  domain_derivation_profile: {
    primary_domain_derivation: { selected_package: "ai-governance", status: "LOCKED" },
    ai_mount_derivation: { ai_package_mount: "AI_PRIMARY" }
  },
  active_run_package_manifest: {
    primary_domain_package: "ai-governance",
    primary_domain_status: "LOCKED",
    ai_package_mount: "AI_PRIMARY"
  },
  ...phase5
};

const context = await resolveActiveThreatRegistryContext({ runId: "CO-2-CO-3-CHECK", artifacts });
const output = buildActiveThreatRegistryManifest({ context });
const manifest = output.active_threat_registry_manifest;
assert.ok(isCurrentActiveThreatRegistryManifest(manifest, context.phase10_execution_fingerprint));
assert.equal(manifest.selection_mode, "DETERMINISTIC_PHASE3_AUTO_SELECTOR");
assert.equal(manifest.auto_selector_status, "ACTIVE");
assert.equal(manifest.primary_package, "ai-governance");
assert.equal(manifest.ai_mount, "AI_PRIMARY");
assert.equal(manifest.expected_row_count, 98);
assert.equal(manifest.registries.length, 1);
assert.equal(manifest.registries[0].package_id, "ai-governance");
assert.equal(manifest.registries[0].routable_row_count, 98);
assert.equal(manifest.registries[0].active_row_count, 73);
assert.equal(manifest.registries[0].upcoming_row_count, 14);
assert.equal(manifest.registries[0].pending_row_count, 8);
assert.equal(manifest.registries[0].watch_row_count, 2);
assert.equal(manifest.registries[0].pending_watch_row_count, 1);
assert.equal(manifest.status_policy.mode, "INCLUDE_ALL_DECLARED_ROWS");
assert.equal(manifest.status_policy.row_filter, "NONE");
assert.equal(manifest.execution_identity_contract.version, "PHASE10_EXECUTION_IDENTITY_v2");
assert.match(manifest.registry_set_fingerprint, /^[a-f0-9]{64}$/);
assert.match(manifest.phase5_classification_fingerprint, /^[a-f0-9]{64}$/);
assert.match(manifest.phase10_execution_fingerprint, /^[a-f0-9]{64}$/);

const stamped = stampPhase10ExecutionMetadata({ sample: true }, manifest);
assert.ok(artifactMatchesPhase10ExecutionFingerprint(stamped, manifest.phase10_execution_fingerprint));
assert.equal(artifactMatchesPhase10ExecutionFingerprint({ ...stamped, phase10_execution_fingerprint: "0".repeat(64) }, manifest.phase10_execution_fingerprint), false);

assert.equal(M11_STATIC_ARTIFACT_NAMES[0], "active_threat_registry_manifest");
assert.doesNotThrow(() => assertCanWriteArtifact(AGENT_IDS.exposureRegistry, "active_threat_registry_manifest"));
assert.doesNotThrow(() => assertInternalJobCanWriteArtifact("M11", "active_threat_registry_manifest"));

const phase10 = getCentralPhase("EXPOSURE_PROFILE");
assert.equal(phase10.terminal_outputs[0], "active_threat_registry_manifest");
const m11 = getPipelineContract("M11");
assert.equal(m11.writes[0], "active_threat_registry_manifest");

console.log(JSON.stringify({
  check: "phase10 active threat registry manifest contract",
  status: "PASS",
  selection_mode: manifest.selection_mode,
  identity_version: manifest.execution_identity_contract.version,
  expected_row_count: manifest.expected_row_count,
  status_counts: manifest.registries[0].status_counts,
  registry_set_fingerprint: manifest.registry_set_fingerprint,
  phase10_execution_fingerprint: manifest.phase10_execution_fingerprint
}, null, 2));
