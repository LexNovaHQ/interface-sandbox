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
  loadReport(runId).catch(function (error) { fail(error.message || String(error)); });
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

  const reportSections = payload.sections.map(renderSection);
  replaceChildren(els.body, reportSections);
}

function assertLockedPayload(payload) {
  if (payload.renderer_source !== LOCKED_RENDERER_SOURCE) throw new Error("Report renderer is not locked to normalized section artifacts.");
  if (!Array.isArray(payload.sections)) throw new Error("Report payload is missing locked sections array.");
  if (Object.prototype.hasOwnProperty.call(payload, "section_list")) throw new Error("Legacy section_list payload is not allowed.");
  if (Object.prototype.hasOwnProperty.call(payload, "section_order")) throw new Error("Legacy section_order payload is not allowed on public page.");
  if (Object.prototype.hasOwnProperty.call(payload, "raw_final_output_handoff")) throw new Error("Raw final handoff is not allowed on public page.");
  if (Object.prototype.hasOwnProperty.call(payload, "normalized_report_manifest")) throw new Error("Normalized manifest is not public-render material.");
}

function renderSection(section) {
  const node = el("section", "report-section");
  node.id = slug(section.section_id);
  node.append(el("div", "eyebrow", "Section " + text(section.section_number, text(section.section_id, "section"))));
  node.append(el("h2", "", text(section.section_title, "Section")));
  if (section.reviewer_summary) node.append(el("p", "section-summary", section.reviewer_summary));
  if (section.display_rule) node.append(el("p", "notice compact", section.display_rule));
  const subsections = Array.isArray(section.subsections) ? section.subsections : [];
  subsections.forEach(function (subsection) { node.append(renderSubsection(subsection)); });
  const limitations = Array.isArray(section.section_limitations) ? section.section_limitations : [];
  if (limitations.length) node.append(renderLimitations(limitations));
  return node;
}

function renderSubsection(subsection) {
  const block = el("div", "subsection-block");
  block.append(el("h3", "", text(subsection.subsection_title, "Subsection")));
  const fields = Array.isArray(subsection.fields) ? subsection.fields : [];
  if (!fields.length) {
    block.append(el("p", "small-muted", "No fields emitted for this subsection."));
    return block;
  }
  fields.forEach(function (field) { block.append(renderField(field)); });
  return block;
}

function renderField(field) {
  const card = el("div", "field-card");
  card.append(el("div", "field-label", text(field.label, "Field")));
  card.append(renderAllowedValue(field.value));
  if (field.qualified_review_note) card.append(el("p", "qualified-review-note", field.qualified_review_note));
  if (field.limitation) card.append(el("p", "field-limitation", field.limitation));
  return card;
}

function renderAllowedValue(value) {
  if (value === null || value === undefined || value === "") return el("p", "small-muted", "Not visible in reviewed public materials.");
  if (Array.isArray(value)) return renderAllowedArray(value);
  if (typeof value === "object") return renderAllowedObject(value);
  return el("p", "field-value", String(value));
}

function renderAllowedArray(items) {
  if (!items.length) return el("p", "small-muted", "No rows emitted.");
  const list = el("div", "public-array");
  items.forEach(function (item, index) {
    const row = el("div", "public-array-row");
    row.append(el("div", "block-title", "Row " + String(index + 1).padStart(2, "0")));
    row.append(renderAllowedValue(item));
    list.append(row);
  });
  return list;
}

