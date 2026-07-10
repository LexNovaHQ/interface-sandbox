import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { P2B_DOMAIN_DERIVATION_ARTIFACTS, P2B_DOMAIN_DERIVATION_ROOT_INPUTS } from "../src/phases/02-cartography-index/domain-derivation-source-index.contract.js";
import { buildDomainDerivationDeterministicMap } from "../src/phases/02-cartography-index/services/domain-derivation-deterministic-map.builder.js";
import { validateDomainDerivationSemanticProfile } from "../src/phases/02-cartography-index/validators/domain-derivation-semantic-profile.validator.js";
import { compileDomainDerivationSourceIndex } from "../src/phases/02-cartography-index/services/domain-derivation-source-index.compiler.js";
import { validateDomainDerivationSourceIndex } from "../src/phases/02-cartography-index/validators/domain-derivation-source-index.validator.js";
import { runDomainDerivationSourceIndexOrchestrator } from "../src/phases/02-cartography-index/orchestrators/domain-derivation-source-index.orchestrator.js";

const ROOT = process.cwd();
const REQUIRED_FILES = Object.freeze([
  "src/phases/02-cartography-index/domain-derivation-source-index.contract.js",
  "src/phases/02-cartography-index/services/domain-derivation-deterministic-map.builder.js",
  "src/phases/02-cartography-index/validators/domain-derivation-semantic-profile.validator.js",
  "src/phases/02-cartography-index/services/domain-derivation-source-index.compiler.js",
  "src/phases/02-cartography-index/validators/domain-derivation-source-index.validator.js",
  "src/phases/02-cartography-index/orchestrators/domain-derivation-source-index.orchestrator.js"
]);
for (const file of REQUIRED_FILES) assert.ok(fs.existsSync(path.join(ROOT, file)), `${file} must exist`);

assert.equal(P2B_DOMAIN_DERIVATION_ARTIFACTS.finalIndex, "domain_derivation_source_index");
assert.equal(P2B_DOMAIN_DERIVATION_ARTIFACTS.finalIndex === "activity_profile_source_index", false, "2B must not own activity_profile_source_index");
assert.equal(P2B_DOMAIN_DERIVATION_ROOT_INPUTS.length, 12, "2B must read exactly 12 scoped roots");

const artifacts = fixtureArtifacts();
const deterministicWrapper = buildDomainDerivationDeterministicMap({ run: { run_id: "TEST-P2B", target_url: "https://example.ai" }, artifacts });
const deterministic = deterministicWrapper[P2B_DOMAIN_DERIVATION_ARTIFACTS.deterministicMap];
assert.ok(deterministic, "builder must emit domain_derivation_deterministic_map");
assert.equal(deterministic.downstream_rules.domain_derivation_source_index_owned_by_2b, true);
assert.equal(deterministic.downstream_rules.activity_profile_source_index_reserved_for_2c_phase5, true);
assert.equal(deterministic.source_artifacts_read.length, 12);

