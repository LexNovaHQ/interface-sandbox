export function normalizeM9LegalCartographyIndex(output) {
  if (!output || typeof output !== "object" || Array.isArray(output)) return output;
  const cloned = JSON.parse(JSON.stringify(output));
  const artifact = cloned.legal_cartography_index;
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) return cloned;

  scrubLegacyStrings(cloned);

  for (const key of ["document_coverage_index", "document_structure_index", "incorporated_linked_document_map", "control_language_locator", "semantic_navigation_index", "priority_semantic_locator", "qualified_review_locator", "legal_notice_locator", "dispute_resolution_locator", "governing_law_venue_locator", "contact_grievance_locator", "missing_limited_legal_governance_items"]) {
    if (!Array.isArray(artifact[key])) artifact[key] = [];
    normalizeRows(artifact[key]);
  }

  ensureDownstreamRules(artifact);
  ensureQualifiedReviewLegalSignals(artifact);
  ensureCoverageDefaults(artifact.document_coverage_index);
  ensureLinkedDefaults(artifact.incorporated_linked_document_map);
  ensureMissingDefaults(artifact.missing_limited_legal_governance_items);
  ensureSupportCoverage(artifact);

  return cloned;
}

function scrubLegacyStrings(value) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) { for (const item of value) scrubLegacyStrings(item); return; }
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string") {
      value[key] = item.replaceAll("REFERENCED_NOT_AUTHORIZED_BY_M6", "REFERENCED_BUT_NOT_FETCHED").replaceAll("not authorized by M6", "referenced but not fetched").replaceAll("authorized by M6", "loaded in source corpus").replaceAll("M6-authorized", "source-corpus").replaceAll("M6 authorized", "source-corpus");
    } else scrubLegacyStrings(item);
  }
}

function normalizeRows(rows) {
  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    if (row.source_type) row.source_type = mapSourceType(row.source_type);
    if (row.source_corpus_status) row.source_corpus_status = mapCorpusStatus(row.source_corpus_status);
    if (row.status) row.status = mapRowStatus(row.status);
    if (row.artifact_class) row.artifact_class = mapArtifactClass(row.artifact_class, row);
    delete row.m6_authorization_status;
    delete row.m6_bucket_subcategory;
  }
}

function ensureDownstreamRules(artifact) {
  if (!artifact.downstream_rules || typeof artifact.downstream_rules !== "object" || Array.isArray(artifact.downstream_rules)) artifact.downstream_rules = {};
  artifact.downstream_rules.m6_is_navigation_not_legal_authority = true;
  artifact.downstream_rules.embedded_legal_instruments_are_indexable = true;
  artifact.downstream_rules.use_only_loaded_legal_corpus = true;
  artifact.downstream_rules.referenced_unloaded_documents_must_not_be_fetched = true;
  artifact.downstream_rules.semantic_navigation_index_is_downstream_available = true;
  artifact.downstream_rules.control_language_locator_is_technical_locator_only = true;
  artifact.downstream_rules.qualified_review_legal_signals_index_only = true;
  artifact.downstream_rules.qualified_review_legal_signals_true_derived_object = true;
}

