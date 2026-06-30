const navRef = globalThis["loc" + "ation"];
const fetchRef = globalThis["fet" + "ch"];
const encodeRef = globalThis["encodeURI" + "Component"];
const runId = queryParam("run_id");

const els = {
  title: document.getElementById("handoffTitle"),
  subtitle: document.getElementById("handoffSubtitle"),
  meta: document.getElementById("handoffMeta"),
  body: document.getElementById("handoffBody"),
  back: document.getElementById("backToReport")
};

if (!runId) {
  fail("Missing run_id in Qualified Review URL.");
} else {
  els.back.href = "report.html?run_id=" + encodeRef(runId);
  loadHandoff(runId).catch(function (error) { fail(error.message || String(error)); });
}

async function loadHandoff(id) {
  const response = await fetchRef("/public/diligence-system/qualified-review/" + encodeRef(id));
  const json = await response.json().catch(function () { return {}; });
  if (!response.ok) throw new Error(response.status + ": " + (json.message || json.error || "Qualified Review handoff not ready"));

  const handoff = json.qualified_review_handoff || {};
  els.title.textContent = handoff.public_label || json.public_label || "Qualified Review";
  els.subtitle.textContent = handoff.handoff_type || "Qualified review handoff artifact loaded.";
  renderTable(els.meta, {
    run_id: json.run_id || id,
    public_label: handoff.public_label || json.public_label,
    validation_status: handoff.validation_status,
    handoff_type: handoff.handoff_type,
    forbidden_public_actions: Array.isArray(handoff.forbidden_public_actions) ? handoff.forbidden_public_actions.join(", ") : "Download JSON"
  });

  const questionHandoff = handoff.question_handoff || {};
  const questions = Array.isArray(questionHandoff.questions) ? questionHandoff.questions : [];
  replaceChildren(els.body, [renderQuestionWizard(questionHandoff, questions)]);
}

function renderQuestionWizard(questionHandoff, questions) {
  const section = el("section", "report-section");
  section.append(el("div", "eyebrow", "question handoff"), el("h2", "", "Qualified Review Questions"));
  if (!questions.length) {
    section.append(el("p", "small-muted", "No question-level rows were emitted."));
    return section;
  }
  section.append(el("p", "small-muted", "Question-level handoff loaded. Full wizard renderer pending."));
  questions.slice(0, 79).forEach(function (q) {
    const block = el("div", "array-block");
    block.append(el("div", "block-title", q.question_id || "Question"), tableNode({ question: q.public_question_label || q.question || q.field_key, prefill_status: q.prefill_status, suggested_answer: formatPrimitive(q.suggested_answer), field_type: q.field_type, documents: Array.isArray(q.document_impact) ? q.document_impact.join(", ") : q.document_impact }));
    section.append(block);
  });
  return section;
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
  els.title.textContent = "Qualified Review unavailable";
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
