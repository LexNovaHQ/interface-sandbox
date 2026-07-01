import { buildNormalizedProfilerOutput as buildBaseNormalizedProfilerOutput } from "./normalized-profiler.js";
import { asArray, getPath, reviewRouteLabel, safeObject, safeText, unique } from "./report-safe-language.js";
import { NORMALIZATION_MAP_VERSION, normalizeInternalValue, normalizeStatusForReport } from "./report-normalization-map.js";

export const NORMALIZED_PROFILER_VERSION = "normalized_profiler_section_789_artifact_split_v2";

export const NORMALIZED_SECTION_DEFINITIONS = Object.freeze([
  ["matter_overview", "Matter Overview"],
  ["executive_summary", "Executive Summary"],
  ["target_profile", "Target Profile"],
  ["product_activity_ip_profile", "Product, Activity & IP Profile"],
  ["data_provenance_controls", "Data Provenance & Controls"],
  ["legal_document_control_review", "Legal Document & Control Review"],
  ["exposure_summary_harm_mechanism_workpad_summary", "7A. Exposure Summary, Harm Mechanism & Workpad Summary"],
  ["exposure_diagnosis_table", "7B. Exposure Diagnosis Table"],
  ["exposure_control_discipline", "7C. Control & False-Positive Discipline"],
  ["review_route_action_plan", "8A. Review Route & Priority Action Plan"],
  ["control_handoff_readiness", "8B. Control Preservation & Handoff Readiness"],
  ["exposure_clarification_queue", "9A. Exposure Clarification & Missing Source Queue"],
  ["global_confirmation_queue", "9B. Global Confirmation & Data-Flow Queue"],
  ["methodology_limitations_review_notes", "Methodology, Limitations & Review Notes"],
  ["forensic_ledger_appendix", "Forensic Ledger Appendix"]
]);

export const NORMALIZED_SECTION_KEYS = Object.freeze(NORMALIZED_SECTION_DEFINITIONS.map(([key]) => key));
export const NORMALIZED_SECTION_ARTIFACT_NAMES = Object.freeze(NORMALIZED_SECTION_KEYS.map((key) => `normalized_section__${key}`));

const SUBCAT_LABELS = Object.freeze({
  CNS: "Consent & contract formation",
  LIA: "Liability, warranty, agent commitment, and product/service classification",
  HAL: "Hallucination, defamation, false output, and bot accountability",
  INF: "IP infringement, training data, RAG, takedown, and watermarking",
  PRV: "Privacy & data protection",
  BIO: "Biometric harvesting & consent",
  DEC: "Automated decision-making harms",
  HRM: "Direct user harm",
  FRD: "Fraud & misrepresentation",
  TRD: "Trading, pricing, and market manipulation"
});
const LEGACY_SUBCAT_NORMALIZATION = Object.freeze({ FIN: "LIA" });
const CONTROLLED_STATUSES = new Set(["CONTROLLED_BY_VISIBLE_CONTROL", "CONTROLLED_BY_EXCLUSION", "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION"]);
const HANDOFF_STATES = Object.freeze(["READY_FOR_REVIEW", "NEEDS_CONFIRMATION", "BLOCKED_PENDING_SOURCE", "BLOCKED_PENDING_CLIENT_FACT", "WATCHLIST_ONLY"]);

export function buildNormalizedProfilerOutput({ run = {}, artifacts = {} } = {}) {
  const base = buildBaseNormalizedProfilerOutput({ run, artifacts });
  const context = buildSection789Context({ run, artifacts, base });
  const baseSections = {
    matter_overview: base.normalized_section__matter_overview,
    executive_summary: base.normalized_section__executive_summary,
    target_profile: base.normalized_section__target_profile,
    product_activity_ip_profile: base.normalized_section__product_activity_ip_profile,
    data_provenance_controls: base.normalized_section__data_provenance_controls,
    legal_document_control_review: base.normalized_section__legal_document_control_review,
    methodology_limitations_review_notes: base.normalized_section__methodology_limitations_review_notes,
    forensic_ledger_appendix: base.normalized_section__forensic_ledger_appendix
  };

  const sections = {
    ...baseSections,
    exposure_summary_harm_mechanism_workpad_summary: buildSection7A(context),
    exposure_diagnosis_table: buildSection7B(context),
    exposure_control_discipline: buildSection7C(context),
    review_route_action_plan: buildSection8A(context),
    control_handoff_readiness: buildSection8B(context),
    exposure_clarification_queue: buildSection9A(context),
    global_confirmation_queue: buildSection9B(context)
  };

  const orderedSections = Object.fromEntries(NORMALIZED_SECTION_KEYS.map((key, index) => [key, normalizeSectionEnvelope(sections[key], key, index, context)]));
  const namedSections = Object.fromEntries(NORMALIZED_SECTION_KEYS.map((key) => [`normalized_section__${key}`, orderedSections[key]]));
  const normalized_report_manifest = buildNormalizedReportManifest({ context, sections: orderedSections });
  const vault_section_handoff = buildVaultSectionHandoff({ context, sections: orderedSections });
  const final_output_handoff = buildFinalOutputHandoff({ base, context, normalized_report_manifest, vault_section_handoff, sections: orderedSections });

  return {
    ...base,
    normalized_report_manifest,
    vault_section_handoff,
    final_output_handoff,
    ...namedSections
  };
}

