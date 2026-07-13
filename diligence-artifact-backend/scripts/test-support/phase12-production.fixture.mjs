import { getActiveOwnershipRows, uniqueOwnerArtifacts } from "../../src/phases/12-normalized-compiler/phase12-report-contract.js";

const MATERIAL_STATUSES = Object.freeze([
  "TRIGGERED",
  "CONTROLLED_BY_VISIBLE_CONTROL",
  "CONTROLLED_BY_EXCLUSION",
  "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION"
]);

export function buildPhase12ProductionFixture(contract, { challengeStatus = "PASS_WITH_LIMITATION" } = {}) {
  const artifacts = {};
  const ownershipRows = getActiveOwnershipRows(contract);
  for (const name of uniqueOwnerArtifacts(contract)) artifacts[name] = { __fdr_values: {} };

  let firstDapField = null;
  for (const row of ownershipRows) {
    const artifactName = row.owner_artifacts[0];
    if (row.field_id.startsWith("DAP.") && !firstDapField) firstDapField = row.field_id;
    artifacts[artifactName].__fdr_values[row.field_id] = `fixture value for ${row.field_id}`;
  }

  if (firstDapField) {
    const owner = ownershipRows.find((row) => row.field_id === firstDapField).owner_artifacts[0];
    artifacts[owner].__fdr_values[firstDapField] = {
      material_fact: "preserved",
      limitation: "Upstream limitation preserved.",
      batch_id: "MECHANICAL_LEAK",
      forensics: { raw: true },
      validation: { status: "INTERNAL" }
    };
  }

  artifacts.target_feature_profile = {
    ...(artifacts.target_feature_profile || {}),
    activities: [
      activityRow({
        reference: "ACT-001",
        name: "Automated payment decisioning",
        primaryBehavior: ["PAY"],
        primarySurface: ["Financial"],
        overlayId: "AI_OVERLAY",
        overlayBehavior: ["JDG"],
        overlaySurface: ["Consumer-Public", "PII"]
      }),
      activityRow({
        reference: "ACT-002",
        name: "Synthetic customer communication",
        primaryBehavior: ["COMMS"],
        primarySurface: ["Consumer-Public"],
        overlayId: "AI_OVERLAY",
        overlayBehavior: ["CRT"],
        overlaySurface: ["Content&IP"]
      })
    ],
    commercial_availability_posture: {
      posture: "Paid production service",
      free_trial_freemium_signal: "Not visible",
      beta_pilot_early_access_signal: "Not visible",
      paid_production_enterprise_plan_signal: "Visible",
      evidence_basis: "Fixture commercial evidence.",
      limitation: null
    },
    profile_level_limitations: [],
    mounted_taxonomy_ref: {
      primary_package: "fintech",
      capability_overlays: ["ai-governance"]
    }
  };

  artifacts.domain_control_obligation_profile = {
    ...(artifacts.domain_control_obligation_profile || {}),
    artifact_type: "domain_control_obligation_profile",
    schema_version: "phase8_dco_material_profile_v1",
    run_id: "PHASE12_PRODUCTION_ACCEPTANCE",
    derivation_mode: "MODEL_DERIVED_MATERIAL_FIELDS_DETERMINISTIC_MECHANICAL_COMPILATION",
    mounted_taxonomy_ref: {
      primary_package_id: "fintech",
      capability_overlays: [{ overlay_id: "AI_OVERLAY", package_id: "ai-governance" }],
      regulatory_overlays: [{ overlay_id: "INDIA_DPDP", package_id: "india-data-protection" }]
    },
    obligation_count: 3,
    obligations: [
      obligationRow({
        candidateId: "DCO-C-001",
        obligationId: "DCO-PAY-001",
        family: "Payment authorization and customer control",
        sourceLayer: "PRIMARY",
        activities: ["ACT-001"],
        behaviors: ["PAY"],
        surfaces: ["Financial", "Consumer-Public"],
        name: "Payment authorization controls",
        requirement: "Maintain visible authorization, reversal and customer-control mechanisms for the payment activity.",
        context: "The target publicly describes automated payment decisioning for customer transactions.",
        authority: "Authority depends on the mounted Primary Sector package and the reviewed customer/payment context.",
        exposureRole: "Provides the expected-control benchmark for payment-related exposure review.",
        locus: "Customer payment workflow",
        timing: "Before and during transaction execution",
        expectedControl: "Visible authorization, transaction confirmation, reversal and dispute route.",
        mechanism: "VISIBLE",
        posture: "VISIBLE",
        evidence: "Fixture payment workflow and support-route evidence.",
        missingProof: null,
        question: null,
        limitation: null
      }),
      obligationRow({
        candidateId: "DCO-C-002",
        obligationId: "DCO-PAY-002",
        family: "Transaction records and dispute support",
        sourceLayer: "PRIMARY",
        activities: ["ACT-001"],
        behaviors: ["PAY"],
        surfaces: ["Financial", "Enterprise-Private"],
        name: "Transaction record and dispute-support controls",
        requirement: "Maintain transaction records and an operational dispute-support route.",
        context: "Public materials identify the payment activity but do not fully evidence the private record-retention workflow.",
        authority: "Authority depends on the mounted Primary Sector package and transaction context.",
        exposureRole: "Provides the expected-control benchmark for payment record and dispute exposure review.",
        locus: "Transaction operations and support",
        timing: "During the transaction lifecycle and after a dispute",
        expectedControl: "Transaction records, escalation route and retained dispute evidence.",
        mechanism: "NOT_VISIBLE",
        posture: "NOT_VISIBLE",
        evidence: "Public support route is visible; private record controls are not publicly evidenced.",
        missingProof: "Private transaction record and dispute-handling procedure.",
        question: "Confirm the transaction record, retention and dispute-escalation workflow.",
        limitation: "Public-footprint evidence does not establish private operational controls."
      }),
      obligationRow({
        candidateId: "DCO-C-003",
        obligationId: "DCO-AI-001",
        family: "AI-assisted communication governance",
        sourceLayer: "CAPABILITY_OVERLAY",
        capabilityOverlayId: "AI_OVERLAY",
        activities: ["ACT-002"],
        behaviors: ["CRT"],
        surfaces: ["Content&IP", "Consumer-Public"],
        name: "AI-assisted customer communication controls",
        requirement: "Maintain review, disclosure and escalation controls for synthetic customer communication.",
        context: "The target exposes a synthetic customer-communication capability.",
        authority: "Authority depends on the mounted Capability Overlay and the communication context.",
        exposureRole: "Provides the expected-control benchmark for synthetic-content exposure review.",
        locus: "Customer communication generation and delivery",
        timing: "Before publication or delivery",
        expectedControl: "Human-review route, disclosure signal and escalation mechanism.",
        mechanism: "UNCLEAR",
        posture: "PARTIAL",
        evidence: "A review signal is visible, but the full escalation workflow is not.",
        missingProof: "Complete human-review and escalation workflow.",
        question: "Confirm when human review is mandatory and how disputed outputs are escalated.",
        limitation: "The public footprint supports only a partial control posture."
      })
    ],
    profile_level_limitations: ["Private operational evidence is not available in the public footprint."]
  };

  const materialRows = [];
  for (const streamType of ["PRIMARY", "OVERLAY"]) {
    for (const [index, status] of MATERIAL_STATUSES.entries()) {
      const packageId = streamType === "PRIMARY" ? "ai-governance" : "fintech";
      const threatId = `${streamType === "PRIMARY" ? "UNI" : "PAY"}_TEST_${index + 1}`;
      materialRows.push(materialRow(`${packageId}::${threatId}`, threatId, status, streamType, packageId));
    }
  }

  artifacts.active_threat_registry_manifest = {
    expected_registry_row_key_count: materialRows.length,
    mounted_packages: ["ai-governance", "fintech"],
    primary_package: "ai-governance",
    ai_mount: "AI_PRIMARY",
    report_row_contract: {
      report_row_schema_version: "phase10_report_row.v1.complete_registry_spine",
      registry_spine_completeness_status: "PASS",
      severity_validation_status: "PASS"
    }
  };
  artifacts.exposure_registry_route_plan = {
    route_rows: materialRows.map((row) => ({ registry_row_key: row.registry_row_key }))
  };
  artifacts.exposure_registry_workpad_98 = {
    registry_rows: materialRows.map((row) => ({
      ...row,
      final_material_status: row.evaluation_status,
      material_projection: row
    }))
  };
  artifacts.exposure_registry_triggered_profile = {
    report_row_schema_version: "phase10_report_row.v1.complete_registry_spine",
    triggered_rows: materialRows.filter((row) => row.evaluation_status === "TRIGGERED"),
    __fdr_values: artifacts.exposure_registry_triggered_profile?.__fdr_values || {}
  };
  artifacts.exposure_registry_controlled_profile = {
    report_row_schema_version: "phase10_report_row.v1.complete_registry_spine",
    controlled_rows: materialRows.filter((row) => row.evaluation_status !== "TRIGGERED"),
    __fdr_values: artifacts.exposure_registry_controlled_profile?.__fdr_values || {}
  };
  artifacts.challenge_gate = {
    schema_version: "challenge_gate.v4.operator_challenge",
    status: challengeStatus,
    compiler_handoff_allowed: true,
    final_gate_fingerprint: "c".repeat(64),
    layer_status: { layer_1: "COMPLETE", layer_2: "COMPLETE", layer_3: "COMPLETE" },
    reinvestigation_dispatch_required: false,
    advisory_warnings: challengeStatus === "PASS_WITH_LIMITATION" ? [warning(materialRows[0].registry_row_key)] : []
  };

  return Object.freeze({ artifacts, materialRows, firstDapField });
}

