const runId = queryParam("run_id");
const LOCKED_RENDERER_SOURCE = "report_manifest_clean_profiles";
const DECK_PAGE_SIZE = 5;
const EXPECTED_SECTION_IDS = Object.freeze(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]);

const ARCHETYPE_LABELS = Object.freeze({
  UNI: "Universal review item",
  DOE: "Decisioning / evaluation activity",
  JDG: "Judgment or scoring activity",
  CMP: "Comparison / ranking activity",
  CRT: "Content creation or generation activity",
  RDR: "Retrieval, data reading, or data access activity",
  ORC: "Orchestration / workflow automation activity",
  TRN: "Training, tuning, or model-improvement activity",
  SHD: "Sharing, disclosure, or publication activity",
  OPT: "Optimization or recommendation activity",
  MOV: "Movement, transfer, or physical-world effect activity"
});

const SUBCATEGORY_LABELS = Object.freeze({
  CNS: "Consent, notice, and user authorization",
  CRN: "Consent, notice, and routing",
  LIA: "Liability and responsibility allocation",
  HAL: "Accuracy, reliance, and hallucination controls",
  INF: "IP, content, and information rights",
  PRV: "Privacy and data protection",
  BIO: "Biometric, voice, or identity signals",
  DEC: "Automated decisioning and human review",
  HRM: "Human resources, employment, or minors-sensitive context",
  FRD: "Fraud, authenticity, or synthetic media",
  TRD: "Trading, transaction, or financial decision context"
});

const SURFACE_LABELS = Object.freeze({
  "Consumer-Public": "Consumer/public-facing context",
  "Enterprise-Private": "Enterprise/private customer context",
  PII: "Personal data context",
  Employment: "Employment/workplace context",
  "Sensitive/Biometric": "Sensitive or biometric data context",
  Financial: "Financial data or financial decision context",
  "Content&IP": "Content, copyright, or IP context",
  "Safety&Physical": "Safety or physical-world impact context",
  Infrastructure: "Infrastructure, security, or operational dependency context",
  Minors: "Children/minors context"
});

const STATUS_LABELS = Object.freeze({
  PASS: "Pass",
  PASS_WITH_LIMITATION: "Pass with limitation",
  LOCKED: "Completed",
  LOCKED_WITH_LIMITATIONS: "Completed with limitations",
  "LOCKED WITH LIMITATIONS": "Completed with limitations",
  "Locked with limitations": "Completed with limitations",
  REPAIR_REQUIRED: "Needs repair before reliance",
  CONTROLLED_FAILURE: "Controlled failure",
  TRIGGERED: "Visible exposure signal",
  CONTROLLED: "Visible control or limitation signal",
  CONTROLLED_BY_VISIBLE_CONTROL: "Visible control reduces exposure",
  CONTROLLED_BY_EXCLUSION: "Registry exclusion applied",
  CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION: "Public evidence limitation",
  SUPPORTED_EXPOSURE_SIGNAL: "Visible exposure signal",
  SUPPORTED_CONTROL_PRESENT: "Visible control language found",
  PARTIAL_OR_WEAK_SIGNAL: "Partial or unclear public signal",
  CONFLICTING_SIGNALS: "Conflicting public signals",
  INSUFFICIENT_EVIDENCE: "Insufficient public evidence",
  NOT_VISIBLE_AFTER_TARGETED_SEARCH: "Not visible in reviewed public materials",
  ACCESS_FAILED: "Source route could not be accessed",
  NOT_TRIGGERED: "Registry condition not triggered",
  NOT_APPLICABLE_CONTEXTUAL: "Not applicable on current public context",
  NOT_APPLICABLE: "Not applicable on current public context",
  REQUIRES_QUALIFIED_REVIEW: "Needs qualified review",
  VISIBLE_CONTROL_PRESENT: "Visible control language found",
  VISIBLE_DATA_PROCESSING_NO_CONTROL_FOUND: "Visible data processing signal; no matching public control found",
  VISIBLE_BUT_CONTROL_WEAK_OR_UNCLEAR: "Visible but control language is weak or unclear",
  UNKNOWN_NOT_SEARCHED: "Not searched in public materials",
  FIELD_LIMITED: "Limited public signal",
  FIELD_NOT_PUBLIC: "Not visible in reviewed public materials",
  FIELD_CONFLICTED: "Conflicting public signals",
  FIELD_NOT_FOUND: "Not visible in reviewed public materials",
  NOT_FOUND: "Not visible in reviewed public materials",
  NOT_PUBLIC: "Not visible in reviewed public materials",
  ABSENT: "Not visible in reviewed public materials",
  MISSING: "Not visible in reviewed public materials",
  FOUND_INDEXED: "Found in reviewed public materials",
  FOUND_AS_PRIMARY_SOURCE: "Found as primary source",
  FOUND_EMBEDDED_IN_LEGAL_CORPUS: "Found inside reviewed legal materials",
  REFERENCED_BUT_NOT_FETCHED: "Referenced but not fetched",
  SOURCE_REJECTED_OR_FAILED: "Source rejected or failed",
  STANDALONE_SOURCE_ABSENT: "Standalone source not found"
});

const REVIEW_ROUTE_LABELS = Object.freeze({
  PRIVACY: "Privacy / data protection review needed",
  SECURITY: "Security controls review needed",
  IP: "IP / content rights review needed",
  CONTENT: "IP / content rights review needed",
  VENDOR: "Vendor / subprocessor flow-down review needed",
  SUBPROCESSOR: "Vendor / subprocessor flow-down review needed",
  AI: "AI governance / human-review route",
  GOVERNANCE: "AI governance / human-review route",
  HUMAN: "AI governance / human-review route",
  CONTRACT: "Contract and responsibility allocation review needed",
  LIABILITY: "Contract and responsibility allocation review needed",
  TERMS: "Contract and responsibility allocation review needed"
});