function buildSection789Context({ run, artifacts, base }) {
  const profiles = {
    target_profile: unwrapArtifact(artifacts.target_profile, "target_profile"),
    target_feature_profile: unwrapArtifact(artifacts.target_feature_profile, "target_feature_profile"),
    legal_cartography_index: unwrapArtifact(artifacts.legal_cartography_index, "legal_cartography_index"),
    data_provenance_profile: unwrapArtifact(artifacts.data_provenance_profile, "data_provenance_profile"),
    integrated_dap_report: unwrapArtifact(artifacts.integrated_dap_report, "integrated_dap_report"),
    exposure_registry_triggered_profile: unwrapArtifact(artifacts.exposure_registry_triggered_profile, "exposure_registry_triggered_profile"),
    exposure_registry_controlled_profile: unwrapArtifact(artifacts.exposure_registry_controlled_profile, "exposure_registry_controlled_profile"),
    challenge_gate: unwrapArtifact(artifacts.challenge_gate, "challenge_gate")
  };
  const forensics = {
    exposure_registry_route_plan: unwrapArtifact(artifacts.exposure_registry_route_plan, "exposure_registry_route_plan"),
    exposure_registry_workpad_98: unwrapArtifact(artifacts.exposure_registry_workpad_98, "exposure_registry_workpad_98"),
    exposure_registry_profile_forensics: unwrapArtifact(artifacts.exposure_registry_profile_forensics, "exposure_registry_profile_forensics")
  };
  const rows = buildExposureRowSet({ profiles, forensics });
  const validation_status = normalizeStatusForReport(run.validation_status || profiles.challenge_gate?.status || profiles.challenge_gate?.lock_status || base.normalized_report_manifest?.validation_status || "LOCKED_WITH_LIMITATIONS");
  return { run, artifacts, base, profiles, forensics, rows, validation_status, generated_at: new Date().toISOString() };
}

function buildExposureRowSet({ profiles, forensics }) {
  const workpadRows = asArray(forensics.exposure_registry_workpad_98.registry_rows);
  const workpadById = new Map(workpadRows.map((row) => [String(row.Threat_ID || ""), row]).filter(([id]) => id));
  const triggeredRows = exposureRows(profiles.exposure_registry_triggered_profile, "triggered_rows").map((row) => normalizeExposureRow(row, { kind: "triggered", workpadRow: workpadById.get(String(row.Threat_ID || "")) }));
  const controlledRows = exposureRows(profiles.exposure_registry_controlled_profile, "controlled_rows").map((row) => normalizeExposureRow(row, { kind: "controlled", workpadRow: workpadById.get(String(row.Threat_ID || "")) }));
  const emittedRows = stableExposureSort([...triggeredRows, ...controlledRows]);
  const exposureIdByThreatId = new Map(emittedRows.map((row, index) => [row.Threat_ID, `EXP-${String(index + 1).padStart(3, "0")}`]));
  const withIdentity = (row) => ({ ...row, Exposure_ID: exposureIdByThreatId.get(row.Threat_ID) || "EXP-UNMAPPED" });
  const outTriggered = triggeredRows.map(withIdentity);
  const outControlled = controlledRows.map(withIdentity);
  const outEmitted = stableExposureSort([...outTriggered, ...outControlled]);
  const workpadOnlyRows = workpadRows.filter(isWorkpadOnlyRow).map((row) => normalizeWorkpadOnlyRow(row));
  return { triggeredRows: outTriggered, controlledRows: outControlled, emittedRows: outEmitted, workpadRows, workpadOnlyRows, exposureIdByThreatId };
}

function buildSection7A(context) {
  const { triggeredRows, controlledRows, workpadRows, workpadOnlyRows, emittedRows } = context.rows;
  const exposureSummary = {
    registry_workpad_rows: workpadRows.length,
    triggered_rows: triggeredRows.length,
    controlled_limited_rows: controlledRows.length,
    workpad_only_rows: workpadOnlyRows.length,
    highest_severity_tier: highestTier(emittedRows),
    highest_review_depth: highestDepth(emittedRows),
    public_source_limitation_count: emittedRows.filter(hasPublicEvidenceLimitation).length
  };
  return section(context, "exposure_summary_harm_mechanism_workpad_summary", [
    subsection("exposure_summary", "Exposure Summary", [field("exposure_summary", "Exposure summary", exposureSummary, "exposure_registry_workpad_98", "registry_rows")]),
    subsection("harm_mechanism_summary", "Harm Mechanism Summary", [field("harm_mechanism_summary", "Harm mechanism summary", harmMechanismSummary({ triggeredRows, controlledRows, workpadOnlyRows }), "exposure_registry_workpad_98", "registry_rows")]),
    subsection("workpad_only_summary", "Workpad-Only / Not Applicable Summary", [field("workpad_only_summary", "Workpad-only summary", workpadOnlySummary(workpadOnlyRows), "exposure_registry_workpad_98", "registry_rows")]),
    subsection("exposure_identity_index", "Exposure Identity Index", [field("exposure_identity_index", "Exposure identity index", emittedRows.map(identityOnly), "normalized_profiler", "section_789_identity_map")])
  ], "Macro view of M11 findings: counts, harm mechanism distribution, workpad-only routing, and stable exposure identity.");
}