function activityRow({ reference, name, primaryBehavior, primarySurface, overlayId, overlayBehavior, overlaySurface }) {
  return {
    activity_reference: reference,
    product_service_wrapper: "Fixture product wrapper",
    activity_feature_name: name,
    activity_candidate_summary: `${name} activity summary.`,
    mechanics_proof: "Fixture mechanics proof.",
    autonomy_human_control_signal: "Human review signal preserved from Phase 5.",
    data_content_object_touched: "Customer transaction and account information.",
    external_internal_action_signal: "External customer-facing effect.",
    primary_classification: {
      package_id: "fintech",
      behavior_class_codes: primaryBehavior,
      behavior_class_derivation_basis: primaryBehavior.map((code) => classificationBasis(code, "Primary")),
      surface_context_tokens: primarySurface,
      surface_derivation_basis: primarySurface.map((token) => classificationBasis(token, "Primary surface"))
    },
    overlay_classifications: [{
      package_id: "ai-governance",
      overlay_id: overlayId,
      behavior_class_codes: overlayBehavior,
      behavior_class_derivation_basis: overlayBehavior.map((code) => classificationBasis(code, "Overlay")),
      surface_context_tokens: overlaySurface,
      surface_derivation_basis: overlaySurface.map((token) => classificationBasis(token, "Overlay surface"))
    }]
  };
}