const SECTION_DECK_PROFILES = Object.freeze({
  product_activity_ip_profile: {
    type: "activity",
    title: "Product/activity item",
    primary: ["activity_display_id", "related_product_service", "publicly_described_activity", "activity_patterns", "affected_contexts"],
    panels: [
      { label: "Activity / mechanics", keys: ["activity_summary", "how_it_appears_to_work", "automation_and_human_review_signal", "external_or_internal_effect"] },
      { label: "Context / proof", keys: ["data_content_or_asset_affected", "activity_pattern_proof", "affected_context_proof_and_limits", "activity_patterns", "affected_contexts"] }
    ]
  },
  data_provenance_controls: {
    type: "data-control",
    title: "Data/control review item",
    layout: "row-groups",
    badges: ["Public_Footprint_Status", "Jurisdiction_Layer", "Review_Action"],
    titleKeys: ["Review_Point", "Purpose", "Processing_Operation"],
    rowGroups: [
      { label: "Control identity", grid: "compact-4", keys: ["Review_Point", "Public_Footprint_Status", "Jurisdiction_Layer", "Review_Action"] },
      { label: "Processing / control position", grid: "wide-2", keys: ["Purpose", "Processing_Operation", "Data_Category", "Data_Categories", "Activity_Data_Flow", "Control_Position"] },
      { label: "Evidence / limitation", grid: "wide-2", keys: ["Evidence_Summary", "Source_Layer", "Source_Basis", "Limitation", "Missing_Proof", "Expected_Source"] }
    ]
  },
  legal_document_control_review: {
    type: "legal-map",
    title: "Legal/governance document item",
    layout: "row-groups",
    badges: ["display_ref", "artifact_class", "status", "source_corpus_status"],
    titleKeys: ["document_title", "document_or_artifact", "missing_or_limited_item"],
    rowGroups: [
      { label: "Document identity", grid: "compact-4", keys: ["display_ref", "document_or_artifact", "document_title", "artifact_class", "status", "source_corpus_status"] },
      { label: "Locator", grid: "wide-2", keys: ["internal_unit", "heading_label", "source_url", "navigation_pointer", "expected_location", "canonical_equivalent"] },
      { label: "Control / missing item", grid: "wide-2", keys: ["missing_or_limited_item", "review_point_type", "reviewer_action", "control_language", "control_position", "limitation", "boundary_note"] }
    ]
  },
  exposure_findings: {
    type: "exposure",
    title: "Exposure findings",
    layout: "row-groups",
    badges: ["display_status", "review_priority_tier", "review_category", "review_route"],
    titleKeys: ["Threat_Name", "plain_english_issue", "Finding"],
    rowGroups: [
      { label: "Exposure identity", grid: "compact-4", keys: ["display_exposure_id", "Exposure_ID", "Threat_ID", "Subcat", "display_status", "review_priority_tier", "review_category", "review_route", "review_depth", "Depth", "Status"] },
      { label: "Finding / issue", grid: "wide-2", keys: ["Threat_Name", "plain_english_issue", "related_activity", "Finding", "Harm_Mechanism"] },
      { label: "Legal consequence / review action", grid: "wide-2", keys: ["legal_business_consequence", "Legal_Business_Consequence", "Legal Business Consequence", "recommended_review_action", "Recommended_Review_Action", "Recommended Review Action", "Review_Action"] },
      { label: "Evidence / basis", grid: "wide-2", keys: ["visible_basis", "evidence_source_basis", "visible_control_position", "activity_pattern", "affected_context", "Basis_Proof", "Evidence_Summary", "Control_Exclusion_Basis", "Limitation"] }
    ]
  },
  review_route_handoff_plan: {
    type: "handoff",
    title: "Review route / handoff plan",
    layout: "row-groups",
    badges: ["Handoff_State", "Priority", "review_route"],
    titleKeys: ["Review_Action", "Drafting_Action", "Document_Impact", "visible_signal"],
    rowGroups: [
      { label: "Handoff identity", grid: "compact-4", keys: ["action_reference", "linked_finding", "review_route", "route_reference", "Handoff_State", "Priority"] },
      { label: "Drafting action", grid: "wide-2", keys: ["visible_signal", "Review_Action", "Document", "Document_Impact", "Downstream_Document", "Drafting_Action"] },
      { label: "Use limit / reviewer input", grid: "wide-2", keys: ["downstream_use_limit", "Required_Input", "Open_Reviewer_Point", "Limitation", "Next_Action"] }
    ]
  },
  clarification_missing_source_queue: {
    type: "clarification",
    title: "Clarification / missing source queue",
    layout: "row-groups",
    badges: ["Blocks_Handoff", "Linked_Exposure_ID", "Exposure_ID"],
    titleKeys: ["question", "Question", "Clarification_Request", "missing_or_limited_item"],
    rowGroups: [
      { label: "Confirmation identity", grid: "compact-4", keys: ["confirmation_reference", "display_ref", "Clarification_ID", "Request_ID", "Linked_Exposure_ID", "Exposure_ID", "Blocks_Handoff"] },
      { label: "Question / missing material", grid: "wide-2", keys: ["question", "Question", "missing_or_limited_item", "Missing_Material", "Clarification_Request", "Review_Point"] },
      { label: "Expected source / downstream effect", grid: "wide-2", keys: ["expected_location", "Expected_Source_Location", "Evidence_Needed", "Why_It_Matters", "Downstream_Effect", "Limitation"] }
    ]
  },
  methodology_limitations_public_annexure: {
    type: "methodology",
    title: "Methodology / limitation item",
    layout: "row-groups",
    badges: ["review_step", "status", "Artifact", "Reference"],
    titleKeys: ["purpose", "review_step", "Methodology", "Reason"],
    rowGroups: [
      { label: "Method identity", grid: "compact-4", keys: ["review_step", "Artifact", "Reference", "status"] },
      { label: "Method / scope", grid: "wide-2", keys: ["purpose", "Scope", "Methodology", "Included_Source", "Included", "Reason"] },
      { label: "Boundary / limitation", grid: "wide-2", keys: ["meaning", "Limitation", "Boundary", "Annexure", "Technical_Annexure", "Reviewer_Note", "Excluded"] }
    ]
  }
});

const RETIRED_VISIBLE_MAPPING_KEY = "va" + "ult_mapping";
const FORBIDDEN_VISIBLE_KEYS = new Set([
  "artifact_name",
  "source_artifact",
  "source_path",
  "technical_refs",
  "evidence_refs",
  "normalization",
  RETIRED_VISIBLE_MAPPING_KEY,
  "section_limitations",
  "trace_id",
  "field_path",
  "value_preview",
  "forensic_trace_present",
  "technical_annexure_only",
  "display_in_main_report",
  "normalized_dap_field_id",
  "integrated_field_group",
  "row_type",
  "subsection_id",
  "field_id",
  "source_section_ref"
]);