function buildSection7B(context) {
  return section(context, "exposure_diagnosis_table", [
    subsection("exposure_diagnosis_table", "Exposure Diagnosis Table", [field("exposure_diagnosis_table", "Exposure diagnosis table", context.rows.emittedRows.map(diagnosisRow), "exposure_registry_triggered_profile + exposure_registry_controlled_profile", "triggered_rows + controlled_rows")])
  ], "What was found, why it routed, and what evidence/control basis supports the exposure status.");
}

function buildSection7C(context) {
  const rows = context.rows.emittedRows.filter((row) => row.kind === "controlled" || row.fp_mechanism || row.control_exclusion_evaluation || row.row_limitations);
  return section(context, "exposure_control_discipline", [
    subsection("control_discipline", "Control / Exclusion / False-Positive Discipline", [field("control_discipline", "Control discipline table", rows.map(controlDisciplineRow), "exposure_registry_controlled_profile + exposure_registry_triggered_profile", "controlled_rows + triggered_rows")])
  ], "How controlled, limited, excluded, or false-positive-sensitive rows were handled without turning controls into disconnected bullets.");
}

function buildSection8A(context) {
  return section(context, "review_route_action_plan", [
    subsection("review_route_summary", "Review Route Summary", [field("review_route_summary", "Review route summary", reviewRouteSummary(context.rows.emittedRows), "normalized_profiler", "section_8_review_route_summary")]),
    subsection("priority_action_matrix", "Priority Action Matrix", [field("priority_action_matrix", "Priority action matrix", context.rows.emittedRows.map(priorityActionRow), "exposure_registry_triggered_profile + exposure_registry_controlled_profile", "review_route + remediation + pain fields")])
  ], "Reviewer workflow: review routes, priority, consequence, action, and handoff state without repeating Section 7 proof text.");
}

function buildSection8B(context) {
  const readiness = handoffReadinessSummary(context.rows.emittedRows);
  return section(context, "control_handoff_readiness", [
    subsection("control_preservation_matrix", "Control Preservation / Verification Matrix", [field("control_preservation_matrix", "Control preservation matrix", context.rows.controlledRows.map(controlPreservationRow), "exposure_registry_controlled_profile", "controlled_rows")]),
    subsection("handoff_readiness_summary", "Handoff Readiness Summary", [field("handoff_readiness_summary", "Handoff readiness summary", readiness, "normalized_profiler", "section_8_handoff_state_derivation")])
  ], "Controlled-row actions and deterministic handoff readiness, separated from exposure diagnosis.");
}

function buildSection9A(context) {
  return section(context, "exposure_clarification_queue", [
    subsection("exposure_linked_clarification_questions", "Exposure-Linked Clarification Questions", [field("exposure_linked_clarification_questions", "Exposure-linked clarification questions", exposureClarificationQuestions(context.rows.emittedRows), "exposure_registry_workpad_98", "registry_rows.material_projection.row_limitations")]),
    subsection("missing_source_document_requests", "Missing Source / Document Requests", [field("missing_source_document_requests", "Missing source or document requests", missingSourceDocumentRequests(context), "legal_cartography_index + exposure_registry_workpad_98", "missing_limited_legal_governance_items + row_limitations")])
  ], "Only exposure-linked questions and missing source/document requests. No raw JSON confirmation rows.");
}

function buildSection9B(context) {
  return section(context, "global_confirmation_queue", [
    subsection("global_non_exposure_confirmations", "Global Non-Exposure Confirmations", [field("global_non_exposure_confirmations", "Global non-exposure confirmations", globalConfirmations(context), "target_profile + integrated_dap_report + normalized_profiler", "global_limitations")]),
    subsection("provider_dataflow_clarifications", "Provider / Data-Flow Clarifications", [field("provider_dataflow_clarifications", "Provider and data-flow clarifications", providerDataflowClarifications(context), "integrated_dap_report + data_provenance_profile", "integrated_table_rows + missing_proof_and_diligence_requests")])
  ], "Non-M11/global questions and provider/data-flow gaps that must not pollute the exposure queue.");
}

function diagnosisRow(row) {
  return {
    ...identityOnly(row),
    Archetype: normalizeInternalValue(row.Archetype, "archetype"),
    Surface: normalizeInternalValue(row.Surface, "surface"),
    Status: normalizeStatusForReport(row.evaluation_status || row.final_material_status),
    Target_Match: safeText(row.target_match, "Target match requires qualified review."),
    Basis_Proof: safeText(row.basis_proof, "Basis proof requires qualified review."),
    Evidence_Source: safeText(row.evidence_source_basis, "Evidence source basis not visible in normalized row."),
    Control_Exclusion_Basis: safeText(row.control_exclusion_evaluation, "Control or exclusion basis requires qualified review.")
  };
}

