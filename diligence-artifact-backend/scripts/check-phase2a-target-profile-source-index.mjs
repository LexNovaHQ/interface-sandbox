import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  P2A_TARGET_PROFILE_ARTIFACTS,
  P2A_TARGET_PROFILE_TARGET_ROOT_INPUTS,
  P2A_TARGET_PROFILE_SECONDARY_CONTEXT_ROOT_INPUTS,
  P2A_TARGET_PROFILE_MATERIAL_FIELD_INVENTORY,
  P2A_TARGET_PROFILE_DETERMINISTIC_MAP_KEYS,
  P2A_TARGET_PROFILE_FINAL_INDEX_KEYS,
  P2A_TARGET_PROFILE_ALLOWED_LEGAL_SIGNAL_LOCATOR_FAMILIES,
  P2A_TARGET_PROFILE_ALLOWED_TARGET_SUBCATS,
  P2A_TARGET_PROFILE_ALLOWED_SIGNAL_FAMILIES,
  P2A_TARGET_PROFILE_FORBIDDEN_CONCLUSIONS,
  TARGET_PROFILE_SOURCE_INDEX_CONTRACT
} from "../src/phases/02-cartography-index/target-profile-source-index.contract.js";
import { buildTargetProfileDeterministicMap } from "../src/phases/02-cartography-index/services/target-profile-deterministic-map.builder.js";
import { validateTargetProfileSemanticProfile } from "../src/phases/02-cartography-index/validators/target-profile-semantic-profile.validator.js";

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const contractText = read("src/phases/02-cartography-index/target-profile-source-index.contract.js");
const builderText = read("src/phases/02-cartography-index/services/target-profile-deterministic-map.builder.js");
const rulesText = read("src/phases/02-cartography-index/services/target-legal-signal-locator.rules.js");
const validatorText = read("src/phases/02-cartography-index/validators/target-profile-semantic-profile.validator.js");

const phase1V5Roots = [
  "lossless_root__homepage_landing",
  "lossless_root__company_identity",
  "lossless_root__contact_notice",
  "lossless_root__pricing_commercial_availability",
  "lossless_root__regulatory_licensing_status",
  "lossless_root__grievance_complaints"
];

assert.equal(TARGET_PROFILE_SOURCE_INDEX_CONTRACT.input_contract.contract_version, "P2A_TARGET_PROFILE_INPUT_CONTRACT_v2_PHASE1_V5_17_ROOT");
assert.equal(TARGET_PROFILE_SOURCE_INDEX_CONTRACT.input_contract.phase1_source_contract_required, "PHASE1_V5_MULTI_DOMAIN_UNION_PROBE_17_ROOT");
assert.deepEqual(P2A_TARGET_PROFILE_TARGET_ROOT_INPUTS, phase1V5Roots);
assert.deepEqual(P2A_TARGET_PROFILE_SECONDARY_CONTEXT_ROOT_INPUTS, []);
for (const root of phase1V5Roots) assert.ok(TARGET_PROFILE_SOURCE_INDEX_CONTRACT.input_contract.reads.includes(root), `2A reads missing ${root}`);

const fieldIds = new Set(P2A_TARGET_PROFILE_MATERIAL_FIELD_INVENTORY.map((row) => row.field_id));
assert.ok(fieldIds.has("TP.BIZ.009"), "2A material field inventory missing TP.BIZ.009");
assert.ok(fieldIds.has("TP.BIZ.010"), "2A material field inventory missing TP.BIZ.010");
assert.equal([...fieldIds].filter((field) => ["TP.BIZ.009", "TP.BIZ.010"].includes(field)).length, 2, "2A must add exactly the two locked new TP fields");
for (const row of P2A_TARGET_PROFILE_MATERIAL_FIELD_INVENTORY) {
  assert.equal(row.phase_2a_action, "LOCATE_ONLY", `${row.field_id} must be locate-only`);
  assert.equal(row.derived_value_forbidden, true, `${row.field_id} must forbid derived values`);
}