const els = {
  title: document.getElementById("reportTitle"),
  subtitle: document.getElementById("reportSubtitle"),
  meta: document.getElementById("reportMeta"),
  body: document.getElementById("reportBody"),
  pdf: document.getElementById("downloadPdfButton"),
  qualifiedReview: document.getElementById("qualifiedReviewButton"),
  annexure: document.getElementById("technicalAnnexureButton"),
  rail: document.getElementById("reportRail"),
  deckStatus: document.getElementById("reportDeckStatus")
};

const deckState = new Map();
let currentPayload = null;
let beforePrintSnapshot = null;
let railObserver = null;

els.pdf.addEventListener("click", function () { window.print(); });
document.addEventListener("click", handleDeckClick, true);
window.addEventListener("beforeprint", expandDecksForPrint);
window.addEventListener("afterprint", restoreDecksAfterPrint);

if (!runId) {
  fail("Missing run_id in report URL.");
} else {
  els.qualifiedReview.href = "qualified-review.html?run_id=" + encodeURIComponent(runId);
  const footerQualifiedReview = document.getElementById("reportFooterQualifiedReviewButton");
  if (footerQualifiedReview) footerQualifiedReview.href = "qualified-review.html?run_id=" + encodeURIComponent(runId);
  if (els.annexure) {
    els.annexure.href = "technical-annexure.html?run_id=" + encodeURIComponent(runId);
    els.annexure.target = "_blank";
    els.annexure.rel = "noopener";
  }
  loadReport(runId).catch(function (error) { renderReportUnavailable(runId, error); });
}

async function loadReport(id) {
  const response = await fetch("/public/diligence-system/report/" + encodeURIComponent(id));
  const json = await response.json().catch(function () { return {}; });
  if (!response.ok) throw new Error(response.status + ": " + (json.message || json.error || "Report not ready"));
  const payload = json.renderer_payload || {};
  assertLockedPayload(payload);
  currentPayload = payload;
  const shell = payload.report_shell || {};
  els.title.textContent = "Diligence Report";
  els.subtitle.textContent = "Review the public-footprint diligence findings, evidence-based summaries, and workflow handoff before qualified review.";
  renderShellMeta({
    "Target": shell.target_display_name,
    "Target domain": shell.target_domain,
    "Run ID": shell.run_id || id,
    "Review status": shell.status_label || shell.validation_status,
    "Generated at": shell.generated_at,
    "Report mode": shell.report_mode
  }, payload.dashboard_tiles || []);
  replaceChildren(els.body, payload.sections.map(renderSection));
  renderReportRail(payload.sections);
  initReportRailObserver();
  updateDeckStatus();
}

async function renderReportUnavailable(id, error) {
  els.title.textContent = "Report not ready";
  els.subtitle.textContent = "This run has not produced a renderer payload yet.";
  const message = error?.message || String(error || "Report not ready");
  let diagnostic = null;
  try {
    const response = await fetch("/public/diligence-system/jobs/" + encodeURIComponent(id));
    diagnostic = await response.json().catch(function () { return null; });
  } catch (_error) { diagnostic = null; }
  const run = diagnostic?.run || {};
  replaceChildren(els.meta, [shellMetaTable({
    "Run ID": id,
    "Report endpoint": message,
    "Run status": run.status || "Unknown",
    "Current phase": run.current_phase || "Unknown",
    "Runner state": run.runner_state || "Unknown",
    "Runner last error": run.runner_last_error || "",
    "Artifact count": run.artifact_count ?? "",
    "Final report URL": run.final_report_url || "Not generated"
  })]);
  if (els.rail) els.rail.textContent = "Report unavailable";
  const block = el("section", "report-section law-report-section report-section-card");
  block.append(el("div", "eyebrow", "Run diagnostic"));
  block.append(el("h2", "", "Renderer payload is missing"));
  block.append(el("p", "section-summary", "The report page can only render after the pipeline reaches RENDERER and saves renderer_payload. This URL may point to a run that has not been regenerated after the latest patch."));
  block.append(renderReportValue({ Required_state: "current_phase = COMPLETE or status = COMPLETE", Current_state: (run.current_phase || "Unknown") + " / " + (run.status || "Unknown"), Next_action: "Deploy latest main and rerun the pipeline from the failed phase or create a fresh run." }));
  replaceChildren(els.body, [block]);
}

function assertLockedPayload(payload) {
  if (payload.renderer_source !== LOCKED_RENDERER_SOURCE) throw new Error("Report renderer is not locked to clean Phase 12 report profiles.");
  if (!Array.isArray(payload.sections)) throw new Error("Report payload is missing locked sections array.");
  const ids = payload.sections.map(function (section) { return section.section_id; });
  if (JSON.stringify(ids) !== JSON.stringify(EXPECTED_SECTION_IDS)) throw new Error("Report payload does not match the locked 10-section structure.");
  ["section_list", "section_order", "raw_final_output_handoff", "normalized_report_manifest"].forEach(function (key) { if (Object.prototype.hasOwnProperty.call(payload, key)) throw new Error("Legacy public report payload key not allowed: " + key); });
  payload.sections.forEach(function (section) {
    if (Array.isArray(section.section_limitations) && section.section_limitations.length) throw new Error("Section limitation leakage is not allowed in the public report body: " + section.section_id);
  });
}

function renderReportRail(sections) {
  if (!els.rail) return;
  const wrap = el("div", "report-rail-list");
  asArray(sections).forEach(function (section, index) {
    const link = el("a", "report-rail-item", "");
    const sectionId = section.section_id || "section-" + index;
    const stats = sectionStats(section);
    link.href = "#" + slug(sectionId);
    link.dataset.reportSectionId = sectionId;
    link.append(
      el("span", "report-rail-index", String(section.section_number || index + 1).padStart(2, "0")),
      railTextNode(section.section_title || sectionId || "Report section", stats)
    );
    wrap.append(link);
  });
  replaceChildren(els.rail, [wrap]);
  setActiveRailItem(asArray(sections)[0]?.section_id || "");
}

function railTextNode(title, stats) {
  const box = el("span", "report-rail-copy");
  box.append(el("span", "report-rail-text", title));
  box.append(el("span", "report-rail-count", stats));
  return box;
}

