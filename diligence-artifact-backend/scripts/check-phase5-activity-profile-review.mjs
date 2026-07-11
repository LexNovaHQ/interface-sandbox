import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getPipelineContract } from "../src/runtime/contracts/pipeline.contract.js";
import { resolveActivityTaxonomy } from "../src/runtime/domain-gate/activity-taxonomy.resolver.js";
import {
  buildM8FeatureCoverageForensics,
  validateFeatureCandidateCoverage
} from "../src/phases/_shared/forensics/profile-forensics.shared.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

const candidate = getPipelineContract("M8_FEATURE_CANDIDATE_INVENTORY");
const material = getPipelineContract("M8_TARGET_FEATURE_PROFILE");

assert.equal(candidate.central_phase_id, "ACTIVITY_PROFILE_REVIEW");
assert.equal(candidate.provider_injected_by_central_runtime, true);
assert.equal(candidate.model_usage, "DETERMINISTIC_LED_SEMANTIC_SUPPORTED");
assert.ok((candidate.prompt_files || []).some((file) => file.endsWith("03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC_LED_SEMANTIC_SUPPORTED.md")));

assert.equal(material.central_phase_id, "ACTIVITY_PROFILE_REVIEW");
assert.equal(material.model_usage, "MODEL_JSON_ONLY_PACKAGE_TAXONOMY_INJECTED");
assert.equal(material.mounted_taxonomy_ref_stamped_by_backend, true);
assert.equal(material.primary_overlay_schema_active, true);
assert.deepEqual(material.reads, ["phase_routing_manifest"]);

const resolved = await resolveActivityTaxonomy({
  primaryPackageId: "fintech",
  capabilityOverlayIds: ["ai-native"]
});
assert.equal(resolved.primary?.package_id, "fintech");
assert.equal(resolved.overlays[0]?.package_id, "ai-governance");

const coverage = validateFeatureCandidateCoverage(
  {
    feature_candidate_inventory: {
      candidates: [{
        candidate_id: "FC.001",
        candidate_name: "Payment initiation",
        capability_key: "payment-initiation",
        canonical_feature_key: "PRODUCT_CAPABILITY_ROUTE::payment-initiation",
        source_pointers: [{ unit_id: "unit-1", source_id: "src-1" }]
      }]
    }
  },
  {
    target_feature_profile: {
      activities: [{
        activity_reference: "ACT.001",
        product_service_wrapper: "Payment initiation API",
        activity_feature_name: "Payment initiation"
      }]
    }
  }
);
assert.equal(coverage.coverage_result, "PASS");

const forensics = buildM8FeatureCoverageForensics(
  { candidates: [{ candidate_id: "FC.001", candidate_name: "Payment initiation", capability_key: "payment-initiation" }] },
  { activities: [{ activity_reference: "ACT.001", product_service_wrapper: "Payment initiation API", activity_feature_name: "Payment initiation" }] }
);
assert.ok(forensics.feature_candidate_inventory_ref);

assert.equal(fs.existsSync(path.join(backendRoot, "src/phases/05-activity-profile-review/services/activity-candidate-inventory.boundary.js")), false, "boundary file must be deleted");
assert.equal(fs.existsSync(path.join(backendRoot, "agent-packages/agent_3_target_feature/03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC.md")), false, "old deterministic prompt must be deleted");

const phase5Files = [
  "src/phases/05-activity-profile-review",
  "agent-packages/agent_3_target_feature",
  "scripts"
].flatMap(walk).filter((file) => file.endsWith(".js") || file.endsWith(".md") || file.endsWith(".yaml") || file.endsWith(".yml"));

const joined = phase5Files.map((file) => fs.readFileSync(file, "utf8")).join("\n");
for (const forbidden of [
  "AI_ONLY_LOCKED_ENUM",
  "AI_ONLY_SURFACE_ENUM",
  "validateNoAiOnlyEnumLock",
  "NONE_DETERMINISTIC",
  "must_not_call_provider",
  "deterministic_only",
  "DETERMINISTIC_INDEX_FROM_ACTIVITY_PROFILE_SOURCE_INDEX_NO_MODEL_NO_EVIDENCE_COMPILATION",
  "m8_feature_candidate_inventory_index_v2_phase2c",
  "m8_feature_candidate_inventory_index_v3_evidence_grounded",
  "archetype_derivation_authority: AI_Registry_Key",
  "surface_derivation_authority: AI_Registry_Key",
  "must not independently scan"
]) {
  assert.equal(joined.includes(forbidden), false, `forbidden active Phase 5 marker remains: ${forbidden}`);
}

console.log("Phase 5 final closure aggregate: PASS");

function walk(relative) {
  const full = path.join(backendRoot, relative);
  if (!fs.existsSync(full)) return [];
  const stat = fs.statSync(full);
  if (stat.isFile()) return [full];
  return fs.readdirSync(full).flatMap((entry) => walk(path.join(relative, entry)));
}
