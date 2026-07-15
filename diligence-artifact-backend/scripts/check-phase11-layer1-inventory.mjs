import assert from "node:assert/strict";
import { buildOperatorChallengeInventory, OPERATOR_CHALLENGE_INVENTORY_VERSION, OPERATOR_CHALLENGE_LAYER1_VERSION } from "../src/phases/11-operator-challenge/operator-challenge-inventory.js";

const artifacts = {
  target_profile: { target_profile: { status: "LOCKED", target_name: "Synthetic Target" } },
  domain_derivation_profile: { domain_derivation_profile: { status: "LOCKED", primary_domain_derivation: { selected_package: "fintech" } } },
  target_feature_profile: {
    target_feature_profile: {
      status: "LOCKED",
      activities: [
        { activity_id: "ACT-PAY", activity_name: "payment processing", primary_classification: { package_id: "fintech", archetype_codes: ["PAY"], surface_context_tokens: ["payment"] }, overlay_classifications: [] },
        { activity_id: "ACT-UNLINKED", activity_name: "lending decision", primary_classification: { package_id: "fintech", archetype_codes: ["LEN"], surface_context_tokens: ["credit"] }, overlay_classifications: [] }
      ]
    }
  },
  domain_control_obligation_profile: {
    domain_control_obligation_profile: {
      status: "LOCKED",
      obligation_count: 1,
      obligations: [{ obligation_id: "OBL-PAY", obligation_name: "payment security control", control_posture_status: "UNRESOLVED", matched_behavior_codes: ["PAY"], matched_surface_tokens: ["payment"] }]
    }
  },
  dap_semantic_batch_flow_artifact: {
    status: "LOCKED",
    fields: [{ field_id: "DAP-FLOW-PAY", field_name: "payment data flow", value: "processor transfer", status: "DERIVED" }]
  },
  data_provenance_profile_semantic_batch_gate: { data_provenance_profile_semantic_batch_gate: { status: "PASS", field_count: 150 } },
  active_threat_registry_manifest: {
    active_threat_registry_manifest: {
      status: "LOCKED",
      primary_package: "fintech",
      mounted_packages: ["fintech", "ai-governance"],
      expected_registry_row_key_count: 3,
      phase10_execution_fingerprint: "fp-1"
    }
  },
  exposure_registry_route_plan: {
    exposure_registry_route_plan: {
      status: "LOCKED",
      route_rows: [
        { registry_row_key: "fintech::UNI_PRV_001", Threat_ID: "UNI_PRV_001", package_id: "fintech", route: "EVALUATION_ROUTED", matched_activity_references: ["ACT-PAY"], deterministic_registry_spine: { Threat_Name: "Payment data risk", Archetype: "PAY", Surface: "payment" } },
        { registry_row_key: "ai-governance::UNI_PRV_001", Threat_ID: "UNI_PRV_001", package_id: "ai-governance", route: "EVALUATION_ROUTED", matched_activity_references: [], deterministic_registry_spine: { Threat_Name: "AI privacy risk", Archetype: "UNI", Surface: "privacy" } },
        { registry_row_key: "fintech::PAY_LIA_002", Threat_ID: "PAY_LIA_002", package_id: "fintech", route: "EVALUATION_ROUTED", matched_activity_references: ["ACT-PAY"], deterministic_registry_spine: { Threat_Name: "Payment liability", Archetype: "PAY", Surface: "payment" } }
      ],
      batch_plan: [{ batch_id: "PRIMARY::fintech::PAY::001" }]
    }
  },
  exposure_registry_workpad_98: {
    exposure_registry_workpad_98: {
      status: "LOCKED",
      registry_rows: [
        materialRow({ key: "fintech::UNI_PRV_001", packageId: "fintech", threatId: "UNI_PRV_001", status: "CONTROLLED_BY_VISIBLE_CONTROL", name: "Payment data risk", archetype: "PAY", surface: "payment", control: "", evidence: "" }),
        materialRow({ key: "ai-governance::UNI_PRV_001", packageId: "ai-governance", threatId: "UNI_PRV_001", status: "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION", name: "AI privacy risk", archetype: "UNI", surface: "privacy", limitations: ["public evidence incomplete"] }),
        materialRow({ key: "fintech::PAY_LIA_002", packageId: "fintech", threatId: "PAY_LIA_002", status: "TRIGGERED", name: "Payment liability", archetype: "PAY", surface: "payment", reviewRoute: "", remediation: "" })
      ]
    }
  },
  exposure_registry_controlled_profile: {
    exposure_registry_controlled_profile: {
      status: "LOCKED",
      controlled_rows: [
        profileRow("fintech::UNI_PRV_001", "fintech", "UNI_PRV_001", "CONTROLLED_BY_VISIBLE_CONTROL"),
        profileRow("ai-governance::UNI_PRV_001", "ai-governance", "UNI_PRV_001", "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION")
      ]
    }
  },
  exposure_registry_triggered_profile: {
    exposure_registry_triggered_profile: {
      status: "LOCKED",
      triggered_rows: [profileRow("fintech::PAY_LIA_002", "fintech", "PAY_LIA_002", "TRIGGERED")]
    }
  }
};