function controlDisciplineRow(row) {
  return {
    ...identityOnly(row),
    Status: normalizeStatusForReport(row.evaluation_status || row.final_material_status),
    FP_Mechanism: safeText(row.fp_mechanism, "False-positive mechanism not specified."),
    Control_Exclusion_Basis: safeText(row.control_exclusion_evaluation, "Control or exclusion basis requires qualified review."),
    Evidence_Source: safeText(row.evidence_source_basis, "Evidence source basis not visible in normalized row."),
    Limitation_Signal: safeText(row.row_limitations, "No row-specific limitation recorded.")
  };
}

function priorityActionRow(row) {
  return {
    ...identityOnly(row),
    Status: normalizeStatusForReport(row.evaluation_status || row.final_material_status),
    Priority: safeText(row.Pain_Tier, "Priority tier not specified"),
    Depth: safeText(row.Pain_Depth, "Review depth not specified"),
    Review_Route: reviewRouteLabel(row.review_route),
    Legal_Business_Consequence: safeText(row.Legal_Pain, "Legal/business consequence requires qualified review."),
    Recommended_Review_Action: safeText(row.remediation, "Reviewer should verify before downstream drafting."),
    Handoff_State: deriveHandoffState(row)
  };
}

function controlPreservationRow(row) {
  return {
    ...identityOnly(row),
    Controlled_Status: normalizeStatusForReport(row.evaluation_status || row.final_material_status),
    Preserve_Verify_Action: derivePreserveVerifyAction(row),
    Evidence_Status: deriveEvidenceStatus(row),
    Linked_Clarification: needsClarification(row) ? clarificationId(row) : ""
  };
}

function identityOnly(row) {
  return {
    Exposure_ID: row.Exposure_ID || "EXP-UNMAPPED",
    Threat_ID: safeText(row.Threat_ID, "Threat ID not specified"),
    Threat_Name: safeText(row.Threat_Name, "Threat name not specified"),
    Subcat: formatSubcat(row.Subcategory)
  };
}

function exposureClarificationQuestions(rowsIn) {
  return rowsIn.filter(needsClarification).map((row) => ({
    Clarification_ID: clarificationId(row),
    ...identityOnly(row),
    Question: buildExposureQuestion(row),
    Affected_Field: affectedField(row),
    Needed_For: reviewRouteLabel(row.review_route),
    Blocks_Handoff: deriveHandoffState(row).startsWith("BLOCKED") ? "Yes" : "No"
  }));
}

function missingSourceDocumentRequests(context) {
  const exposureRequests = context.rows.emittedRows.filter((row) => deriveHandoffState(row) === "BLOCKED_PENDING_SOURCE").map((row) => ({
    Request_ID: `DOCREQ-${row.Exposure_ID.replace(/^EXP-/, "")}`,
    Linked_Exposure_ID: row.Exposure_ID,
    Threat_ID: row.Threat_ID,
    Threat_Name: row.Threat_Name,
    Subcat: formatSubcat(row.Subcategory),
    Missing_Material: safeText(row.row_limitations || row.evidence_source_basis, "Source material needed to support or clear this exposure row."),
    Expected_Source_Location: "Public source, legal/governance document, product documentation, or reviewer-supplied source material.",
    Why_It_Matters: "Blocks reliance on the exposure row until source support is verified.",
    Blocks_Handoff: "Yes"
  }));
  const legalRequests = asArray(context.profiles.legal_cartography_index.missing_limited_legal_governance_items).map((item, index) => ({
    Request_ID: `DOCREQ-GLOBAL-${String(index + 1).padStart(3, "0")}`,
    Linked_Exposure_ID: "",
    Threat_ID: "",
    Threat_Name: "",
    Subcat: "",
    Missing_Material: describeReviewItem(item, "Missing or limited legal/governance material."),
    Expected_Source_Location: "Terms, privacy policy, DPA, trust/security page, subprocessor page, or other governance document.",
    Why_It_Matters: "Affects public-source reliance and local counsel review readiness.",
    Blocks_Handoff: "No"
  }));
  return [...exposureRequests, ...legalRequests];
}

function globalConfirmations(context) {
  const items = [];
  for (const item of asArray(context.profiles.target_profile.target_profile_limitations)) items.push({ Module: "M7", Field: "target_profile_limitations", item });
  for (const item of asArray(context.profiles.target_feature_profile.profile_level_limitations)) items.push({ Module: "M8", Field: "profile_level_limitations", item });
  for (const item of asArray(context.profiles.data_provenance_profile.missing_proof_and_diligence_requests)) items.push({ Module: "M10", Field: "missing_proof_and_diligence_requests", item });
  for (const item of asArray(context.profiles.integrated_dap_report.qualified_review_queue)) items.push({ Module: "DAP", Field: "qualified_review_queue", item });
  for (const item of asArray(context.profiles.integrated_dap_report.limitations)) items.push({ Module: "DAP", Field: "limitations", item });
  return items.map((entry, index) => ({
    Global_Ref: `GQ-${String(index + 1).padStart(3, "0")}`,
    Module: entry.Module,
    Field: entry.Field,
    Question: buildGlobalQuestion(entry.item),
    Downstream_Effect: "Reviewer confirmation is needed before treating this public-footprint signal as a relied-on drafting fact.",
    Blocks_Handoff: /block|missing|required|not visible|insufficient/i.test(describeReviewItem(entry.item, "")) ? "Yes" : "No"
  }));
}