function sectionStats(section) {
  const subsections = asArray(section.subsections);
  let rows = 0;
  for (const subsection of subsections) for (const field of asArray(subsection.fields)) if (isTableValue(field.value)) rows += field.value.length;
  if (rows) return `${subsections.length} parts Â· ${rows} rows`;
  return `${subsections.length} parts`;
}

function initReportRailObserver() {
  if (railObserver) railObserver.disconnect();
  const sections = [...document.querySelectorAll(".report-section-card[id]")];
  if (!sections.length || !("IntersectionObserver" in window)) return;
  railObserver = new IntersectionObserver(function (entries) {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible?.target?.id) setActiveRailItem(visible.target.id);
  }, { root: null, rootMargin: "-18% 0px -64% 0px", threshold: [0.08, 0.18, 0.32, 0.5] });
  sections.forEach((section) => railObserver.observe(section));
}

function setActiveRailItem(sectionId) {
  const normalized = slug(sectionId);
  document.querySelectorAll(".report-rail-item").forEach(function (item) {
    const active = slug(item.dataset.reportSectionId || item.getAttribute("href") || "") === normalized || item.getAttribute("href") === "#" + normalized;
    item.classList.toggle("active", active);
    item.setAttribute("aria-current", active ? "true" : "false");
  });
  updateDeckStatus();
}

function renderSection(section) {
  const node = el("section", "report-section law-report-section report-section-card");
  node.id = slug(section.section_id);
  node.dataset.reportSectionId = section.section_id || "";
  const number = text(section.section_number, "");
  node.append(el("div", "eyebrow", number ? "Section " + number : "Report Section"));
  node.append(el("h2", "", (number ? number + ". " : "") + normalizeReportLabel(text(section.section_title, "Section"))));
  if (section.reviewer_summary) node.append(el("p", "section-summary", normalizeDisplayText(section.reviewer_summary, "reviewer_summary")));
  if (section.display_rule) node.append(el("p", "notice compact", normalizeDisplayText(section.display_rule, "display_rule")));
  asArray(section.subsections).forEach(function (subsection) { node.append(renderSubsection(subsection, { section })); });
  return node;
}

function renderSubsection(subsection, context) {
  const block = el("div", "subsection-block law-subsection");
  block.append(el("h3", "", normalizeReportLabel(text(subsection.subsection_title, "Subsection"))));
  const fields = asArray(subsection.fields);
  if (!fields.length) { block.append(el("p", "small-muted", "No fields emitted for this subsection.")); return block; }
  const tableFields = fields.filter(function (field) { return isTableValue(field.value); });
  const ordinaryFields = fields.filter(function (field) { return !isTableValue(field.value); });
  if (ordinaryFields.length) block.append(renderFieldsGrid(ordinaryFields, context));
  tableFields.forEach(function (field) { block.append(renderField(field, { ...context, subsection })); });
  return block;
}

function renderField(field, context) {
  const card = el("div", "field-card law-field-block");
  card.append(el("div", "field-label", normalizeReportLabel(text(field.label, "Field"))));
  card.append(renderReportValue(field.value, { ...context, field }));
  if (field.qualified_review_note) card.append(el("p", "qualified-review-note", normalizeDisplayText(field.qualified_review_note, "qualified_review_note")));
  if (field.limitation) card.append(el("p", "field-limitation", normalizeDisplayText(field.limitation, "limitation")));
  return card;
}

function renderFieldsGrid(fields, context) {
  const grid = el("div", "report-fact-grid");
  fields.forEach(function (field) {
    const item = el("div", "report-fact-item");
    item.append(el("div", "report-fact-label", normalizeReportLabel(text(field.label, "Field"))));
    const value = el("div", "report-fact-value");
    value.append(renderReportValue(field.value, { ...context, field }));
    if (field.qualified_review_note) value.append(el("p", "qualified-review-note", normalizeDisplayText(field.qualified_review_note, "qualified_review_note")));
    if (field.limitation) value.append(el("p", "field-limitation", normalizeDisplayText(field.limitation, "limitation")));
    item.append(value);
    grid.append(item);
  });
  return grid;
}

function renderFieldsTable(fields, context) {
  const table = el("table", "report-table field-table");
  const tbody = document.createElement("tbody");
  fields.forEach(function (field) {
    const tr = document.createElement("tr");
    tr.append(el("th", "", normalizeReportLabel(text(field.label, "Field"))));
    const td = document.createElement("td");
    td.append(renderReportValue(field.value, { ...context, field }));
    if (field.qualified_review_note) td.append(el("p", "qualified-review-note", normalizeDisplayText(field.qualified_review_note, "qualified_review_note")));
    if (field.limitation) td.append(el("p", "field-limitation", normalizeDisplayText(field.limitation, "limitation")));
    tr.append(td);
    tbody.append(tr);
  });
  table.append(tbody);
  return wrapTable(table, "field-table-scroll");
}

function renderReportValue(value, context = {}) {
  const key = context.field?.field_id || context.field?.label || "";
  if (value === null || value === undefined || value === "") return el("span", "small-muted", "Not visible in reviewed public materials.");
  if (Array.isArray(value)) return renderArrayValue(value, context);
  if (typeof value === "object") {
    if (isTruncatedRowset(value)) return renderTruncatedRowset(value, context);
    return renderKeyValueTable(value, context);
  }
  return el("span", "field-value", normalizeDisplayText(value, key));
}

function renderArrayValue(items, context = {}) {
  const cleaned = items.filter(function (item) { return !isSuppressedRow(item); });
  if (!cleaned.length) return el("span", "small-muted", "No entries emitted.");
  if (isTableValue(cleaned)) return renderRowsetDisplay(cleaned, context);
  const list = document.createElement("ul");
  list.className = "report-list";
  cleaned.forEach(function (item) { const li = document.createElement("li"); li.append(renderReportValue(item, context)); list.append(li); });
  return list;
}

function renderRowsetDisplay(items, context = {}) {
  const sectionId = context.section?.section_id || "";
  const profile = SECTION_DECK_PROFILES[sectionId];
  if (profile) return renderPagedCardDeck(items, { ...context, profile });
  if (items.length > DECK_PAGE_SIZE) return renderPagedCardDeck(items, { ...context, profile: defaultDeckProfile(context) });
  return renderRowsetTable(items);
}

