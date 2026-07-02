const runId = queryParam("run_id");
const LOCKED_RENDERER_SOURCE = "normalized_section_artifacts_only";

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
  }, payload.dashboard_tiles || [], payload.report_layers || []);
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
  block.append(renderAllowedValue({Required_state:"current_phase = COMPLETE or status = COMPLETE", Current_state:(run.current_phase||"Unknown")+" / "+(run.status||"Unknown"), Next_action:"Deploy latest main and rerun the pipeline from the failed phase or create a fresh run."}));
  replaceChildren(els.body, [block]);
}

function assertLockedPayload(payload) {
  if (payload.renderer_source !== LOCKED_RENDERER_SOURCE) throw new Error("Report renderer is not locked to normalized section artifacts.");
  if (!Array.isArray(payload.sections)) throw new Error("Report payload is missing locked sections array.");
  ["section_list","section_order","raw_final_output_handoff","normalized_report_manifest"].forEach(function(k){ if(Object.prototype.hasOwnProperty.call(payload,k)) throw new Error("Legacy public report payload key not allowed: "+k); });
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
  const limitations = asArray(section.section_limitations);
  if (limitations.length) node.append(renderLimitations(limitations));
  return node;
}
function renderSubsection(subsection) {
  const block = el("div", "subsection-block law-subsection");
  block.append(el("h3", "", text(subsection.subsection_title, "Subsection")));
  const fields = asArray(subsection.fields);
  if (!fields.length) { block.append(el("p", "small-muted", "No fields emitted for this subsection.")); return block; }
  const tableFields = fields.filter(function (field) { return isTableArray(field.value); });
  const ordinaryFields = fields.filter(function (field) { return !isTableArray(field.value); });
  if (ordinaryFields.length) block.append(renderFieldsTable(ordinaryFields));
  tableFields.forEach(function (field) { block.append(renderField(field)); });
  return block;
}
function renderField(field) { const card = el("div", "field-card law-field-block"); card.append(el("div", "field-label", text(field.label, "Field"))); card.append(renderAllowedValue(field.value)); if (field.qualified_review_note) card.append(el("p", "qualified-review-note", field.qualified_review_note)); if (field.limitation) card.append(el("p", "field-limitation", field.limitation)); return card; }
function renderFieldsTable(fields) { const table = el("table", "report-table field-table"); const tbody = document.createElement("tbody"); fields.forEach(function (field) { const tr = document.createElement("tr"); tr.append(el("th", "", text(field.label, "Field"))); const td = document.createElement("td"); td.append(renderAllowedValue(field.value)); if (field.qualified_review_note) td.append(el("p", "qualified-review-note", field.qualified_review_note)); if (field.limitation) td.append(el("p", "field-limitation", field.limitation)); tr.append(td); tbody.append(tr); }); table.append(tbody); return table; }
function renderAllowedValue(value) { if (value === null || value === undefined || value === "") return el("span", "small-muted", "Not visible in reviewed public materials."); if (Array.isArray(value)) return renderAllowedArray(value); if (typeof value === "object") return renderAllowedObject(value); return el("span", "field-value", String(value)); }
function renderAllowedArray(items) { if (!items.length) return el("span", "small-muted", "No entries emitted."); if (isTableArray(items)) return renderRowsetTable(items); const list = document.createElement("ul"); list.className = "report-list"; items.forEach(function (item) { const li = document.createElement("li"); li.append(renderAllowedValue(item)); list.append(li); }); return list; }
function renderAllowedObject(object) { const rows = Object.entries(object || {}).filter(function (entry) { return entry[1] !== undefined && entry[1] !== null && entry[1] !== ""; }); if (!rows.length) return el("span", "small-muted", "No visible values emitted."); if (Object.prototype.hasOwnProperty.call(object, "displayed_rows") && Object.prototype.hasOwnProperty.call(object, "suppressed_row_count")) { const block = el("div", "truncated-table-block"); block.append(el("p", "small-muted", "Large table: " + String(object.row_count || 0) + " entries. " + String(object.suppressed_row_count || 0) + " additional entries are preserved in the public technical annexure.")); block.append(renderAllowedArray(object.displayed_rows || [])); if (object.display_rule) block.append(el("p", "small-muted", object.display_rule)); return block; } const table = el("table", "report-table kv public-value-table"); const tbody = document.createElement("tbody"); rows.forEach(function (entry) { const tr = document.createElement("tr"); tr.append(el("th", "", titleCase(entry[0]))); const td = document.createElement("td"); td.append(renderAllowedValue(entry[1])); tr.append(td); tbody.append(tr); }); table.append(tbody); return table; }
function renderRowsetTable(items) { const columns = deriveColumns(items); const table = el("table", "report-table rowset-table"); const thead = document.createElement("thead"); const header = document.createElement("tr"); columns.forEach(function (column) { header.append(el("th", "", titleCase(column))); }); thead.append(header); const tbody = document.createElement("tbody"); items.forEach(function (item) { const tr = document.createElement("tr"); columns.forEach(function (column) { tr.append(el("td", "", stringifyCell(item[column]))); }); tbody.append(tr); }); table.append(thead, tbody); return table; }
function isTableArray(value) { return Array.isArray(value) && value.length > 0 && value.every(function (item) { return item && typeof item === "object" && !Array.isArray(item); }); }
function deriveColumns(items) { const priority = ["Exposure_ID", "Threat_ID", "Threat_Name", "Subcat", "Status", "Severity", "Review_Route", "Question_ID", "Document", "Field", "Value", "Limitation"]; const seen = new Set(); const columns = []; priority.forEach(function (key) { if (items.some(function (item) { return Object.prototype.hasOwnProperty.call(item, key); })) { seen.add(key); columns.push(key); } }); items.forEach(function (item) { Object.keys(item || {}).forEach(function (key) { if (!seen.has(key) && columns.length < 10) { seen.add(key); columns.push(key); } }); }); return columns.length ? columns : Object.keys(items[0] || {}); }
function stringifyCell(value) { if (value === null || value === undefined || value === "") return "—"; if (Array.isArray(value)) return value.map(stringifyCell).join("; "); if (typeof value === "object") return Object.entries(value).map(function (entry) { return titleCase(entry[0]) + ": " + stringifyCell(entry[1]); }).join("; "); return String(value); }
function renderLimitations(items) { const block = el("div", "section-limitations"); block.append(el("div", "block-title", "Section limitations")); block.append(renderAllowedArray(items.slice(0, 20))); if (items.length > 20) block.append(el("p", "small-muted", String(items.length - 20) + " additional limitation entries are available in the public technical annexure.")); return block; }
function renderShellMeta(object, tiles, layers) { const children = [shellMetaTable(object)]; if (Array.isArray(tiles) && tiles.length) children.push(reportMetaTable("Diligence Snapshot", tiles.map(function (tile) { return { Metric: tile.label, Value: tile.value }; }))); if (Array.isArray(layers) && layers.length) children.push(reportMetaTable("Report Layers", layers.map(function (layer) { return { Layer: layer.label || layer.layer_id, Purpose: layer.purpose || layer.display_rule || "", Status: layer.canonical ? "Primary report" : layer.separate_branch ? "Separate workspace" : "Supporting layer" }; }))); replaceChildren(els.meta, children); }
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
