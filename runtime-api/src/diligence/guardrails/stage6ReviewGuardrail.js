import {
  STAGE6_BASIS_CODES,
  STAGE6_COMPONENTS,
  STAGE6_CONTROL_FAMILIES,
  STAGE6_CONTROL_SIGNALS,
  STAGE6_DOCUMENT_TYPES,
  STAGE6_LEGAL_UNIT_TYPES,
  STAGE6_REVIEW_VERSION,
  STAGE6_STAGE_ROLE
} from "../stage6CanonicalVocabulary.js";
import {
  stage6AAdmissionDecision,
  stage6ASourceRecordRef
} from "../stage6aLegalSourceAdmission.js";
import { evaluateStage6AQualityExpectations } from "../stage6aSemanticQualityExpectations.js";
import { evaluateStage6BQualityExpectations } from "../stage6bSemanticQualityExpectations.js";

const RETIRED_KEYS = new Set([
  "legal_stack_review_version",
  "legal_stack",
  "document_stack_redline",
  "document_stack_synthesis",
  "legal_stack_assessment",
  "doc_id",
  "doc_type",
  "doc_family",
  "doc_title",
  "section_id",
  "section_path",
  "heading_text",
  "heading_level",
  "structural_zone",
  "document_section",
  "control_topics_detected",
  "feature_to_document_section_index",
  "document_source_locator_index",
  "flow_id",
  "profile_summary_signals"
]);

const RETIRED_VALUES = new Set([
  "source_text_classification",
  "stage6_section_ref",
  "stage6_legal_section_ref",
  "document_relationship_signal",
  "feature_control_alignment",
  "model_overlay",
  "heading_classification",
  "feature_without_control_section",
  "doc_without_required_section",
  "conflicting_document_signal",
  "missing_core_document",
  "missing_supplemental_document",
  "control_signal_unclear",
  "footer_notice",
  "banner_notice",
  "modal_notice",
  "faq",
  "micro_section",
  "table_of_contents_row",
  "page_header",
  "page_footer"
]);

