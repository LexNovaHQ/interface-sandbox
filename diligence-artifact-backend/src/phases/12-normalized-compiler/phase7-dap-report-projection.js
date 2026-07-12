const PHASE7_DAP_BATCH_ARTIFACT_NAMES = Object.freeze(["dap_semantic_batch_exec_artifact", "dap_semantic_batch_lim_artifact", "dap_semantic_batch_party_artifact", "dap_semantic_batch_role_artifact", "dap_semantic_batch_flow_artifact", "dap_semantic_batch_obj_artifact", "dap_semantic_batch_auth_artifact", "dap_semantic_batch_ctrl_artifact", "dap_semantic_batch_contact_cm_artifact", "dap_semantic_batch_vend_artifact", "dap_semantic_batch_loc_artifact", "dap_semantic_batch_ret_artifact", "dap_semantic_batch_sec_artifact", "dap_semantic_batch_sens_artifact", "dap_semantic_batch_dom_artifact", "dap_semantic_batch_ready_artifact", "dap_semantic_batch_req_artifact"]);

const FAMILY_TITLES = Object.freeze({ EXEC: "Executive DAP Posture", LIM: "Limitations and Review Boundary", PARTY: "Party and Actor Identification", ROLE: "Role and Relationship Posture", FLOW: "Activity and Data Flow Mapping", OBJ: "Processing Objects and Purpose Signals", AUTH: "Authorization and Consent Signals", CTRL: "Control Visibility", CONTACT: "Contact and Grievance Routes", CM: "Consent Manager Readiness", VEND: "Vendor and Sharing Posture", LOC: "Location and Cross-Border Custody", RET: "Retention, Deletion, and Export Controls", SEC: "Security and Incident Visibility", SENS: "Sensitive and High-Risk Context", DOM: "Domain and Population Signals", READY: "Readiness and Governance Signals", REQ: "Missing Proof and Review Requests" });

export function buildPhase7DapReportProjection({ run = {}, artifacts = {} } = {}) {
  const routeManifest = unwrap(artifacts.dap_semantic_batch_route_manifest, "dap_semantic_batch_route_manifest");
  const gate = unwrap(artifacts.data_provenance_profile_semantic_batch_gate, "data_provenance_profile_semantic_batch_gate");
  const validationManifest = unwrap(artifacts.dap_semantic_batch_validation_manifest, "dap_semantic_batch_validation_manifest");
  const routePackets = Array.isArray(routeManifest.batch_route_packets) ? routeManifest.batch_route_packets : [];
  const rows = [];
  for (const packet of routePackets) {
    const artifactName = packet.expected_artifact_name;
    const batchRoot = unwrap(artifacts[artifactName], artifactName);
    const fieldRows = Array.isArray(batchRoot.field_rows) ? batchRoot.field_rows : [];
    const routeRowsById = new Map((packet.field_route_rows || []).map((routeRow) => [routeRow.field_id, routeRow]));
    for (const row of fieldRows) rows.push(toProjectionRow({ row, routeRow: routeRowsById.get(row.field_id), packet, artifactName, index: rows.length }));
  }
  const missingBatchArtifacts = PHASE7_DAP_BATCH_ARTIFACT_NAMES.filter((name) => !artifacts[name]);
  const subsections = Object.entries(groupBy(rows, (row) => row.family_code || "UNROUTED")).map(([family, familyRows], index) => ({ subsection_id: `phase7_dap_${String(index + 1).padStart(2, "0")}_${family.toLowerCase()}`, subsection_title: FAMILY_TITLES[family] || `DAP ${family}`, fields: familyRows.map((row) => row.public_field) }));
  const reviewRows = rows.filter((row) => row.requires_review);
  const projection = {
    artifact_type: "phase7_dap_report_projection",
    profile_version: "phase7_dap_batch_projection_v1_no_4b_4c",
    run_id: run.run_id || "UNKNOWN_RUN",
    derivation_mode: "DETERMINISTIC_ADAPTER_NO_MODEL",
    source_boundary: "LOCKED_PHASE7_BATCH_ARTIFACTS",
    source_artifacts: ["dap_semantic_batch_route_manifest", ...PHASE7_DAP_BATCH_ARTIFACT_NAMES, "dap_semantic_batch_validation_manifest", "data_provenance_profile_semantic_batch_gate"],
    batch_count: routePackets.length,
    field_count: rows.length,
    expected_field_count: 150,
    missing_batch_artifacts: missingBatchArtifacts,
    gate_status: gate.status || validationManifest.validation_quality_control_result?.status || "LOCKED_WITH_LIMITATIONS",
    non_blocking_repair_required: Boolean(gate.non_blocking_repair_required || validationManifest.validation_quality_control_result?.non_blocking_repair_required || missingBatchArtifacts.length),
    all_fields_covered_once: gate.all_fields_covered_once === true,
    validation_manifest_summary: { observed_batch_count: validationManifest.observed_batch_count || 0, observed_field_count: validationManifest.observed_field_count || rows.length, expected_field_count: validationManifest.expected_field_count || 150 },
    subsections,
    rows,
    qualified_review_queue: reviewRows.map((row, index) => ({ queue_id: `DAP-P7-QR-${String(index + 1).padStart(3, "0")}`, field_id: row.field_id, family_code: row.family_code, source_artifact: row.source_artifact, action: row.qualified_review_action })),
    normalized_profile_overlay: { phase7_substantive_field_base: rows, phase7_semantic_batch_gate: gate, phase7_validation_manifest: validationManifest }
  };
  return { phase7_dap_report_projection: projection };
}