function obligationRow({
  candidateId,
  obligationId,
  family,
  sourceLayer,
  capabilityOverlayId = null,
  activities,
  behaviors,
  surfaces,
  name,
  requirement,
  context,
  authority,
  exposureRole,
  locus,
  timing,
  expectedControl,
  mechanism,
  posture,
  evidence,
  missingProof,
  question,
  limitation
}) {
  return {
    candidate_id: candidateId,
    obligation_id: obligationId,
    obligation_family: family,
    source_layer: sourceLayer,
    source_package_id: sourceLayer === "PRIMARY" ? "fintech" : "ai-governance",
    catalog_package_id: sourceLayer === "PRIMARY" ? "fintech" : "ai-governance",
    capability_overlay_id: capabilityOverlayId,
    linked_activity_references: activities,
    matched_behavior_codes: behaviors,
    matched_surface_tokens: surfaces,
    registry_key_ref: `REGISTRY::${obligationId}`,
    obligation_catalog_ref: `CATALOG::${obligationId}`,
    p2e_navigation_route_refs: [`P2E::${obligationId}`],
    regulatory_overlay_refs: [{
      overlay_id: "INDIA_DPDP",
      matched_frameworks: ["DPDP Act 2023"],
      overlay_status: "CANDIDATE_ONLY"
    }],
    normalized_name: name,
    what_it_requires: requirement,
    target_specific_obligation_context: context,
    authority_dependency: authority,
    exposure_role_context: exposureRole,
    obligation_locus: locus,
    obligation_trigger_timing: timing,
    expected_control_signal: expectedControl,
    control_mechanism_present: mechanism,
    control_posture_status: posture,
    evidence_basis: evidence,
    missing_proof: missingProof,
    diligence_question: question,
    derivation_basis: [{
      field_id: `${obligationId}.BASIS`,
      output_field: "Obligation presentation",
      conditions_satisfied: ["fixture condition"],
      trigger_outcome_applied: true,
      material_basis: `Fixture derivation basis for ${obligationId}.`,
      limitation
    }],
    limitation
  };
}

