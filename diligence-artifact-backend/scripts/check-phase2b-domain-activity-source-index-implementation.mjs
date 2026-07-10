import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  P2B_DOMAIN_ACTIVITY_ARTIFACTS,
  P2B_DOMAIN_ACTIVITY_ROOT_INPUTS,
  P2B_DOMAIN_ACTIVITY_SAVE_ORDER,
  P2B_DOMAIN_ACTIVITY_DETERMINISTIC_MAP_KEYS,
  P2B_DOMAIN_ACTIVITY_FINAL_INDEX_KEYS,
  P2B_DOMAIN_ACTIVITY_ALLOWED_ROUTE_CLASSES,
  P2B_DOMAIN_ACTIVITY_ALLOWED_SIGNAL_FAMILIES
} from "../src/phases/02-cartography-index/domain-activity-source-index.contract.js";
import { buildDomainActivityDeterministicMap } from "../src/phases/02-cartography-index/services/domain-activity-deterministic-map.builder.js";
import { compileDomainActivitySourceIndex } from "../src/phases/02-cartography-index/services/domain-activity-source-index.compiler.js";
import { validateDomainActivitySemanticProfile } from "../src/phases/02-cartography-index/validators/domain-activity-semantic-profile.validator.js";
import { validateDomainActivitySourceIndex } from "../src/phases/02-cartography-index/validators/domain-activity-source-index.validator.js";
import { runDomainActivitySourceIndexOrchestrator, P2B_DOMAIN_ACTIVITY_SOURCE_SAVE_ORDER } from "../src/phases/02-cartography-index/orchestrators/domain-activity-source-index.orchestrator.js";

const ROOT = process.cwd();
const requiredFiles = [
  "src/phases/02-cartography-index/domain-activity-source-index.contract.js",
  "src/phases/02-cartography-index/services/domain-activity-deterministic-map.builder.js",
  "src/phases/02-cartography-index/services/domain-activity-source-index.compiler.js",
  "src/phases/02-cartography-index/validators/domain-activity-semantic-profile.validator.js",
  "src/phases/02-cartography-index/validators/domain-activity-source-index.validator.js",
  "src/phases/02-cartography-index/orchestrators/domain-activity-source-index.orchestrator.js",
  "agent-packages/phase_2b_domain_activity_source_index/P2B_DOMAIN_ACTIVITY_SOURCE_INDEX.md",
  "agent-packages/phase_2b_domain_activity_source_index/P2B_PACKET_MANIFEST.json"
];
for (const file of requiredFiles) assert.equal(fs.existsSync(path.join(ROOT, file)), true, `${file} must exist`);
assert.deepEqual(P2B_DOMAIN_ACTIVITY_SAVE_ORDER, [
  P2B_DOMAIN_ACTIVITY_ARTIFACTS.deterministicMap,
  P2B_DOMAIN_ACTIVITY_ARTIFACTS.semanticProfile,
  P2B_DOMAIN_ACTIVITY_ARTIFACTS.finalIndex
]);
assert.deepEqual(P2B_DOMAIN_ACTIVITY_SOURCE_SAVE_ORDER, P2B_DOMAIN_ACTIVITY_SAVE_ORDER);

const fixtureArtifacts = Object.fromEntries(P2B_DOMAIN_ACTIVITY_ROOT_INPUTS.map((artifactName) => {
  const commonRoot = artifactName.replace(/^lossless_root__/, "");
  return [artifactName, rootArtifact(commonRoot, textForRoot(commonRoot))];
}));
fixtureArtifacts.source_discovery_handoff = { target_url: "https://fixture.example/" };

