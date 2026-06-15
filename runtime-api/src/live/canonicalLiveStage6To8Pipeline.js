import { buildStage6IntegratedHandoffArtifact } from "../diligence/stage6IntegratedHandoffBuilder.js";
import {
  buildStage6CanonicalInput,
  buildStage6SourceCustodyManifest
} from "../diligence/stage6/stage6.runtime.js";
import { runStage6ALegalCartography } from "../diligence/stage6/6a/6a.runtime.js";
import { runStage6BLegalGovernanceDataProvenance } from "../diligence/stage6/6b/6b.runtime.js";
import { buildStage6BInputFrom6AHandoff } from "../diligence/stage6/validators/validate6aTo6bHandoff.js";
import { validate6bTo6cHandoff } from "../diligence/stage6/validators/validate6bTo6cHandoff.js";
import { asArray, logStage, nowIso } from "./liveRunShared.js";
import {
  buildStage6Cache,
  runStage,
  runStage7,
  runStage8
} from "./liveStage6To8Pipeline.js";

export { buildStage6Cache, runStage, runStage7, runStage8 };

function legalDocumentIndexFromCartography(legalCartography = {}) {
  return asArray(legalCartography.legal_unit_map).map((unit) => ({
    legal_unit_id: unit.legal_unit_id,
    legal_document_id: unit.legal_document_id,
    source_record_ref: unit.source_id,
    source_window_ref: unit.source_window_ref,
    legal_unit_type: unit.unit_type,
    heading_text: unit.heading_text,
    control_family_candidates: asArray(unit.control_family_candidates),
    source_refs: [unit.source_window_ref].filter(Boolean),
    source_sha256: unit.source_sha256
  }));
}

function legalUnitSourceLocatorIndex(legalCartography = {}) {
  return asArray(legalCartography.legal_unit_map).map((unit) => ({
    legal_unit_id: unit.legal_unit_id,
    source_record_ref: unit.source_id,
    source_window_ref: unit.source_window_ref,
    char_start: unit.char_start,
    char_end: unit.char_end,
    source_sha256: unit.source_sha256
  }));
}

function controlFamilyIndex(legalCartography = {}) {
  return asArray(legalCartography.legal_control_map).map((control) => ({
    control_family: control.control_family,
    legal_unit_id: control.legal_unit_id,
    source_window_refs: asArray(control.source_window_refs)
  }));
}

function buildCanonicalStage6AReview(stage6aCanonical = {}) {
  const legalCartography = stage6aCanonical.legal_cartography || {};
  return {
    stage6_review_version: "stage6_review_v1",
    stage6_component: "stage6a_legal_cartography_canonical",
    stage_role: "legal_cartography",
    legal_document_cartography: {
      ...legalCartography,
      legal_document_index: legalCartography.legal_document_index || legalDocumentIndexFromCartography(legalCartography)
    },
    stage7_navigation_index: {
      feature_to_legal_unit_index: [],
      control_family_index: controlFamilyIndex(legalCartography),
      legal_unit_source_locator_index: legalUnitSourceLocatorIndex(legalCartography),
      absence_unknown_index: [],
      fallback_source_packet: []
    },
    stage6_limitations: asArray(legalCartography.limitations)
  };
}

function compatibilityDataFlowRows(stage6bCanonical = {}) {
  const findings = asArray(stage6bCanonical.legal_governance_data_provenance_profile?.legal_data_findings);
  return findings.map((finding, index) => ({
    data_flow_id: `LGDP_FLOW_${String(index + 1).padStart(4, "0")}`,
    legal_data_finding_id: finding.legal_data_finding_id,
    source_basis: finding.source_basis,
    data_category: finding.data_category,
    data_subject: finding.data_subject,
    processing_context: finding.processing_context,
    declared_action: finding.declared_action,
    ai_or_model_treatment: finding.ai_or_model_treatment,
    retention_or_deletion_signal: finding.retention_or_deletion_signal,
    subprocessor_or_transfer_signal: finding.subprocessor_or_transfer_signal,
    controller_processor_role: finding.controller_processor_role,
    legal_unit_refs: asArray(finding.legal_unit_refs),
    source_window_refs: asArray(finding.source_window_refs),
    stage6c_integration_status: "PENDING_STAGE6C_INTEGRATION"
  }));
}

