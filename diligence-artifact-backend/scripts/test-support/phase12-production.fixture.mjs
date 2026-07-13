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