const output = buildOperatorChallengeInventory({ artifacts, run: { run_id: "RUN-11-L1", target: "Synthetic Target" } });
const inventory = output.operator_challenge_inventory;
assert.equal(inventory.schema_version, OPERATOR_CHALLENGE_INVENTORY_VERSION);
assert.equal(inventory.layer_version, OPERATOR_CHALLENGE_LAYER1_VERSION);
assert.equal(inventory.forensic_inputs_used, false);
assert.equal(inventory.final_adjudication_performed, false);
assert.equal(inventory.reinvestigation_attempted, false);
assert.equal(inventory.profile_summaries.activity_count, 2);
assert.equal(inventory.profile_summaries.workpad_row_count, 3);
assert.equal(inventory.critical_candidate_count, 0);
assert.ok(inventory.inventory_fingerprint.length === 64);

const types = new Set(inventory.challenge_candidates.map((row) => row.challenge_type));
assert.ok(types.has("ACTIVE_ACTIVITY_WITHOUT_EXPOSURE_LINK"));
assert.ok(types.has("UNRESOLVED_OBLIGATION_VS_CONTROLLED_EXPOSURE"));
assert.ok(types.has("TRIGGERED_EXPOSURE_WITHOUT_REVIEW_ROUTE"));
assert.ok(types.has("MATERIAL_EXPOSURE_WITHOUT_REMEDIATION"));
assert.ok(types.has("VISIBLE_CONTROL_WITHOUT_COMPLETE_SUPPORT"));
assert.equal(inventory.challenge_candidates.some((row) => row.layer1_is_final_conclusion !== false), false);
assert.equal(inventory.challenge_candidates.some((row) => row.affected_registry_row_keys.includes("fintech::UNI_PRV_001")), true);
assert.equal(inventory.challenge_candidates.some((row) => row.affected_registry_row_keys.includes("ai-governance::UNI_PRV_001")), false, "raw Threat_ID collision must not merge package-scoped rows");

const corrupted = structuredClone(artifacts);
corrupted.active_threat_registry_manifest.active_threat_registry_manifest.expected_registry_row_key_count = 4;
const corruptedInventory = buildOperatorChallengeInventory({ artifacts: corrupted, run: { run_id: "RUN-11-L1-BAD" } }).operator_challenge_inventory;
assert.ok(corruptedInventory.critical_candidate_count > 0);
assert.ok(corruptedInventory.challenge_candidates.some((row) => row.challenge_type === "PHASE10_COMPOUND_CUSTODY_MISMATCH"));
assert.equal(corruptedInventory.inventory_status, "CRITICAL_SUBSTRATE_CANDIDATE_PRESENT");

const forensicPolluted = { ...artifacts, exposure_registry_profile_forensics: { status: "LOCKED" } };
const pollutedInventory = buildOperatorChallengeInventory({ artifacts: forensicPolluted, run: { run_id: "RUN-11-L1-F" } }).operator_challenge_inventory;
assert.ok(pollutedInventory.challenge_candidates.some((row) => row.challenge_type === "FORENSIC_INPUT_BOUNDARY_BREACH"));

console.log(JSON.stringify({
  check: "Phase 11 Layer 1 deterministic challenge inventory",
  status: "PASS",
  schema_version: inventory.schema_version,
  candidate_count: inventory.candidate_count,
  critical_candidate_count: inventory.critical_candidate_count,
  material_candidate_count: inventory.material_candidate_count,
  advisory_candidate_count: inventory.advisory_candidate_count,
  compiler_handoff_allowed: false
}, null, 2));

function materialRow({ key, packageId, threatId, status, name, archetype, surface, reviewRoute = "local counsel", remediation = "review control", control = "control support", evidence = "evidence support", limitations = [] }) {
  return {
    registry_row_key: key,
    package_id: packageId,
    stream_id: `PRIMARY::${packageId}`,
    stream_type: "PRIMARY",
    Threat_ID: threatId,
    final_material_status: status,
    material_projection: {
      Threat_ID: threatId,
      Threat_Name: name,
      evaluation_status: status,
      Archetype: archetype,
      Subcategory: "LIA",
      Surface: surface,
      control_exclusion_evaluation: control,
      evidence_source_basis: evidence,
      review_route: reviewRoute,
      remediation,
      row_limitations: limitations
    }
  };
}

function profileRow(key, packageId, threatId, status) {
  return {
    registry_row_key: key,
    package_id: packageId,
    stream_id: `PRIMARY::${packageId}`,
    stream_type: "PRIMARY",
    Threat_ID: threatId,
    Threat_Name: threatId,
    target_match: "matched",
    evaluation_status: status,
    basis_proof: "proof",
    control_exclusion_evaluation: "evaluation",
    evidence_source_basis: "evidence",
    fp_mechanism: "none",
    Archetype: "PAY",
    Subcategory: "LIA",
    Surface: "payment",
    authority_anchors: [],
    Pain_Tier: "P2",
    Pain_Depth: "material",
    Pain_Category: "Legal",
    Legal_Pain: "pain",
    remediation: "remediation",
    review_route: "local counsel",
    row_limitations: []
  };
}