function buildCanonicalStage6BReview(stage6bCanonical = {}) {
  const legalGovernanceProfile = stage6bCanonical.legal_governance_data_provenance_profile || {};
  const dataFlowProfile = compatibilityDataFlowRows(stage6bCanonical);
  const dataProvenanceProfile = {
    data_provenance_profile_version: "stage6b_legal_governance_reference_profile_v1",
    profile_scope: "LEGAL_GOVERNANCE_ONLY_PENDING_STAGE6C_INTEGRATION",
    legal_governance_data_provenance_profile: legalGovernanceProfile,
    data_flow_profile: dataFlowProfile,
    integrated_feature_data_flow_profile: [],
    stage6c_required: true,
    limitations: [
      "This live Stage 6 handoff uses canonical 6B legal/governance findings. Product/legal integration is pending Stage 6C."
    ]
  };
  return {
    stage6_review_version: "stage6_review_v1",
    stage6_component: "stage6b_legal_governance_data_provenance_canonical",
    stage_role: "legal_governance_data_provenance",
    legal_governance_data_provenance_profile: legalGovernanceProfile,
    data_provenance_profile: dataProvenanceProfile,
    stage7_navigation_index: {
      feature_to_data_flow_index: [],
      data_signal_index: dataFlowProfile.map((row) => ({
        data_flow_id: row.data_flow_id,
        legal_data_finding_id: row.legal_data_finding_id,
        data_category: row.data_category,
        source_window_refs: row.source_window_refs
      })),
      absence_unknown_index: [],
      fallback_source_packet: []
    },
    stage6_limitations: asArray(legalGovernanceProfile.limitations)
  };
}

function throwCanonicalStage6Error(message, result = {}) {
  const error = new Error(message);
  error.status = 422;
  error.result = result;
  throw error;
}

