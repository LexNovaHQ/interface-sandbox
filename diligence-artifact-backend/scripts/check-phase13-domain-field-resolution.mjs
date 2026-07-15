import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPhase13DomainFieldResolutionArtifacts } from "../src/phases/13-qualified-review/index.js";

const BACKEND_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../");

function reportArtifacts({ activityRows = [], exposureLanes = [], legalName = "Phase 12 Corp", agentic = true } = {}) {
  return {
    report_section__03_target_entity_sector_profile: {
      findings: [
        finding("TP.ID.002", "Legal entity name", legalName),
        finding("TP.ID.005", "Entity type", "Delaware corporation"),
        finding("TP.BIZ.004", "Industry", "Software")
      ]
    },
    report_section__04_product_activity_architecture: {
      findings: [
        finding("PA.MECH.008", "Autonomous execution", agentic),
        finding("PA.MECH.009", "Human control signal", agentic),
        finding("PA.MECH.011", "External integrations", ["Slack", "Salesforce"])
      ],
      activity_register: { rows: activityRows }
    },
    report_section__05_vendor_processor_chain: { findings: [] },
    report_section__05_location_transfer_custody: { findings: [] },
    report_section__05_parties_roles: { findings: [] },
    report_section__05_data_objects_flows: { findings: [] },
    report_section__05_purpose_authorization_user_controls: { findings: [] },
    report_section__05_privacy_contacts_consent_manager: { findings: [] },
    report_section__05_retention_deletion_portability: { findings: [] },
    report_section__05_security_access_incident_governance: { findings: [] },
    report_section__05_sensitive_high_risk_contexts: { findings: [] },
    report_section__05_regulatory_readiness: { findings: [] },
    report_section__06_sector_control_obligations: { findings: [] },
    report_section__07_legal_governance_architecture: { findings: [] },
    report_section__08_exposure_register: {
      child_artifacts: exposureLanes.length
        ? [{ rows: exposureLanes.map((lane) => ({ classification: { lane } })) }]
        : []
    }
  };
}

function activity({ signal, behavior = [], surface = [] } = {}) {
  return {
    activity_reference: `ACT-${signal}`,
    product_service_wrapper: "AI platform",
    activity_feature_name: `${signal} AI workflow`,
    activity_candidate_summary: `${signal} use of AI`,
    mechanics_proof: behavior.join(", "),
    autonomy_human_control_signal: "Human review available",
    data_content_object_touched: "Business data",
    external_internal_action_signal: signal,
    primary_classification: {
      package_id: "ai-governance",
      behavior_class_codes: behavior,
      surface_context_tokens: surface
    },
    overlay_classifications: []
  };
}

function finding(field_id, label, value) {
  return { field_id, label, value, value_status: "RESOLVED", report_importance: "MATERIAL", presentation: "FIELD_OR_ROW" };
}

function build({ manifest, rows = [], exposureLanes = [], reviewer = {}, runMode = "PRODUCTION" }) {
  return buildPhase13DomainFieldResolutionArtifacts({
    backendRoot: BACKEND_ROOT,
    active_run_package_manifest: manifest,
    domain_derivation_profile: {},
    phase12_report_artifacts: reportArtifacts({ activityRows: rows, exposureLanes }),
    reviewer_values: reviewer,
    run_mode: runMode
  });
}

function assertScenario({ name, result, fields, activeSubpackages, inactiveSubpackages = [], unresolvedSubpackages = [], probes = [] }) {
  const ledger = result.qr_active_field_ledger;
  assert.equal(ledger.counts.active_field_count, fields, `${name}: active field count`);
  assert.equal(ledger.confirmation_unit, "SECTION", `${name}: section confirmation`);
  assert.equal(ledger.per_question_confirmation_forbidden, true, `${name}: per-question confirmation forbidden`);
  assert.deepEqual([...result.qr_registry_resolution_manifest.unresolved_activation_probe_field_ids].sort(), [...probes].sort(), `${name}: probes`);
  const subpackages = result.qr_registry_resolution_manifest.registry_resolutions.flatMap((row) => row.subpackages || []);
  for (const id of activeSubpackages) assert.equal(subpackages.find((row) => row.subpackage_id === id)?.state, "ACTIVE", `${name}:${id}:active`);
  for (const id of inactiveSubpackages) assert.equal(subpackages.find((row) => row.subpackage_id === id)?.state, "INACTIVE", `${name}:${id}:inactive`);
  for (const id of unresolvedSubpackages) assert.equal(subpackages.find((row) => row.subpackage_id === id)?.state, "UNRESOLVED", `${name}:${id}:unresolved`);
  assert.ok(ledger.sections.every((section) => section.attestation_required === true), `${name}: all sections require attestation`);
  assert.ok(ledger.active_fields.every((field) => field.ui.per_question_confirmation_required === false), `${name}: no field confirmation gate`);
}

