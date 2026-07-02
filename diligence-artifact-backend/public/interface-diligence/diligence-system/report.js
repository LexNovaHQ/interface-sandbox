const runId = queryParam("run_id");
const LOCKED_RENDERER_SOURCE = "normalized_section_artifacts_only";
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
  annexure: document.getElementById("technicalAnnexureButton")
};

els.pdf.addEventListener("click", function () { window.print(); });

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
  replaceChildren(els.body, payload.sections.map(renderSection));
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
  const block = el("section", "report-section law-report-section");
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

function renderSection(section) {
  const node = el("section", "report-section law-report-section");
  node.id = slug(section.section_id);
  const number = text(section.section_number, "");
  node.append(el("div", "eyebrow", number ? "Section " + number : "Report Section"));
  node.append(el("h2", "", (number ? number + ". " : "") + text(section.section_title, "Section")));
  if (section.reviewer_summary) node.append(el("p", "section-summary", section.reviewer_summary));
  if (section.display_rule) node.append(el("p", "notice compact", section.display_rule));
  asArray(section.subsections).forEach(function (subsection) { node.append(renderSubsection(subsection)); });
  return node;
}

function renderSubsection(subsection) {
  const block = el("div", "subsection-block law-subsection");
  block.append(el("h3", "", text(subsection.subsection_title, "Subsection")));
  const fields = asArray(subsection.fields);
  if (!fields.length) { block.append(el("p", "small-muted", "No fields emitted for this subsection.")); return block; }
  const tableFields = fields.filter(function (field) { return isTableValue(field.value); });
  const ordinaryFields = fields.filter(function (field) { return !isTableValue(field.value); });
  if (ordinaryFields.length) block.append(renderFieldsTable(ordinaryFields));
  tableFields.forEach(function (field) { block.append(renderField(field)); });
  return block;
}

function renderField(field) {
  const card = el("div", "field-card law-field-block");
  card.append(el("div", "field-label", text(field.label, "Field")));
  card.append(renderReportValue(field.value));
  if (field.qualified_review_note) card.append(el("p", "qualified-review-note", field.qualified_review_note));
  if (field.limitation) card.append(el("p", "field-limitation", field.limitation));
  return card;
}

function renderFieldsTable(fields) {
  const table = el("table", "report-table field-table");
  const tbody = document.createElement("tbody");
  fields.forEach(function (field) {
    const tr = document.createElement("tr");
    tr.append(el("th", "", text(field.label, "Field")));
    const td = document.createElement("td");
    td.append(renderReportValue(field.value));
    if (field.qualified_review_note) td.append(el("p", "qualified-review-note", field.qualified_review_note));
    if (field.limitation) td.append(el("p", "field-limitation", field.limitation));
    tr.append(td);
    tbody.append(tr);
  });
  table.append(tbody);
  return table;
}

function renderReportValue(value) {
  if (value === null || value === undefined || value === "") return el("span", "small-muted", "Not visible in reviewed public materials.");
  if (Array.isArray(value)) return renderArrayValue(value);
  if (typeof value === "object") {
    if (isTruncatedRowset(value)) return renderTruncatedRowset(value);
    return renderKeyValueTable(value);
  }
  return el("span", "field-value", String(value));
}

function renderArrayValue(items) {
  const cleaned = items.filter(function (item) { return !isSuppressedRow(item); });
  if (!cleaned.length) return el("span", "small-muted", "No entries emitted.");
  if (isTableValue(cleaned)) return renderRowsetTable(cleaned);
  const list = document.createElement("ul");
  list.className = "report-list";
  cleaned.forEach(function (item) { const li = document.createElement("li"); li.append(renderReportValue(item)); list.append(li); });
  return list;
}

function renderKeyValueTable(object) {
  const rows = visibleEntries(object);
  if (!rows.length) return el("span", "small-muted", "No visible values emitted.");
  const table = el("table", "report-table kv public-value-table");
  const tbody = document.createElement("tbody");
  rows.forEach(function (entry) {
    const tr = document.createElement("tr");
    tr.append(el("th", "", titleCase(entry[0])));
    const td = document.createElement("td");
    td.append(renderReportValue(entry[1]));
    tr.append(td);
    tbody.append(tr);
  });
  table.append(tbody);
  return table;
}

