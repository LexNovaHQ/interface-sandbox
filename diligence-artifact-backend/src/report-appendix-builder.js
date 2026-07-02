import { FORENSIC_ANNEXURE_FAMILIES } from "./report-registry-map.js";
import { asArray, safeObject, safeText, statusLabel } from "./report-safe-language.js";

const APPENDIX_MATERIAL_STATUSES = new Set([
  "TRIGGERED",
  "CONTROLLED_BY_VISIBLE_CONTROL",
  "CONTROLLED_BY_EXCLUSION",
  "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION"
]);

export function buildForensicLedgerAppendix({ handoff, profiles, forensics, displayIdIndex }) {
  const workpad = unwrap(forensics.exposure_registry_workpad_98, "exposure_registry_workpad_98");
  const profileForensics = unwrap(forensics.exposure_registry_profile_forensics, "exposure_registry_profile_forensics");
  const routePlan = unwrap(forensics.exposure_registry_route_plan, "exposure_registry_route_plan");
  const registryRows = asArray(workpad.registry_rows);
  const triggeredDisplayIds = new Map(asArray(displayIdIndex?.exposure_display_ids).map((row) => [row.canonical_refs?.threat_id || row.canonical_refs?.registry_row_id, row.display_exposure_id]));

  return {
    heading: "Forensic Ledger Appendix",
    appendix_registry_families: FORENSIC_ANNEXURE_FAMILIES,
    appendix_notice: "This appendix preserves audit/proof/validation material. It is not legal advice, does not include chain-of-thought, and does not create findings beyond locked upstream artifacts.",
    full_ledger_summary: {
      source_rows: countSourceRows(profiles.source_discovery_handoff),
      feature_rows: asArray(profiles.target_feature_profile?.activities).length,
      data_field_count: countPresentObjectKeys(profiles.data_provenance_profile),
      legal_coverage_rows: asArray(profiles.legal_cartography_index?.document_coverage_index).length,
      legal_control_rows: asArray(profiles.legal_cartography_index?.control_language_locator).length,
      registry_workpad_rows: registryRows.length,
      triggered_rows: asArray(profiles.exposure_registry_triggered_profile?.triggered_rows).length,
      controlled_rows: asArray(profiles.exposure_registry_controlled_profile?.controlled_rows).length,
      route_plan_status: routePlan?.phase_a_validation?.status || "UNKNOWN",
      profile_forensics_status: profileForensics?.registry_lock_gate_result?.status || profileForensics?.registry_self_check_result?.status || "UNKNOWN"
    },
    full_registry_ledger: registryRows.map((row, index) => ({
      appendix_ref: `REG-${String(index + 1).padStart(3, "0")}`,
      display_exposure_id: triggeredDisplayIds.get(row.Threat_ID) || null,
      threat_id: row.Threat_ID || "",
      registry_order: row.registry_order ?? index + 1,
      archetype: row.archetype || row.Archetype || "",
      surface: row.surface || row.Surface || "",
      route: safeText(row.route, "Route not specified"),
      route_reason: safeText(row.route_reason, "Route reason not specified"),
      final_material_status: statusLabel(row.final_material_status),
      internal_evaluation_status: statusLabel(row.internal_evaluation_status),
      trigger_status: statusLabel(row.trigger_status),
      limitations: safeText(row.limitations, "No row-specific limitation recorded")
    })),
    row_level_proof: registryRows.filter((row) => APPENDIX_MATERIAL_STATUSES.has(String(row.final_material_status || "").toUpperCase())).map((row) => ({
      threat_id: row.Threat_ID || "",
      display_exposure_id: triggeredDisplayIds.get(row.Threat_ID) || null,
      material_status: statusLabel(row.final_material_status),
      basis_proof: safeText(row.material_projection?.basis_proof || row.basis_proof, "Basis proof not specified in material projection"),
      control_exclusion_evaluation: safeText(row.material_projection?.control_exclusion_evaluation || row.control_exclusion_evaluation, "Control/exclusion evaluation not specified"),
      evidence_source_basis: safeText(row.material_projection?.evidence_source_basis || row.evidence_source_basis, "Evidence/source basis not specified"),
      fp_mechanism: safeText(row.material_projection?.fp_mechanism || row.fp_mechanism, "FP mechanism not specified"),
      pain_tier: safeText(row.material_projection?.Pain_Tier || row.Pain_Tier, "Pain tier not specified"),
      pain_depth: safeText(row.material_projection?.Pain_Depth || row.Pain_Depth, "Pain depth not specified"),
      pain_category: safeText(row.material_projection?.Pain_Category || row.Pain_Category, "Pain category not specified"),
      review_route: safeText(row.material_projection?.review_route || row.review_route, "Qualified reviewer should verify")
    })),
    condition_trigger_basis: asArray(profileForensics.trigger_adjudication_ledger),
    evidence_references: asArray(profileForensics.evidence_binding_ledger),
    operator_challenge_trace: profiles.challenge_gate || handoff.challenge_gate || {},
    batch_warnings: collectBatchWarnings({ forensics, routePlan, profileForensics }),
    appendix_limitations: collectLimitations({ profiles, forensics, handoff }),
    renderer_export_trace: { renderer_generated_by: "locked-report-renderer", renderer_deterministic: true, model_used_after_m11: false, old_exposure_registry_profile_used: false, split_exposure_profiles_used: true, m11_four_status_material_rows_supported: true },
    forensic_boundary: { no_chain_of_thought: true, no_hidden_scratchpad: true, no_secrets_or_api_keys: true, no_legal_conclusions: true, appendix_only: true }
  };
}