const deterministicWrapper = buildDomainActivityDeterministicMap({
  run: { run_id: "CHECK-P2B-IMPL", target_url: "https://fixture.example/" },
  artifacts: fixtureArtifacts
});
const deterministic = deterministicWrapper[P2B_DOMAIN_ACTIVITY_ARTIFACTS.deterministicMap];
assert.ok(deterministic, "deterministic artifact root must exist");
for (const key of P2B_DOMAIN_ACTIVITY_DETERMINISTIC_MAP_KEYS) assert.ok(key in deterministic, `deterministic map missing ${key}`);
assert.equal(deterministic.model_used, false);
assert.equal(deterministic.downstream_rules.phase_2b_is_index_only, true);
assert.equal(deterministic.downstream_rules.domain_derivation_layer_derives_values_later, true);
assert.equal(deterministic.downstream_rules.primary_domain_derivation_forbidden_in_2b, true);
assert.equal(deterministic.downstream_rules.ai_overlay_derivation_forbidden_in_2b, true);
assert.equal(deterministic.downstream_rules.regulatory_overlay_derivation_forbidden_in_2b, true);
assert.equal(deterministic.downstream_rules.fusion_candidate_requires_composite_signal, true);
assert.equal(deterministic.downstream_rules.full_text_copied, false);
assert.equal(deterministic.downstream_rules.summaries_allowed, false);
assert.equal(deterministic.downstream_rules.excerpts_allowed, false);

assert.equal(deterministic.source_artifacts_read.length, P2B_DOMAIN_ACTIVITY_ROOT_INPUTS.length, "all 12 roots must be route-accounted");
assert.ok(deterministic.domain_activity_source_coverage_index.length >= P2B_DOMAIN_ACTIVITY_ROOT_INPUTS.length, "coverage index must account for all fixture roots");
assert.ok(deterministic.domain_activity_document_structure_index.length >= P2B_DOMAIN_ACTIVITY_ROOT_INPUTS.length, "structure index must not be skeletal");

const expectedNonEmptyMaps = [
  "primary_domain_locator_map",
  "ai_overlay_locator_map",
  "regulatory_overlay_locator_map",
  "fusion_candidate_locator_map",
  "activity_capability_locator_map",
  "commercial_availability_locator_map",
  "technical_capability_locator_map",
  "integration_ecosystem_locator_map",
  "use_case_customer_industry_locator_map"
];
for (const key of expectedNonEmptyMaps) assert.ok(Array.isArray(deterministic[key]) && deterministic[key].length > 0, `${key} must not be thin or empty on fixture`);
assert.ok(deterministic.semantic_label_queue.length > 0, "semantic label queue must be populated");
assert.equal(containsKey(deterministic, "lossless_text"), false, "deterministic map must not copy lossless_text key");
assert.equal(containsKey(deterministic, "derived_value"), false, "deterministic map must not emit derived_value key");
assert.equal(containsKey(deterministic, "primary_domain"), false, "deterministic map must not emit primary_domain key");

for (const row of deterministic.fusion_candidate_locator_map) {
  assert.equal(row.phase_2b_action, "LOCATE_ONLY");
  assert.equal(row.derived_value_emitted, false);
  assert.equal(row.source_text_copied, false);
  assert.ok(row.fusion_basis?.ai_signal_visible, "fusion candidate requires AI signal");
  assert.ok(Number(row.fusion_basis?.composite_signal_count || 0) >= 2, "fusion candidate requires composite signal count >= 2");
}
for (const row of collectLocatorRows(deterministic)) {
  assert.equal(row.phase_2b_action, "LOCATE_ONLY");
  assert.equal(row.derived_value_emitted, false);
  assert.equal(row.source_text_copied, false);
  assert.ok(P2B_DOMAIN_ACTIVITY_ALLOWED_ROUTE_CLASSES.includes(row.route_class), `invalid route class ${row.route_class}`);
}

const requiredRows = deterministic.semantic_label_queue.filter((row) => row.semantic_label_required === true || ["P0", "P1"].includes(row.priority));
assert.ok(requiredRows.length > 0, "fixture must create required semantic queue rows");
for (const row of requiredRows) {
  assert.ok(P2B_DOMAIN_ACTIVITY_ALLOWED_ROUTE_CLASSES.includes(row.route_class), `queue invalid route class ${row.route_class}`);
  for (const family of row.route_signal_families || []) assert.ok(P2B_DOMAIN_ACTIVITY_ALLOWED_SIGNAL_FAMILIES.includes(family), `queue invalid signal family ${family}`);
}

const semanticWrapper = makeSemanticWrapper(requiredRows);
const semanticValidation = validateDomainActivitySemanticProfile(semanticWrapper, deterministicWrapper);
assert.equal(semanticValidation.ok, true, semanticValidation.errors.join("|"));