function providerDataflowClarifications(context) {
  const dapRows = asArray(context.profiles.integrated_dap_report.integrated_table_rows);
  const proofRows = asArray(context.profiles.data_provenance_profile.missing_proof_and_diligence_requests);
  const rowsIn = [...dapRows, ...proofRows].filter((row) => /vendor|processor|provider|transfer|sharing|model|flow|processing|collection|retention|logging|subprocessor/i.test(describeReviewItem(row, "")));
  return rowsIn.map((row, index) => ({
    Clarification_ID: `DFQ-${String(index + 1).padStart(3, "0")}`,
    Exposure_ID: "",
    Threat_ID: "",
    Threat_Name: "",
    Subcat: "",
    Provider_Flow_Question: buildProviderQuestion(row),
    Evidence_Needed: describeReviewItem(row, "Provider or data-flow evidence needed."),
    Review_Route: "Privacy / data-governance review",
    Blocks_Handoff: /missing|required|not visible|insufficient|unknown/i.test(describeReviewItem(row, "")) ? "Yes" : "No"
  }));
}

function reviewRouteSummary(rowsIn) {
  const grouped = new Map();
  for (const row of rowsIn) {
    const route = reviewRouteLabel(row.review_route);
    if (!grouped.has(route)) grouped.set(route, []);
    grouped.get(route).push(row);
  }
  return [...grouped.entries()].map(([route, rows]) => ({
    Review_Route: route,
    Subcats_Covered: unique(rows.map((row) => formatSubcat(row.Subcategory))),
    Finding_Count: rows.length,
    Highest_Priority: highestTier(rows),
    Reviewer_Focus: reviewerFocusForRoute(route, rows)
  }));
}

function harmMechanismSummary({ triggeredRows, controlledRows, workpadOnlyRows }) {
  const codes = unique([...triggeredRows, ...controlledRows, ...workpadOnlyRows].map((row) => row.Subcategory || row.subcategory).filter(Boolean)).sort();
  return codes.map((code) => {
    const triggered = triggeredRows.filter((row) => row.Subcategory === code);
    const controlled = controlledRows.filter((row) => row.Subcategory === code);
    const workpad = workpadOnlyRows.filter((row) => row.Subcategory === code || row.subcategory === code);
    return {
      Subcat: formatSubcat(code),
      Harm_Mechanism: SUBCAT_LABELS[normalizeSubcatCode(code)] || "Unmapped harm mechanism",
      Triggered_Rows: triggered.length,
      Controlled_Rows: controlled.length,
      Workpad_Only_Rows: workpad.length,
      Highest_Tier: highestTier([...triggered, ...controlled])
    };
  });
}

function workpadOnlySummary(workpadOnlyRows) {
  const grouped = new Map();
  for (const row of workpadOnlyRows) {
    const key = `${row.Subcategory || "UNKNOWN"}::${row.route_reason || "WORKPAD_ONLY"}`;
    if (!grouped.has(key)) grouped.set(key, { Subcat: formatSubcat(row.Subcategory), Harm_Mechanism: SUBCAT_LABELS[normalizeSubcatCode(row.Subcategory)] || "Unmapped harm mechanism", Workpad_Only_Rows: 0, Route_Reason: safeText(row.route_reason, "Workpad only") });
    grouped.get(key).Workpad_Only_Rows += 1;
  }
  return [...grouped.values()];
}

function handoffReadinessSummary(rowsIn) {
  const counts = Object.fromEntries(HANDOFF_STATES.map((state) => [state, 0]));
  for (const row of rowsIn) counts[deriveHandoffState(row)] = (counts[deriveHandoffState(row)] || 0) + 1;
  return HANDOFF_STATES.map((state) => ({ Handoff_State: state, Count: counts[state] || 0, Meaning: handoffMeaning(state) }));
}

function normalizeExposureRow(row = {}, { kind, workpadRow } = {}) {
  const material = safeObject(row.material_projection || row);
  const threatId = safeText(material.Threat_ID || row.Threat_ID, "");
  const subcategory = normalizeSubcatCode(material.Subcategory || row.Subcategory || workpadRow?.Subcategory || workpadRow?.subcategory || deriveThreatIdPart(threatId, 1));
  return {
    ...material,
    kind,
    Threat_ID: threatId,
    Threat_Name: safeText(material.Threat_Name || row.Threat_Name || workpadRow?.Threat_Name, threatId || "Threat name not specified"),
    Subcategory: subcategory,
    registry_order: Number(workpadRow?.registry_order ?? row.registry_order ?? 9999),
    final_material_status: safeText(row.final_material_status || material.evaluation_status || workpadRow?.final_material_status, ""),
    evaluation_status: safeText(material.evaluation_status || row.evaluation_status || workpadRow?.final_material_status, ""),
    target_match: safeText(material.target_match || row.target_match, ""),
    basis_proof: safeText(material.basis_proof || row.basis_proof, ""),
    control_exclusion_evaluation: safeText(material.control_exclusion_evaluation || row.control_exclusion_evaluation, ""),
    evidence_source_basis: safeText(material.evidence_source_basis || row.evidence_source_basis, ""),
    fp_mechanism: safeText(material.fp_mechanism || row.fp_mechanism, ""),
    review_route: safeText(material.review_route || row.review_route, ""),
    row_limitations: safeText(material.row_limitations || row.row_limitations || workpadRow?.limitations, "")
  };
}