function toProjectionRow({ row, routeRow = {}, packet = {}, artifactName, index }) {
  const fieldId = row.field_id || routeRow.field_id || `DAP.UNROUTED.${String(index + 1).padStart(3, "0")}`;
  const familyCode = String(fieldId).split(".")[1] || "UNROUTED";
  const status = row.semantic_resolution_status || "SEMANTIC_MISSING_PROOF_REQUIRED";
  const requiresReview = status !== "SEMANTIC_RESOLVED_WITH_BOUNDED_SUPPORT" && status !== "DETERMINISTIC_SOURCE_FACT_CARRIED";
  const action = text(row.missing_proof_request || row.qualified_review_action, requiresReview ? "Confirm this field during qualified review before reliance." : "Confirm before final draft reliance.");
  const publicField = { field_id: fieldId, label: `${String(index + 1).padStart(3, "0")}. ${text(routeRow.output_field || row.output_field, fieldId)}`, value: { finding: stringifyCandidate(row.structured_candidate), basis_summary: text(row.basis_summary, "No basis summary provided."), reasoning_summary: text(row.reasoning_summary, "No reasoning summary provided."), semantic_resolution_status: status, basis_route_ids: Array.isArray(row.basis_route_ids) ? row.basis_route_ids : [], forbidden_inference_check: row.forbidden_inference_check || "NOT_REPORTED" }, limitation: text(row.limitation, "Qualified review required before reliance."), qualified_review_note: action, source_artifact: artifactName, source_path: `field_rows.${Math.max(index, 0)}`, technical_refs: { batch_id: packet.batch_id || "UNKNOWN_BATCH", family_code: familyCode, registry_family: routeRow.registry_family || "", material_section_id: routeRow.material_section_id || "", material_subsection_id: routeRow.material_subsection_id || "" } };
  return { field_id: fieldId, family_code: familyCode, source_artifact: artifactName, semantic_resolution_status: status, qualified_review_action: action, requires_review: requiresReview, public_field: publicField };
}

function unwrap(value, key) { return value?.[key] && typeof value[key] === "object" ? value[key] : value?.artifact?.[key] || value || {}; }
function text(value, fallback) { return typeof value === "string" && value.trim() ? value.trim() : fallback; }
function stringifyCandidate(value) { if (typeof value === "string" && value.trim()) return value.trim(); if (value && typeof value === "object") return JSON.stringify(value); return "Not visible in reviewed public materials."; }
function groupBy(rows, picker) { const grouped = {}; for (const row of rows) { const key = picker(row); grouped[key] ||= []; grouped[key].push(row); } return grouped; }