const finalWrapper = compileDomainActivitySourceIndex({ deterministicMap: deterministicWrapper, semanticProfile: semanticWrapper });
const final = finalWrapper[P2B_DOMAIN_ACTIVITY_ARTIFACTS.finalIndex];
assert.ok(final, "final activity_profile_source_index root must exist");
for (const key of P2B_DOMAIN_ACTIVITY_FINAL_INDEX_KEYS) assert.ok(key in final, `final index missing ${key}`);
assert.equal(validateDomainActivitySourceIndex(finalWrapper).ok, true, validateDomainActivitySourceIndex(finalWrapper).errors.join("|"));
for (const key of expectedNonEmptyMaps) assert.ok(Array.isArray(final[key]) && final[key].length > 0, `final ${key} must not be thin or empty`);
assert.ok(final.priority_domain_activity_locator.length > 0, "priority_domain_activity_locator must be populated");
assert.equal(final.downstream_rules.domain_derivation_layer_derives_values_later, true);
assert.equal(final.downstream_rules.domain_package_selection_forbidden_in_2b, true);
assert.equal(final.downstream_rules.active_run_package_manifest_update_forbidden_in_2b, true);
assert.equal(containsKey(final, "lossless_text"), false, "final index must not copy lossless_text key");
assert.equal(containsKey(final, "primary_domain"), false, "final index must not emit primary_domain key");

const badDerivedSemantic = structuredClone(semanticWrapper);
badDerivedSemantic[P2B_DOMAIN_ACTIVITY_ARTIFACTS.semanticProfile].primary_domain = "fintech";
assert.equal(validateDomainActivitySemanticProfile(badDerivedSemantic, deterministicWrapper).ok, false, "semantic validator must reject primary_domain derivation");
const badCopySemantic = structuredClone(semanticWrapper);
badCopySemantic[P2B_DOMAIN_ACTIVITY_ARTIFACTS.semanticProfile].semantic_navigation_index[0].excerpt = "copied text";
assert.equal(validateDomainActivitySemanticProfile(badCopySemantic, deterministicWrapper).ok, false, "semantic validator must reject copied excerpt");
const badCoverageSemantic = structuredClone(semanticWrapper);
badCoverageSemantic[P2B_DOMAIN_ACTIVITY_ARTIFACTS.semanticProfile].semantic_navigation_index = [];
badCoverageSemantic[P2B_DOMAIN_ACTIVITY_ARTIFACTS.semanticProfile].semantic_integrity = { required_queue_count: requiredRows.length, labeled_queue_count: 0, coverage_ratio: 0, ready_for_compiler: false };
badCoverageSemantic[P2B_DOMAIN_ACTIVITY_ARTIFACTS.semanticProfile].lock_status = "REPAIR_REQUIRED";
assert.equal(validateDomainActivitySemanticProfile(badCoverageSemantic, deterministicWrapper).ok, false, "semantic validator must reject low coverage when required queue exists");
const badFinal = structuredClone(finalWrapper);
badFinal[P2B_DOMAIN_ACTIVITY_ARTIFACTS.finalIndex].primary_domain = "fintech";
assert.equal(validateDomainActivitySourceIndex(badFinal).ok, false, "final validator must reject primary_domain derivation");
const badFusionFinal = structuredClone(finalWrapper);
badFusionFinal[P2B_DOMAIN_ACTIVITY_ARTIFACTS.finalIndex].fusion_candidate_locator_map[0].fusion_basis.composite_signal_count = 1;
assert.equal(validateDomainActivitySourceIndex(badFusionFinal).ok, false, "final validator must reject non-composite fusion");

const saved = [];
const orchestration = await runDomainActivitySourceIndexOrchestrator({
  run: { run_id: "CHECK-P2B-IMPL", target_url: "https://fixture.example/" },
  artifacts: fixtureArtifacts,
  runSemanticModel: async ({ artifacts }) => {
    const deterministicFromOrchestrator = artifacts[P2B_DOMAIN_ACTIVITY_ARTIFACTS.deterministicMap][P2B_DOMAIN_ACTIVITY_ARTIFACTS.deterministicMap];
    const queue = deterministicFromOrchestrator.semantic_label_queue.filter((row) => row.semantic_label_required === true || ["P0", "P1"].includes(row.priority));
    return makeSemanticWrapper(queue);
  },
  saveArtifact: async ({ artifactName }) => { saved.push(artifactName); }
});
assert.equal(orchestration.ok, true);
assert.deepEqual(saved, P2B_DOMAIN_ACTIVITY_SAVE_ORDER);
assert.equal(orchestration.required_save_order_respected, true);
assert.equal(orchestration.final_validation.ok, true);