function normalizeWorkpadOnlyRow(row = {}) {
  const material = safeObject(row.material_projection || row);
  const threatId = safeText(row.Threat_ID || material.Threat_ID, "");
  return {
    Threat_ID: threatId,
    Threat_Name: safeText(row.Threat_Name || material.Threat_Name, threatId || "Threat name not specified"),
    Subcategory: normalizeSubcatCode(row.Subcategory || row.subcategory || material.Subcategory || deriveThreatIdPart(threatId, 1)),
    route_reason: safeText(row.route_reason, "WORKPAD_ONLY"),
    final_material_status: safeText(row.final_material_status, "WORKPAD_ONLY")
  };
}

function stableExposureSort(rowsIn) {
  return [...rowsIn].sort((a, b) => (a.registry_order ?? 9999) - (b.registry_order ?? 9999) || String(a.Threat_ID).localeCompare(String(b.Threat_ID)));
}

function isWorkpadOnlyRow(row = {}) {
  const status = String(row.final_material_status || row.workpad_status || "").toUpperCase();
  return status === "WORKPAD_ONLY" || !row.material_projection || String(row.route || "").includes("NOT_TRIGGERED");
}

function deriveHandoffState(row) {
  const status = String(row.evaluation_status || row.final_material_status || "").toUpperCase();
  const text = [row.row_limitations, row.evidence_source_basis, row.control_exclusion_evaluation].join(" ").toLowerCase();
  if (status.includes("PUBLIC_EVIDENCE_LIMITATION") || /missing|not visible|no public|insufficient|unable to confirm|source.+needed|limited evidence/.test(text)) return "BLOCKED_PENDING_SOURCE";
  if (/client|internal|private|customer supplied|not public/.test(text)) return "BLOCKED_PENDING_CLIENT_FACT";
  if (needsClarification(row)) return "NEEDS_CONFIRMATION";
  if (/watch|pending/i.test(row.Pain_Tier || row.evaluation_status || "")) return "WATCHLIST_ONLY";
  return "READY_FOR_REVIEW";
}

function needsClarification(row) {
  const text = [row.row_limitations, row.evidence_source_basis, row.control_exclusion_evaluation].join(" ");
  return Boolean(text.trim()) && /missing|not visible|unclear|limited|partial|confirm|unable|insufficient|silent|no public|verify/i.test(text);
}

function clarificationId(row) {
  const number = String(row.Exposure_ID || "EXP-000").replace(/^EXP-/, "") || "000";
  return `CQ-${number.padStart(3, "0")}`;
}

function affectedField(row) {
  if (/control|exclusion|visible control/i.test(row.row_limitations || row.control_exclusion_evaluation || "")) return "control_exclusion_evaluation / row_limitations";
  if (/source|evidence|missing|not visible|no public/i.test(row.row_limitations || row.evidence_source_basis || "")) return "evidence_source_basis / row_limitations";
  return "row_limitations";
}

function buildExposureQuestion(row) {
  const issue = safeText(row.row_limitations || row.control_exclusion_evaluation || row.evidence_source_basis, "the public-source limitation for this row");
  return `Please confirm the factual/source position for ${row.Threat_Name} (${formatSubcat(row.Subcategory)}): ${cleanSentence(issue)}`;
}

function buildGlobalQuestion(item) {
  return `Please confirm the non-exposure review point: ${cleanSentence(describeReviewItem(item, "global review point requires confirmation"))}`;
}

function buildProviderQuestion(item) {
  return `Please confirm the provider/data-flow position: ${cleanSentence(describeReviewItem(item, "provider or data-flow point requires confirmation"))}`;
}

function derivePreserveVerifyAction(row) {
  const basis = safeText(row.control_exclusion_evaluation || row.row_limitations, "visible control/exclusion/limitation");
  return `Preserve or verify the visible control position: ${cleanSentence(basis)}`;
}

function deriveEvidenceStatus(row) {
  const status = String(row.evaluation_status || row.final_material_status || "").toUpperCase();
  if (status === "CONTROLLED_BY_VISIBLE_CONTROL") return "Visible control recorded";
  if (status === "CONTROLLED_BY_EXCLUSION") return "Registry exclusion recorded";
  if (status === "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION") return "Public evidence limitation recorded";
  return normalizeStatusForReport(status || "LOCKED_WITH_LIMITATIONS");
}

