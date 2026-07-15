import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  P2C_ACTIVITY_PROFILE_ARTIFACTS,
  P2C_ACTIVITY_PROFILE_ROOT_INPUTS
} from "../src/phases/02-cartography-index/activity-profile-source-index.contract.js";
import { buildActivityProfileDeterministicMap } from "../src/phases/02-cartography-index/services/activity-profile-deterministic-map.builder.js";
import { validateActivityProfileSemanticProfile } from "../src/phases/02-cartography-index/validators/activity-profile-semantic-profile.validator.js";
import { compileActivityProfileSourceIndex } from "../src/phases/02-cartography-index/services/activity-profile-source-index.compiler.js";
import { validateActivityProfileSourceIndex } from "../src/phases/02-cartography-index/validators/activity-profile-source-index.validator.js";
import { runActivityProfileSourceIndexOrchestrator } from "../src/phases/02-cartography-index/orchestrators/activity-profile-source-index.orchestrator.js";

const ROOT = process.cwd();
const REQUIRED_FILES = Object.freeze([
  "src/phases/02-cartography-index/activity-profile-source-index.contract.js",
  "src/phases/02-cartography-index/services/activity-profile-deterministic-map.builder.js",
  "src/phases/02-cartography-index/validators/activity-profile-semantic-profile.validator.js",
  "src/phases/02-cartography-index/services/activity-profile-source-index.compiler.js",
  "src/phases/02-cartography-index/validators/activity-profile-source-index.validator.js",
  "src/phases/02-cartography-index/orchestrators/activity-profile-source-index.orchestrator.js"
]);
for (const file of REQUIRED_FILES) assert.ok(fs.existsSync(path.join(ROOT, file)), `${file} must exist`);

assert.equal(P2C_ACTIVITY_PROFILE_ARTIFACTS.deterministicMap, "activity_profile_deterministic_map");
assert.equal(P2C_ACTIVITY_PROFILE_ARTIFACTS.semanticProfile, "activity_profile_semantic_profile");
assert.equal(P2C_ACTIVITY_PROFILE_ARTIFACTS.finalIndex, "activity_profile_source_index");
assert.equal(P2C_ACTIVITY_PROFILE_ROOT_INPUTS.length, 9, "2C must read exactly 9 activity-profile roots");

const artifacts = fixtureArtifacts();
const deterministicWrapper = buildActivityProfileDeterministicMap({ run: { run_id: "TEST-P2C", target_url: "https://example.com" }, artifacts });
const deterministic = deterministicWrapper[P2C_ACTIVITY_PROFILE_ARTIFACTS.deterministicMap];
assert.ok(deterministic, "builder must emit activity_profile_deterministic_map");
assert.equal(deterministic.downstream_rules.activity_profile_source_index_owned_by_2c, true);
assert.equal(deterministic.downstream_rules.domain_package_specific_activity_taxonomy_deferred_to_phase5, true);
assert.equal(deterministic.downstream_rules.package_specific_classification_forbidden_in_2c, true);
assert.equal(deterministic.downstream_rules.archetype_derivation_forbidden_in_2c, true);
assert.equal(deterministic.downstream_rules.surface_derivation_forbidden_in_2c, true);
assert.equal(deterministic.source_artifacts_read.length, 9);