function renderKeyValueTable(object, context = {}) {
  const rows = visibleEntries(object);
  if (!rows.length) return el("span", "small-muted", "No visible values emitted.");
  const table = el("table", "report-table kv public-value-table");
  const tbody = document.createElement("tbody");
  rows.forEach(function (entry) {
    const tr = document.createElement("tr");
    tr.append(el("th", "", normalizeReportLabel(entry[0])));
    const td = document.createElement("td");
    td.append(renderReportValue(entry[1], { ...context, field: { ...(context.field || {}), field_id: entry[0], label: entry[0] } }));
    tr.append(td);
    tbody.append(tr);
  });
  table.append(tbody);
  return table;
}

function renderTruncatedRowset(object, context = {}) {
  const block = el("div", "truncated-table-block stale-truncated-table-block");
  block.append(el("p", "small-muted", "This renderer payload was produced before the full-table renderer patch and contains a pre-truncated rowset. Regenerate the report from RENDERER to show the full public table inline."));
  block.append(renderArrayValue(object.displayed_rows || [], context));
  if (object.display_rule) block.append(el("p", "small-muted", normalizeDisplayText(object.display_rule, "display_rule")));
  return block;
}

function renderPagedCardDeck(items, context) {
  const deckId = deckIdFor(context, items);
  if (!deckState.has(deckId)) deckState.set(deckId, { page: 0, expanded: items.length <= DECK_PAGE_SIZE });
  const block = el("div", "report-card-deck");
  block.dataset.reportDeckId = deckId;
  block.dataset.reportDeckTotal = String(items.length);
  block.__reportDeckItems = items;
  block.__reportDeckContext = context;
  renderDeckInto(block);
  return block;
}

function renderDeckInto(block) {
  const items = block.__reportDeckItems || [];
  const context = block.__reportDeckContext || {};
  const state = deckState.get(block.dataset.reportDeckId) || { page: 0, expanded: false };
  const expanded = state.expanded || items.length <= DECK_PAGE_SIZE;
  const pageCount = Math.max(1, Math.ceil(items.length / DECK_PAGE_SIZE));
  const page = Math.max(0, Math.min(state.page || 0, pageCount - 1));
  state.page = page;
  deckState.set(block.dataset.reportDeckId, state);
  const start = expanded ? 0 : page * DECK_PAGE_SIZE;
  const end = expanded ? items.length : Math.min(items.length, start + DECK_PAGE_SIZE);
  const shown = items.slice(start, end);

  const header = el("div", "report-deck-header");
  const title = context.profile?.title || context.field?.label || "Report items";
  header.append(
    el("div", "report-deck-title", normalizeReportLabel(title)),
    el("div", "report-deck-count", `${items.length} items Â· Showing ${items.length ? start + 1 : 0}-${end}`)
  );
  if (items.length > DECK_PAGE_SIZE) {
    header.append(renderDeckActions(page, pageCount, expanded));
  }

  const cards = el("div", "report-deck-cards");
  shown.forEach(function (item, index) {
    cards.append(renderFindingCard(item, { ...context, ordinal: start + index + 1 }));
  });

  if (items.length > DECK_PAGE_SIZE) {
    const footer = el("div", "report-deck-footer");
    footer.append(renderDeckActions(page, pageCount, expanded));
    replaceChildren(block, [header, cards, footer]);
  } else {
    replaceChildren(block, [header, cards]);
  }
  updateDeckStatus();
}

function renderDeckActions(page, pageCount, expanded) {
  const actions = el("div", "report-deck-actions");
  const prev = deckButton("Previous", "prev", page <= 0 || expanded);
  const next = deckButton("Next", "next", page >= pageCount - 1 || expanded);
  const toggle = deckButton(expanded ? "Collapse" : "Show all", expanded ? "collapse" : "show_all", false);
  actions.append(prev, next, toggle);
  return actions;
}

function deckButton(label, action, disabled) {
  const button = el("button", "btn secondary report-deck-button", label);
  button.type = "button";
  button.dataset.reportDeckAction = action;
  button.disabled = Boolean(disabled);
  return button;
}

function renderFindingCard(item, context) {
  const profile = context.profile || defaultDeckProfile(context);
  if (profile.layout === "row-groups" || Array.isArray(profile.rowGroups)) {
    return renderRowGroupReportCard(item, context);
  }
  const card = el("article", "report-finding-card " + (profile.type ? "report-card-" + profile.type : ""));
  const allVisible = visibleEntries(item);

  if (!allVisible.length) {
    card.append(el("div", "report-finding-ref", `Item ${context.ordinal || ""}`));
    card.append(el("p", "small-muted", "No displayable report values emitted for this item."));
    return card;
  }

  const primaryRows = rowsForKeys(item, profile.primary);
  const used = new Set(primaryRows.map((entry) => normalizeKey(entry[0])));
  const panels = buildCardPanels({ item, profile, used });
  const remaining = allVisible.filter(function (entry) { return !used.has(normalizeKey(entry[0])); });

  const header = el("div", "report-finding-header");
  const ref = firstValue(item, ["activity_display_id", "display_exposure_id", "display_control_id", "action_reference", "confirmation_reference", "display_ref", "Clarification_ID", "Request_ID", "Threat_ID", "Artifact", "Reference"]) || `Item ${context.ordinal}`;
  header.append(el("div", "report-finding-ref", normalizeDisplayText(ref, "display_ref")));
  const chips = el("div", "report-finding-chips");
  primaryRows.forEach(function (entry) {
    chips.append(el("span", "report-finding-chip", `${normalizeReportLabel(entry[0])}: ${stringifyCell(entry[1], entry[0])}`));
  });
  header.append(chips);
  card.append(header);

  const title = firstValue(item, ["plain_english_issue", "activity_summary", "publicly_described_activity", "Review_Point", "question", "Question", "Threat_Name", "Finding", "document_or_artifact", "document_title", "missing_or_limited_item", "Field"]) || profile.title || "Report item";
  card.append(el("h4", "report-finding-title", normalizeDisplayText(title, "title")));

  if (panels.length) {
    const layout = el("div", "report-finding-layout");
    panels.forEach(function (panel) { layout.append(renderDetailPanelRows(panel.label, panel.rows)); });
    card.append(layout);
  }

  if (remaining.length) {
    const details = el("div", "report-detail-grid");
    remaining.forEach(function (entry) {
      const row = el("div", "report-detail-item");
      row.append(el("div", "report-detail-label", normalizeReportLabel(entry[0])), el("div", "report-detail-value", stringifyCell(entry[1], entry[0])));
      details.append(row);
    });
    card.append(details);
  }
  return card;
}