function hasPublicEvidenceLimitation(row) {
  return deriveHandoffState(row) === "BLOCKED_PENDING_SOURCE" || String(row.evaluation_status || row.final_material_status || "").includes("PUBLIC_EVIDENCE_LIMITATION");
}

function reviewerFocusForRoute(route, rowsIn) {
  const subcats = unique(rowsIn.map((row) => normalizeSubcatCode(row.Subcategory)));
  if (/privacy|data/i.test(route)) return "Consent, biometrics, transfers, DPA/security, retention, and rights routes.";
  if (/product|governance|content|ip/i.test(route) || subcats.some((code) => ["CNS", "INF", "HAL"].includes(code))) return "Assent, IP/output posture, AI disclosures, takedown/content controls, and product claims.";
  if (/regulated|finance|market/i.test(route) || subcats.some((code) => ["FRD", "TRD"].includes(code))) return "Regulated claims, financial/market conduct, AI-washing, and substantiation review.";
  return "Liability allocation, warranty, agent authority, SLA, and product/service classification.";
}

function highestTier(rowsIn) {
  const order = ["T1", "T2", "T3", "T4", "T5"];
  const found = rowsIn.map((row) => String(row.Pain_Tier || "").toUpperCase()).filter(Boolean).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return found.find((tier) => order.includes(tier)) || "Not specified";
}

function highestDepth(rowsIn) {
  const order = ["Criminal", "Personal", "Corporate"];
  const values = rowsIn.map((row) => safeText(row.Pain_Depth, "")).filter(Boolean);
  return order.find((depth) => values.some((value) => value.toLowerCase() === depth.toLowerCase())) || values[0] || "Not specified";
}

function handoffMeaning(state) {
  return {
    READY_FOR_REVIEW: "Reviewer can proceed from the visible record, subject to qualified review before reliance.",
    NEEDS_CONFIRMATION: "Reviewer/client confirmation is needed before relying on the row.",
    BLOCKED_PENDING_SOURCE: "A missing or thin public source blocks reliance on the row.",
    BLOCKED_PENDING_CLIENT_FACT: "A private/internal fact is needed before reliance.",
    WATCHLIST_ONLY: "Monitor; not an immediate drafting blocker."
  }[state] || "Handoff state not specified.";
}

function formatSubcat(value) {
  const code = normalizeSubcatCode(value);
  return code ? `${code} — ${SUBCAT_LABELS[code] || "Unmapped harm mechanism"}` : "Subcat not specified";
}

function normalizeSubcatCode(value) {
  const raw = String(value || "").trim().toUpperCase();
  return LEGACY_SUBCAT_NORMALIZATION[raw] || raw;
}

function deriveThreatIdPart(threatId, index) {
  return String(threatId || "").split("_")[index] || "";
}

function describeReviewItem(item, fallback) {
  if (typeof item === "string") return safeText(item, fallback);
  const row = safeObject(item);
  return safeText(row.question || row.review_point || row.action || row.missing_material || row.material || row.field || row.status || row.reason || row.message || row.limitation || row.description, fallback);
}

