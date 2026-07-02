const runId = queryParam("run_id");
const LOCKED_RENDERER_SOURCE = "normalized_section_artifacts_only";
const DECK_PAGE_SIZE = 5;
const EXPECTED_SECTION_IDS = Object.freeze([
  "matter_overview",
  "executive_summary",
  "target_profile",
  "product_activity_ip_profile",
  "data_provenance_controls",
  "legal_document_control_review",
  "exposure_findings",
  "review_route_handoff_plan",
  "clarification_missing_source_queue",
  "methodology_limitations_public_annexure"
]);
const SECTION_DECK_PROFILES = Object.freeze({
  exposure_findings: {
    type: "exposure",
    title: "Exposure findings",
    primary: ["Exposure_ID", "display_exposure_id", "Threat_ID", "Threat_Name", "Subcat", "Status", "Priority", "Review_Route"],
    left: ["Threat_Name", "Finding", "Harm_Mechanism", "Pain_Depth", "Review_Action"],
    right: ["Target_Match", "Basis_Proof", "Evidence_Summary", "Control_Exclusion_Basis", "FP_Mechanism", "Limitation"]
  },
  review_route_handoff_plan: {
    type: "handoff",
    title: "Review route / handoff plan",
    primary: ["Exposure_ID", "Threat_ID", "Threat_Name", "Priority", "Review_Route", "Handoff_State"],
    left: ["Review_Action", "Document", "Document_Impact", "Downstream_Document", "Drafting_Action"],
    right: ["Evidence_Summary", "Required_Input", "Open_Reviewer_Point", "Limitation", "Next_Action"]
  },
  clarification_missing_source_queue: {
    type: "clarification",
    title: "Clarification / missing source queue",
    primary: ["Clarification_ID", "Request_ID", "Linked_Exposure_ID", "Exposure_ID", "Threat_Name", "Blocks_Handoff"],
    left: ["Question", "Missing_Material", "Clarification_Request", "Review_Point"],
    right: ["Expected_Source_Location", "Evidence_Needed", "Why_It_Matters", "Downstream_Effect", "Limitation"]
  },
  methodology_limitations_public_annexure: {
    type: "methodology",
    title: "Methodology / limitation item",
    primary: ["Artifact", "Reference", "Status", "Included", "Excluded", "Reason"],
    left: ["Scope", "Methodology", "Included_Source", "Included", "Reason"],
    right: ["Limitation", "Boundary", "Annexure", "Technical_Annexure", "Reviewer_Note"]
  }
});
const FORBIDDEN_VISIBLE_KEYS = new Set([
  "artifact_name",
  "source_artifact",
  "source_path",
  "technical_refs",
  "evidence_refs",
  "normalization",
  "vault_mapping",
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

els.pdf.addEventListener("click", function () { window.print(); });
document.addEventListener("click", handleDeckClick, true);
window.addEventListener("beforeprint", expandDecksForPrint);
window.addEventListener("afterprint", restoreDecksAfterPrint);

if (!runId) {
  fail("Missing run_id in report URL.");
} else {
  els.qualifiedReview.href = "qualified-review.html?run_id=" + encodeURIComponent(runId);
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
  els.title.textContent = shell.report_title || "Interface Diligence Report";
  els.subtitle.textContent = shell.report_subtitle || "Public-Footprint Legal Exposure Diligence";
  renderShellMeta({
    "Target": shell.target_display_name,
    "Target domain": shell.target_domain,
    "Run ID": shell.run_id || id,
    "Review status": shell.status_label || shell.validation_status,
    "Generated at": shell.generated_at,
    "Report mode": shell.report_mode
  }, payload.dashboard_tiles || []);
  renderReportRail(payload.sections);
  replaceChildren(els.body, payload.sections.map(renderSection));
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
  if (payload.renderer_source !== LOCKED_RENDERER_SOURCE) throw new Error("Report renderer is not locked to normalized section artifacts.");
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
    link.href = "#" + slug(section.section_id || "section-" + index);
    link.append(
      el("span", "report-rail-index", String(section.section_number || index + 1).padStart(2, "0")),
      el("span", "report-rail-text", section.section_title || section.section_id || "Report section")
    );
    wrap.append(link);
  });
  replaceChildren(els.rail, [wrap]);
}

function renderSection(section) {
  const node = el("section", "report-section law-report-section report-section-card");
  node.id = slug(section.section_id);
  const number = text(section.section_number, "");
  node.append(el("div", "eyebrow", number ? "Section " + number : "Report Section"));
  node.append(el("h2", "", (number ? number + ". " : "") + text(section.section_title, "Section")));
  if (section.reviewer_summary) node.append(el("p", "section-summary", section.reviewer_summary));
  if (section.display_rule) node.append(el("p", "notice compact", section.display_rule));
  asArray(section.subsections).forEach(function (subsection) { node.append(renderSubsection(subsection, { section })); });
  return node;
}

