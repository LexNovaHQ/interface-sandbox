import assert from "node:assert/strict";

import {
  DOMAIN_CONTROL_OBLIGATION_MODEL_MATERIAL_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT,
  compileDomainControlObligationProfile,
  validateDomainControlObligationModelOutput,
  validateDomainControlObligationProfile
} from "../src/phases/08-domain-control-obligation-profile/index.js";

const candidateInventory = {
  artifact_type: "domain_control_obligation_candidate_inventory",
  schema_version: "phase8_dco_candidate_inventory_v1",
  run_id: "PHASE8-LAYER2-CHECK",
  derivation_mode: "DETERMINISTIC_PACKAGE_SCOPED_OBLIGATION_TRIGGER_MATCHING_P2E_NAVIGATED",
  source_navigation_index: "domain_control_obligation_navigation_index",
  mounted_package_refs: {
    primary_package_id: "fintech",
    primary_key_version: "test-fintech-v1",
    capability_overlays: [],
    regulatory_overlays: [{
      overlay_id: "privacy",
      package_id: "fintech",
      key_version: "test-fintech-v1",
      framework_links: ["GDPR", "DPDP"]
    }]
  },
  candidate_count: 1,
  candidates: [{
    candidate_id: "DCO-CAND-001",
    obligation_id: "FIN-OBL-TEST-01",
    obligation_family: "payment_control",
    source_layer: "PRIMARY",
    source_package_id: "fintech",
    catalog_package_id: "fintech",
    capability_overlay_id: "",
    linked_activity_references: ["ACT-001"],
    matched_behavior_codes: ["PAY"],
    matched_surface_tokens: ["Transaction-Data"],
    registry_key_ref: {
      key_file: "FinTech_Registry_Key.yml",
      package_id: "fintech",
      key_version: "test-fintech-v1",
      obligation_path: "domain_control_obligation.obligations[0]"
    },
    obligation_catalog_ref: {
      catalog_file: "fintech.obligation-catalog.json",
      domain_id: "fintech",
      obligation_family: "payment_control"
    },
    p2e_navigation_route_refs: [{
      route_ref_id: "fintech:payment_control",
      domain_id: "fintech",
      obligation_family: "payment_control",
      required_control_source_route_ids: ["DCO.CONTROL.PAYMENT"],
      selective_legal_route_ids: [],
      locator_families: ["TEST_LOCATOR"],
      legal_doc_types: [],
      shell_field_targets: ["control_mechanism_present"],
      reading_priority: ["test evidence"]
    }],
    candidate_status: "MATCHED",
    candidate_limitation: []
  }],
  inventory_limitations: []
};

const resolvedTaxonomy = {
  resolver_status: "RESOLVED",
  limitations: [],
  mounted_taxonomy_ref: candidateInventory.mounted_package_refs,
  regulatory_overlays: [{
    overlay_id: "privacy",
    package_id: "fintech",
    key_version: "test-fintech-v1",
    framework_links: ["GDPR", "DPDP"],
    overlay_status: "CANDIDATE_ONLY",
    resolution_status: "RESOLVED"
  }],
  obligations: [{
    obligation_id: "FIN-OBL-TEST-01",
    source_package_id: "fintech",
    registry_obligation: {
      authority_dependency: ["GDPR", "DPDP", "RBI"]
    }
  }]
};

const fdrRules = DOMAIN_CONTROL_OBLIGATION_MODEL_MATERIAL_FIELDS
  .filter((field) => field !== "derivation_basis")
  .map((field, index) => ({
    field_id: `DCO.TEST.${String(index + 1).padStart(3, "0")}`,
    profile_section: "Domain Control Obligation Profile",
    output_field: field
  }));

const materialValues = {
  normalized_name: "Payment control review",
  what_it_requires: "Maintain an operational control for the reviewed payment flow and make the control visible enough for diligence review.",
  target_specific_obligation_context: "The target exposes a payment activity tied to transaction data, making the control relevant to the reviewed customer flow.",
  authority_dependency: ["GDPR"],
  exposure_role_context: "A",
  obligation_locus: "product and payment workflow",
  obligation_trigger_timing: "ongoing",
  expected_control_signal: "A target-specific payment-control description, operating procedure, monitoring route, or equivalent visible mechanism.",
  control_mechanism_present: "VISIBLE",
  control_posture_status: "VISIBLE",
  evidence_basis: ["The reviewed product material shows a target-specific control tied to the payment workflow."],
  missing_proof: [],
  diligence_question: "Can the target provide the operating evidence and ownership record for this payment control?",
  limitation: []
};