const routeMaps = Object.freeze([
  "activity_candidate_source_locator_map",
  "product_capability_locator_map",
  "feature_mechanics_locator_map",
  "technical_mechanics_locator_map",
  "api_interaction_locator_map",
  "data_object_interaction_locator_map",
  "integration_action_locator_map",
  "commercial_availability_locator_map",
  "customer_use_context_locator_map",
  "support_operational_context_locator_map",
  "automation_transparency_context_locator_map",
  "human_control_context_locator_map",
  "external_action_context_locator_map",
  "input_output_object_context_locator_map"
]);
for (const key of routeMaps) assert.ok(Array.isArray(deterministic[key]) && deterministic[key].length > 0, `${key} must be non-empty on fixture evidence`);
for (const row of routeMaps.flatMap((key) => deterministic[key])) {
  assert.equal(row.route_action, "LOCATE_ONLY");
  assert.equal(row.derived_value_forbidden, true);
  assert.equal(row.package_specific_classification_forbidden, true);
  assert.equal(row.source_text_copied, false);
  assert.equal("lossless_text" in row, false);
  assert.equal("mechanics_proof" in row, false);
  assert.equal("archetype_codes" in row, false);
  assert.equal("surface_context_tokens" in row, false);
}
for (const row of deterministic.customer_use_context_locator_map) assert.equal(row.candidate_creation_allowed, false, "customer/use context must not create standalone candidates");
for (const row of deterministic.support_operational_context_locator_map) assert.equal(row.candidate_creation_allowed, false, "support context must not create standalone candidates");
for (const row of deterministic.automation_transparency_context_locator_map) assert.equal(row.candidate_creation_allowed, false, "automation/transparency context must not create standalone candidates");

const semantic = semanticFor(deterministic);
const semanticValidation = validateActivityProfileSemanticProfile(semantic, { deterministicMap: deterministic });
assert.equal(semanticValidation.status, "PASS", semanticValidation.failures.join("; "));

const finalWrapper = compileActivityProfileSourceIndex({ deterministicMap: deterministic, semanticProfile: semantic });
assert.ok(finalWrapper.activity_profile_source_index, "compiler must emit activity_profile_source_index");
assert.equal("feature_candidate_inventory" in finalWrapper, false, "compiler must not emit feature_candidate_inventory");
assert.equal("target_feature_profile" in finalWrapper, false, "compiler must not emit target_feature_profile");
const finalValidation = validateActivityProfileSourceIndex({ sourceIndex: finalWrapper });
assert.equal(finalValidation.ok, true, finalValidation.errors.join("; "));

const badSemantic = structuredClone(semantic);
badSemantic.activity_profile_semantic_profile.semantic_route_labels[0].archetype_codes = ["UNI"];
assert.equal(validateActivityProfileSemanticProfile(badSemantic, { deterministicMap: deterministic }).status, "FAIL", "semantic archetype leakage must fail");

const badSemanticText = structuredClone(semantic);
badSemanticText.activity_profile_semantic_profile.semantic_route_labels[0].semantic_reason_code = "archetype code locked";
assert.equal(validateActivityProfileSemanticProfile(badSemanticText, { deterministicMap: deterministic }).status, "FAIL", "semantic package-classification prose must fail");

const badFinal = structuredClone(finalWrapper);
badFinal.activity_profile_source_index.activity_candidate_source_locator_map[0].surface_context_tokens = ["PII"];
assert.equal(validateActivityProfileSourceIndex({ sourceIndex: badFinal }).ok, false, "final surface leakage must fail");

const badFinalProof = structuredClone(finalWrapper);
badFinalProof.activity_profile_source_index.feature_mechanics_locator_map[0].mechanics_proof = "This feature does X";
assert.equal(validateActivityProfileSourceIndex({ sourceIndex: badFinalProof }).ok, false, "final mechanics proof leakage must fail");

const saves = [];
const orchestratorResult = await runActivityProfileSourceIndexOrchestrator({
  run: { run_id: "TEST-P2C", target_url: "https://example.com" },
  artifacts,
  saveArtifact: async ({ artifact_name }) => saves.push(artifact_name)
});
assert.equal(orchestratorResult.ok, true);
assert.deepEqual(saves, ["activity_profile_deterministic_map", "activity_profile_semantic_profile", "activity_profile_source_index"]);

console.log("Phase 2C activity profile source implementation check: PASS");