function renderSubsection(subsection, context) {
  const block = el("div", "subsection-block law-subsection");
  block.append(el("h3", "", text(subsection.subsection_title, "Subsection")));
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
  card.append(el("div", "field-label", text(field.label, "Field")));
  card.append(renderReportValue(field.value, { ...context, field }));
  if (field.qualified_review_note) card.append(el("p", "qualified-review-note", field.qualified_review_note));
  if (field.limitation) card.append(el("p", "field-limitation", field.limitation));
  return card;
}

function renderFieldsGrid(fields, context) {
  const grid = el("div", "report-fact-grid");
  fields.forEach(function (field) {
    const item = el("div", "report-fact-item");
    item.append(el("div", "report-fact-label", text(field.label, "Field")));
    const value = el("div", "report-fact-value");
    value.append(renderReportValue(field.value, { ...context, field }));
    if (field.qualified_review_note) value.append(el("p", "qualified-review-note", field.qualified_review_note));
    if (field.limitation) value.append(el("p", "field-limitation", field.limitation));
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
    tr.append(el("th", "", text(field.label, "Field")));
    const td = document.createElement("td");
    td.append(renderReportValue(field.value, { ...context, field }));
    if (field.qualified_review_note) td.append(el("p", "qualified-review-note", field.qualified_review_note));
    if (field.limitation) td.append(el("p", "field-limitation", field.limitation));
    tr.append(td);
    tbody.append(tr);
  });
  table.append(tbody);
  return wrapTable(table, "field-table-scroll");
}

function renderReportValue(value, context = {}) {
  if (value === null || value === undefined || value === "") return el("span", "small-muted", "Not visible in reviewed public materials.");
  if (Array.isArray(value)) return renderArrayValue(value, context);
  if (typeof value === "object") {
    if (isTruncatedRowset(value)) return renderTruncatedRowset(value, context);
    return renderKeyValueTable(value, context);
  }
  return el("span", "field-value", String(value));
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
    tr.append(el("th", "", titleCase(entry[0])));
    const td = document.createElement("td");
    td.append(renderReportValue(entry[1], context));
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
  if (object.display_rule) block.append(el("p", "small-muted", object.display_rule));
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
    el("div", "report-deck-title", title),
    el("div", "report-deck-count", `${items.length} items · Showing ${items.length ? start + 1 : 0}-${end}`)
  );
  if (items.length > DECK_PAGE_SIZE) {
    const actions = el("div", "report-deck-actions");
    const prev = deckButton("Previous", "prev", page <= 0 || expanded);
    const next = deckButton("Next", "next", page >= pageCount - 1 || expanded);
    const toggle = deckButton(expanded ? "Collapse" : "Show all", expanded ? "collapse" : "show_all", false);
    actions.append(prev, next, toggle);
    header.append(actions);
  }

  const cards = el("div", "report-deck-cards");
  shown.forEach(function (item, index) {
    cards.append(renderFindingCard(item, { ...context, ordinal: start + index + 1 }));
  });

  replaceChildren(block, [header, cards]);
  updateDeckStatus();
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
  const card = el("article", "report-finding-card " + (profile.type ? "report-card-" + profile.type : ""));
  const header = el("div", "report-finding-header");
  const ref = firstValue(item, ["Exposure_ID", "display_exposure_id", "Clarification_ID", "Request_ID", "Threat_ID", "Artifact", "Reference"]) || `Item ${context.ordinal}`;
  header.append(el("div", "report-finding-ref", String(ref)));
  const chips = el("div", "report-finding-chips");
  profile.primary.forEach(function (key) {
    const value = getByKey(item, key);
    if (value !== undefined && value !== null && value !== "") chips.append(el("span", "report-finding-chip", `${titleCase(key)}: ${stringifyCell(value)}`));
  });
  header.append(chips);
  card.append(header);

  const title = firstValue(item, ["Threat_Name", "Finding", "Question", "Review_Point", "Document", "Artifact", "Field"]) || profile.title || "Report item";
  card.append(el("h4", "report-finding-title", String(title)));

  const layout = el("div", "report-finding-layout");
  layout.append(renderDetailPanel("Finding / action", item, profile.left), renderDetailPanel("Evidence / basis", item, profile.right));
  card.append(layout);

  const used = new Set([].concat(profile.primary, profile.left, profile.right).map(normalizeKey));
  const remaining = visibleEntries(item).filter(function (entry) { return !used.has(normalizeKey(entry[0])); });
  if (remaining.length) {
    const details = el("div", "report-detail-grid");
    remaining.forEach(function (entry) {
      const row = el("div", "report-detail-item");
      row.append(el("div", "report-detail-label", titleCase(entry[0])), el("div", "report-detail-value", stringifyCell(entry[1])));
      details.append(row);
    });
    card.append(details);
  }
  return card;
}

