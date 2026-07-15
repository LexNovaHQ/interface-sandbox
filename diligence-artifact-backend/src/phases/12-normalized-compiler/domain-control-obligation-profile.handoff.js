import {
  DOMAIN_CONTROL_OBLIGATION_COMPILER_HANDOFF_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_CONSUMERS,
  DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_HANDOFF_VERSION,
  assertAcceptedDomainControlObligationHandoffStatus
} from "../08-domain-control-obligation-profile/domain-control-obligation-downstream-handoff.contract.js";

const SOURCE_ARTIFACT = "domain_control_obligation_profile";
const EXISTING_SECTION_IDS = Object.freeze([
  "legal_document_control_review",
  "exposure_control_discipline",
  "review_route_action_plan",
  "control_handoff_readiness",
  "exposure_clarification_queue",
  "methodology_limitations_review_notes"
]);

export const COMPILER_DOMAIN_CONTROL_OBLIGATION_HANDOFF_STATUS = Object.freeze({
  handoff: "phase8-domain-control-obligation-to-normalized-compiler",
  handoff_version: DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_HANDOFF_VERSION,
  consumer: DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_CONSUMERS.compiler,
  deterministic_projection_only: true,
  new_findings_allowed: false,
  new_rendered_section_allowed: false,
  candidate_inventory_rendering_allowed: false,
  derivation_basis_rendering_allowed: false,
  source_pointer_rendering_allowed: false
});

export function buildDomainControlObligationCompilerHandoff({
  domainControlObligationProfile,
  sourceLockStatus = "LOCKED"
} = {}) {
  const lockStatus = assertAcceptedDomainControlObligationHandoffStatus(sourceLockStatus);
  const profile = unwrapArtifact(domainControlObligationProfile, SOURCE_ARTIFACT);
  assertProfile(profile);

  const rows = profile.obligations.map((row) => pick(row, DOMAIN_CONTROL_OBLIGATION_COMPILER_HANDOFF_FIELDS));
  const legalControlRows = rows.map(buildLegalControlRow);
  const exposureControlRows = rows.map(buildExposureControlRow);
  const reviewRows = rows.map(buildReviewRouteRow);
  const readinessRows = rows.map(buildReadinessRow);
  const clarificationRows = rows
    .filter((row) => normalizeArray(row.missing_proof).length || normalizeId(row.diligence_question))
    .map(buildClarificationRow);
  const limitationRows = buildLimitationRows(rows, profile.profile_level_limitations || []);

  return deepFreeze({
    handoff_type: "normalized_compiler_domain_control_obligation_projection",
    handoff_version: DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_HANDOFF_VERSION,
    source_artifact: SOURCE_ARTIFACT,
    source_schema_version: normalizeId(profile.schema_version),
    source_lock_status: lockStatus,
    no_new_findings_created: true,
    no_new_rendered_section_created: true,
    existing_section_ids_only: EXISTING_SECTION_IDS,
    profile_summary: summarizeProfile(rows),
    existing_section_contributions: {
      legal_document_control_review: {
        contribution_key: "domain_control_obligation_rows",
        rows: legalControlRows
      },
      exposure_control_discipline: {
        contribution_key: "domain_control_posture_rows",
        rows: exposureControlRows
      },
      review_route_action_plan: {
        contribution_key: "domain_control_review_routes",
        rows: reviewRows
      },
      control_handoff_readiness: {
        contribution_key: "domain_control_handoff_readiness",
        rows: readinessRows
      },
      exposure_clarification_queue: {
        contribution_key: "domain_control_clarification_questions",
        rows: clarificationRows
      },
      methodology_limitations_review_notes: {
        contribution_key: "domain_control_limitations",
        rows: limitationRows
      }
    },
    projection_boundaries: {
      candidate_inventory_rendered: false,
      derivation_basis_rendered: false,
      registry_key_ref_rendered: false,
      obligation_catalog_ref_rendered: false,
      p2e_navigation_route_refs_rendered: false,
      regulatory_overlay_refs_are_candidate_only_context: true,
      authority_dependency_is_not_legal_applicability: true,
      visible_control_is_not_compliance_or_adequacy: true,
      qualified_review_required_before_reliance: true
    }
  });
}

function buildLegalControlRow(row) {
  return {
    obligation_id: row.obligation_id,
    obligation_name: row.normalized_name,
    obligation_family: row.obligation_family,
    source_package_id: row.source_package_id,
    source_layer: row.source_layer,
    capability_overlay_id: row.capability_overlay_id,
    target_context: row.target_specific_obligation_context,
    operational_requirement: row.what_it_requires,
    obligation_locus: row.obligation_locus,
    trigger_timing: row.obligation_trigger_timing,
    authority_dependency: clonePlain(row.authority_dependency),
    regulatory_overlay_context: normalizeArray(row.regulatory_overlay_refs).map((overlay) => ({
      overlay_id: normalizeId(overlay?.overlay_id),
      matched_frameworks: uniqueStrings(overlay?.matched_frameworks || []),
      status: "CANDIDATE_ONLY"
    })),
    legal_applicability_determined: false,
    compliance_determined: false
  };
}

function buildExposureControlRow(row) {
  return {
    obligation_id: row.obligation_id,
    linked_activity_references: clonePlain(row.linked_activity_references),
    exposure_role_context: row.exposure_role_context,
    expected_control_signal: row.expected_control_signal,
    control_mechanism_present: row.control_mechanism_present,
    control_posture_status: row.control_posture_status,
    evidence_basis: clonePlain(row.evidence_basis),
    missing_proof: clonePlain(row.missing_proof),
    limitations: clonePlain(row.limitation),
    control_signal_role: "PUBLIC_FOOTPRINT_VISIBILITY_ONLY",
    exposure_verdict_created: false
  };
}