export async function runStage6Live({ sourceBundle, evidenceJunction, companyProfile, targetFeatureProfile, logs, runId }) {
  const stage6Input = {
    stage6_input_version: "stage6_live_input_v1",
    run_id: `${runId}_stage6_input`,
    source_bundle: sourceBundle,
    evidence_junction: evidenceJunction,
    company_profile: companyProfile,
    target_profile: companyProfile,
    target_feature_profile: targetFeatureProfile
  };

  const canonicalStage6Input = buildStage6CanonicalInput({
    targetRef: { run_id: runId },
    targetProfile: companyProfile,
    targetFeatureProfile,
    stage6Input,
    evidenceJunction,
    sourceBundle
  });
  const custodyManifest = buildStage6SourceCustodyManifest(canonicalStage6Input);

  logStage(logs, "stage6a_legal_cartography_canonical", "running", { source_count: custodyManifest.source_count });
  const stage6aCanonical = await runStage6ALegalCartography({
    canonicalInput: canonicalStage6Input,
    maxReinvestigationAttempts: Number(process.env.LIVE_STAGE6A_MAX_REINVESTIGATION_ATTEMPTS || process.env.STAGE6A_MAX_REINVESTIGATION_ATTEMPTS || 1)
  });
  const legalCartography = stage6aCanonical.legal_cartography || null;
  const stage6aStageResult = {
    ok: stage6aCanonical.ok !== false,
    stage_id: "stage6a_legal_document_cartography",
    stage6_review: buildCanonicalStage6AReview(stage6aCanonical),
    canonical_stage6a_output: stage6aCanonical,
    semantic_model_attempted: false,
    validation: stage6aCanonical.validation || {}
  };
  if (!stage6aStageResult.ok) throwCanonicalStage6Error("Canonical Stage 6A failed.", stage6aCanonical);
  logStage(logs, "stage6a_legal_cartography_canonical", "complete", {
    legal_document_inventory_count: legalCartography?.legal_document_inventory?.length || 0,
    legal_unit_count: legalCartography?.legal_unit_map?.length || 0,
    validation_status: stage6aCanonical.validation?.status || null
  });

  logStage(logs, "stage6b_legal_governance_data_provenance_canonical", "running", { handoff: "stage6a_canonical_cartography" });
  const stage6bInput = buildStage6BInputFrom6AHandoff({
    canonicalStage6Input,
    stage6aOutput: stage6aCanonical,
    targetProfile: companyProfile,
    targetFeatureProfile
  });
  const stage6bCanonical = await runStage6BLegalGovernanceDataProvenance({
    canonicalInput: canonicalStage6Input,
    stage6aOutput: stage6aCanonical,
    stage6bInput,
    maxReinvestigationAttempts: Number(process.env.LIVE_STAGE6B_MAX_REINVESTIGATION_ATTEMPTS || process.env.STAGE6B_MAX_REINVESTIGATION_ATTEMPTS || 1)
  });
  if (stage6bCanonical.status === "CONTRACT_VIOLATION") throwCanonicalStage6Error("Canonical Stage 6B contract failed.", stage6bCanonical);

  const stage6bTo6cValidation = validate6bTo6cHandoff({
    canonicalStage6Input,
    stage6aOutput: stage6aCanonical,
    stage6bInput,
    stage6bOutput: stage6bCanonical,
    targetFeatureProfile
  });
  const stage6bStageResult = {
    ok: stage6bCanonical.ok !== false,
    stage_id: "stage6b_data_provenance",
    stage6_review: buildCanonicalStage6BReview(stage6bCanonical),
    canonical_stage6b_output: stage6bCanonical,
    semantic_model_attempted: false,
    validation: {
      ...(stage6bCanonical.validation || {}),
      stage6b_to_6c_handoff: stage6bTo6cValidation
    }
  };
  const dataProvenanceProfile = stage6bStageResult.stage6_review.data_provenance_profile;
  logStage(logs, "stage6b_legal_governance_data_provenance_canonical", "complete", {
    legal_data_finding_count: stage6bCanonical.legal_governance_data_provenance_profile?.legal_data_findings?.length || 0,
    data_flow_profile_count: dataProvenanceProfile?.data_flow_profile?.length || 0,
    validation_status: stage6bCanonical.validation?.status || null,
    stage6b_to_6c_status: stage6bTo6cValidation.status || null
  });

  const stage6IntegratedArtifact = buildStage6IntegratedHandoffArtifact(
    { stage6a_review: stage6aStageResult.stage6_review, stage6b_review: stage6bStageResult.stage6_review },
    {
      run_id: `${runId}_stage6_integrated_handoff`,
      generated_at: nowIso(),
      stage6a_stage_id: stage6aStageResult.stage_id,
      stage6b_stage_id: stage6bStageResult.stage_id,
      canonical_stage6_runtime: "6A_6B_CANONICAL_PENDING_6C",
      stage6b_to_6c_status: stage6bTo6cValidation.status || null
    }
  );
  const stage6IntegratedValidation = {
    schemaValidation: { ok: true, validation_mode: "canonical_6a_6b_compatibility_pending_6c" },
    guardrail: { ok: true, validation_mode: "canonical_6a_6b_compatibility_pending_6c", warnings: [], repairs: [] },
    stage6b_to_6c_handoff: stage6bTo6cValidation
  };
  logStage(logs, "stage6_integrated_handoff", "complete", {
    compatibility_adapter_only: true,
    canonical_stage6_path: "6A_6B_PENDING_6C",
    stage6b_to_6c_status: stage6bTo6cValidation.status || null
  });

  return {
    stage6aStageResult,
    stage6bStageResult,
    legalCartography,
    dataProvenanceProfile,
    stage6IntegratedArtifact,
    stage6IntegratedValidation
  };
}