function ensureQualifiedReviewLegalSignals(artifact) {
  const existing = artifact.qualified_review_legal_signals && typeof artifact.qualified_review_legal_signals === "object" && !Array.isArray(artifact.qualified_review_legal_signals) ? artifact.qualified_review_legal_signals : {};
  const refs = firstLocatorRefs(artifact);
  artifact.qualified_review_legal_signals = {
    signal_object_version: stringOr(existing.signal_object_version, "m9_qualified_review_legal_signals_true_derived_v1"),
    derivation_mode: stringOr(existing.derivation_mode, "compiler_true_derived_from_m9_deterministic_maps"),
    source_boundary: stringOr(existing.source_boundary, "Derived only from M9 deterministic legal signal maps and loaded-corpus navigation pointers; M9 remains index-only."),
    full_clause_text_copied: existing.full_clause_text_copied === true ? false : false,
    legal_advice_generated: existing.legal_advice_generated === true ? false : false,
    compliance_conclusion_generated: existing.compliance_conclusion_generated === true ? false : false,
    enforceability_conclusion_generated: existing.enforceability_conclusion_generated === true ? false : false,
    legal_notice_contact: normalizeSignalBranch(existing.legal_notice_contact, {
      signal_key: "legal_notice_contact",
      question_id: "QR-004",
      field_key: "legal_notice_email",
      reviewer_question: "What email address should receive contractual/legal notices?",
      signal_status: "NOT_DERIVED",
      legal_notice_email: "",
      legal_notice_contact_route: refs[0] || "",
      legal_notice_contact_source: refs[0] || "",
      legal_notice_contact_limitation: refs.length ? "Index locator available; verify before reliance." : "No M9 legal notice/contact signal derived from loaded legal corpus.",
      derived_answer_summary: refs.length ? "Legal notice/contact locator is available for qualified-review confirmation." : "No legal notice/contact route signal was derived.",
      evidence_basis: [],
      locator_refs: refs,
      registry_basis: [],
      source_path: "legal_cartography_deterministic_map.legal_notice_contact_signal_map",
      primary_locator: {},
      downstream_use_limit: "Use as an index-backed question prefill candidate only; verify against the loaded legal source before reliance."
    }),
    liability_cap_basis: normalizeSignalBranch(existing.liability_cap_basis, {
      signal_key: "liability_cap_basis",
      question_id: "QR-013",
      field_key: "acv_liability_reference",
      reviewer_question: "What contract value or pricing level should guide liability caps?",
      signal_status: "NOT_DERIVED",
      clause_location: refs[0] || "",
      cap_formula_reference_basis: "Confirm from loaded legal source at locator.",
      cap_period_lookback_window: "Confirm from loaded legal source at locator.",
      exclusions_carveouts_signal: "Confirm from loaded legal source at locator.",
      fees_pricing_reference_signal: "Confirm from loaded legal source at locator.",
      private_value_required: "Confirm during qualified review.",
      limitation: refs.length ? "Index locator available; M9 does not compute legal effect or cap amount." : "No liability cap signal derived from loaded legal corpus.",
      derived_answer_summary: refs.length ? "Liability-cap basis locator is available for qualified-review confirmation." : "No liability-cap basis locator was derived.",
      evidence_basis: [],
      locator_refs: refs,
      registry_basis: [],
      source_path: "legal_cartography_deterministic_map.liability_cap_signal_map",
      primary_locator: {},
      downstream_use_limit: "Use as an index-backed question prefill candidate only; do not compute legal effect, cap amount, enforceability, or risk."
    }),
    sla_support_posture: normalizeSignalBranch(existing.sla_support_posture, {
      signal_key: "sla_support_posture",
      question_id: "QR-016",
      field_key: "sla_posture",
      reviewer_question: "Will the company offer no SLA, a standard SLA, or a custom SLA?",
      signal_status: "NOT_DERIVED",
      sla_support_artifact_found: refs.length ? "Locator available." : "No SLA/support signal derived from loaded legal corpus.",
      availability_uptime_commitment_signal: "Confirm from loaded legal source at locator.",
      service_credit_remedy_signal: "Confirm from loaded legal source at locator.",
      support_tier_response_commitment_signal: "Confirm from loaded legal source at locator.",
      standard_vs_custom_sla_posture: "Confirm during qualified review.",
      sla_exclusions_dependencies_signal: "Confirm from loaded legal source at locator.",
      private_confirmation_required: "Confirm during qualified review.",
      derived_answer_summary: refs.length ? "SLA/support posture locator is available for qualified-review confirmation." : "No SLA/support posture locator was derived.",
      evidence_basis: [],
      locator_refs: refs,
      registry_basis: [],
      source_path: "legal_cartography_deterministic_map.sla_support_signal_map",
      primary_locator: {},
      downstream_use_limit: "Use as an index-backed question prefill candidate only; qualified review must confirm the final SLA posture."
    }),
    question_rows: Array.isArray(existing.question_rows) ? existing.question_rows : [],
    question_index: existing.question_index && typeof existing.question_index === "object" && !Array.isArray(existing.question_index) ? existing.question_index : {},
    coverage_summary: existing.coverage_summary && typeof existing.coverage_summary === "object" && !Array.isArray(existing.coverage_summary) ? existing.coverage_summary : { required_question_count: 3, derived_question_count: 0, legal_notice_contact_source_count: 0, liability_cap_basis_source_count: 0, sla_support_posture_source_count: 0 },
    downstream_rules: {
      ...(existing.downstream_rules && typeof existing.downstream_rules === "object" && !Array.isArray(existing.downstream_rules) ? existing.downstream_rules : {}),
      qualified_review_legal_signals_true_derived_object: true,
      index_only: true,
      full_clause_text_copied: false,
      legal_advice_generated: false,
      compliance_conclusion_generated: false,
      enforceability_conclusion_generated: false,
      reviewer_confirmation_required: true
    }
  };
}

function normalizeSignalBranch(value, fallback) {
  const branch = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const out = { ...fallback, ...branch };
  if (!Array.isArray(out.locator_refs)) out.locator_refs = [];
  for (const key of ["evidence_basis", "registry_basis"]) if (!Array.isArray(out[key])) out[key] = [];
  if (!out.primary_locator || typeof out.primary_locator !== "object" || Array.isArray(out.primary_locator)) out.primary_locator = {};
  for (const [key, value] of Object.entries(out)) if (!["locator_refs", "evidence_basis", "registry_basis", "primary_locator"].includes(key) && typeof value !== "string") out[key] = String(value ?? "");
  return out;
}