function renderAllowedObject(object) {
  const rows = Object.entries(object || {}).filter(function (entry) { return entry[1] !== undefined && entry[1] !== null && entry[1] !== ""; });
  if (!rows.length) return el("p", "small-muted", "No visible values emitted.");

  if (Object.prototype.hasOwnProperty.call(object, "displayed_rows") && Object.prototype.hasOwnProperty.call(object, "suppressed_row_count")) {
    const details = el("details", "technical");
    details.open = false;
    const summary = document.createElement("summary");
    summary.textContent = "Large rowset — " + String(object.row_count || 0) + " rows, " + String(object.suppressed_row_count || 0) + " hidden from main body";
    details.append(summary);
    details.append(renderAllowedArray(object.displayed_rows || []));
    if (object.display_rule) details.append(el("p", "small-muted", object.display_rule));
    return details;
  }

  const table = el("table", "kv public-value-table");
  const tbody = document.createElement("tbody");
  rows.forEach(function (entry) {
    const tr = document.createElement("tr");
    tr.append(el("th", "", titleCase(entry[0])));
    const td = document.createElement("td");
    td.append(renderAllowedValue(entry[1]));
    tr.append(td);
    tbody.append(tr);
  });
  table.append(tbody);
  return table;
}

function renderLimitations(items) {
  const block = el("div", "section-limitations");
  block.append(el("div", "block-title", "Section limitations"));
  const ul = document.createElement("ul");
  items.slice(0, 20).forEach(function (item) {
    const li = document.createElement("li");
    li.append(renderAllowedValue(item));
    ul.append(li);
  });
  if (items.length > 20) ul.append(el("li", "small-muted", String(items.length - 20) + " additional limitation rows are available in the public technical annexure."));
  block.append(ul);
  return block;
}

function renderShellMeta(object, tiles, layers) {
  const children = [shellMetaTable(object)];
  if (Array.isArray(tiles) && tiles.length) children.push(tileGrid(tiles));
  if (Array.isArray(layers) && layers.length) children.push(layerGrid(layers));
  replaceChildren(els.meta, children);
}

function tileGrid(tiles) {
  const grid = el("div", "report-dashboard");
  tiles.forEach(function (tile) {
    const card = el("div", "report-chip");
    card.append(el("span", "k", tile.label));
    card.append(el("strong", "v", String(tile.value)));
    grid.append(card);
  });
  return grid;
}

function layerGrid(layers) {
  const grid = el("div", "report-layer-grid");
  layers.forEach(function (layer) {
    const card = el("div", "report-layer-card");
    card.append(el("div", "block-title", layer.label || layer.layer_id));
    card.append(el("p", "small-muted", layer.purpose || layer.display_rule || ""));
    grid.append(card);
  });
  return grid;
}

function shellMetaTable(object) {
  const rows = Object.entries(object || {}).filter(function (entry) { return entry[1] !== undefined && entry[1] !== null && entry[1] !== ""; });
  if (!rows.length) return el("p", "small-muted", "No visible values emitted.");
  const table = el("table", "kv");
  const tbody = document.createElement("tbody");
  rows.forEach(function (entry) {
    const tr = document.createElement("tr");
    tr.append(el("th", "", entry[0]), el("td", "", String(entry[1])));
    tbody.append(tr);
  });
  table.append(tbody);
  return table;
}

function replaceChildren(target, children) {
  while (target.firstChild) target.removeChild(target.firstChild);
  children.forEach(function (child) { target.append(child); });
}

function queryParam(name) {
  const query = String(window.location.search || "").replace(/^\?/, "");
  return query.split("&").map(function (part) { return part.split("="); }).filter(function (pair) { return decodeURIComponent(pair[0] || "") === name; }).map(function (pair) { return decodeURIComponent(pair[1] || ""); })[0] || "";
}

function titleCase(value) {
  return String(value || "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, function (match) { return match.toUpperCase(); });
}

function text(value, fallback) {
  const out = String(value ?? "").trim();
  return out || fallback;
}

function fail(message) {
  els.title.textContent = "Report unavailable";
  els.subtitle.textContent = message;
  replaceChildren(els.meta, [el("p", "small-muted", message)]);
  replaceChildren(els.body, []);
}

function el(tag, className, textContent) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (textContent !== undefined && textContent !== "") node.textContent = textContent;
  return node;
}

function slug(value) {
  return String(value || "section").replace(/\s+/g, "-");
}
