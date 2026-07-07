const FORBIDDEN_ROOTS = Object.freeze([
  "data_privacy_architecture_profile",
  "data_provenance_profile",
  "extended_dap_india_readiness_profile",
  "integrated_dap_report",
  "data_provenance_profile_forensics",
  "data_privacy_public_report_projection"
]);

export function validatePhase7DataPrivacyNavigationIndex(index) {
  const errors = [];
  if (!index || index.artifact_type !== "data_privacy_navigation_index") errors.push("wrong_artifact_type");
  const policy = index?.navigation_policy || {};
  if (policy.deterministic_index_construction_leads !== true) errors.push("deterministic_index_lead_not_locked");
  if (policy.semantic_batch_pointer_augmentation_required !== true) errors.push("semantic_pointer_overlay_not_locked");
  if (policy.full_d_family_lossless_access_allowed_through_index !== true) errors.push("d_family_index_access_not_locked");
  if (policy.selective_l_family_lossless_access_only_through_legal_cartography !== true) errors.push("l_family_legal_cartography_only_not_locked");
  if (policy.no_free_corpus_read !== true) errors.push("free_corpus_read_not_forbidden");
  if (policy.no_full_l_family_scan_without_locator !== true) errors.push("full_l_family_scan_not_forbidden");
  if (policy.no_dossier_emission !== true) errors.push("dossier_emission_not_forbidden");
  if (policy.no_compiler_output !== true) errors.push("compiler_output_not_forbidden");
  if (policy.no_forensics_output !== true) errors.push("forensics_output_not_forbidden");
  for (const root of FORBIDDEN_ROOTS) if (root in (index || {})) errors.push(`forbidden_root:${root}`);
  const spine = index?.deterministic_navigation_spine || {};
  if (!Array.isArray(spine.d_family_routes) || spine.d_family_routes.length !== 5) errors.push("d_family_routes_count_not_5");
  if (!Array.isArray(spine.l_family_routes) || spine.l_family_routes.length < 2) errors.push("l_family_routes_missing");
  const overlay = index?.semantic_navigation_overlay || {};
  const pointers = overlay.batch_navigation_pointers || [];
  if (!Array.isArray(pointers) || pointers.length !== 17) errors.push(`batch_pointer_count_not_17:${pointers.length || 0}`);
  for (const pointer of pointers) validateBatchPointer(pointer, errors);
  return Object.freeze({
    status: errors.length ? "REPAIR_REQUIRED" : "PASS",
    checked_batch_pointers: pointers.length || 0,
    checked_d_family_routes: spine.d_family_routes?.length || 0,
    checked_l_family_routes: spine.l_family_routes?.length || 0,
    compiler_and_forensics_excluded: !errors.some((error) => error.includes("compiler") || error.includes("forensics") || error.includes("forbidden_root")),
    errors: Object.freeze(errors)
  });
}

function validateBatchPointer(pointer, errors) {
  if (!pointer.batch_id) errors.push("batch_pointer_missing_batch_id");
  if (!Array.isArray(pointer.families) || !pointer.families.length) errors.push(`batch_pointer_missing_families:${pointer.batch_id}`);
  if (!pointer.expected_artifact_name) errors.push(`batch_pointer_missing_expected_artifact_name:${pointer.batch_id}`);
  if (!Array.isArray(pointer.required_d_family_route_ids) || pointer.required_d_family_route_ids.length !== 5) errors.push(`batch_pointer_d_routes_not_5:${pointer.batch_id}`);
  if (!Array.isArray(pointer.selective_l_family_route_ids) || pointer.selective_l_family_route_ids.length < 1) errors.push(`batch_pointer_missing_l_routes:${pointer.batch_id}`);
  if (!Array.isArray(pointer.reading_priority) || !pointer.reading_priority.length) errors.push(`batch_pointer_missing_reading_priority:${pointer.batch_id}`);
  if (!Array.isArray(pointer.forbidden_outputs) || !pointer.forbidden_outputs.includes("compiler") || !pointer.forbidden_outputs.includes("forensics")) errors.push(`batch_pointer_forbidden_outputs_missing:${pointer.batch_id}`);
  if (!String(pointer.model_instruction || "").includes("Do not free-read corpus")) errors.push(`batch_pointer_missing_no_free_read_instruction:${pointer.batch_id}`);
}