for (const key of ["material_target_field_locator_map", "regulatory_licensing_locator_map", "grievance_complaints_locator_map"]) {
  assert.ok(P2A_TARGET_PROFILE_DETERMINISTIC_MAP_KEYS.includes(key), `deterministic map keys missing ${key}`);
}
for (const key of ["material_target_field_locator", "regulatory_licensing_locator", "grievance_complaints_locator"]) {
  assert.ok(P2A_TARGET_PROFILE_FINAL_INDEX_KEYS.includes(key), `final index keys missing ${key}`);
}
for (const family of [
  "REGULATORY_LICENSING_SIGNAL_LOCATOR",
  "REGULATORY_DISCLOSURE_LOCATOR",
  "BANK_PARTNER_SPONSOR_BANK_LOCATOR",
  "CONSUMER_DISCLOSURE_LOCATOR",
  "COUNTERPARTY_INSTITUTION_LOCATOR",
  "GRIEVANCE_COMPLAINTS_SIGNAL_LOCATOR",
  "NODAL_GRIEVANCE_OFFICER_LOCATOR",
  "OMBUDSMAN_ESCALATION_LOCATOR",
  "COMPLAINTS_ROUTE_LOCATOR"
]) assert.ok(P2A_TARGET_PROFILE_ALLOWED_LEGAL_SIGNAL_LOCATOR_FAMILIES.includes(family), `locator family missing ${family}`);
for (const subcat of ["REGULATORY_LICENSING_SIGNAL", "PUBLIC_REGULATORY_DISCLOSURE", "GRIEVANCE_COMPLAINTS_SIGNAL", "COMPLAINTS_ESCALATION_ROUTE", "COUNTERPARTY_INSTITUTION_SIGNAL", "CONSUMER_DISCLOSURE_SIGNAL"]) assert.ok(P2A_TARGET_PROFILE_ALLOWED_TARGET_SUBCATS.includes(subcat), `target subcat missing ${subcat}`);
for (const family of ["REGULATORY_OPERATING_CONTEXT", "GRIEVANCE_OPERATING_CONTEXT", "COUNTERPARTY_INSTITUTION", "CONSUMER_DISCLOSURE", "MONEY_MOVEMENT_CONTEXT"]) assert.ok(P2A_TARGET_PROFILE_ALLOWED_SIGNAL_FAMILIES.includes(family), `semantic family missing ${family}`);

for (const forbidden of P2A_TARGET_PROFILE_FORBIDDEN_CONCLUSIONS) {
  assert.ok(contractText.includes(forbidden), `contract must preserve forbidden conclusion ${forbidden}`);
  assert.ok(validatorText.includes(forbidden) || validatorText.includes("P2A_TARGET_PROFILE_FORBIDDEN_CONCLUSIONS"), `semantic validator must block forbidden conclusion ${forbidden}`);
}
for (const forbidden of ["business_context.license_status", "business_context.regulatory_compliance_status", "business_context.grievance_compliance_status", "applicable_regulator"]) {
  assert.equal(contractText.includes(forbidden), false, `2A contract must not add bad material field ${forbidden}`);
}
assert.ok(builderText.includes("phase1_v5_source_contract_required: true"));
assert.ok(builderText.includes("governing_law_from_regulatory_or_grievance_roots_forbidden: true"));
assert.ok(builderText.includes("courts_venue_from_regulatory_or_grievance_roots_forbidden: true"));
assert.ok(rulesText.includes("PHASE1_V5_EXPANDED_LEGAL_DOC_TARGET_LOCATOR_HINTS"));