function renderRowGroupReportCard(item, context) {
  const profile = context.profile || defaultDeckProfile(context);
  const cardClass = "report-finding-card report-card-row-groups" + (profile.type ? " report-card-" + profile.type : "");
  const card = el("article", cardClass);
  const allVisible = visibleEntries(item);

  if (!allVisible.length) {
    card.append(el("div", "report-finding-ref", `Item ${context.ordinal || ""}`));
    card.append(el("p", "small-muted", "No displayable report values emitted for this item."));
    return card;
  }

  const used = new Set();
  const header = el("div", "report-finding-header");
  const ref = firstValue(item, ["activity_display_id", "display_exposure_id", "display_control_id", "action_reference", "confirmation_reference", "display_ref", "Clarification_ID", "Request_ID", "Threat_ID", "Artifact", "Reference"]) || `Item ${context.ordinal}`;
  header.append(el("div", "report-finding-ref", normalizeDisplayText(ref, "display_ref")));
  const chips = el("div", "report-finding-chips");
  rowsForKeys(item, profile.badges || []).forEach(function (entry) {
    chips.append(el("span", "report-finding-chip", `${normalizeReportLabel(entry[0])}: ${stringifyCell(entry[1], entry[0])}`));
  });
  header.append(chips);
  card.append(header);

  const titleRow = firstRowForKeys(item, profile.titleKeys || []);
  if (titleRow) used.add(normalizeKey(titleRow[0]));
  const title = titleRow?.[1] || firstValue(item, ["plain_english_issue", "activity_summary", "publicly_described_activity", "Review_Point", "question", "Question", "Threat_Name", "Finding", "document_or_artifact", "document_title", "missing_or_limited_item", "Field"]) || profile.title || "Report item";
  card.append(el("h4", "report-finding-title", normalizeDisplayText(title, "title")));

  const body = el("div", "report-row-card-body");
  (profile.rowGroups || []).forEach(function (group) {
    const rows = renderRowGroupRows(item, group.keys || [], used);
    if (!rows.length) return;
    markRowsUsed(rows, used);
    body.append(renderReportRowGroup(group.label || "Report values", rows, group.grid || "wide-2"));
  });

  const remaining = allVisible.filter(function (entry) { return !used.has(normalizeKey(entry[0])); });
  if (remaining.length) body.append(renderReportRowGroup("Additional report values", remaining, "wide-2"));
  if (body.childNodes.length) card.append(body);
  return card;
}

function renderRowGroupRows(item, keys, used) {
  return rowsForKeys(item, keys).filter(function (entry) {
    return !used.has(normalizeKey(entry[0]));
  });
}

function renderReportRowGroup(label, rows, gridClass) {
  const group = el("div", "report-row-group");
  group.append(el("div", "report-row-group-label", label));
  const grid = el("div", "report-row-group-grid " + gridClass);
  rows.forEach(function (entry) {
    const cell = el("div", "report-row-cell");
    cell.append(el("div", "report-row-cell-label", normalizeReportLabel(entry[0])), el("div", "report-row-cell-value", stringifyCell(entry[1], entry[0])));
    grid.append(cell);
  });
  group.append(grid);
  return group;
}

function markRowsUsed(rows, used) {
  rows.forEach(function (entry) { used.add(normalizeKey(entry[0])); });
}

function buildCardPanels({ item, profile, used }) {
  const definitions = Array.isArray(profile.panels) && profile.panels.length
    ? profile.panels
    : [
        { label: "Finding / action", keys: profile.left || [] },
        { label: "Evidence / basis", keys: profile.right || [] }
      ];
  const allVisible = visibleEntries(item);
  const panels = definitions.map((definition) => {
    const rows = rowsForKeys(item, definition.keys || []).filter(function (entry) {
      const normalized = normalizeKey(entry[0]);
      if (used.has(normalized)) return false;
      used.add(normalized);
      return true;
    });
    return { label: definition.label || "Details", rows };
  });

  const emptyPanels = panels.filter((panel) => !panel.rows.length);
  for (const panel of emptyPanels) {
    const remaining = allVisible.filter(function (entry) { return !used.has(normalizeKey(entry[0])); });
    if (!remaining.length) break;
    const emptyLeft = emptyPanels.filter((candidate) => !candidate.rows.length).length || 1;
    const take = Math.max(1, Math.ceil(remaining.length / emptyLeft));
    panel.rows = remaining.slice(0, take);
    panel.rows.forEach((entry) => used.add(normalizeKey(entry[0])));
  }

  const nonEmpty = panels.filter((panel) => panel.rows.length);
  if (nonEmpty.length) return nonEmpty;
  const fallback = allVisible.filter(function (entry) { return !used.has(normalizeKey(entry[0])); });
  return fallback.length ? [{ label: profile.fallback_label || "Details", rows: fallback }] : [];
}

function renderDetailPanelRows(label, rows) {
  const panel = el("div", "report-context-panel");
  panel.append(el("div", "report-context-label", label));
  rows.forEach(function (entry) {
    const row = el("div", "report-context-row");
    row.append(el("span", "report-context-key", normalizeReportLabel(entry[0])), el("span", "report-context-value", stringifyCell(entry[1], entry[0])));
    panel.append(row);
  });
  return panel;
}

function renderDetailPanel(label, item, keys) {
  return renderDetailPanelRows(label, rowsForKeys(item, keys));
}

function rowsForKeys(item, keys) {
  const rows = [];
  const seen = new Set();
  keys.forEach(function (key) {
    const actual = findActualKey(item, key);
    if (!actual || seen.has(normalizeKey(actual))) return;
    const value = item[actual];
    if (value !== undefined && value !== null && value !== "") {
      seen.add(normalizeKey(actual));
      rows.push([actual, value]);
    }
  });
  return rows;
}

function firstRowForKeys(item, keys) {
  return rowsForKeys(item, keys)[0] || null;
}