const routeMaps = [
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
for (const key of routeMaps) assert.ok(Array.isArray(deterministic[key]) && deterministic[key].length > 0, `${key} must be non-empty on fixture evidence`);
for (const row of deterministic.fusion_candidate_locator_map) {
  assert.equal(row.phase_2b_action, "LOCATE_ONLY");
  assert.equal(row.fusion_basis.ai_signal_visible, true);
  assert.ok(row.fusion_basis.composite_signal_count >= 2);
  assert.equal("lossless_text" in row, false);
  assert.equal(row.derived_value, null);
}

const semantic = semanticFor(deterministic);
const semanticValidation = validateDomainDerivationSemanticProfile({ semanticProfile: semantic, deterministicMap: deterministic });
assert.equal(semanticValidation.ok, true, semanticValidation.errors.join("; "));

const finalWrapper = compileDomainDerivationSourceIndex({ deterministicMap: deterministic, semanticProfile: semantic });
assert.ok(finalWrapper.domain_derivation_source_index, "compiler must emit domain_derivation_source_index");
assert.equal("activity_profile_source_index" in finalWrapper, false, "compiler must not emit activity_profile_source_index");
const finalValidation = validateDomainDerivationSourceIndex({ sourceIndex: finalWrapper });
assert.equal(finalValidation.ok, true, finalValidation.errors.join("; "));

const badSemantic = structuredClone(semantic);
badSemantic.domain_derivation_semantic_profile.semantic_navigation_index[0].primary_domain = "Fintech";
assert.equal(validateDomainDerivationSemanticProfile({ semanticProfile: badSemantic, deterministicMap: deterministic }).ok, false, "semantic derivation leakage must fail");

const badFinal = structuredClone(finalWrapper);
badFinal.domain_derivation_source_index.primary_domain_locator_map[0].primary_domain = "Fintech";
assert.equal(validateDomainDerivationSourceIndex({ sourceIndex: badFinal }).ok, false, "final derivation leakage must fail");

const badFusion = structuredClone(finalWrapper);
badFusion.domain_derivation_source_index.fusion_candidate_locator_map[0].fusion_basis.composite_signal_count = 1;
assert.equal(validateDomainDerivationSourceIndex({ sourceIndex: badFusion }).ok, false, "non-composite fusion must fail");

const saves = [];
const orchestratorResult = await runDomainDerivationSourceIndexOrchestrator({
  run: { run_id: "TEST-P2B", target_url: "https://example.ai" },
  artifacts,
  saveArtifact: async ({ artifact_name }) => saves.push(artifact_name)
});
assert.equal(orchestratorResult.ok, true);
assert.deepEqual(saves, ["domain_derivation_deterministic_map", "domain_derivation_semantic_profile", "domain_derivation_source_index"]);

console.log("Phase 2B domain derivation source implementation check: PASS");

function semanticFor(deterministic) {
  const required = deterministic.semantic_label_queue.filter((row) => row.semantic_label_required || row.priority === "P0" || row.priority === "P1");
  return {
    domain_derivation_semantic_profile: {
      schema_version: "P2B_DOMAIN_DERIVATION_SEMANTIC_PROFILE_v1_PHASE1_V5_12_ROOT",
      semantic_navigation_index: required.map((row) => ({ queue_id: row.queue_id, unit_id: row.unit_id, route_classes: [row.route_class_hint], route_signal_families: [row.route_signal_family_hint], confidence: "CLEAR" })),
      semantic_integrity: {
        required_queue_count: required.length,
        labeled_queue_count: required.length,
        coverage_ratio: required.length ? 1 : 1,
        ready_for_compiler: true
      },
      lock_status: "LOCKED"
    }
  };
}

function fixtureArtifacts() {
  const base = {
    homepage_landing: "ExampleAI is an AI platform for regulated financial workflows. It automates payment review and enterprise operations.",
    company_identity: "ExampleAI Inc. provides software services to banks, merchants, and enterprise finance teams.",
    product_service: "The product generates risk scores, verifies transactions, routes workflows, and exposes an API for payments and lending operations.",
    platform_feature_solution: "Features include generative AI analysis, document extraction, automated classification, monitoring, and workflow orchestration.",
    technical_docs_api: "Developer docs describe REST API endpoints, SDK authentication, webhook events, and integration architecture.",
    docs_api_data_flow: "Data flow docs explain how customer records move through API ingestion, model inference, review queues, and webhook callbacks.",
    pricing_commercial_availability: "Enterprise pricing, pilot plans, subscriptions, beta access, and contact sales are available.",
    use_case_customer_industry: "Use cases include banking, lending, payments, merchant underwriting, finance operations, and enterprise compliance teams.",
    integrations_ecosystem: "Integrations include Slack, Salesforce, GitHub, Zapier, partner apps, connectors, plugins, and marketplace systems.",
    ai_safety_transparency: "Responsible AI pages describe model cards, evaluation, transparency, AI safety, monitoring, and human oversight.",
    regulatory_licensing_status: "Regulatory disclosures mention bank partner arrangements, licensing, authorized providers, KYC, AML, consumer disclosures, RBI and FCA context.",
    grievance_complaints: "Complaint and grievance pages identify a nodal officer, complaint route, escalation process, and ombudsman reference."
  };
  return Object.fromEntries(P2B_DOMAIN_DERIVATION_ROOT_INPUTS.map((artifact) => {
    const root = artifact.replace(/^lossless_root__/, "");
    return [artifact, { rows: [{ source_id: `${root}-1`, url: `https://example.ai/${root}`, lossless_text: base[root] }] }];
  }));
}