const fixture = buildTargetProfileDeterministicMap({
  run: { run_id: "CHECK-P2A", target_url: "https://fixture.example/" },
  artifacts: {
    source_discovery_handoff: { target_url: "https://fixture.example/" },
    legal_doc_inventory: { documents_found: [] },
    lossless_root__homepage_landing: rootArtifact("homepage_landing", "/", "Fixture AI finance platform"),
    lossless_root__company_identity: rootArtifact("company_identity", "/about", "Fixture Labs Private Limited is the company operating this platform."),
    lossless_root__contact_notice: rootArtifact("contact_notice", "/contact", "Contact support and legal notices at legal@example.com."),
    lossless_root__pricing_commercial_availability: rootArtifact("pricing_commercial_availability", "/pricing", "Enterprise pricing, fees and schedule of charges are available."),
    lossless_root__regulatory_licensing_status: rootArtifact("regulatory_licensing_status", "/regulatory-disclosures", "Regulatory disclosure. Sponsor bank and bank partner information. Fair practice code and key fact statement."),
    lossless_root__grievance_complaints: rootArtifact("grievance_complaints", "/grievance", "Grievance redressal route. Nodal officer, ombudsman escalation and complaint email are visible.")
  }
});
const map = fixture[P2A_TARGET_PROFILE_ARTIFACTS.deterministicMap];
assert.ok(map.material_target_field_locator_map.some((row) => row.field_id === "TP.BIZ.009"), "fixture missing TP.BIZ.009 locator");
assert.ok(map.material_target_field_locator_map.some((row) => row.field_id === "TP.BIZ.010"), "fixture missing TP.BIZ.010 locator");
assert.ok(map.regulatory_licensing_locator_map.length > 0, "fixture missing regulatory locator rows");
assert.ok(map.grievance_complaints_locator_map.length > 0, "fixture missing grievance locator rows");
assert.equal(map.downstream_rules.license_validity_forbidden, true);
assert.equal(map.downstream_rules.grievance_sufficiency_forbidden, true);
for (const row of map.material_target_field_locator_map) {
  assert.equal(row.derived_value_emitted, false);
  assert.equal(row.value, "");
}

const requiredRows = (map.semantic_label_queue || []).filter((row) => row.semantic_label_required === true || ["P0", "P1"].includes(row.priority));
const semanticRows = requiredRows.map((row) => ({
  queue_id: row.queue_id,
  unit_id: row.unit_id,
  target_subcats: row.target_subcat_candidates,
  target_signal_families: row.target_signal_family_candidates,
  confidence: "CLEAR"
}));
const validation = validateTargetProfileSemanticProfile({
  [P2A_TARGET_PROFILE_ARTIFACTS.semanticProfile]: {
    run_id: "CHECK-P2A",
    schema_version: "P2A_TARGET_PROFILE_SEMANTIC_PROFILE_v2_PHASE1_V5",
    semantic_navigation_index: semanticRows,
    semantic_integrity: {
      required_queue_count: requiredRows.length,
      labeled_queue_count: requiredRows.length,
      coverage_ratio: 1,
      ready_for_compiler: true
    },
    lock_status: "LOCKED"
  }
}, fixture);
assert.equal(validation.ok, true, `semantic fixture failed: ${validation.errors.join("|")}`);

console.log(JSON.stringify({
  check: "phase2a target profile source index",
  status: "PASS",
  enforced_gates: [
    "PHASE1_V5_TARGET_ROOTS",
    "TWO_NEW_MATERIAL_FIELDS_ONLY",
    "FIELD_LOCATORS_POINTER_ONLY",
    "REGULATORY_GRIEVANCE_CONCLUSIONS_FORBIDDEN",
    "SEMANTIC_COVERAGE_FROM_DETERMINISTIC_QUEUE"
  ]
}, null, 2));

function rootArtifact(commonRoot, path, text) {
  return {
    artifact_name: `lossless_root__${commonRoot}`,
    common_root: commonRoot,
    sources: [{
      source_id: `${commonRoot}.SRC.001`,
      common_root: commonRoot,
      canonical_url: `https://fixture.example${path}`,
      final_url: `https://fixture.example${path}`,
      url: `https://fixture.example${path}`,
      materiality: "fixture",
      phase_1_classification_effect: "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING",
      lossless_text: text
    }]
  };
}
