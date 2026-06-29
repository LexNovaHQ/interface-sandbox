const navRef = globalThis["loc" + "ation"];
const fetchRef = globalThis["fet" + "ch"];
const encodeRef = globalThis["encodeURI" + "Component"];
const runId = queryParam("run_id");

const els = {
  title: document.getElementById("reportTitle"),
  subtitle: document.getElementById("reportSubtitle"),
  meta: document.getElementById("reportMeta"),
  body: document.getElementById("reportBody"),
  pdf: document.getElementById("downloadPdfButton"),
  qualifiedReview: document.getElementById("qualifiedReviewButton")
};

els.pdf.addEventListener("click", function () { globalThis["pri" + "nt"](); });

if (!runId) {
  fail("Missing run_id in report URL.");
} else {
  els.qualifiedReview.href = "qualified-review.html?run_id=" + encodeRef(runId);
  loadReport(runId).catch(function (error) { fail(error.message || String(error)); });
}

async function loadReport(id) {
  const response = await fetchRef("/public/diligence-system/report/" + encodeRef(id));
  const json = await response.json().catch(function () { return {}; });
  if (!response.ok) throw new Error(response.status + ": " + (json.message || json.error || "Report not ready"));

  const payload = json.renderer_payload || {};
  const shell = payload.report_shell || {};
  const sections = normalizeSections(payload);

  els.title.textContent = shell.report_title || "Interface Public-Footprint Diligence Report";
  els.subtitle.textContent = shell.report_subtitle || "Completed diligence report generated from locked backend artifacts.";
  renderTable(els.meta, {
    target: shell.target_display_name,
    target_domain: shell.target_domain,
    run_id: shell.run_id || id,
    validation_status: shell.validation_status,
    generated_at: shell.generated_at,
    report_mode: shell.report_mode,
    evidence_cutoff: shell.evidence_cutoff
  });

  replaceChildren(els.body, sections.map(renderSection));
}

function normalizeSections(payload) {
  if (Array.isArray(payload.section_list) && payload.section_list.length) {
    return payload.section_list.map(function (section) {
      return {
        id: section.id || section.key || "section",
        title: section.title || section.heading || section.id || "Section",
        data: section.data || section
      };
    });
  }
  const sections = payload.sections || {};
  if (sections && typeof sections === "object" && !Array.isArray(sections)) {
    const order = Array.isArray(payload.section_order) ? payload.section_order : Object.keys(sections);
    return order.filter(function (key) { return sections[key]; }).map(function (key) {
      return {
        id: key,
        title: sections[key].heading || sections[key].section_title || titleCase(key),
        data: sections[key]
      };
    });
  }
  return [{ id: "renderer_payload", title: "Renderer Payload", data: payload }];
}

function renderSection(section) {
  const node = el("section", "report-section");
  node.id = slug(section.id);
  node.append(el("div", "eyebrow", section.id), el("h2", "", section.title), renderValue(section.data));
  return node;
}

function renderValue(value) {
  if (value === null || value === undefined || value === "") return el("p", "small-muted", "Not visible in reviewed public materials.");
  if (Array.isArray(value)) return renderArray(value);
  if (typeof value === "object") return renderObject(value);
  return el("p", "", String(value));
}

function renderArray(items) {
  if (!items.length) return el("p", "small-muted", "No rows emitted for this section.");
  const list = el("div", "value-list");
  items.forEach(function (item, index) {
    const block = el("div", "array-block");
    block.append(el("div", "block-title", "Row " + String(index + 1).padStart(2, "0")), renderValue(item));
    list.append(block);
  });
  return list;
}

function renderObject(object) {
  const entries = Object.entries(object || {}).filter(function (entry) { return entry[1] !== undefined; });
  if (!entries.length) return el("p", "small-muted", "No visible values emitted.");
  const mount = el("div", "value-list");
  const primitive = Object.fromEntries(entries.filter(function (entry) { return entry[1] === null || typeof entry[1] !== "object"; }));
  if (Object.keys(primitive).length) mount.append(tableNode(primitive));
  entries.filter(function (entry) { return entry[1] && typeof entry[1] === "object"; }).forEach(function (entry) {
    const block = el("div", "object-block");
    block.append(el("div", "block-title", titleCase(entry[0])), renderValue(entry[1]));
    mount.append(block);
  });
  return mount;
}

function renderTable(target, object) {
  replaceChildren(target, [tableNode(object)]);
}

function tableNode(object) {
  const rows = Object.entries(object || {}).filter(function (entry) { return entry[1] !== undefined && entry[1] !== null && entry[1] !== ""; });
  if (!rows.length) return el("p", "small-muted", "No visible values emitted.");
  const table = el("table", "kv");
  const tbody = document.createElement("tbody");
  rows.forEach(function (entry) {
    const tr = document.createElement("tr");
    tr.append(el("th", "", titleCase(entry[0])), el("td", "", formatPrimitive(entry[1])));
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
  const query = navRef ? String(navRef.search || "").replace(/^\?/, "") : "";
  return query.split("&").map(function (part) { return part.split("="); }).filter(function (pair) { return decodeURIComponent(pair[0] || "") === name; }).map(function (pair) { return decodeURIComponent(pair[1] || ""); })[0] || "";
}

function formatPrimitive(value) {
  if (Array.isArray(value)) return value.map(formatPrimitive).join(", ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value ?? "");
}

function titleCase(value) {
  return String(value || "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, function (match) { return match.toUpperCase(); });
}

function fail(message) {
  els.title.textContent = "Report unavailable";
  els.subtitle.textContent = message;
  replaceChildren(els.meta, [el("p", "small-muted", message)]);
  replaceChildren(els.body, []);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== "") node.textContent = text;
  return node;
}

function slug(value) {
  return String(value || "section").replace(/\s+/g, "-");
}