function cleanSentence(value) {
  return safeText(value, "confirmation needed").replace(/\s+/g, " ").replace(/[{}[\]"]/g, "").trim();
}

function exposureRows(profile, key) {
  const o = safeObject(profile);
  return asArray(o[key] || o.rows || o.registry_rows);
}

function unwrapArtifact(value, key) {
  const object = safeObject(value);
  return safeObject(object[key] || object.artifact?.[key] || object);
}

function section(context, key, subsections, summary) {
  const defIndex = NORMALIZED_SECTION_KEYS.indexOf(key);
  const title = NORMALIZED_SECTION_DEFINITIONS[defIndex]?.[1] || key;
  return {
    section_id: key,
    artifact_name: `normalized_section__${key}`,
    section_title: title,
    section_order: defIndex + 1,
    section_status: context.validation_status,
    reviewer_summary: safeText(summary, "Section summary not specified"),
    subsections,
    section_limitations: [],
    source_artifacts_used: collectSourceArtifacts(subsections),
    normalization: {
      profiler_version: NORMALIZED_PROFILER_VERSION,
      normalization_map_version: NORMALIZATION_MAP_VERSION,
      section_789_artifact_split: true,
      business_category_removed_from_exposure_sections: true,
      exposure_identity_required: true,
      legal_conclusion_generated: false
    },
    vault_mapping: { eligible_for_vault: true, vault_category: key, requires_confirmation_before_assembly: true }
  };
}

function subsection(subsection_id, subsection_title, fields) {
  return { subsection_id, subsection_title, fields: asArray(fields) };
}

function field(field_id, label, value, source_artifact, source_path) {
  return {
    field_id,
    label: safeText(label, "Field"),
    value,
    source_artifact,
    source_path,
    evidence_refs: [],
    limitation: "",
    qualified_review_note: "Qualified reviewer should verify before reliance.",
    technical_refs: {}
  };
}

function normalizeSectionEnvelope(sectionValue, key, index, context) {
  const sectionObject = safeObject(sectionValue);
  return {
    ...sectionObject,
    section_id: key,
    artifact_name: `normalized_section__${key}`,
    section_title: NORMALIZED_SECTION_DEFINITIONS[index]?.[1] || sectionObject.section_title || key,
    section_order: index + 1,
    section_status: context.validation_status,
    display_section_status: sectionObject.display_section_status || sectionObject.section_status || context.validation_status,
    normalization: {
      ...(sectionObject.normalization || {}),
      profiler_version: NORMALIZED_PROFILER_VERSION,
      normalization_map_version: NORMALIZATION_MAP_VERSION
    }
  };
}

function buildNormalizedReportManifest({ context, sections }) {
  return {
    manifest_type: "normalized_report_manifest",
    profiler_version: NORMALIZED_PROFILER_VERSION,
    normalization_map_version: NORMALIZATION_MAP_VERSION,
    run_id: context.run.run_id || "UNKNOWN_RUN",
    target: context.run.target || hostFromUrl(context.run.root_url),
    target_url: context.run.root_url || context.run.target_url || context.run.target || "",
    generated_at: context.generated_at,
    validation_status: context.validation_status,
    section_order: NORMALIZED_SECTION_KEYS,
    section_artifacts: NORMALIZED_SECTION_KEYS.map((key) => ({ section_id: key, artifact_name: `normalized_section__${key}`, title: sections[key]?.section_title || key, status: sections[key]?.section_status || context.validation_status })),
    renderer_contract: { renderer_may_render: true, renderer_may_sort: false, renderer_may_filter_for_view: true, renderer_may_add_facts: false, renderer_may_change_statuses: false, renderer_may_generate_legal_advice: false, model_used_after_m12: false, section_789_artifact_split: true },
    vault_contract: { vault_may_prefill_review_ready_objects: true, vault_must_preserve_source_refs: true, vault_must_not_treat_public_signals_as_confirmed_private_facts: true, qualified_review_required_before_assembly_reliance: true }
  };
}

function buildVaultSectionHandoff({ context, sections }) {
  return {
    handoff_type: "vault_section_handoff",
    profiler_version: NORMALIZED_PROFILER_VERSION,
    run_id: context.run.run_id || "UNKNOWN_RUN",
    validation_status: context.validation_status,
    sections: NORMALIZED_SECTION_KEYS.map((key) => ({ section_id: key, artifact_name: `normalized_section__${key}`, section_title: sections[key]?.section_title || key, eligible_for_vault: sections[key]?.vault_mapping?.eligible_for_vault !== false, vault_category: sections[key]?.vault_mapping?.vault_category || key, requires_confirmation_before_assembly: true })),
    assembly_boundary: "Use section artifacts as Review-Ready support material only. Public-footprint facts require qualified-review confirmation before document assembly reliance."
  };
}

function buildFinalOutputHandoff({ base, context, normalized_report_manifest, vault_section_handoff, sections }) {
  const baseFinal = safeObject(base.final_output_handoff?.final_output_handoff || base.final_output_handoff);
  const normalized_sections = Object.fromEntries(NORMALIZED_SECTION_KEYS.map((key) => [key, sections[key]]));
  return {
    final_output_handoff: {
      ...baseFinal,
      validation_status: context.validation_status,
      normalized_report_manifest_ref: "normalized_report_manifest",
      vault_section_handoff_ref: "vault_section_handoff",
      section_artifacts: normalized_report_manifest.section_artifacts,
      normalized_report_manifest,
      normalized_sections,
      renderer_contract: normalized_report_manifest.renderer_contract,
      vault_contract: normalized_report_manifest.vault_contract,
      terminal_checks: { ...(baseFinal.terminal_checks || {}), normalized_section_count: NORMALIZED_SECTION_KEYS.length, normalized_sections_emitted: NORMALIZED_SECTION_KEYS.length, section_789_artifact_split: true, legacy_blob_replaced_by_section_artifacts: true },
      compiler_trace: { ...(baseFinal.compiler_trace || {}), compiler_version: "normalized_profiler_compiler_replacement_v5_section_789_artifact_split", deterministic_only: true, no_new_findings_created: true, no_row_re_evaluation: true, section_789_artifact_split: true, exposure_identity_required: true, threat_name_required: true, subcat_required: true, business_category_removed_from_sections_7_8_9: true, qualified_review_branch_separate: true },
      legacy_archive: baseFinal.legacy_archive || { profiles_combined: "ARCHIVED_LEGACY", forensics_combined: "ARCHIVED_LEGACY", old_compiler_blob: "REPLACED_BY_NORMALIZED_SECTION_ARTIFACTS", active_replacement: "normalized_report_manifest + normalized_section__*" },
      vault_section_handoff
    }
  };
}

function collectSourceArtifacts(subsections = []) {
  return unique(subsections.flatMap((sub) => asArray(sub.fields).map((f) => f.source_artifact).filter(Boolean)));
}

function hostFromUrl(value) {
  try {
    return new URL(String(value || "")).hostname.replace(/^www\./i, "");
  } catch {
    return safeText(value, "Target not specified");
  }
}