console.log("Phase 2B domain activity compiler/final validator/orchestrator check: PASS");

function makeSemanticWrapper(requiredRows) {
  return {
    [P2B_DOMAIN_ACTIVITY_ARTIFACTS.semanticProfile]: {
      run_id: "CHECK-P2B-IMPL",
      schema_version: "P2B_DOMAIN_ACTIVITY_SEMANTIC_PROFILE_v1_PHASE1_V5_12_ROOT",
      semantic_navigation_index: requiredRows.map((row) => ({
        queue_id: row.queue_id,
        unit_id: row.unit_id,
        route_classes: [row.route_class],
        route_signal_families: row.route_signal_families || [],
        confidence: "CLEAR"
      })),
      semantic_integrity: { required_queue_count: requiredRows.length, labeled_queue_count: requiredRows.length, coverage_ratio: 1, ready_for_compiler: true },
      lock_status: "LOCKED"
    }
  };
}

function rootArtifact(commonRoot, text) {
  return {
    artifact_name: `lossless_root__${commonRoot}`,
    common_root: commonRoot,
    sources: [{
      source_id: `${commonRoot}.SRC.001`,
      common_root: `lossless_root__${commonRoot}`,
      canonical_url: `https://fixture.example/${commonRoot}`,
      final_url: `https://fixture.example/${commonRoot}`,
      url: `https://fixture.example/${commonRoot}`,
      phase_1_classification_effect: "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING",
      lossless_text: text
    }]
  };
}

function textForRoot(commonRoot) {
  const text = {
    homepage_landing: "# Fixture Platform\nAI finance workflow platform for banks, lenders, merchants, and enterprise teams with API automation and commercial availability.",
    company_identity: "# Fixture Labs\nFixture Labs builds financial workflow software with bank partner disclosures and regulated operating context for enterprise customers.",
    product_service: "# Product\nAI automation product that scores, verifies, processes, routes, extracts, and monitors lending and payments workflows through a platform API.",
    platform_feature_solution: "# Features\nGenerative AI model workflow, automated classification, document extraction, verification, orchestration, and API-driven workflow routing.",
    technical_docs_api: "# Developer API\nAPI, SDK, webhook, endpoint authentication, model inference, data flow, integration architecture, and workflow documentation.",
    docs_api_data_flow: "# Data Flow\nData flow from upload to model inference, webhook response, endpoint processing, and automated workflow routing.",
    pricing_commercial_availability: "# Pricing\nEnterprise pricing, plans, subscription, trial, pilot, contact sales, quote, fees, and available commercial deployment.",
    use_case_customer_industry: "# Use Cases\nUse cases for finance teams, lenders, borrowers, merchants, developers, healthcare teams, education teams, and enterprise operations.",
    integrations_ecosystem: "# Integrations\nIntegrations marketplace with Slack, Salesforce, GitHub, Zapier, partner apps, connectors, plugins, and developer ecosystem.",
    ai_safety_transparency: "# Responsible AI\nResponsible AI, model card, AI safety, transparency, evaluation, automated model monitoring, and generative AI governance information.",
    regulatory_licensing_status: "# Regulatory Disclosure\nRegulatory disclosure, bank partner, sponsor bank, registered status, KYC, AML, consumer disclosure, NBFC, RBI, SEBI, FCA context.",
    grievance_complaints: "# Complaints\nGrievance, complaint, nodal officer, ombudsman escalation, consumer complaint route, complaint email, and redressal process visibility."
  };
  return text[commonRoot] || `# ${commonRoot}\nDomain activity fixture text.`;
}

function collectLocatorRows(map) {
  return expectedNonEmptyMaps.flatMap((key) => Array.isArray(map[key]) ? map[key] : []);
}

function containsKey(value, key) {
  if (!value || typeof value !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(value, key)) return true;
  if (Array.isArray(value)) return value.some((item) => containsKey(item, key));
  return Object.values(value).some((item) => containsKey(item, key));
}