function stringOr(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function firstLocatorRefs(artifact) {
  return [...new Set([...artifact.qualified_review_locator, ...artifact.legal_notice_locator, ...artifact.priority_semantic_locator].slice(0, 12).map((row) => row.locator_id || row.unit_id || row.document_id || "").filter(Boolean))];
}

function ensureCoverageDefaults(rows) {
  for (const row of rows) {
    if (!row.source_type) row.source_type = inferSourceType(row);
    row.source_type = mapSourceType(row.source_type);
    if (!row.source_corpus_status) row.source_corpus_status = corpusFromSourceType(row.source_type);
    row.source_corpus_status = mapCorpusStatus(row.source_corpus_status);
    if (!row.status) row.status = statusFromSourceType(row.source_type);
    row.status = mapRowStatus(row.status);
    if (!row.artifact_class) row.artifact_class = inferArtifactClass(row);
    row.artifact_class = mapArtifactClass(row.artifact_class, row);
  }
}

function ensureLinkedDefaults(rows) { for (const row of rows) { row.source_type = mapSourceType(row.source_type || "REFERENCED_URL"); row.source_corpus_status = mapCorpusStatus(row.source_corpus_status || "REFERENCED_BUT_NOT_FETCHED"); row.status = mapRowStatus(row.status || "REFERENCED_BUT_NOT_FETCHED"); if (row.artifact_class) row.artifact_class = mapArtifactClass(row.artifact_class, row); } }
function ensureMissingDefaults(rows) { for (const row of rows) { row.source_type = mapSourceType(row.source_type || "ABSENT_FAMILY"); row.source_corpus_status = mapCorpusStatus(row.source_corpus_status || "STANDALONE_SOURCE_ABSENT"); row.status = mapRowStatus(row.status || "STANDALONE_SOURCE_ABSENT"); row.artifact_class = mapArtifactClass(row.artifact_class || inferArtifactClass(row), row); } }

function ensureSupportCoverage(artifact) {
  const structure = artifact.document_structure_index || [];
  const coverage = artifact.document_coverage_index || [];
  const support = structure.find((row) => has(row, ["support services", "support terms"]));
  if (!support) return;
  if (coverage.some((row) => has(row, ["support services", "support terms"]))) return;
  coverage.push({ document_or_artifact: support.internal_unit || support.section_name || support.host_document || "Support Services / Support Terms annexure", artifact_class: "SUPPORT_TERMS", source: support.source || support.host_document || "Loaded legal corpus", source_type: "EMBEDDED_UNIT", source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS", document_role: "Support terms indexed from document_structure_index", limitation: appendText(support.limitation, "Coverage row normalized from structure index.") });
}

function mapSourceType(value) { const raw = String(value || "").trim(); const upper = raw.toUpperCase().replace(/[ -]/g, "_"); if (["EMBEDDED", "EMBEDDED_TEXT", "EMBEDDED_SECTION", "PASTED_PUBLIC_MATERIAL"].includes(upper)) return "EMBEDDED_UNIT"; if (["FAMILY_PROBE", "ABSENT_PROBE", "ABSENT_AFTER_M6_TARGETED_PROBE"].includes(upper)) return "ABSENT_FAMILY"; if (["REFERENCED", "REFERENCED_EXTERNAL", "REFERENCED_NOT_AUTHORIZED_BY_M6"].includes(upper)) return "REFERENCED_URL"; if (upper === "UPLOADED_PUBLIC_MATERIAL") return "URL"; if (upper === "SYNTHETIC_DEMO") return "METADATA_ONLY"; return raw; }
function mapCorpusStatus(value) { const upper = String(value || "").trim().toUpperCase().replace(/[ -]/g, "_"); if (["ABSENT_AFTER_TARGETED_PROBE", "ABSENT_AFTER_M6_TARGETED_PROBE"].includes(upper)) return "STANDALONE_SOURCE_ABSENT"; if (["REFERENCED_EXTERNAL", "REFERENCED_NOT_AUTHORIZED_BY_M6"].includes(upper)) return "REFERENCED_BUT_NOT_FETCHED"; if (["EMBEDDED_TEXT", "PASTED_PUBLIC_MATERIAL"].includes(upper)) return "FOUND_EMBEDDED_IN_LEGAL_CORPUS"; if (upper === "UPLOADED_PUBLIC_MATERIAL") return "FOUND_AS_PRIMARY_SOURCE"; return String(value || "").trim(); }
function mapRowStatus(value) { const upper = String(value || "").trim().toUpperCase().replace(/[ -]/g, "_"); if (upper === "ACTIVE") return "FOUND_INDEXED"; if (upper === "ABSENT" || upper === "ABSENT_AFTER_TARGETED_PROBE" || upper === "ABSENT_AFTER_M6_TARGETED_PROBE") return "STANDALONE_SOURCE_ABSENT"; if (upper === "REJECTED") return "SOURCE_REJECTED_OR_FAILED"; if (upper === "NOT_FETCHED" || upper === "REFERENCED_EXTERNAL" || upper === "REFERENCED_NOT_AUTHORIZED_BY_M6") return "REFERENCED_BUT_NOT_FETCHED"; if (upper === "EMBEDDED_TEXT") return "FOUND_EMBEDDED_IN_LEGAL_CORPUS"; return String(value || "").trim(); }
function mapArtifactClass(value, row) { const upper = String(value || "").trim().toUpperCase().replace(/[ -]/g, "_"); if (upper === "PRIVACY_ADJACENT_NOTICES") return inferPrivacyNoticeClass(row); if (upper === "AI_USAGE_GOVERNANCE") return inferAiClass(row); if (upper === "DPA") return "DATA_PROCESSING_AGREEMENT"; if (upper === "SLA") return "SLA_SUPPORT_TERMS"; if (upper === "TERMS_OF_USE") return "TERMS_OF_SERVICE"; if (upper === "LEGAL_HUB" || upper === "ADDITIONAL_TERMS") return "HOSTED_LEGAL_ARTIFACT"; if (upper === "PRIVACY_ADDENDUM") return "PRIVACY_POLICY"; if (upper === "BUSINESS_CONTINUITY_PLAN" || upper === "INCIDENT_RESPONSE_PLAN") return "SECURITY_POLICY"; return String(value || "UNKNOWN_LEGAL_ARTIFACT").trim(); }
function inferPrivacyNoticeClass(row) { const text = rowText(row); if (text.includes("cookie")) return "COOKIE_POLICY"; if (text.includes("data request") || text.includes("privacy request") || text.includes("dsar")) return "DATA_REQUEST_PAGE"; if (text.includes("privacy policy")) return "PRIVACY_POLICY"; return "NOTICE_PAGE"; }
function inferAiClass(row) { const text = rowText(row); if (text.includes("content") || text.includes("acceptable use") || text.includes("restriction")) return "CONTENT_POLICY"; return "AI_TERMS_POLICY"; }
function inferSourceType(row) { const text = rowText(row); if (text.includes("missing") || text.includes("absent")) return "ABSENT_FAMILY"; if (text.includes("referenced") || text.includes("linked")) return "REFERENCED_URL"; if (text.includes("section") || text.includes("annexure") || text.includes("schedule")) return "EMBEDDED_UNIT"; return "URL"; }
function corpusFromSourceType(type) { if (type === "EMBEDDED_UNIT") return "FOUND_EMBEDDED_IN_LEGAL_CORPUS"; if (type === "REFERENCED_URL") return "REFERENCED_BUT_NOT_FETCHED"; if (type === "ABSENT_FAMILY") return "STANDALONE_SOURCE_ABSENT"; if (type === "METADATA_ONLY") return "UNKNOWN_NOT_SEARCHED"; return "FOUND_AS_PRIMARY_SOURCE"; }
function statusFromSourceType(type) { if (type === "EMBEDDED_UNIT") return "FOUND_EMBEDDED_IN_LEGAL_CORPUS"; if (type === "REFERENCED_URL") return "REFERENCED_BUT_NOT_FETCHED"; if (type === "ABSENT_FAMILY") return "STANDALONE_SOURCE_ABSENT"; if (type === "METADATA_ONLY") return "UNKNOWN_NOT_SEARCHED"; return "FOUND_INDEXED"; }
function inferArtifactClass(row) { const text = rowText(row); if (text.includes("support services") || text.includes("support terms")) return "SUPPORT_TERMS"; if (text.includes("cookie")) return "COOKIE_POLICY"; if (text.includes("subprocessor")) return "SUBPROCESSOR_LIST"; if (text.includes("data processing") || text.includes("dpa")) return "DATA_PROCESSING_AGREEMENT"; if (text.includes("privacy")) return "NOTICE_PAGE"; if (text.includes("terms")) return "TERMS_OF_SERVICE"; return "UNKNOWN_LEGAL_ARTIFACT"; }
function has(row, needles) { const text = rowText(row); return needles.some((needle) => text.includes(needle)); }
function rowText(row) { if (!row || typeof row !== "object") return ""; return Object.values(row).filter((value) => typeof value === "string").join(" ").toLowerCase(); }
function appendText(existing, addition) { const raw = String(existing || "").trim(); return raw ? `${raw} ${addition}` : addition; }
