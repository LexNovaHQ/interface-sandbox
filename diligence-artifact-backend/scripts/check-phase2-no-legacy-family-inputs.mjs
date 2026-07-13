import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ACTIVE_PHASE2_INPUT_FILES = Object.freeze([
  "src/runtime/contracts/artifact-permissions.contract.js",
  "src/runtime/contracts/pipeline.contract.js",
  "src/runtime/contracts/central-phase.contract.js",
  "src/runtime/contracts/artifacts.contract.js",
  "src/phases/02-cartography-index/cartography-index.contract.js",
  "src/phases/02-cartography-index/cartography-index.runner.js",
  "src/phases/02-cartography-index/phase-routing.contract.js",
  "src/phases/02-cartography-index/target-profile-source-index.contract.js",
  "src/phases/02-cartography-index/domain-derivation-source-index.contract.js",
  "src/phases/02-cartography-index/activity-profile-source-index.contract.js",
  "src/phases/02-cartography-index/data-privacy-navigation-index.contract.js",
  "src/phases/02-cartography-index/domain-control-obligation-navigation-index.contract.js",
  "src/phases/02-cartography-index/services/target-profile-deterministic-map.builder.js",
  "src/phases/02-cartography-index/services/target-profile-source-index.compiler.js",
  "src/phases/02-cartography-index/services/target-legal-signal-locator.rules.js",
  "src/phases/02-cartography-index/services/domain-derivation-deterministic-map.builder.js",
  "src/phases/02-cartography-index/services/domain-derivation-source-index.compiler.js",
  "src/phases/02-cartography-index/services/activity-profile-deterministic-map.builder.js",
  "src/phases/02-cartography-index/services/activity-profile-source-index.compiler.js",
  "src/phases/02-cartography-index/services/data-privacy-deterministic-map.builder.js",
  "src/phases/02-cartography-index/services/data-privacy-navigation-index.compiler.js",
  "src/phases/02-cartography-index/services/domain-control-obligation-navigation-index.builder.js",
  "src/phases/02-cartography-index/services/phase-routing-manifest.builder.js",
  "src/phases/02-cartography-index/validators/target-profile-semantic-profile.validator.js",
  "src/phases/02-cartography-index/validators/target-profile-source-index.validator.js",
  "src/phases/02-cartography-index/validators/domain-derivation-semantic-profile.validator.js",
  "src/phases/02-cartography-index/validators/domain-derivation-source-index.validator.js",
  "src/phases/02-cartography-index/validators/activity-profile-semantic-profile.validator.js",
  "src/phases/02-cartography-index/validators/activity-profile-source-index.validator.js",
  "src/phases/02-cartography-index/validators/data-privacy-navigation-index.validator.js",
  "src/phases/02-cartography-index/validators/domain-control-obligation-navigation-index.validator.js",
  "src/phases/02-cartography-index/validators/phase-routing-manifest.validator.js",
  "src/phases/02-cartography-index/orchestrators/target-profile-source-index.orchestrator.js",
  "src/phases/02-cartography-index/orchestrators/domain-derivation-source-index.orchestrator.js",
  "src/phases/02-cartography-index/orchestrators/activity-profile-source-index.orchestrator.js",
  "src/phases/02-cartography-index/orchestrators/data-privacy-navigation-index.orchestrator.js",
  "src/phases/02-cartography-index/orchestrators/domain-control-obligation-navigation-index.orchestrator.js",
  "src/phases/02-cartography-index/orchestrators/phase-routing-manifest.orchestrator.js",
  "src/phases/02-legal-cartography-index/legal-cartography-index.contract.js",
  "src/phases/02-legal-cartography-index/services/legal-cartography-deterministic-map.builder.js",
  "src/phases/02-legal-cartography-index/services/legal-cartography-hybrid-compiler.js",
  "src/phases/02-legal-cartography-index/orchestrators/legal-cartography-hybrid.orchestrator.js",
  "src/phases/07-data-provenance-profile/layer2-data-privacy-navigation-index-builder.js",
  "src/phases/07-data-provenance-profile/data-provenance-profile.contract.js",
  "src/phases/07-data-provenance-profile/data-provenance-profile.runner.js",
  "src/runtime/services/pipeline.service.js",
  "src/runtime/services/artifacts.service.js",
  "agent-packages/agent_2b_m9/AGENT2B_M9_RUNTIME_BINDING_PACKET.yaml",
  "agent-packages/agent_2b_m9/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md",
  "agent-packages/agent_2b_m9/04_M9_LEGAL_CARTOGRAPHY_RUNTIME_SYNC_PATCHED.md",
  "agent-packages/agent_2b_m9/M9_FIELD_DERIVATION_REGISTRY.yaml",
  "agent-packages/agent_2b_m9/M9_LEGAL_SIGNAL_DERIVATION_CONTRACT.md",
  "agent-packages/agent_2b_m9/M9_C_REINVESTIGATION.md",
  "agent-packages/agent_2b_m9/M9_HYBRID_COMPILER_CONTRACT.md",
  "agent-packages/agent_2b_m9/00_VALIDATOR_RULES_INTEGRATED.md",
  "agent-packages/agent_2b_m9/AGENT2B_M9_PACKET_MANIFEST.json",
  "agent-packages/agent_2b_m9/AGENT2B_M9_PACKET_VALIDATION.json"
]);