function buildReviewRouteRow(row) {
  return {
    obligation_id: row.obligation_id,
    obligation_name: row.normalized_name,
    review_route_signal: reviewRouteSignal(row),
    diligence_question: row.diligence_question,
    missing_proof: clonePlain(row.missing_proof),
    authority_dependency: clonePlain(row.authority_dependency),
    qualified_review_required: true
  };
}

function buildReadinessRow(row) {
  return {
    obligation_id: row.obligation_id,
    obligation_name: row.normalized_name,
    control_posture_status: row.control_posture_status,
    handoff_state: handoffState(row),
    expected_control_signal: row.expected_control_signal,
    evidence_to_preserve_or_request: uniqueStrings([
      row.evidence_basis,
      row.missing_proof
    ]),
    reviewer_question: row.diligence_question
  };
}

function buildClarificationRow(row) {
  return {
    obligation_id: row.obligation_id,
    obligation_name: row.normalized_name,
    question: row.diligence_question,
    missing_proof: clonePlain(row.missing_proof),
    target_context: row.target_specific_obligation_context,
    review_route_signal: reviewRouteSignal(row)
  };
}

function buildLimitationRows(rows, profileLimitations) {
  const output = [];
  for (const row of rows) {
    for (const limitation of uniqueStrings(row.limitation || [])) {
      output.push({
        scope: "OBLIGATION_ROW",
        obligation_id: row.obligation_id,
        limitation,
        legal_or_compliance_verdict: false
      });
    }
  }
  for (const limitation of uniqueStrings(profileLimitations)) {
    output.push({
      scope: "PROFILE",
      obligation_id: "",
      limitation,
      legal_or_compliance_verdict: false
    });
  }
  return output;
}

function reviewRouteSignal(row) {
  if (row.control_mechanism_present === "VISIBLE" && row.control_posture_status === "VISIBLE") {
    return normalizeArray(row.missing_proof).length || normalizeArray(row.limitation).length
      ? "VERIFY_VISIBLE_CONTROL_AND_CLOSE_PROOF_GAPS"
      : "VERIFY_VISIBLE_CONTROL_AND_PRESERVE_EVIDENCE";
  }
  if (row.control_posture_status === "PARTIAL") return "CONFIRM_CONTROL_SCOPE_AND_OPERATION";
  if (row.control_mechanism_present === "NOT_VISIBLE" || row.control_posture_status === "NOT_VISIBLE") return "REQUEST_CONTROL_EVIDENCE";
  return "QUALIFIED_REVIEW_AND_PRIVATE_CONFIRMATION";
}

function handoffState(row) {
  if (row.control_mechanism_present === "VISIBLE" && row.control_posture_status === "VISIBLE" && !normalizeArray(row.missing_proof).length && !normalizeArray(row.limitation).length) {
    return "READY_FOR_REVIEW";
  }
  if (row.control_posture_status === "PARTIAL" || row.control_mechanism_present === "UNCLEAR") return "NEEDS_CONFIRMATION";
  if (row.control_mechanism_present === "NOT_VISIBLE" || row.control_posture_status === "NOT_VISIBLE") return "BLOCKED_PENDING_SOURCE";
  return "BLOCKED_PENDING_CLIENT_FACT";
}

function summarizeProfile(rows) {
  return {
    obligation_count: rows.length,
    visible: rows.filter((row) => row.control_posture_status === "VISIBLE").length,
    partial: rows.filter((row) => row.control_posture_status === "PARTIAL").length,
    not_visible: rows.filter((row) => row.control_posture_status === "NOT_VISIBLE").length,
    unresolved: rows.filter((row) => row.control_posture_status === "UNRESOLVED").length,
    rows_with_missing_proof: rows.filter((row) => normalizeArray(row.missing_proof).length).length,
    rows_with_limitations: rows.filter((row) => normalizeArray(row.limitation).length).length
  };
}

function assertProfile(profile) {
  if (!isPlainObject(profile)) throw new Error("COMPILER_DOMAIN_CONTROL_OBLIGATION_PROFILE_MISSING");
  if (profile.artifact_type !== SOURCE_ARTIFACT) throw new Error(`COMPILER_DOMAIN_CONTROL_OBLIGATION_ARTIFACT_TYPE_MISMATCH:${profile.artifact_type || "missing"}`);
  if (!Array.isArray(profile.obligations)) throw new Error("COMPILER_DOMAIN_CONTROL_OBLIGATION_ROWS_MISSING");
  if (Number(profile.obligation_count) !== profile.obligations.length) throw new Error("COMPILER_DOMAIN_CONTROL_OBLIGATION_COUNT_MISMATCH");
}

function pick(value, fields) {
  return Object.fromEntries(fields.map((field) => [field, clonePlain(value?.[field])]));
}

function unwrapArtifact(value, artifactName) {
  if (isPlainObject(value?.[artifactName])) return value[artifactName];
  if (value?.artifact_type === artifactName) return value;
  if (isPlainObject(value?.artifact)) return unwrapArtifact(value.artifact, artifactName);
  return value || {};
}

function clonePlain(value) {
  if (Array.isArray(value)) return value.map(clonePlain);
  if (isPlainObject(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clonePlain(item)]));
  return value;
}

function normalizeArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function uniqueStrings(value) {
  return [...new Set(normalizeArray(value).flat(Infinity).map(normalizeId).filter(Boolean))];
}

function normalizeId(value) {
  return String(value ?? "").trim();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}