const universal = build({ manifest: { primary_domain_package: "fintech", capability_overlays: [], active_lanes: [] } });
assertScenario({ name: "universal-only", result: universal, fields: 19, activeSubpackages: [], probes: [] });

const aOnly = build({
  manifest: { primary_domain_package: "ai-governance", capability_overlays: [], active_lanes: ["A"] },
  rows: [activity({ signal: "EXTERNAL", behavior: ["DOE"], surface: ["Financial"] })],
  exposureLanes: ["A"]
});
assertScenario({ name: "lane-a-only", result: aOnly, fields: 47, activeSubpackages: ["AI_LANE_A"], inactiveSubpackages: ["AI_LANE_B"] });
assert.equal(aOnly.qr_phase12_value_resolution.field_resolutions.A03.atomic_values.autonomous_agent_enabled.source, "PHASE_12");
assert.equal(aOnly.qr_phase12_value_resolution.field_resolutions.A03.atomic_values.autonomous_agent_enabled.value, true);

const bOnly = build({
  manifest: { primary_domain_package: "ai-governance", capability_overlays: [], active_lanes: ["B"] },
  rows: [activity({ signal: "INTERNAL", behavior: ["JDG"], surface: ["Employment"] })],
  exposureLanes: ["B"]
});
assertScenario({ name: "lane-b-only", result: bOnly, fields: 37, activeSubpackages: ["AI_LANE_B"], inactiveSubpackages: ["AI_LANE_A"] });
assert.equal(bOnly.qr_phase12_value_resolution.field_resolutions.B01.atomic_values.internal_ai_use.source, "PHASE_12");
assert.equal(bOnly.qr_phase12_value_resolution.field_resolutions.B01.atomic_values.internal_ai_use.value, true);

const both = build({
  manifest: { primary_domain_package: "ai-governance", capability_overlays: [], active_lanes: ["A", "B"] },
  rows: [
    activity({ signal: "EXTERNAL", behavior: ["DOE"], surface: ["Financial"] }),
    activity({ signal: "INTERNAL", behavior: ["JDG"], surface: ["Employment"] })
  ],
  exposureLanes: ["A", "B"],
  reviewer: { U01: { value: "Reviewer Corrected Corp", review_status: "EDITED" } }
});
assertScenario({ name: "both-lanes", result: both, fields: 65, activeSubpackages: ["AI_LANE_A", "AI_LANE_B"] });
assert.equal(both.qr_phase12_value_resolution.field_resolutions.U01.atomic_values.legal_entity_name.source, "REVIEWER");
assert.equal(both.qr_phase12_value_resolution.field_resolutions.U01.atomic_values.legal_entity_name.value, "Reviewer Corrected Corp");
assert.equal(both.qr_phase12_value_resolution.field_resolutions.A28.atomic_values.availability_target.source, "MARKET_BASED");
assert.equal(both.qr_phase12_value_resolution.field_resolutions.A28.atomic_values.availability_target.demo_not_evidence, true);

const unresolved = build({
  manifest: { primary_domain_package: "ai-governance", capability_overlays: [] },
  rows: [],
  exposureLanes: []
});
assertScenario({
  name: "unresolved-lanes",
  result: unresolved,
  fields: 21,
  activeSubpackages: [],
  unresolvedSubpackages: ["AI_LANE_A", "AI_LANE_B"],
  probes: ["A01", "B01"]
});
assert.equal(unresolved.qr_active_field_ledger.active_fields.find((field) => field.qr_field_id === "A01")?.activation_probe, true);
assert.equal(unresolved.qr_active_field_ledger.active_fields.find((field) => field.qr_field_id === "B01")?.activation_probe, true);

const reviewerSuppressesA = build({
  manifest: { primary_domain_package: "ai-governance", capability_overlays: [] },
  reviewer: { A01: { review_status: "NOT_APPLICABLE", not_applicable: true } }
});
assertScenario({
  name: "reviewer-suppresses-a",
  result: reviewerSuppressesA,
  fields: 20,
  activeSubpackages: [],
  inactiveSubpackages: ["AI_LANE_A"],
  unresolvedSubpackages: ["AI_LANE_B"],
  probes: ["B01"]
});

const demo = build({
  manifest: { primary_domain_package: "ai-governance", capability_overlays: [], active_lanes: ["A"] },
  rows: [activity({ signal: "EXTERNAL", behavior: ["DOE"] })],
  runMode: "DEMO"
});
assert.equal(demo.qr_phase12_value_resolution.field_resolutions.A28.atomic_values.availability_target.value_state, "DEMO_PREFILLED");

console.log("Phase 13 domain activation and field resolution: PASS");
console.log(JSON.stringify({
  universal_only: universal.qr_active_field_ledger.counts,
  lane_a_only: aOnly.qr_active_field_ledger.counts,
  lane_b_only: bOnly.qr_active_field_ledger.counts,
  both_lanes: both.qr_active_field_ledger.counts,
  unresolved_lanes: unresolved.qr_active_field_ledger.counts
}, null, 2));