function renderRowsetTable(items) {
  const columns = deriveColumns(items);
  const table = el("table", "report-table rowset-table full-public-table");
  table.style.minWidth = Math.max(960, columns.length * 170) + "px";
  const thead = document.createElement("thead");
  const header = document.createElement("tr");
  columns.forEach(function (column) { header.append(el("th", "", normalizeReportLabel(column))); });
  thead.append(header);
  const tbody = document.createElement("tbody");
  items.forEach(function (item) {
    const tr = document.createElement("tr");
    columns.forEach(function (column) { tr.append(el("td", "", stringifyCell(getByKey(item, column), column))); });
    tbody.append(tr);
  });
  table.append(thead, tbody);
  return wrapTable(table, "rowset-table-scroll", "Full public table â€” scroll horizontally to view all columns.");
}

function handleDeckClick(event) {
  const button = event.target.closest?.("[data-report-deck-action]");
  if (!button) return;
  const deck = button.closest("[data-report-deck-id]");
  if (!deck) return;
  event.preventDefault();
  const state = deckState.get(deck.dataset.reportDeckId) || { page: 0, expanded: false };
  const total = Number(deck.dataset.reportDeckTotal || 0);
  const pageCount = Math.max(1, Math.ceil(total / DECK_PAGE_SIZE));
  if (button.dataset.reportDeckAction === "prev") state.page = Math.max(0, state.page - 1);
  if (button.dataset.reportDeckAction === "next") state.page = Math.min(pageCount - 1, state.page + 1);
  if (button.dataset.reportDeckAction === "show_all") state.expanded = true;
  if (button.dataset.reportDeckAction === "collapse") { state.expanded = false; state.page = 0; }
  deckState.set(deck.dataset.reportDeckId, state);
  renderDeckInto(deck);
}

function expandDecksForPrint() {
  beforePrintSnapshot = new Map(deckState);
  document.querySelectorAll("[data-report-deck-id]").forEach(function (deck) {
    const state = deckState.get(deck.dataset.reportDeckId) || { page: 0, expanded: false };
    state.expanded = true;
    state.page = 0;
    deckState.set(deck.dataset.reportDeckId, state);
    renderDeckInto(deck);
  });
}

function restoreDecksAfterPrint() {
  if (beforePrintSnapshot) {
    deckState.clear();
    beforePrintSnapshot.forEach(function (value, key) { deckState.set(key, value); });
  }
  beforePrintSnapshot = null;
  document.querySelectorAll("[data-report-deck-id]").forEach(renderDeckInto);
}

function updateDeckStatus() {
  if (!els.deckStatus) return;
  const deckCount = document.querySelectorAll("[data-report-deck-id]").length;
  const activeRail = document.querySelector(".report-rail-item.active .report-rail-text");
  const active = activeRail?.textContent ? ` Current section: ${activeRail.textContent}.` : "";
  if (!deckCount) els.deckStatus.textContent = "Report uses compact tables for this payload." + active;
  else els.deckStatus.textContent = `${deckCount} paged report deck${deckCount === 1 ? "" : "s"} active Â· 5 items at a time Â· print expands all.${active}`;
}

function wrapTable(table, className, captionText) {
  const block = el("div", "table-scroll " + (className || ""));
  block.setAttribute("tabindex", "0");
  block.setAttribute("role", "region");
  block.setAttribute("aria-label", captionText || "Scrollable report table");
  if (captionText) block.append(el("p", "table-scroll-note", captionText));
  block.append(table);
  return block;
}

function isTableValue(value) { return Array.isArray(value) && value.length > 0 && value.every(function (item) { return item && typeof item === "object" && !Array.isArray(item); }); }
function isTruncatedRowset(value) { return value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, "displayed_rows") && Object.prototype.hasOwnProperty.call(value, "suppressed_row_count"); }
function isSuppressedRow(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value) && (value.display_in_main_report === false || value.technical_annexure_only === true)); }

function deriveColumns(items) {
  const priority = ["display_ref", "activity_display_id", "display_exposure_id", "display_control_id", "action_reference", "confirmation_reference", "Review_Point", "Public_Footprint_Status", "display_status", "plain_english_issue", "review_route", "document_or_artifact", "document_title", "artifact_class", "source_url", "Exposure_ID", "Threat_ID", "Threat_Name", "Subcat", "Status", "Priority", "Pain_Tier", "Pain_Depth", "Review_Route", "Document", "Locator_ID", "Unit_Heading", "Field", "Review_Point", "Jurisdiction_Layer", "Evidence_Summary", "Review_Action", "Limitation"];
  const seen = new Set();
  const columns = [];
  priority.forEach(function (key) { if (!FORBIDDEN_VISIBLE_KEYS.has(key) && items.some(function (item) { return hasKey(item, key); })) { seen.add(normalizeKey(key)); columns.push(findActualKey(items.find((item) => hasKey(item, key)), key) || key); } });
  items.forEach(function (item) { Object.keys(item || {}).forEach(function (key) { if (!FORBIDDEN_VISIBLE_KEYS.has(key) && !seen.has(normalizeKey(key))) { seen.add(normalizeKey(key)); columns.push(key); } }); });
  return columns.length ? columns : Object.keys(items[0] || {}).filter(function (key) { return !FORBIDDEN_VISIBLE_KEYS.has(key); });
}

function stringifyCell(value, key = "") {
  if (value === null || value === undefined || value === "") return "â€”";
  if (Array.isArray(value)) return value.map((item) => stringifyCell(item, key)).filter(Boolean).join("; ");
  if (typeof value === "object") return visibleEntries(value).map(function (entry) { return normalizeReportLabel(entry[0]) + ": " + stringifyCell(entry[1], entry[0]); }).join("; ");
  return normalizeDisplayText(value, key);
}

function visibleEntries(object) {
  return Object.entries(object || {}).filter(function (entry) {
    return !FORBIDDEN_VISIBLE_KEYS.has(entry[0]) && entry[1] !== undefined && entry[1] !== null && entry[1] !== "";
  });
}

function renderShellMeta(object, tiles) {
  const children = [shellMetaTable(object)];
  if (Array.isArray(tiles) && tiles.length) children.push(reportMetaTable("Diligence Snapshot", tiles.map(function (tile) { return { Label: tile.label, Value: tile.value, Note: tile.note || "" }; })));
  replaceChildren(els.meta, children);
}