function renderDetailPanel(label, item, keys) {
  const panel = el("div", "report-context-panel");
  panel.append(el("div", "report-context-label", label));
  const rows = keys.map(function (key) { return [key, getByKey(item, key)]; }).filter(function (entry) { return entry[1] !== undefined && entry[1] !== null && entry[1] !== ""; });
  if (!rows.length) {
    panel.append(el("div", "small-muted", "No visible value emitted."));
    return panel;
  }
  rows.forEach(function (entry) {
    const row = el("div", "report-context-row");
    row.append(el("span", "report-context-key", titleCase(entry[0])), el("span", "report-context-value", stringifyCell(entry[1])));
    panel.append(row);
  });
  return panel;
}

function renderRowsetTable(items) {
  const columns = deriveColumns(items);
  const table = el("table", "report-table rowset-table full-public-table");
  table.style.minWidth = Math.max(960, columns.length * 170) + "px";
  const thead = document.createElement("thead");
  const header = document.createElement("tr");
  columns.forEach(function (column) { header.append(el("th", "", titleCase(column))); });
  thead.append(header);
  const tbody = document.createElement("tbody");
  items.forEach(function (item) {
    const tr = document.createElement("tr");
    columns.forEach(function (column) { tr.append(el("td", "", stringifyCell(getByKey(item, column)))); });
    tbody.append(tr);
  });
  table.append(thead, tbody);
  return wrapTable(table, "rowset-table-scroll", "Full public table — scroll horizontally to view all columns.");
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
  if (!deckCount) els.deckStatus.textContent = "Report uses compact tables for this payload.";
  else els.deckStatus.textContent = `${deckCount} paged report deck${deckCount === 1 ? "" : "s"} active · 5 items at a time · print expands all.`;
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
  const priority = ["display_ref", "display_exposure_id", "Exposure_ID", "Threat_ID", "Threat_Name", "Subcat", "Status", "Priority", "Pain_Tier", "Pain_Depth", "Review_Route", "Document", "Locator_ID", "Unit_Heading", "Field", "Review_Point", "Jurisdiction_Layer", "Public_Footprint_Status", "Evidence_Summary", "Review_Action", "Limitation"];
  const seen = new Set();
  const columns = [];
  priority.forEach(function (key) { if (!FORBIDDEN_VISIBLE_KEYS.has(key) && items.some(function (item) { return hasKey(item, key); })) { seen.add(normalizeKey(key)); columns.push(key); } });
  items.forEach(function (item) { Object.keys(item || {}).forEach(function (key) { if (!FORBIDDEN_VISIBLE_KEYS.has(key) && !seen.has(normalizeKey(key))) { seen.add(normalizeKey(key)); columns.push(key); } }); });
  return columns.length ? columns : Object.keys(items[0] || {}).filter(function (key) { return !FORBIDDEN_VISIBLE_KEYS.has(key); });
}

function stringifyCell(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.map(stringifyCell).join("; ");
  if (typeof value === "object") return visibleEntries(value).map(function (entry) { return titleCase(entry[0]) + ": " + stringifyCell(entry[1]); }).join("; ");
  return String(value);
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
    tr.append(el("th", "", entry[0]));
    tr.append(el("td", "", String(entry[1])));
    tbody.append(tr);
  });
  table.append(tbody);
  return wrapTable(table, "shell-meta-table-scroll");
}

function reportMetaTable(title, rows) {
  const block = el("div", "meta-table-block");
  block.append(el("h3", "", title));
  block.append(renderRowsetTable(rows));
  return block;
}

function defaultDeckProfile(context = {}) {
  return {
    type: "default",
    title: context.field?.label || context.subsection?.subsection_title || "Report items",
    primary: ["display_ref", "Exposure_ID", "Threat_ID", "Threat_Name", "Status", "Priority", "Document", "Field"],
    left: ["Finding", "Review_Point", "Question", "Document", "Field", "Review_Action"],
    right: ["Evidence_Summary", "Basis_Proof", "Expected_Source_Location", "Limitation", "Reviewer_Note"]
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

function hasKey(object, key) { return Object.keys(object || {}).some(function (actual) { return normalizeKey(actual) === normalizeKey(key); }); }
function getByKey(object, key) { const actual = Object.keys(object || {}).find(function (candidate) { return normalizeKey(candidate) === normalizeKey(key); }); return actual ? object[actual] : undefined; }
function normalizeKey(key) { return String(key || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }
function queryParam(name) { return new URLSearchParams(window.location.search).get(name); }
function fail(message) { els.title.textContent = "Report unavailable"; els.subtitle.textContent = message; els.body.textContent = ""; }
function text(value, fallback) { return value === undefined || value === null || value === "" ? fallback : String(value); }
function asArray(value) { return Array.isArray(value) ? value : []; }
function titleCase(value) { return String(value || "").replace(/[_-]+/g, " ").replace(/\b\w/g, function (letter) { return letter.toUpperCase(); }); }
function slug(value) { return String(value || "section").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function el(tag, className, textContent) { const node = document.createElement(tag); if (className) node.className = className; if (textContent !== undefined && textContent !== "") node.textContent = textContent; return node; }
function replaceChildren(parent, children) { parent.replaceChildren(...children); }