const modelRow = {
  candidate_id: "DCO-CAND-001",
  ...materialValues,
  derivation_basis: fdrRules.map((rule) => ({
    field_id: rule.field_id,
    output_field: rule.output_field,
    conditions_satisfied: ["Candidate packet contains sufficient target-specific context for this field."],
    trigger_outcome_applied: "DERIVED",
    material_basis: `The candidate-scoped packet supports ${rule.output_field.replaceAll("_", " ")}.`,
    limitation: "NONE"
  }))
};

const modelOutput = {
  [DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT]: {
    obligations: [modelRow]
  }
};

const modelValidation = validateDomainControlObligationModelOutput(modelOutput, {
  candidateInventory,
  resolvedTaxonomy,
  fdrRules
});
assert.equal(modelValidation.status, "PASS", modelValidation.failures.join("\n"));

const compiled = compileDomainControlObligationProfile({
  modelOutput,
  candidateInventory,
  resolvedTaxonomy,
  runId: "PHASE8-LAYER2-CHECK",
  fdrRules
});
const profile = compiled[DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT];
assert.equal(profile.artifact_type, DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT);
assert.equal(profile.run_id, "PHASE8-LAYER2-CHECK");
assert.equal(profile.obligation_count, 1);
assert.deepEqual(profile.mounted_taxonomy_ref, candidateInventory.mounted_package_refs);
assert.deepEqual(profile.profile_level_limitations, []);

const finalRow = profile.obligations[0];
for (const field of DOMAIN_CONTROL_OBLIGATION_MODEL_MATERIAL_FIELDS) {
  assert.deepEqual(finalRow[field], modelRow[field], `compiler changed model material field ${field}`);
}
for (const field of [
  "obligation_id",
  "obligation_family",
  "source_layer",
  "source_package_id",
  "catalog_package_id",
  "capability_overlay_id",
  "linked_activity_references",
  "matched_behavior_codes",
  "matched_surface_tokens",
  "registry_key_ref",
  "obligation_catalog_ref",
  "p2e_navigation_route_refs"
]) assert.deepEqual(finalRow[field], candidateInventory.candidates[0][field], `compiler mechanical stamp mismatch ${field}`);

assert.deepEqual(finalRow.regulatory_overlay_refs, [{
  overlay_id: "privacy",
  matched_frameworks: ["GDPR"],
  overlay_status: "CANDIDATE_ONLY"
}]);

const finalValidation = validateDomainControlObligationProfile(compiled, {
  candidateInventory,
  resolvedTaxonomy,
  modelOutput
});
assert.equal(finalValidation.status, "PASS", finalValidation.failures.join("\n"));

const outputWithMechanicalLeak = structuredClone(modelOutput);
outputWithMechanicalLeak.domain_control_obligation_profile.obligations[0].obligation_id = "FORBIDDEN";
assert.equal(validateDomainControlObligationModelOutput(outputWithMechanicalLeak, {
  candidateInventory,
  resolvedTaxonomy,
  fdrRules
}).status, "FAIL");

const outputWithMissingCandidate = {
  domain_control_obligation_profile: { obligations: [] }
};
assert.equal(validateDomainControlObligationModelOutput(outputWithMissingCandidate, {
  candidateInventory,
  resolvedTaxonomy,
  fdrRules
}).status, "FAIL");

const outputWithExpandedAuthority = structuredClone(modelOutput);
outputWithExpandedAuthority.domain_control_obligation_profile.obligations[0].authority_dependency = ["INVENTED_FRAMEWORK"];
assert.equal(validateDomainControlObligationModelOutput(outputWithExpandedAuthority, {
  candidateInventory,
  resolvedTaxonomy,
  fdrRules
}).status, "FAIL");

console.log("Phase 8 Domain Control Obligation Layer 2 model/compile/validate flow: PASS");