function shellMetaTable(object) {
  const table = el("table", "report-table shell-meta-table");
  const tbody = document.createElement("tbody");
  Object.entries(object || {}).forEach(function (entry) {
    if (entry[1] === undefined || entry[1] === null || entry[1] === "") return;
    const tr = document.createElement("tr");
    tr.append(el("th", "", normalizeReportLabel(entry[0])));
    tr.append(el("td", "", normalizeDisplayText(entry[1], entry[0])));
    tbody.append(tr);
  });
  table.append(tbody);
  return wrapTable(table, "shell-meta-table-scroll");
}

function reportMetaTable(title, rows) {
  const block = el("div", "meta-table-block");
  block.append(el("h3", "", normalizeReportLabel(title)));
  block.append(renderRowsetTable(rows));
  return block;
}

function defaultDeckProfile(context = {}) {
  return {
    type: "default",
    title: context.field?.label || context.subsection?.subsection_title || "Report items",
    primary: ["display_ref", "activity_display_id", "display_exposure_id", "display_control_id", "Threat_ID", "Threat_Name", "display_status", "Status", "Priority", "Document", "Field"],
    panels: [
      { label: "Report item", keys: ["plain_english_issue", "activity_summary", "Finding", "Review_Point", "Question", "Document", "Field", "Review_Action"] },
      { label: "Source / context", keys: ["Evidence_Summary", "visible_basis", "evidence_source_basis", "Basis_Proof", "Expected_Source_Location", "Limitation", "Reviewer_Note"] }
    ],
    fallback_label: "Details"
  };
}

function deckIdFor(context, items) {
  return [context.section?.section_id || "section", context.subsection?.subsection_id || slug(context.subsection?.subsection_title || "subsection"), context.field?.field_id || slug(context.field?.label || "field"), items.length].join("__");
}

function firstValue(object, keys) {
  for (const key of keys) {
    const value = getByKey(object, key);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
}

function normalizeReportLabel(value) {
  return String(value || "Field")
    .replace(/lawyer[-\s]?readable\s*/gi, "")
    .replace(/_/g, " ")
    .replace(/\bId\b/g, "ID")
    .replace(/\bUrl\b/g, "URL")
    .replace(/\bIp\b/g, "IP")
    .replace(/\bAi\b/g, "AI")
    .replace(/\bDpa\b/g, "DPA")
    .replace(/\bDap\b/g, "DAP")
    .replace(/\bQr\b/g, "QR")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function normalizeDisplayText(value, key = "") {
  if (value === null || value === undefined || value === "") return "Not visible in reviewed public materials";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const raw = String(value).replace(/\s+/g, " ").trim();
  if (!raw) return "Not visible in reviewed public materials";
  if (/^(true|false)$/i.test(raw)) return /^true$/i.test(raw) ? "Yes" : "No";
  const normalizedKey = normalizeKey(key);
  const upper = raw.toUpperCase();

  if (STATUS_LABELS[raw]) return STATUS_LABELS[raw];
  if (STATUS_LABELS[upper]) return STATUS_LABELS[upper];

  if (normalizedKey.includes("archetype") || normalizedKey.includes("activity_pattern")) return normalizeCodeList(raw, ARCHETYPE_LABELS);
  if (ARCHETYPE_LABELS[upper]) return ARCHETYPE_LABELS[upper];

  if (normalizedKey.includes("surface") || normalizedKey.includes("affected_context")) return normalizeCodeList(raw, SURFACE_LABELS);
  if (SURFACE_LABELS[raw]) return SURFACE_LABELS[raw];

  if (normalizedKey === "subcat" || normalizedKey.includes("subcategory") || normalizedKey.includes("review_category")) return normalizeCodeList(raw, SUBCATEGORY_LABELS);
  if (SUBCATEGORY_LABELS[upper]) return SUBCATEGORY_LABELS[upper];

  if (normalizedKey.includes("review_route")) return normalizeReviewRoute(raw);
  if (normalizedKey.includes("status") || normalizedKey.includes("lock") || normalizedKey.includes("source_corpus")) return STATUS_LABELS[upper] || raw;

  return raw
    .replace(/LOCKED_WITH_LIMITATIONS/g, "Completed with limitations")
    .replace(/\bFIELD_NOT_FOUND\b/g, "Not visible in reviewed public materials")
    .replace(/\bFIELD_LIMITED\b/g, "Limited public signal")
    .replace(/\bFIELD_NOT_PUBLIC\b/g, "Not visible in reviewed public materials")
    .replace(/lawyer[-\s]?readable\s*/gi, "")
    .trim();
}

function normalizeCodeList(raw, map) {
  const exact = map[raw] || map[raw.toUpperCase()];
  if (exact) return exact;
  const parts = raw.split(/[;,|/]+|\s{2,}/).map((part) => part.trim()).filter(Boolean);
  if (parts.length > 1) {
    const normalized = parts.map((part) => map[part] || map[part.toUpperCase()] || part).filter(Boolean);
    return [...new Set(normalized)].join("; ");
  }
  return raw;
}

function normalizeReviewRoute(raw) {
  const upper = String(raw || "").toUpperCase();
  for (const [key, label] of Object.entries(REVIEW_ROUTE_LABELS)) if (upper.includes(key)) return label;
  return raw.replace(/_/g, " ");
}

function hasKey(object, key) { return Boolean(findActualKey(object, key)); }
function findActualKey(object, key) { return Object.keys(object || {}).find(function (actual) { return normalizeKey(actual) === normalizeKey(key); }) || ""; }
function getByKey(object, key) { const actual = findActualKey(object, key); return actual ? object[actual] : undefined; }
function normalizeKey(key) { return String(key || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }
function queryParam(name) { return new URLSearchParams(window.location.search).get(name); }
function fail(message) { els.title.textContent = "Report unavailable"; els.subtitle.textContent = message; els.body.textContent = ""; }
function text(value, fallback) { return value === undefined || value === null || value === "" ? fallback : String(value); }
function asArray(value) { return Array.isArray(value) ? value : []; }
function titleCase(value) { return normalizeReportLabel(value); }
function slug(value) { return String(value || "section").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function el(tag, className, textContent) { const node = document.createElement(tag); if (className) node.className = className; if (textContent !== undefined && textContent !== "") node.textContent = textContent; return node; }
function replaceChildren(parent, children) { parent.replaceChildren(...children); }