export function collectLimitations({ profiles = {}, forensics = {}, handoff = {} } = {}) {
  const rows = [];
  pushLimit(rows, "target_profile", profiles.target_profile?.target_profile_limitations);
  pushLimit(rows, "target_feature_profile", profiles.target_feature_profile?.profile_level_limitations);
  pushLimit(rows, "data_provenance_profile", profiles.data_provenance_profile?.limitations);
  pushLimit(rows, "legal_cartography_index", profiles.legal_cartography_index?.missing_limited_legal_governance_items);
  pushLimit(rows, "compiler", handoff.limitations || handoff.missing_artifacts);
  pushLimit(rows, "m7_forensics", forensics.target_profile_forensics?.limitation_ledger);
  pushLimit(rows, "m8_forensics", forensics.target_feature_profile_forensics?.activity_limitations_ledger);
  pushLimit(rows, "m10_forensics", forensics.data_provenance_profile_forensics?.missing_proof_request_ledger);
  pushLimit(rows, "m11_forensics", unwrap(forensics.exposure_registry_profile_forensics, "exposure_registry_profile_forensics")?.control_exclude_evaluation_ledger);
  return rows;
}

function pushLimit(rows, source, value) { for (const item of asArray(value)) rows.push({ source, limitation: typeof item === "string" ? item : safeObject(item), display_text: safeText(item, "Limitation recorded") }); }
function collectBatchWarnings({ forensics = {}, routePlan = {}, profileForensics = {} } = {}) { const warnings = []; for (const validation of asArray(forensics.m12_batch_validation_artifacts)) { const root = validation?.exposure_registry_batch_validation || validation?.artifact?.exposure_registry_batch_validation || validation; if (root?.status && !["PASS", "PASS_WITH_LIMITATION"].includes(String(root.status).toUpperCase())) warnings.push(root); warnings.push(...asArray(root?.warnings)); warnings.push(...asArray(root?.failures)); } warnings.push(...asArray(routePlan?.phase_a_validation?.warnings)); warnings.push(...asArray(routePlan?.phase_a_validation?.failures)); warnings.push(...asArray(profileForensics?.registry_self_check_result?.failures)); return warnings.map((warning) => safeText(warning, "Warning recorded")); }
function countSourceRows(sourceDiscovery = {}) { const handoff = unwrap(sourceDiscovery, "source_discovery_handoff"); const indexes = [handoff?.source_inventory, handoff?.admitted_sources, handoff?.phase_packages?.final_source_coverage_package?.source_records, handoff?.phase_packages?.target_profile_package?.source_records, handoff?.phase_packages?.feature_profile_package?.source_records]; return indexes.reduce((count, value) => count + asArray(value).length, 0); }
function countPresentObjectKeys(value) { if (!value || typeof value !== "object" || Array.isArray(value)) return 0; return Object.keys(value).filter((key) => value[key] !== null && value[key] !== undefined && value[key] !== "").length; }
function unwrap(value, key) { const object = safeObject(value); return safeObject(object[key] || object); }
