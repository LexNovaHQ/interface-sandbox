const runId = queryParam("run_id");

const els = {
  title: document.getElementById("annexureTitle"),
  subtitle: document.getElementById("annexureSubtitle"),
  meta: document.getElementById("annexureMeta"),
  table: document.getElementById("artifactTable"),
  back: document.getElementById("backToReportButton"),
  json: document.getElementById("manifestJsonButton")
};

if (!runId) {
  fail("Missing run_id in technical annexure URL.");
} else {
  const apiPath = "/public/diligence-system/technical-annexure/" + encodeURIComponent(runId);
  els.back.href = "report.html?run_id=" + encodeURIComponent(runId);
  els.json.href = apiPath;
  loadAnnexure(apiPath).catch(function (error) { fail(error.message || String(error)); });
}

async function loadAnnexure(apiPath) {
  const response = await fetch(apiPath);
  const json = await response.json().catch(function () { return {}; });
  if (!response.ok) throw new Error(response.status + ": " + (json.message || json.error || "Technical annexure not ready"));
  assertAnnexurePayload(json);
  els.title.textContent = json.public_label || "Public Technical Annexure";
  els.subtitle.textContent = "Run " + text(json.run_id, runId) + " · " + text(json.target, "Target not specified");
  renderMeta(json);
  renderArtifactTable(json.artifacts || []);
}

function assertAnnexurePayload(payload) {
  if (payload.layer_id !== "layer_2_public_technical_annexure") throw new Error("Technical annexure payload is not Layer 2.");
  if (payload.report_body_inlines_full_payloads !== false) throw new Error("Technical annexure contract violation: report body must not inline full payloads.");
  if (!Array.isArray(payload.artifacts)) throw new Error("Technical annexure manifest missing artifacts array.");
}

function renderMeta(payload) {
  replaceChildren(els.meta, [
    kvTable({
      "Run ID": payload.run_id,
      "Target": payload.target,
      "Target URL": payload.target_url,
      "Status": payload.status,
      "Current phase": payload.current_phase,
      "Expected pack": payload.expected_pack_name,
      "Manifest only": payload.manifest_only ? "Yes" : "No",
      "Full payloads inline": payload.report_body_inlines_full_payloads ? "Yes" : "No",
      "Artifact rows": payload.artifact_count,
      "Exclusion rule": payload.exclusion_rule
    })
  ]);
}

function renderArtifactTable(artifacts) {
  if (!artifacts.length) {
    replaceChildren(els.table, [el("p", "small-muted", "No artifacts listed for this run.")]);
    return;
  }
  const table = el("table", "kv public-value-table");
  const thead = document.createElement("thead");
  const header = document.createElement("tr");
  ["Artifact", "Phase", "Status", "Version", "Public Annexure", "Reason"].forEach(function (label) { header.append(el("th", "", label)); });
  thead.append(header);
  const tbody = document.createElement("tbody");
  artifacts.forEach(function (artifact) {
    const tr = document.createElement("tr");
    tr.append(el("td", "", text(artifact.artifact_name, "Unnamed artifact")));
    tr.append(el("td", "", text(artifact.phase, "")));
    tr.append(el("td", "", statusLabel(artifact.lock_status)));
    tr.append(el("td", "", text(artifact.latest_version, "")));
    tr.append(el("td", "", artifact.included_in_public_annexure_manifest ? "Included" : "Excluded"));
    tr.append(el("td", "", text(artifact.exclusion_reason, "")));
    tbody.append(tr);
  });
  table.append(thead, tbody);
  replaceChildren(els.table, [table]);
}

function kvTable(object) {
  const table = el("table", "kv public-value-table");
  const tbody = document.createElement("tbody");
  Object.entries(object).forEach(function (entry) {
    if (entry[1] === undefined || entry[1] === null || entry[1] === "") return;
    const tr = document.createElement("tr");
    tr.append(el("th", "", entry[0]));
    tr.append(el("td", "", String(entry[1])));
    tbody.append(tr);
  });
  table.append(tbody);
  return table;
}

function statusLabel(value) {
  const raw = String(value || "").trim();
  const upper = raw.toUpperCase();
  if (upper === "LOCKED_WITH_LIMITATIONS") return "Completed with public-source limitations";
  if (upper === "LOCKED" || upper === "COMPLETE") return "Completed";
  if (upper === "REPAIR_REQUIRED") return "Requires repair before reliance";
  if (upper === "CONTROLLED_FAILURE") return "Controlled failure — do not rely";
  return raw;
}

function queryParam(name) {
  const query = String(window.location.search || "").replace(/^\?/, "");
  return query.split("&").map(function (part) { return part.split("="); }).filter(function (pair) { return decodeURIComponent(pair[0] || "") === name; }).map(function (pair) { return decodeURIComponent(pair[1] || ""); })[0] || "";
}

function replaceChildren(target, children) {
  while (target.firstChild) target.removeChild(target.firstChild);
  children.forEach(function (child) { target.append(child); });
}

function text(value, fallback) {
  const out = String(value ?? "").trim();
  return out || fallback;
}

function fail(message) {
  els.title.textContent = "Technical annexure unavailable";
  els.subtitle.textContent = message;
  replaceChildren(els.meta, [el("p", "small-muted", message)]);
  replaceChildren(els.table, []);
}

function el(tag, className, textContent) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (textContent !== undefined && textContent !== "") node.textContent = textContent;
  return node;
}
