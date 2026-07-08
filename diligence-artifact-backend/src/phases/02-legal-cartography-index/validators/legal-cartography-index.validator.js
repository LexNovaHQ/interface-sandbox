const REQUIRED_KEYS = Object.freeze(["document_coverage_index", "document_structure_index", "incorporated_linked_document_map", "control_language_locator", "semantic_navigation_index", "priority_semantic_locator", "qualified_review_locator", "legal_notice_locator", "dispute_resolution_locator", "governing_law_venue_locator", "contact_grievance_locator", "missing_limited_legal_governance_items", "downstream_rules", "lock_status"]);
const ARRAY_KEYS = REQUIRED_KEYS.filter((key) => !["downstream_rules", "lock_status"].includes(key));
const LOCK_STATUSES = Object.freeze(["LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE"]);
const NON_BLOCKING_LOCK_STATUSES = Object.freeze(["LOCKED_WITH_LIMITATIONS"]);
const FORBIDDEN_KEYS = Object.freeze(["qualified_review_legal_signals", "target_profile", "target_feature_profile", "data_provenance_profile", "data_provenance_profile_forensics", "extended_dap_india_readiness_profile", "integrated_dap_report", "exposure_registry_profile", "challenge_gate", "final_output_handoff", "renderer_payload", "legal_advice", "compliance_conclusion", "sufficiency_conclusion", "enforceability_assessment", "risk_conclusion", "registry_evaluation"]);

export function validateM9LegalCartographyIndex(output) {
  const failures = [];
  const limitations = [];
  const artifact = output?.legal_cartography_index;
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) return fail(["missing legal_cartography_index object"]);
  const keys = Object.keys(artifact);
  const missing = REQUIRED_KEYS.filter((key) => !(key in artifact));
  const extra = keys.filter((key) => !REQUIRED_KEYS.includes(key));
  if (missing.length) failures.push(`missing keys: ${missing.join(",")}`);
  if (extra.length) failures.push(`extra keys: ${extra.join(",")}`);
  for (const key of ARRAY_KEYS) if (!Array.isArray(artifact[key])) failures.push(`${key} must be an array`);
  if (!artifact.downstream_rules || typeof artifact.downstream_rules !== "object" || Array.isArray(artifact.downstream_rules)) failures.push("downstream_rules must be an object");
  if (artifact.downstream_rules?.source_discovery_is_navigation_not_legal_authority !== true && artifact.downstream_rules?.m6_is_navigation_not_legal_authority !== true) failures.push("downstream_rules.source_discovery_is_navigation_not_legal_authority must be true");
  if (artifact.downstream_rules?.embedded_legal_instruments_are_indexable !== true) failures.push("downstream_rules.embedded_legal_instruments_are_indexable must be true");
  if (artifact.downstream_rules?.semantic_navigation_index_is_downstream_available !== true) failures.push("downstream_rules.semantic_navigation_index_is_downstream_available must be true");
  if (artifact.downstream_rules?.control_language_locator_is_technical_locator_only !== true) failures.push("downstream_rules.control_language_locator_is_technical_locator_only must be true");
  if (artifact.downstream_rules?.legal_signal_derivation_profile_is_separate_job_b_artifact !== true) failures.push("downstream_rules.legal_signal_derivation_profile_is_separate_job_b_artifact must be true");
  if (artifact.downstream_rules?.qualified_review_legal_signals_retired_from_m9_index !== true) failures.push("downstream_rules.qualified_review_legal_signals_retired_from_m9_index must be true");
  if (artifact.downstream_rules?.m10_4b_4c_not_active !== true) failures.push("downstream_rules.m10_4b_4c_not_active must be true");
  if (!LOCK_STATUSES.includes(artifact.lock_status)) failures.push(`invalid lock_status: ${artifact.lock_status || "missing"}`);
  if (NON_BLOCKING_LOCK_STATUSES.includes(artifact.lock_status)) limitations.push(`legal_cartography_index emitted ${artifact.lock_status}`);
  for (const forbidden of FORBIDDEN_KEYS) if (containsKey(output, forbidden)) failures.push(`forbidden key present: ${forbidden}`);
  if (failures.length) return fail(failures);
  if (limitations.length) return { status: "LOCKED_WITH_LIMITATIONS", failed_gates: [], limitation_gates: limitations, repair_instructions: [] };
  return { status: "PASS", failed_gates: [], limitation_gates: [], repair_instructions: [] };
}

export function assertM9LegalCartographyIndex(output) {
  return validateM9LegalCartographyIndex(output);
}

function fail(failures) {
  const validation = { status: "REPAIR_REQUIRED", failed_gates: failures, limitation_gates: [], repair_instructions: ["Return exactly one legal_cartography_index object using Phase 2 index-only contract. Keep legal signal derivation in legal_signal_derivation_profile and do not emit old M10/4B/4C artifacts."] };
  const error = new Error(`LEGAL_CARTOGRAPHY_VALIDATION_FAILED:${JSON.stringify(validation)}`);
  error.validation = validation;
  throw error;
}
function containsKey(value, key) { if (!value || typeof value !== "object") return false; if (Object.prototype.hasOwnProperty.call(value, key)) return true; return Object.values(value).some((item) => containsKey(item, key)); }
