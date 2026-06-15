import { buildStage6IntegratedHandoffArtifact } from "../diligence/stage6IntegratedHandoffBuilder.js";
import {
  buildStage6CanonicalInput,
  buildStage6SourceCustodyManifest
} from "../diligence/stage6/stage6.runtime.js";
import { runStage6ALegalCartography } from "../diligence/stage6/6a/6a.runtime.js";
import { runStage6BLegalGovernanceDataProvenance } from "../diligence/stage6/6b/6b.runtime.js";
import { runStage6CDataProvenanceIntegration } from "../diligence/stage6/6c/6c.runtime.js";
import { buildStage6BInputFrom6AHandoff } from "../diligence/stage6/validators/validate6aTo6bHandoff.js";
import { validate6bTo6cHandoff } from "../diligence/stage6/validators/validate6bTo6cHandoff.js";
import { validate6cTo7Handoff } from "../diligence/stage6/validators/validate6cTo7Handoff.js";
import { STAGE6_VALIDATION_STATUS } from "../diligence/stage6/stage6.dictionary.js";
import { asArray, logStage, nowIso } from "./liveRunShared.js";
import {
  buildStage6Cache as buildLegacyStage6Cache,
  runStage,
  runStage7,
  runStage8
} from "./liveStage6To8Pipeline.js";

export { runStage, runStage7, runStage8 };

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

function compatibilityDataSignalIndex(stage6cCanonical = {}) {
  return asArray(stage6cCanonical.data_provenance_profile?.integrated_data_flows).map((row) => ({
    integrated_data_flow_id: row.integrated_data_flow_id,
    data_flow_id: row.integrated_data_flow_id,
    alignment_status: row.alignment_status,
    data_category: row.data_category,
    product_observed_refs: asArray(row.product_observed_refs),
    legal_governance_refs: asArray(row.legal_governance_refs),
    product_source_window_refs: asArray(row.product_source_window_refs),
    legal_source_window_refs: asArray(row.legal_source_window_refs)
  }));
}

function buildCanonicalStage6CReview(stage6cCanonical = {}) {
  const dataProvenanceProfile = stage6cCanonical.data_provenance_profile || {};
  return {
    stage6_review_version: "stage6_review_v1",
    stage6_component: "stage6c_integrated_data_provenance_canonical",
    stage_role: "integrated_data_provenance_profile",
    data_provenance_profile: dataProvenanceProfile,
    legal_governance_data_provenance_profile: stage6cCanonical.legal_governance_profile || null,
    product_observed_flows: asArray(stage6cCanonical.product_observed_flows),
    legal_governance_findings: asArray(stage6cCanonical.legal_governance_findings),
    stage7_navigation_index: {
      feature_to_data_flow_index: asArray(stage6cCanonical.product_observed_flows).map((flow) => ({
        feature_id: flow.feature_id,
        product_flow_id: flow.product_flow_id,
        source_window_refs: asArray(flow.source_window_refs)
      })),
      data_signal_index: compatibilityDataSignalIndex(stage6cCanonical),
      absence_unknown_index: [],
      fallback_source_packet: []
    },
    stage6_limitations: asArray(dataProvenanceProfile.limitations)
  };
}

function throwCanonicalStage6Error(message, result = {}) {
  const error = new Error(message);
  error.status = 422;
  error.result = result;
  throw error;
}