function semanticFor(deterministic) {
  const queue = deterministic.semantic_label_queue || [];
  const rows = queue.map((row) => ({
    queue_id: row.queue_id,
    unit_id: row.unit_id,
    route_classes: row.route_classes,
    route_signal_families: row.route_signal_families,
    confidence: row.confidence,
    semantic_reason_code: "P2C_ROUTE_CONFIRMED",
    source_text_copied: false,
    package_specific_classification_forbidden: true,
    route_label_status: "CONFIRMED"
  }));
  return {
    activity_profile_semantic_profile: {
      artifact_type: "activity_profile_semantic_profile",
      schema_version: "P2C_ACTIVITY_PROFILE_SEMANTIC_PROFILE_v1_PHASE1_V5_DOMAIN_AGNOSTIC",
      generated_by: "phase2c_activity_profile_semantic_fixture",
      source_text_policy: {
        source_artifacts_remain_source_of_truth: true,
        source_text_copied: false,
        summaries_allowed: false,
        excerpts_allowed: false
      },
      semantic_route_labels: rows,
      semantic_navigation_index: rows.map((row) => ({
        queue_id: row.queue_id,
        unit_id: row.unit_id,
        route_classes: row.route_classes,
        route_signal_families: row.route_signal_families,
        reading_priority: row.route_classes.includes("ACTIVITY_CANDIDATE_SOURCE_ROUTE") ? "P0" : "P1",
        navigation_status: "USE_POINTERS_ONLY",
        source_text_copied: false,
        package_specific_classification_forbidden: true
      })),
      semantic_integrity: {
        deterministic_queue_count: queue.length,
        labeled_queue_count: rows.length,
        coverage_ratio: queue.length ? 1 : 1,
        ready_for_compiler: true
      },
      package_boundary: {
        domain_agnostic_activity_locator_only: true,
        mounted_domain_package_controls_activity_taxonomy: true,
        archetype_surface_and_package_field_derivation_forbidden: true,
        phase_5_derives_profile_values_later: true
      },
      downstream_rules: {
        phase_2c_is_index_only: true,
        activity_profile_source_index_owned_by_2c: true,
        phase_5_activity_profile_review_derives_values_later: true,
        domain_package_specific_activity_taxonomy_deferred_to_phase5: true,
        archetype_derivation_allowed: false,
        surface_derivation_allowed: false,
        package_specific_classification_allowed: false,
        feature_candidate_inventory_emission_allowed: false,
        mechanics_proof_allowed: false,
        source_text_copy_allowed: false
      },
      lock_status: "LOCKED"
    }
  };
}

function fixtureArtifacts() {
  const base = {
    product_service: "Product platform service capability and solution for teams. Users can upload files, send messages, manage records, create outputs, export results, and configure workflow modules.",
    platform_feature_solution: "Feature workflow shows how it works: user can configure settings, system automatically processes documents, generates results, routes notifications, reviews records, and returns outputs.",
    technical_docs_api: "Developer API docs describe SDK authentication, endpoint request response method parameters, payload schema, webhook callback events, integration architecture, and token configuration.",
    docs_api_data_flow: "Data flow docs explain record file document message content metadata payload input output import export convert extract transform parse and response handling.",
    integrations_ecosystem: "Integration connector plugin app marketplace partner systems sync connect push pull send receive import export third-party recipient and client delivery actions.",
    pricing_commercial_availability: "Pricing plan tier subscription seat usage quote contact sales beta pilot trial free freemium enterprise production availability.",
    use_case_customer_industry: "Use case customer industry team department workflow scenario for users, customers, developers, operators, admins, teams, and enterprises.",
    support_help_resources: "Help support guide tutorial FAQ troubleshoot documentation knowledge base settings configuration account admin permission role access delete disable manage manual review approve override control.",
    ai_safety_transparency: "Automation transparency page describes automated algorithm model decision recommendation prediction classification explanation review evaluation monitoring safety guardrail human manual approval override supervision."
  };
  return Object.fromEntries(P2C_ACTIVITY_PROFILE_ROOT_INPUTS.map((artifact) => {
    const root = artifact.replace(/^lossless_root__/, "");
    return [artifact, { rows: [{ source_id: `${root}-1`, url: `https://example.com/${root}`, lossless_text: base[root] }] }];
  }));
}