function classificationBasis(codeOrToken, label) {
  return {
    code_or_token: codeOrToken,
    normalized_name: codeOrToken,
    conditions_satisfied: ["fixture condition"],
    trigger_if_applied: true,
    exclude_if_checked: true,
    material_basis: `${label} fixture basis for ${codeOrToken}.`,
    limitation: null
  };
}

function warning(registryRowKey) {
  return {
    challenge_candidate_id: "P11.C.001",
    disposition: "UNRESOLVED_AFTER_REINVESTIGATION",
    affected_artifacts: ["target_feature_profile"],
    affected_field_paths: ["activities[0].mechanics_proof"],
    affected_registry_row_keys: [registryRowKey],
    limitation_if_unresolved: "Private workflow evidence remains unavailable.",
    materiality_analysis: "Preserve the limitation."
  };
}

function materialRow(registryRowKey, threatId, status, streamType, packageId) {
  return {
    registry_row_key: registryRowKey,
    package_id: packageId,
    source_domain: packageId,
    stream_id: `${streamType}::${packageId}`,
    stream_type: streamType,
    batch_id: `${streamType}__TEST__001`,
    Threat_ID: threatId,
    Threat_Name: `${threatId} exposure`,
    Lane: packageId === "fintech" ? "PAY" : "A",
    Behavior_Class: packageId === "fintech" ? "PAY" : "UNI",
    Surface: "Consumer-Public",
    Subcategory: "TEST",
    Compliance_Framework: null,
    Authority_IN: "Indian authority",
    Authority_EU: "EU authority",
    Authority_US: "US authority",
    Velocity: "ACTIVE_NOW",
    Pain_Tier: status === "TRIGGERED" ? "T2" : "T4",
    Pain_Category: status === "TRIGGERED" ? "Deal Death" : "Regulatory Heat",
    Pain_Depth: "Corporate",
    Status: "Active",
    Effective_Date: "2026-01-01",
    Legal_Pain: "Legal consequence carried from Phase 10.",
    FP_Mechanism: "False-positive mechanism carried from Phase 10.",
    FP_Impact: "False-positive impact carried from Phase 10.",
    Lex_Nova_Fix: "Recommended response carried from Phase 10.",
    Hunter_Trigger: "Internal trigger mechanics that must not enter the report profile.",
    Provenance: "Phase 10 fixture provenance.",
    FIELD21: "TEST",
    FIELD22: "TEST",
    FIELD23: 1,
    target_match: "Target match carried from Phase 10.",
    evaluation_status: status,
    basis_proof: "Basis proof carried from Phase 10.",
    control_exclusion_evaluation: "Control or exclusion position carried from Phase 10.",
    evidence_source_basis: "Evidence basis carried from Phase 10.",
    applied_fp_mechanism: "Applied false-positive mechanism carried from Phase 10.",
    row_limitations: "Upstream row limitation.",
    review_route: "QUALIFIED_REVIEW"
  };
}