function arr(v) { return Array.isArray(v) ? v : []; }
function obj(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
function err(code, path, message, params = {}) { return { keyword: code, code, severity: "critical", instancePath: path, schemaPath: "#/stage6ReviewGuardrail", message, params }; }
function warn(code, path, message, params = {}) { return { keyword: code, code, severity: "warning", instancePath: path, schemaPath: "#/stage6ReviewGuardrail", message, params }; }
function rep(code, path, message, params = {}) { return { keyword: code, code, severity: "repairable", instancePath: path, schemaPath: "#/stage6ReviewGuardrail", message, params }; }
function walk(v, cb, p = "") { if (!v || typeof v !== "object") return; if (Array.isArray(v)) return v.forEach((x, i) => walk(x, cb, `${p}/${i}`)); for (const [k, x] of Object.entries(v)) { const next = `${p}/${k}`; cb(k, x, next); walk(x, cb, next); } }
function ids(rows, key) { return new Set(arr(rows).map((r) => r?.[key]).filter(Boolean)); }
function sourceRecords(input = {}) { return arr(input?.source_bundle?.raw_footprint?.source_records).concat(arr(input?.source_bundle?.evidence_buffer)); }
function textOf(record = {}) { return [record.clean_text_lossless, record.clean_text, record.text?.clean_text_lossless, record.text, record.body, record.extracted_text].filter(Boolean).join(" ").trim(); }
function hasLegalSources(input = {}) { return sourceRecords(input).some((record) => stage6AAdmissionDecision(record).admitted === true); }
function hasUsableLegalSources(input = {}) { return sourceRecords(input).some((record) => stage6AAdmissionDecision(record).admitted === true && textOf(record).length >= 80); }
function admissionBySourceRef(input = {}) {
  const map = new Map();
  sourceRecords(input).forEach((record, index) => map.set(stage6ASourceRecordRef(record, index), stage6AAdmissionDecision(record)));
  return map;
}
function checkEnum(values, allowed, path, warnings) { const set = new Set(allowed); arr(values).forEach((v, i) => { if (!set.has(v)) warnings.push(warn("STAGE6_ENUM_DRIFT_WARNING", `${path}/${i}`, `Non-canonical enum value passed as warning: ${v}`, { value: v })); }); }
function checkIdArrayRefs(values, allowedIds, path, warnings, code, message) { arr(values).forEach((value, index) => { if (!allowedIds.has(value)) warnings.push(warn(code, `${path}/${index}`, message, { value })); }); }
function stage5ProvenanceCount(input = {}) { const p = input?.target_feature_profile || input?.feature_profile_v2 || {}; if (Array.isArray(p.data_provenance_map)) return p.data_provenance_map.length; return arr(p.feature_inventory).reduce((n, f) => n + arr(f?.data_provenance).length, 0); }
function stage5FeatureCount(input = {}) { const p = input?.target_feature_profile || input?.feature_profile_v2 || {}; return arr(p.feature_inventory).length; }
function pushQualityIssues(qualityIssues = [], warnings, repairs, critical) {
  for (const issue of arr(qualityIssues)) {
    if (issue?.severity === "critical") critical.push(err(issue.code, issue.path || "/", issue.message || issue.code, issue.params || {}));
    else if (issue?.severity === "repairable") repairs.push(rep(issue.code, issue.path || "/", issue.message || issue.code, issue.params || {}));
    else warnings.push(warn(issue.code, issue.path || "/", issue.message || issue.code, issue.params || {}));
  }
}

export function validateStage6ReviewGuardrail(stage6Review = {}, { input = {}, stageId = null, semanticModelAttempted = null } = {}) {
  const critical = [];
  const warnings = [];
  const repairs = [];
  const metrics = { stage_id: stageId, stage6_component: stage6Review?.stage6_component || null };

  if (stage6Review?.stage6_review_version !== STAGE6_REVIEW_VERSION) critical.push(err("STAGE6_SCHEMA_INVALID", "/stage6_review_version", "Invalid Stage 6 version."));
  if (!STAGE6_COMPONENTS.includes(stage6Review?.stage6_component)) critical.push(err("STAGE6_UNKNOWN_COMPONENT", "/stage6_component", "Unknown Stage 6 component."));
  if (stage6Review?.stage_role !== STAGE6_STAGE_ROLE) critical.push(err("STAGE6_SCHEMA_INVALID", "/stage_role", "Invalid Stage 6 role."));

  walk(stage6Review, (key, value, path) => {
    if (RETIRED_KEYS.has(key)) critical.push(err("STAGE6_LEGACY_FIELD_PRESENT", path, `Retired Stage 6 key present: ${key}`, { key }));
    if (typeof value === "string" && RETIRED_VALUES.has(value)) critical.push(err("STAGE6_RETIRED_TERM_PRESENT", path, `Retired Stage 6 value present: ${value}`, { value }));
    if (["quote", "evidence_quote", "excerpt_text", "html", "report_data", "vault_prefill_suggestions", "vault_confirmation_questions"].includes(key)) critical.push(err("STAGE6_RETIRED_TERM_PRESENT", path, `Stage 6 output cannot contain ${key}.", { key }));
  });

  const component = stage6Review?.stage6_component;
  const has6A = Object.prototype.hasOwnProperty.call(obj(stage6Review), "legal_document_cartography");
  const has6B = Object.prototype.hasOwnProperty.call(obj(stage6Review), "data_provenance_profile");
  if (component === "stage6a_legal_document_cartography" && has6B) critical.push(err("STAGE6_COMPONENT_CROSS_CONTAMINATION", "/data_provenance_profile", "6A output must not contain 6B profile."));
  if (component === "stage6b_data_provenance" && has6A) critical.push(err("STAGE6_COMPONENT_CROSS_CONTAMINATION", "/legal_document_cartography", "6B output must not contain 6A profile."));
  if (component === "stage6_integrated_handoff" && (!has6A || !has6B)) critical.push(err("STAGE6_COMPONENT_CROSS_CONTAMINATION", "/", "Integrated output must contain both 6A and 6B profiles.", { has6A, has6B }));

  if (component === "stage6a_legal_document_cartography" || component === "stage6_integrated_handoff") {
    const c = obj(stage6Review.legal_document_cartography);
    const inventory = arr(c.legal_document_inventory);
    const units = arr(c.legal_document_index);
    const controls = arr(c.document_control_signal_map);
    const nav = obj(stage6Review.stage7_navigation_index);
    const legalUnitIds = ids(units, "legal_unit_id");
    const documentIds = ids(inventory, "document_id");
    const admissionMap = admissionBySourceRef(input);
    Object.assign(metrics, { legal_document_inventory_count: inventory.length, legal_document_index_count: units.length, document_control_signal_map_count: controls.length, feature_to_legal_unit_index_count: arr(nav.feature_to_legal_unit_index).length, legal_unit_source_locator_index_count: arr(nav.legal_unit_source_locator_index).length });
    if (hasUsableLegalSources(input) && inventory.length === 0) critical.push(err("STAGE6_EMPTY_6A_WITH_USABLE_LEGAL_TEXT", "/legal_document_cartography/legal_document_inventory", "Usable admitted legal/governance source text exists but 6A inventory is empty."));
    else if (hasLegalSources(input) && inventory.length === 0) warnings.push(warn("STAGE6_THIN_LEGAL_SOURCE_WARNING", "/legal_document_cartography/legal_document_inventory", "Admitted legal/governance source URL/title exists but no usable legal text was mapped; passed as warning."));
    if (inventory.length && units.length === 0) critical.push(err("STAGE6_MISSING_REQUIRED_INDEX", "/legal_document_cartography/legal_document_index", "Legal docs exist but macro legal unit index is empty."));
    if (units.length && arr(nav.legal_unit_source_locator_index).length === 0) critical.push(err("STAGE6_MISSING_REQUIRED_INDEX", "/stage7_navigation_index/legal_unit_source_locator_index", "Legal units exist but locator index is empty."));
    if (inventory.length && controls.length === 0) repairs.push(rep("STAGE6_CONTROL_MAP_EMPTY_REPAIR_REQUIRED", "/legal_document_cartography/document_control_signal_map", "Legal docs exist but no control signal map was emitted; Stage 6A semantic derivation should classify visible/partial/absent controls."));
    if (stage5FeatureCount(input) && inventory.length && arr(nav.feature_to_legal_unit_index).length === 0) repairs.push(rep("STAGE6_FEATURE_LEGAL_INDEX_EMPTY_REPAIR_REQUIRED", "/stage7_navigation_index/feature_to_legal_unit_index", "Stage 5 features exist but feature/legal-unit index is empty; Stage 6A semantic derivation should map broad legal units to affected features where supported."));
    inventory.forEach((r, i) => {
      if (!STAGE6_DOCUMENT_TYPES.includes(r?.document_type)) warnings.push(warn("STAGE6_ENUM_DRIFT_WARNING", `/legal_document_cartography/legal_document_inventory/${i}/document_type`, "Invalid document_type passed as warning.", { value: r?.document_type }));
      const decision = admissionMap.get(r?.source_record_ref);
      if (decision && decision.admitted !== true) critical.push(err("STAGE6A_NON_LEGAL_SOURCE_ADMITTED", `/legal_document_cartography/legal_document_inventory/${i}/source_record_ref`, "6A inventory contains a source that fails strict legal/governance admission.", { source_record_ref: r?.source_record_ref, source_family: decision.source_family, admission_reason: decision.admission_reason, locator_document_type: decision.locator_document_type }));
    });
    units.forEach((r, i) => { if (!STAGE6_LEGAL_UNIT_TYPES.includes(r?.legal_unit_type) || RETIRED_VALUES.has(r?.legal_unit_type)) critical.push(err("STAGE6_MICRO_LEGAL_UNIT_PRESENT", `/legal_document_cartography/legal_document_index/${i}/legal_unit_type`, "Macro legal units only.")); if (!documentIds.has(r?.document_id)) warnings.push(warn("STAGE6_UNKNOWN_DOCUMENT_REF_WARNING", `/legal_document_cartography/legal_document_index/${i}/document_id`, "Unknown document_id ref passed as warning.")); checkEnum(r?.control_families_detected, STAGE6_CONTROL_FAMILIES, `/legal_document_cartography/legal_document_index/${i}/control_families_detected`, warnings); checkEnum(r?.basis_codes, STAGE6_BASIS_CODES, `/legal_document_cartography/legal_document_index/${i}/basis_codes`, warnings); });
    controls.forEach((r, i) => { if (!documentIds.has(r?.document_id)) warnings.push(warn("STAGE6_UNKNOWN_DOCUMENT_REF_WARNING", `/legal_document_cartography/document_control_signal_map/${i}/document_id`, "Unknown document_id ref passed as warning.")); if (r?.legal_unit_id && !legalUnitIds.has(r.legal_unit_id)) warnings.push(warn("STAGE6_UNKNOWN_LEGAL_UNIT_REF_WARNING", `/legal_document_cartography/document_control_signal_map/${i}/legal_unit_id`, "Unknown legal_unit_id ref passed as warning.")); if (!STAGE6_CONTROL_FAMILIES.includes(r?.control_family)) warnings.push(warn("STAGE6_ENUM_DRIFT_WARNING", `/legal_document_cartography/document_control_signal_map/${i}/control_family`, "Invalid control_family passed as warning.")); if (!STAGE6_CONTROL_SIGNALS.includes(r?.control_signal)) warnings.push(warn("STAGE6_ENUM_DRIFT_WARNING", `/legal_document_cartography/document_control_signal_map/${i}/control_signal`, "Invalid control_signal passed as warning.")); checkEnum(r?.basis_codes, STAGE6_BASIS_CODES, `/legal_document_cartography/document_control_signal_map/${i}/basis_codes`, warnings); });
    if (inventory.length > 1 && arr(c.document_relationship_map).length === 0) warnings.push(warn("STAGE6_ZERO_RELATIONSHIP_WARNING", "/legal_document_cartography/document_relationship_map", "Multiple legal documents exist but no relationships were emitted."));
    pushQualityIssues(evaluateStage6AQualityExpectations(stage6Review, { input, semanticModelAttempted }), warnings, repairs, critical);
  }

  if (component === "stage6b_data_provenance" || component === "stage6_integrated_handoff") {
    const p = obj(stage6Review.data_provenance_profile);
    const rows = arr(p.data_flow_profile);
    const nav = obj(stage6Review.stage7_navigation_index);
    const flowIds = ids(rows, "data_flow_id");
    Object.assign(metrics, { stage5_data_provenance_seed_count: stage5ProvenanceCount(input), data_flow_profile_count: rows.length, feature_to_data_flow_index_count: arr(nav.feature_to_data_flow_index).length, data_signal_index_count: arr(nav.data_signal_index).length });
    if (stage5ProvenanceCount(input) > 0 && rows.length === 0) critical.push(err("STAGE6_EMPTY_6B_WITH_PROVENANCE_SEEDS", "/data_provenance_profile/data_flow_profile", "Stage 5 provenance exists but 6B data_flow_profile is empty."));
    if (rows.length && arr(nav.feature_to_data_flow_index).length === 0) critical.push(err("STAGE6_MISSING_REQUIRED_INDEX", "/stage7_navigation_index/feature_to_data_flow_index", "Data flows exist but feature/data-flow index is empty."));
    if (rows.length && arr(nav.data_signal_index).length === 0) critical.push(err("STAGE6_MISSING_REQUIRED_INDEX", "/stage7_navigation_index/data_signal_index", "Data flows exist but data signal index is empty."));
    rows.forEach((r, i) => checkEnum(r?.basis_codes, STAGE6_BASIS_CODES, `/data_provenance_profile/data_flow_profile/${i}/basis_codes`, warnings));
    arr(nav.feature_to_data_flow_index).forEach((r, i) => checkIdArrayRefs(r?.data_flow_ids, flowIds, `/stage7_navigation_index/feature_to_data_flow_index/${i}/data_flow_ids`, warnings, "STAGE6_UNKNOWN_DATA_FLOW_REF_WARNING", "Unknown data_flow_id ref passed as warning."));
    arr(nav.data_signal_index).forEach((r, i) => checkIdArrayRefs(r?.data_flow_ids, flowIds, `/stage7_navigation_index/data_signal_index/${i}/data_flow_ids`, warnings, "STAGE6_UNKNOWN_DATA_FLOW_REF_WARNING", "Unknown data_flow_id ref passed as warning."));
    pushQualityIssues(evaluateStage6BQualityExpectations(stage6Review, { input, semanticModelAttempted }), warnings, repairs, critical);
  }

  if (semanticModelAttempted === false) warnings.push(warn("STAGE6_SEMANTIC_MODEL_SKIPPED_WARNING", "/", "Semantic model was skipped; deterministic Stage 6 path passed only.", { stageId }));

  return { ok: critical.length === 0, severity: critical.length ? "critical" : repairs.length ? "repair" : warnings.length ? "warning" : "pass", validation_mode: "stage6_review_runtime_guardrails", errors: critical, critical, repairs, warnings, metrics, repaired_output: stage6Review };
}

export const stage6ReviewGuardrailInternals = { RETIRED_KEYS, RETIRED_VALUES, hasLegalSources, hasUsableLegalSources, stage5ProvenanceCount, stage5FeatureCount };
