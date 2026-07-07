const FORBIDDEN_ATOM_KEYS = Object.freeze(["excerpt", "excerpts", "raw_text", "clean_text", "content", "body", "html", "markdown", "text"]);

export const PHASE7_EVIDENCE_ATOM_TYPES = Object.freeze([
  "ROUTE_LOCATOR_ATOM",
  "CONTACT_ROUTE_ATOM",
  "CONSENT_CONTROL_ROUTE_ATOM",
  "VENDOR_ROUTE_ATOM",
  "TRANSFER_LOCATION_ROUTE_ATOM",
  "RETENTION_ROUTE_ATOM",
  "SECURITY_CONTROL_ROUTE_ATOM",
  "DATA_FLOW_ROUTE_ATOM",
  "AI_LIFECYCLE_ROUTE_ATOM",
  "RIGHTS_ROUTE_ATOM",
  "NAVIGATION_MISS_ATOM"
]);

export function makePhase7EvidenceAtom(input = {}) {
  for (const key of FORBIDDEN_ATOM_KEYS) if (Object.prototype.hasOwnProperty.call(input, key)) throw new Error(`PHASE7_ATOM_FORBIDDEN_KEY:${key}`);
  const atomType = input.atom_type || atomTypeForDocumentType(input.document_type);
  if (!PHASE7_EVIDENCE_ATOM_TYPES.includes(atomType)) throw new Error(`PHASE7_ATOM_TYPE_INVALID:${atomType}`);
  return Object.freeze({
    atom_id: input.atom_id,
    atom_type: atomType,
    atom_status: input.atom_status || "PINPOINT_ATOM_CREATED",
    source_route_id: input.source_route_id,
    source_artifact: input.source_artifact,
    source_family: input.source_family,
    document_type: input.document_type,
    source_url_or_route: input.source_url_or_route,
    artifact_path: input.artifact_path,
    pinpoint_locator: input.pinpoint_locator,
    normalized_signal_label: input.normalized_signal_label || atomType.toLowerCase(),
    normalized_value: sanitizeAtomValue(input.normalized_value || input.source_url_or_route || input.document_type),
    candidate_dap_families: Object.freeze(input.candidate_dap_families || []),
    anti_unknown_status: input.anti_unknown_status || "DERIVED_DIRECT",
    family_access_mode: input.family_access_mode,
    whole_family_access_was_allowed_for_navigation: Boolean(input.whole_family_access_was_allowed_for_navigation),
    whole_family_output_allowed: false,
    full_document_output_allowed: false,
    excerpt_output_allowed: false,
    downstream_use: "Layer 4-8 may use this atom as structured signal only; not as source excerpt."
  });
}

export function validatePhase7EvidenceAtomShape(atom) {
  if (!atom || typeof atom !== "object") return fail("atom_not_object");
  const errors = [];
  for (const key of FORBIDDEN_ATOM_KEYS) if (Object.prototype.hasOwnProperty.call(atom, key)) errors.push(`forbidden_atom_key:${key}`);
  for (const key of ["atom_id", "atom_type", "source_route_id", "source_artifact", "document_type", "pinpoint_locator", "anti_unknown_status"]) if (!atom[key]) errors.push(`missing_${key}`);
  if (atom.whole_family_output_allowed !== false) errors.push("whole_family_output_not_disabled");
  if (atom.full_document_output_allowed !== false) errors.push("full_document_output_not_disabled");
  if (atom.excerpt_output_allowed !== false) errors.push("excerpt_output_not_disabled");
  return errors.length ? fail(errors) : Object.freeze({ status: "PASS", errors: [] });
}

export function atomTypeForDocumentType(documentType = "") {
  const map = {
    privacy_notice: "CONTACT_ROUTE_ATOM",
    dpa: "VENDOR_ROUTE_ATOM",
    subprocessor_list: "VENDOR_ROUTE_ATOM",
    security_trust: "SECURITY_CONTROL_ROUTE_ATOM",
    cookie_tracking_notice: "CONSENT_CONTROL_ROUTE_ATOM",
    ai_policy: "AI_LIFECYCLE_ROUTE_ATOM",
    docs_api_data_flow: "DATA_FLOW_ROUTE_ATOM",
    help_rights_request: "RIGHTS_ROUTE_ATOM",
    retention_deletion_export: "RETENTION_ROUTE_ATOM",
    incident_breach_security: "SECURITY_CONTROL_ROUTE_ATOM",
    terms: "ROUTE_LOCATOR_ATOM",
    direct_legal_signal_profile: "CONTACT_ROUTE_ATOM",
    upstream_activity_profile: "DATA_FLOW_ROUTE_ATOM",
    upstream_target_profile: "ROUTE_LOCATOR_ATOM",
    legal_navigation_ref: "ROUTE_LOCATOR_ATOM"
  };
  return map[documentType] || "ROUTE_LOCATOR_ATOM";
}

function sanitizeAtomValue(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

function fail(error) {
  return Object.freeze({ status: "REPAIR_REQUIRED", errors: Array.isArray(error) ? error : [error] });
}