const GLOBAL_FORBIDDEN = Object.freeze(["compatibility.adapter", "CompatibilityArtifacts", "compatibility_adapter", "loaded legal-governance lossless family"]);
const RETIRED_ROOT_ACTIVE_INPUT_MARKERS = Object.freeze(["lossless_root__legal_identity_notice", "lossless_root__security_trust\"", "lossless_root__trust_compliance", "lossless_root__technical_docs_api_developer"]);
const REQUIRED = Object.freeze([
  "phase1_v5",
  "P2A_TARGET_PROFILE_SOURCE_INDEX",
  "target_profile_source_index",
  "P2B_DOMAIN_DERIVATION_SOURCE_INDEX",
  "domain_derivation_source_index",
  "P2C_ACTIVITY_PROFILE_SOURCE_INDEX",
  "activity_profile_source_index_owned_by_2c",
  "P2D_DATA_PRIVACY_NAVIGATION_INDEX",
  "data_privacy_navigation_index_owned_by_2d",
  "P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX",
  "domain_control_obligation_navigation_index_owned_by_2e",
  "P2F_LEGAL_CARTOGRAPHY_LEGAL_SIGNALS",
  "phase2f_m9_legal_cartography_designated",
  "full_legal_governance_cartography_owned_by_2f",
  "phase2e_domain_control_obligation_index_separate",
  "P2G_PHASE_ROUTER",
  "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
  "phase_routing_manifest",
  "phase_route_validation_manifest",
  "LOSSLESS_EVIDENCE_IS_PRIMARY_AND_MUST_BE_NAVIGATED_THROUGH_INDEX",
  "DIRECT_LOSSLESS_EVIDENCE_IS_NOT_FALLBACK",
  "phase2g_lossless_evidence_primary",
  "phase2g_index_navigation_mandatory",
  "phase1_common_roots_plus_legal_doc_artifacts",
  "legal_doc_inventory",
  "legal_doc_{DOC_TYPE}",
  "lossless_root__privacy_data_processing",
  "lossless_root__regulatory_licensing_status",
  "lossless_root__grievance_complaints",
  "regulatory_governance_locator",
  "grievance_redressal_locator",
  "target_profile_legal_signal_locators_owned_by_2a",
  "data_source_routes",
  "control_source_routes"
]);
const FORBIDDEN_CONCLUSIONS = Object.freeze(["license_validity", "license_requirement", "applicable_regulator", "regulatory_compliance_status", "grievance_sufficiency", "grievance_compliance_status", "ombudsman_requirement"]);
const SECTOR_VOCAB_FORBIDDEN_IN_PHASE2_JS = Object.freeze(["sponsor_bank", "kyc", "aml", "custody_safeguarding", "human_oversight_locator"]);

assert.equal(fs.existsSync(path.join(ROOT, "src/phase-contracts.js")), false, "retired phase-contracts shim must not return");

const activeText = ACTIVE_PHASE2_INPUT_FILES.map((file) => [file, fs.readFileSync(path.join(ROOT, file), "utf8")]);
for (const [file, text] of activeText) {
  for (const marker of GLOBAL_FORBIDDEN) assert.equal(text.includes(marker), false, `${file} contains forbidden legacy marker: ${marker}`);
  if (file.endsWith(".js")) for (const marker of SECTOR_VOCAB_FORBIDDEN_IN_PHASE2_JS) assert.equal(containsExactToken(text, marker), false, `${file} contains sector vocabulary that belongs in catalogs: ${marker}`);
}

const m9Active = activeText.filter(([file]) => file.includes("02-legal-cartography-index") || file.includes("agent_2b_m9"));
for (const [file, text] of m9Active) for (const marker of RETIRED_ROOT_ACTIVE_INPUT_MARKERS) assert.equal(text.includes(marker), false, `${file} contains retired active M9 root input marker: ${marker}`);

const combined = activeText.map(([, text]) => text).join("\n");
for (const marker of REQUIRED) assert.ok(combined.includes(marker), `active Phase 2 contract missing required marker: ${marker}`);
for (const marker of FORBIDDEN_CONCLUSIONS) assert.ok(combined.includes(marker), `Phase 2/M9 contract must explicitly forbid ${marker}`);
assert.equal(combined.includes("LOSSLESS_EVIDENCE_IS_FALLBACK"), false, "2G must not describe lossless evidence as fallback");
console.log("Phase 2 no legacy family input validator: PASS");

function containsExactToken(source, marker) {
  return new RegExp(`(^|[^a-z0-9_])${escapeRegExp(marker.toLowerCase())}([^a-z0-9_]|$)`).test(String(source || "").toLowerCase());
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