function renderTruncatedRowset(object) {
  const block = el("div", "truncated-table-block");
  block.append(el("p", "small-muted", "Large table: " + String(object.row_count || 0) + " entries. " + String(object.suppressed_row_count || 0) + " additional entries are preserved in the public technical annexure."));
  block.append(renderArrayValue(object.displayed_rows || []));
  if (object.display_rule) block.append(el("p", "small-muted", object.display_rule));
  return block;
}

function renderRowsetTable(items) {
  const columns = deriveColumns(items);
  const table = el("table", "report-table rowset-table");
  const thead = document.createElement("thead");
  const header = document.createElement("tr");
  columns.forEach(function (column) { header.append(el("th", "", titleCase(column))); });
  thead.append(header);
  const tbody = document.createElement("tbody");
  items.forEach(function (item) {
    const tr = document.createElement("tr");
    columns.forEach(function (column) { tr.append(el("td", "", stringifyCell(item[column]))); });
    tbody.append(tr);
  });
  table.append(thead, tbody);
  return table;
}

function isTableValue(value) { return Array.isArray(value) && value.length > 0 && value.every(function (item) { return item && typeof item === "object" && !Array.isArray(item); }); }
function isTruncatedRowset(value) { return value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, "displayed_rows") && Object.prototype.hasOwnProperty.call(value, "suppressed_row_count"); }
function isSuppressedRow(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value) && (value.display_in_main_report === false || value.technical_annexure_only === true)); }

function deriveColumns(items) {
  const priority = ["display_ref", "display_exposure_id", "Exposure_ID", "Threat_ID", "Threat_Name", "Subcat", "Status", "Priority", "Pain_Tier", "Pain_Depth", "Review_Route", "Document", "Field", "Review_Action", "Limitation"];
  const seen = new Set();
  const columns = [];
  priority.forEach(function (key) { if (!FORBIDDEN_VISIBLE_KEYS.has(key) && items.some(function (item) { return Object.prototype.hasOwnProperty.call(item, key); })) { seen.add(key); columns.push(key); } });
  items.forEach(function (item) { Object.keys(item || {}).forEach(function (key) { if (!FORBIDDEN_VISIBLE_KEYS.has(key) && !seen.has(key) && columns.length < 10) { seen.add(key); columns.push(key); } }); });
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
  if (Array.isArray(tiles) && tiles.length) children.push(reportMetaTable("Diligence Snapshot", tiles.map(function (tile) { return { Metric: tile.label, Value: tile.value }; })));
  replaceChildren(els.meta, children);
}
function reportMetaTable(title, rows) { const block = el("div", "report-meta-table-block"); block.append(el("div", "block-title", title)); block.append(renderRowsetTable(rows)); return block; }
function shellMetaTable(object) { const rows = Object.entries(object || {}).filter(function (entry) { return entry[1] !== undefined && entry[1] !== null && entry[1] !== ""; }); if (!rows.length) return el("p", "small-muted", "No visible values emitted."); const table = el("table", "report-table kv shell-meta-table"); const tbody = document.createElement("tbody"); rows.forEach(function (entry) { const tr = document.createElement("tr"); tr.append(el("th", "", entry[0]), el("td", "", String(entry[1]))); tbody.append(tr); }); table.append(tbody); return table; }
function replaceChildren(target, children) { while (target.firstChild) target.removeChild(target.firstChild); children.forEach(function (child) { target.append(child); }); }
function queryParam(name) { const query = String(window.location.search || "").replace(/^\?/, ""); return query.split("&").map(function (part) { return part.split("="); }).filter(function (pair) { return decodeURIComponent(pair[0] || "") === name; }).map(function (pair) { return decodeURIComponent(pair[1] || ""); })[0] || ""; }
function titleCase(value) { return String(value || "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, function (match) { return match.toUpperCase(); }); }
function text(value, fallback) { const out = String(value ?? "").trim(); return out || fallback; }
function fail(message) { els.title.textContent = "Report unavailable"; els.subtitle.textContent = message; replaceChildren(els.meta, [el("p", "small-muted", message)]); replaceChildren(els.body, []); }
function el(tag, className, textContent) { const node = document.createElement(tag); if (className) node.className = className; if (textContent !== undefined && textContent !== "") node.textContent = textContent; return node; }
function slug(value) { return String(value || "section").replace(/\s+/g, "-"); }
function asArray(value) { return Array.isArray(value) ? value : []; }
