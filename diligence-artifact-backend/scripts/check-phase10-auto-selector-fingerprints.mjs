import assert from "node:assert/strict";
import { artifactMatchesPhase10ExecutionFingerprint, resolveActiveThreatRegistryContext, stampPhase10ExecutionMetadata } from "../src/phases/10-exposure-profile/active-threat-registry-manifest.js";

function phase5(primaryPackage, overlays = []) {
  return {
    target_feature_profile: {
      mounted_taxonomy_ref: { primary_package_id: primaryPackage, primary_key_version: primaryPackage === "ai-governance" ? "v4.0" : "v1.0", overlays },
      activities: [{
        activity_reference: "ACT-001",
        primary_classification: { package_id: primaryPackage, archetype_codes: ["UNI"], surface_context_tokens: [], archetype_derivation_basis: [], surface_derivation_basis: [] },
        overlay_classifications: overlays.map((overlay) => ({ overlay_id: overlay.overlay_id, package_id: overlay.package_id, archetype_codes: ["UNI"], surface_context_tokens: [], archetype_derivation_basis: [], surface_derivation_basis: [] }))
      }]
    }
  };
}

function artifacts(primaryPackage, aiMount, overlays = []) {
  return {
    domain_derivation_profile: {
      primary_domain_derivation: { selected_package: primaryPackage, status: "LOCKED" },
      ai_mount_derivation: { ai_package_mount: aiMount }
    },
    active_run_package_manifest: {
      primary_domain_package: primaryPackage,
      primary_domain_status: "LOCKED",
      ai_package_mount: aiMount
    },
    ...phase5(primaryPackage, overlays)
  };
}

const ai = await resolveActiveThreatRegistryContext({ runId: "AI", artifacts: artifacts("ai-governance", "AI_PRIMARY") });
assert.deepEqual(ai.selection.mounted_packages, ["ai-governance"]);
assert.equal(ai.registries.length, 1);
assert.equal(ai.registries[0].stream_type, "PRIMARY");
assert.equal(ai.artifact.expected_row_count, 98);
assert.equal(ai.legacy_route_compatibility.ok, true);

const fintech = await resolveActiveThreatRegistryContext({ runId: "FIN", artifacts: artifacts("fintech", "AI_NOT_VISIBLE") });
assert.deepEqual(fintech.selection.mounted_packages, ["fintech"]);
assert.equal(fintech.registries.length, 1);
assert.equal(fintech.registries[0].registry_file, "FinTech_Threat_Registry.yaml");
assert.equal(fintech.artifact.expected_row_count, 46);
assert.equal(fintech.legacy_route_compatibility.ok, false);

const overlay = await resolveActiveThreatRegistryContext({
  runId: "FIN-AI",
  artifacts: artifacts("fintech", "AI_OVERLAY_MOUNTED", [{ overlay_id: "ai-native", package_id: "ai-governance", key_version: "v4.0" }])
});
assert.deepEqual(overlay.selection.mounted_packages, ["fintech", "ai-governance"]);
assert.equal(overlay.registries.length, 2);
assert.equal(overlay.registries[0].stream_type, "PRIMARY");
assert.equal(overlay.registries[1].stream_type, "OVERLAY");
assert.equal(overlay.artifact.expected_row_count, 144);
assert.equal(overlay.identity.registry_row_key_count, 144);
assert.ok(overlay.identity.canonical_threat_id_collision_count >= 1);
const privacyCollision = overlay.identity.canonical_threat_id_collisions.find((row) => row.Threat_ID === "UNI_PRV_001");
assert.ok(privacyCollision, "known cross-package canonical Threat_ID collision must be recorded");
assert.deepEqual(privacyCollision.registry_row_keys, ["ai-governance::UNI_PRV_001", "fintech::UNI_PRV_001"]);
assert.equal(overlay.artifact.validation.compound_identity_resolution_status, "PASS");

const candidateOnly = await resolveActiveThreatRegistryContext({ runId: "FIN-CANDIDATE", artifacts: artifacts("fintech", "AI_CANDIDATE_ONLY") });
assert.deepEqual(candidateOnly.selection.mounted_packages, ["fintech"]);

assert.notEqual(ai.registry_set_fingerprint, fintech.registry_set_fingerprint);
assert.notEqual(fintech.registry_set_fingerprint, overlay.registry_set_fingerprint);
assert.notEqual(ai.phase10_execution_fingerprint, overlay.phase10_execution_fingerprint);

const checkpoint = stampPhase10ExecutionMetadata({ artifact: "route" }, overlay.artifact);
assert.ok(artifactMatchesPhase10ExecutionFingerprint(checkpoint, overlay.phase10_execution_fingerprint));
assert.equal(artifactMatchesPhase10ExecutionFingerprint(checkpoint, fintech.phase10_execution_fingerprint), false);

await assert.rejects(
  () => resolveActiveThreatRegistryContext({
    runId: "MISMATCH",
    artifacts: {
      ...artifacts("fintech", "AI_NOT_VISIBLE"),
      active_run_package_manifest: { primary_domain_package: "ai-governance", primary_domain_status: "LOCKED", ai_package_mount: "AI_NOT_VISIBLE" }
    }
  }),
  /ACTIVE_PACKAGE_MANIFEST_MISMATCH:PRIMARY/
);
await assert.rejects(
  () => resolveActiveThreatRegistryContext({ runId: "BAD-MOUNT", artifacts: artifacts("fintech", "AI_PRIMARY") }),
  /DOMAIN_MOUNT_INCONSISTENCY/
);

console.log(JSON.stringify({
  check: "phase10 deterministic auto-selector and execution fingerprints",
  status: "PASS",
  ai_primary_rows: ai.artifact.expected_row_count,
  fintech_primary_rows: fintech.artifact.expected_row_count,
  fintech_ai_union_rows: overlay.artifact.expected_row_count,
  canonical_threat_id_collision_count: overlay.identity.canonical_threat_id_collision_count,
  known_collision: privacyCollision,
  execution_identity_version: overlay.identity.version,
  stale_checkpoint_rejected: true
}, null, 2));
