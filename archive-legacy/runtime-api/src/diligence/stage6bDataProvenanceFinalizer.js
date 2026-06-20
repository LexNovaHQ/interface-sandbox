import {
  buildStage6BDataSignalIndex,
  buildStage6BFeatureToDataFlowIndex,
  deriveStage6BDataProfileSummarySignals,
  normalizeStage5FeatureProfile
} from "./stage6bDataProvenanceBuilder.js";
import {
  applyStage6BLegalGovernancePrefill,
  buildStage6BLegalGovernancePrefill
} from "./stage6bLegalGovernancePrefill.js";

function arr(value) { return Array.isArray(value) ? value : []; }

export function finalizeStage6BDataProvenance(stage6Review = {}, input = {}) {
  const output = structuredClone(stage6Review || {});
  const prefill = buildStage6BLegalGovernancePrefill(input);
  const profile = normalizeStage5FeatureProfile(input);
  const rows = arr(output.data_provenance_profile?.data_flow_profile).map((row) => applyStage6BLegalGovernancePrefill(row, prefill));
  if (output.data_provenance_profile) {
    output.data_provenance_profile.data_flow_profile = rows;
    output.data_provenance_profile.data_profile_summary_signals = deriveStage6BDataProfileSummarySignals(rows);
  }
  if (output.stage7_navigation_index) {
    output.stage7_navigation_index.feature_to_data_flow_index = buildStage6BFeatureToDataFlowIndex(rows, profile);
    output.stage7_navigation_index.data_signal_index = buildStage6BDataSignalIndex(rows);
  }
  return { stage6_review: output, legal_governance_prefill: prefill };
}

export const stage6bDataProvenanceFinalizerInternals = { arr };