export function buildStage6Cache({
  sourceBundle,
  evidenceJunction,
  companyProfile,
  targetFeatureProfile,
  stage6aStageResult,
  stage6bStageResult,
  stage6cStageResult = null,
  legalCartography = null,
  dataProvenanceProfile = null,
  stage6IntegratedArtifact,
  stage6IntegratedValidation = null,
  stage7HandoffValidation = null,
  stage7HandoffInput = null
}) {
  const cache = buildLegacyStage6Cache({
    sourceBundle,
    evidenceJunction,
    companyProfile,
    targetFeatureProfile,
    stage6aStageResult,
    stage6bStageResult,
    legalCartography,
    dataProvenanceProfile,
    stage6IntegratedArtifact,
    stage6IntegratedValidation
  });
  return {
    ...cache,
    canonical_stage6_runtime: "6A_6B_6C_TO_7_CANONICAL",
    data_provenance_profile: dataProvenanceProfile || cache.data_provenance_profile || null,
    stage6c_stage_result: stage6cStageResult,
    stage7_handoff_validation: stage7HandoffValidation,
    stage7_input_handoff: stage7HandoffInput,
    compatibility_adapters: {
      ...(cache.compatibility_adapters || {}),
      stage6_integrated_artifact: stage6IntegratedArtifact,
      stage6_integrated_validation: stage6IntegratedValidation,
      stage6_review: stage6IntegratedArtifact?.stage6_review || null,
      stage6_to_stage7_adapter: stage6IntegratedArtifact?.stage6_to_stage7_adapter || null,
      stage7_handoff_validation: stage7HandoffValidation,
      stage7_input_handoff: stage7HandoffInput
    }
  };
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
  if (stage6bCanonical.status === STAGE6_VALIDATION_STATUS.CONTRACT_VIOLATION) throwCanonicalStage6Error("Canonical Stage 6B contract failed.", stage6bCanonical);

  const stage6bTo6cValidation = validate6bTo6cHandoff({
    canonicalStage6Input,
    stage6aOutput: stage6aCanonical,
    stage6bInput,
    stage6bOutput: stage6bCanonical,
    targetFeatureProfile
  });
  const stage6bStageResult = {
    ok: stage6bCanonical.ok !== false,
    stage_id: "stage6b_legal_governance_data_provenance",
    stage6_review: {
      stage6_review_version: "stage6_review_v1",
      stage6_component: "stage6b_legal_governance_data_provenance_canonical",
      stage_role: "legal_governance_data_provenance",
      legal_governance_data_provenance_profile: stage6bCanonical.legal_governance_data_provenance_profile || {},
      data_provenance_profile: {
        profile_version: "stage6b_legal_governance_profile_reference_only_v1",
        legal_governance_data_provenance_profile: stage6bCanonical.legal_governance_data_provenance_profile || {},
        stage6c_required: true
      },
      stage7_navigation_index: { feature_to_data_flow_index: [], data_signal_index: [], absence_unknown_index: [], fallback_source_packet: [] },
      stage6_limitations: asArray(stage6bCanonical.legal_governance_data_provenance_profile?.limitations)
    },
    canonical_stage6b_output: stage6bCanonical,
    semantic_model_attempted: false,
    validation: {
      ...(stage6bCanonical.validation || {}),
      stage6b_to_6c_handoff: stage6bTo6cValidation
    }
  };
  logStage(logs, "stage6b_legal_governance_data_provenance_canonical", "complete", {
    legal_data_finding_count: stage6bCanonical.legal_governance_data_provenance_profile?.legal_data_findings?.length || 0,
    validation_status: stage6bCanonical.validation?.status || null,
    stage6b_to_6c_status: stage6bTo6cValidation.status || null
  });

  logStage(logs, "stage6c_integrated_data_provenance_canonical", "running", { handoff: "stage6b_legal_governance_profile" });
  const stage6cCanonical = await runStage6CDataProvenanceIntegration({
    canonicalStage6Input,
    stage6aOutput: stage6aCanonical,
    stage6bOutput: stage6bCanonical,
    targetFeatureProfile,
    maxReinvestigationAttempts: Number(process.env.LIVE_STAGE6C_MAX_REINVESTIGATION_ATTEMPTS || process.env.STAGE6C_MAX_REINVESTIGATION_ATTEMPTS || 1)
  });
  if (stage6cCanonical.status === STAGE6_VALIDATION_STATUS.CONTRACT_VIOLATION) throwCanonicalStage6Error("Canonical Stage 6C contract failed.", stage6cCanonical);
  const stage6cInput = stage6cCanonical.validation?.handoff?.stage6c_input || stage6bTo6cValidation.stage6c_input || null;
  const stage6cTo7Validation = validate6cTo7Handoff({
    canonicalStage6Input,
    stage6aOutput: stage6aCanonical,
    stage6bOutput: stage6bCanonical,
    stage6cOutput: stage6cCanonical,
    stage6cInput,
    targetProfile: companyProfile,
    targetFeatureProfile
  });
  if (stage6cTo7Validation.status === STAGE6_VALIDATION_STATUS.CONTRACT_VIOLATION) throwCanonicalStage6Error("Canonical Stage 6C→7 handoff contract failed.", stage6cTo7Validation);
  const stage6cStageResult = {
    ok: stage6cCanonical.ok !== false,
    stage_id: "stage6c_data_provenance_integration",
    stage6_review: buildCanonicalStage6CReview(stage6cCanonical),
    canonical_stage6c_output: stage6cCanonical,
    semantic_model_attempted: false,
    validation: {
      ...(stage6cCanonical.validation || {}),
      stage6c_to_7_handoff: stage6cTo7Validation
    }
  };
  const dataProvenanceProfile = stage6cCanonical.data_provenance_profile || null;
  logStage(logs, "stage6c_integrated_data_provenance_canonical", "complete", {
    integrated_data_flow_count: dataProvenanceProfile?.integrated_data_flows?.length || 0,
    validation_status: stage6cCanonical.validation?.status || null,
    stage6c_to_7_status: stage6cTo7Validation.status || null
  });

  const stage6IntegratedArtifact = buildStage6IntegratedHandoffArtifact(
    { stage6a_review: stage6aStageResult.stage6_review, stage6b_review: stage6cStageResult.stage6_review },
    {
      run_id: `${runId}_stage6_integrated_handoff`,
      generated_at: nowIso(),
      stage6a_stage_id: stage6aStageResult.stage_id,
      stage6b_stage_id: stage6bStageResult.stage_id,
      stage6c_stage_id: stage6cStageResult.stage_id,
      canonical_stage6_runtime: "6A_6B_6C_TO_7_CANONICAL",
      stage6b_to_6c_status: stage6bTo6cValidation.status || null,
      stage6c_to_7_status: stage6cTo7Validation.status || null
    }
  );
  const stage6IntegratedValidation = {
    schemaValidation: { ok: true, validation_mode: "canonical_6a_6b_6c_compatibility" },
    guardrail: { ok: true, validation_mode: "canonical_6a_6b_6c_compatibility", warnings: [], repairs: [] },
    stage6b_to_6c_handoff: stage6bTo6cValidation,
    stage6c_to_7_handoff: stage6cTo7Validation
  };
  logStage(logs, "stage6_integrated_handoff", "complete", {
    compatibility_adapter_only: true,
    canonical_stage6_path: "6A_6B_6C_TO_7",
    stage6b_to_6c_status: stage6bTo6cValidation.status || null,
    stage6c_to_7_status: stage6cTo7Validation.status || null
  });

  return {
    stage6aStageResult,
    stage6bStageResult,
    stage6cStageResult,
    legalCartography,
    dataProvenanceProfile,
    stage6IntegratedArtifact,
    stage6IntegratedValidation,
    stage7HandoffValidation: stage6cTo7Validation,
    stage7HandoffInput: stage6cTo7Validation.stage7_input || null
  };
}