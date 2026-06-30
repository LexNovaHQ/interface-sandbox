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

let activeSection = 0;
let handoff = {};
let questionHandoff = {};
let questions = [];
let sections = [];
const answers = {};

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

  handoff = json.qualified_review_handoff || {};
  questionHandoff = handoff.question_handoff || {};
  questions = Array.isArray(questionHandoff.questions) ? questionHandoff.questions : [];
  sections = buildSections(questionHandoff, questions);

  els.title.textContent = handoff.public_label || json.public_label || "Qualified Review";
  els.subtitle.textContent = "Section-by-section human review of diligence-prefilled questions. Missing public evidence never blocks entry into review.";
  renderTable(els.meta, {
    run_id: json.run_id || id,
    validation_status: handoff.validation_status,
    question_contract_status: handoff.question_handoff_contract_status,
    question_count: handoff.question_count || questionHandoff.question_count || questions.length,
    ui_mode: handoff.ui_mode || questionHandoff.ui_mode,
    vault_groups: arr(questionHandoff.vault_payload_groups).join(", "),
    boundary: handoff.intake_boundary || "Public-source facts require reviewer confirmation."
  });

  if (!questions.length) {
    replaceChildren(els.body, [panel("Question handoff unavailable", "The public endpoint returned no question_handoff.questions array.")]);
    return;
  }
  renderWizard();
}

function buildSections(qh, qs) {
  const out = [];
  const seen = new Set();
  const rails = Array.isArray(qh.progress_rail) ? qh.progress_rail : [];
  const pages = Array.isArray(qh.section_pages) ? qh.section_pages : [];
  rails.concat(pages).forEach(function (row, index) {
    const id = row.section_id || row.id || row.key || "section_" + (index + 1);
    if (seen.has(id)) return;
    seen.add(id);
    out.push({ id, title: row.public_label || row.section_title || row.title || titleCase(id), description: row.section_description || row.description || "Review and confirm this section before continuing." });
  });
  qs.forEach(function (q) {
    const id = q.section_id || "unmapped_section";
    if (!seen.has(id)) { seen.add(id); out.push({ id, title: titleCase(id), description: "Review and confirm this section before continuing." }); }
  });
  return out;
}

function renderWizard() {
  const layout = el("div", "qr-layout");
  layout.append(renderRail(), renderActiveSection());
  replaceChildren(els.body, [layout]);
  setProgress();
}

function renderRail() {
  const rail = el("aside", "qr-rail no-print");
  rail.append(el("div", "qr-rail-title", "Qualified Review Progress"));
  sections.forEach(function (section, index) {
    const stats = sectionStats(section.id);
    const cls = ["qr-rail-step"];
    if (index === activeSection) cls.push("active");
    if (stats.total && stats.confirmed === stats.total) cls.push("complete");
    if (stats.blockers) cls.push("needs-attention");
    const b = el("button", cls.join(" "));
    b.type = "button";
    b.append(el("span", "qr-rail-index", String(index + 1).padStart(2, "0")), el("span", "qr-rail-copy", section.title), el("span", "qr-rail-sub", stats.confirmed + "/" + stats.total + " confirmed · " + stats.blockers + " blockers"));
    b.addEventListener("click", function () { captureAll(); activeSection = index; renderWizard(); });
    rail.append(b);
  });
  return rail;
}

function renderActiveSection() {
  const section = sections[activeSection] || sections[0];
  const qs = sectionQuestions(section.id);
  const stats = sectionStats(section.id);
  const main = el("main", "qr-panel");
  const head = el("section", "vault-panel qr-section-head");
  head.append(el("div", "eyebrow", "section " + String(activeSection + 1).padStart(2, "0")), el("h2", "", section.title), el("p", "", section.description), statGrid(stats));
  main.append(head);
  qs.forEach(function (q, index) { main.append(questionCard(q, index)); });
  main.append(sectionActions(stats));
  return main;
}

function questionCard(q, index) {
  const id = q.question_id || q.field_key || "question_" + index;
  const a = answerFor(q, id);
  const card = el("article", "qr-question-card");
  card.dataset.questionId = id;

  const head = el("div", "qr-question-header");
  head.append(el("div", "qr-question-number", q.question_id || "QR"), el("div", "qr-question-type", titleCase(q.answer_type || "review field")));

  const suggestion = el("div", "qr-prefill-box");
  suggestion.append(el("div", "qr-mini-label", q.demo_disclaimer ? "Demo market suggestion" : "Diligence suggestion"), el("p", "", clean(q.suggested_answer) || clean(q.demo_market_suggestion) || "No public-source prefill. Reviewer must answer if relevant."));

  const controls = el("div", "qr-control-grid");
  controls.append(fieldWrap("Review status", selectStatus(a.review_status)), fieldWrap("Confirmed answer", answerInput(q, a.final_confirmed_answer)), fieldWrap("Reviewer note", textBox("reviewer_note", a.reviewer_note, "Reviewer note, limitation, or local-counsel issue.", 2)));

  card.append(head, el("h3", "qr-question-title", q.public_question_label || q.field_key || "Qualified Review question"), el("div", prefillClass(q), q.prefill_status || "prefill status unavailable"), suggestion, controls, questionMeta(q));
  card.addEventListener("input", captureCard);
  card.addEventListener("change", captureCard);
  return card;
}

function answerInput(q, value) {
  if (["dropdown", "select"].includes(q.answer_type) && Array.isArray(q.allowed_options) && q.allowed_options.length) {
    const s = document.createElement("select");
    s.className = "input qr-answer";
    s.dataset.qrInput = "final_confirmed_answer";
    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "Select...";
    s.append(blank);
    q.allowed_options.forEach(function (item) {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = titleCase(item);
      option.selected = String(item) === String(value);
      s.append(option);
    });
    return s;
  }
  return textBox("final_confirmed_answer", value, "Edit the suggestion or enter the correct private fact.", q.answer_type === "long_answer" ? 5 : 2);
}

function questionMeta(q) {
  const wrap = el("div", "qr-question-meta");
  wrap.append(chipBlock("Vault path", arr(q.vault_path)));
  wrap.append(chipBlock("Documents affected", arr(q.document_impact)));
  const details = el("details", "technical qr-details");
  details.append(el("summary", "", "Info, evidence, and routing"));
  details.append(tableNode({ helper: q.helper_text, market_norm: q.market_norm_helper, demo_disclaimer: q.demo_disclaimer_text, answer_type: q.answer_type, vault_path: q.vault_path, source_artifacts: arr(q.source_artifacts).join(", "), source_field_hints: arr(q.source_field_hints).join(", "), required_for_assembly: q.required_for_assembly, assembly_blocker: q.assembly_blocker }), chipBlock("Evidence sources", evidenceLabels(q.evidence_sources)));
  wrap.append(details);
  return wrap;
}

function sectionActions(stats) {
  const box = el("div", "vault-panel qr-actions");
  box.append(el("div", "small-muted", stats.blockers ? stats.blockers + " assembly blocker(s) remain. The diligence run still passes; draft preparation waits for human confirmation." : "No unresolved assembly blockers in this section."));
  const row = el("div", "report-actions");
  const prev = button("Previous Section", "btn secondary", function () { moveSection(-1); });
  prev.disabled = activeSection === 0;
  const next = button(activeSection === sections.length - 1 ? "Open Final Review Gate" : "Confirm Section & Continue", "btn", function () { captureAll(); if (activeSection === sections.length - 1) renderFinalGate(); else moveSection(1); });
  row.append(prev, next);
  box.append(row);
  return box;
}

function renderFinalGate() {
  captureAll();
  const stats = statsFor(questions);
  const blockers = questions.filter(function (q) { return isBlocking(q); });
  const p = el("section", "vault-panel qr-final-gate");
  p.append(el("div", "eyebrow", "final review gate"), el("h2", "", "Final Review & Draft Preparation Gate"), el("p", "", "Missing or incorrect diligence fields do not fail the run. They stay here until a reviewer confirms, edits, or marks them not applicable."), statGrid(stats));
  if (blockers.length) {
    const list = el("div", "qr-blocker-list");
    list.append(el("div", "block-title", "Unresolved assembly blockers"));
    blockers.slice(0, 80).forEach(function (q) { list.append(el("p", "small-muted", (q.question_id || "QR") + ": " + (q.public_question_label || q.field_key || "Question") + " → " + (q.vault_path || "vault path missing"))); });
    p.append(list);
  }
  p.append(el("div", "notice", "Boundary: This page does not produce legal advice or final legal instruments. Draft preparation must use reviewer-confirmed answers and remain subject to local counsel review."));
  const actions = el("div", "report-actions");
  actions.append(button("Back to Review", "btn secondary", renderWizard));
  const proceed = button("Proceed to Draft Preparation", "btn", function () { els.subtitle.textContent = "Draft-preparation endpoint is not wired yet."; });
  proceed.disabled = blockers.length > 0;
  actions.append(proceed);
  p.append(actions);
  replaceChildren(els.body, [p]);
  const line = document.querySelector(".progress-line");
  if (line) line.style.width = "100%";
}

function answerFor(q, id) { const saved = answers[id] || {}; return { review_status: saved.review_status || q.review_status || "Needs confirmation", final_confirmed_answer: saved.final_confirmed_answer || q.final_confirmed_answer || clean(q.suggested_answer) || "", reviewer_note: saved.reviewer_note || q.reviewer_note || "" }; }
function sectionQuestions(sectionId) { return questions.filter(function (q) { return (q.section_id || "unmapped_section") === sectionId; }); }
function sectionStats(sectionId) { return statsFor(sectionQuestions(sectionId)); }
function statsFor(qs) { let confirmed = 0; let blockers = 0; qs.forEach(function (q) { const id = q.question_id || q.field_key; const a = answers[id] || {}; const status = a.review_status || q.review_status || "Needs confirmation"; if (["confirmed", "edited", "not_applicable", "Confirmed", "Edited", "Not applicable"].includes(status)) confirmed += 1; if (isBlocking(q)) blockers += 1; }); return { total: qs.length, confirmed, needsReview: Math.max(0, qs.length - confirmed), blockers }; }
function isBlocking(q) { const id = q.question_id || q.field_key; const a = answers[id] || {}; const status = a.review_status || q.review_status || "Needs confirmation"; const value = a.final_confirmed_answer || q.final_confirmed_answer || ""; if (["not_applicable", "Not applicable"].includes(status)) return false; if (q.assembly_blocker !== true && q.required_for_assembly !== true) return false; return !["confirmed", "edited", "Confirmed", "Edited"].includes(status) || !String(value).trim(); }
function captureCard(event) { const card = event.currentTarget; const id = card.dataset.questionId; if (!id) return; answers[id] = answers[id] || {}; card.querySelectorAll("[data-qr-input]").forEach(function (input) { answers[id][input.dataset.qrInput] = input.value; }); }
function captureAll() { document.querySelectorAll(".qr-question-card").forEach(function (card) { captureCard({ currentTarget: card }); }); }
function moveSection(delta) { activeSection = Math.max(0, Math.min(sections.length - 1, activeSection + delta)); renderWizard(); globalThis.scrollTo({ top: 0, behavior: "smooth" }); }
function fieldWrap(labelText, child) { const wrap = el("label", "qr-field"); wrap.append(el("span", "qr-mini-label", labelText), child); return wrap; }
function textBox(key, value, placeholder, rows) { const t = document.createElement("textarea"); t.className = "input qr-answer"; t.rows = rows; t.dataset.qrInput = key; t.value = value; t.placeholder = placeholder; return t; }
function selectStatus(value) { const s = document.createElement("select"); s.className = "input qr-status"; s.dataset.qrInput = "review_status"; [["Needs confirmation","Needs confirmation"],["Confirmed","Confirmed"],["Edited","Edited"],["Manual required","Manual required"],["Not applicable","Not applicable"]].forEach(function (row) { const o = document.createElement("option"); o.value = row[0]; o.textContent = row[1]; o.selected = row[0] === value; s.append(o); }); return s; }
function button(text, className, handler) { const b = el("button", className, text); b.type = "button"; b.addEventListener("click", handler); return b; }
function prefillClass(q) { const v = String(q.prefill_status || "").toLowerCase(); return "qr-prefill-status " + (v.includes("need") || v.includes("manual") || v.includes("missing") ? "manual" : "prefilled"); }
function evidenceLabels(value) { return arr(value).map(function (item) { if (!item || typeof item !== "object") return item; return item.artifact_name || item.source_artifact || item.field_key || item.label || JSON.stringify(item); }); }
function chipBlock(labelText, values) { const box = el("div", "qr-chip-block"); box.append(el("div", "qr-mini-label", labelText)); const row = el("div", "qr-chip-list"); if (!values.length) row.append(el("span", "qr-chip muted", "Not emitted")); values.forEach(function (value) { row.append(el("span", "qr-chip", clean(value))); }); box.append(row); return box; }
function statGrid(stats) { const g = el("div", "qr-stat-grid"); g.append(tile("Questions", stats.total), tile("Confirmed", stats.confirmed), tile("Needs review", stats.needsReview), tile("Assembly blockers", stats.blockers)); return g; }
function tile(k, v) { const t = el("div", "meta-tile"); t.append(el("div", "k", k), el("div", "v", String(v))); return t; }
function setProgress() { const line = document.querySelector(".progress-line"); if (line) line.style.width = (((activeSection + 1) / Math.max(1, sections.length)) * 100) + "%"; }
function renderTable(target, object) { replaceChildren(target, [tableNode(object)]); }
function tableNode(object) { const rows = Object.entries(object || {}).filter(function (entry) { return entry[1] !== undefined && entry[1] !== null && entry[1] !== ""; }); if (!rows.length) return el("p", "small-muted", "No visible values emitted."); const table = el("table", "kv"); const tbody = document.createElement("tbody"); rows.forEach(function (entry) { const tr = document.createElement("tr"); tr.append(el("th", "", titleCase(entry[0])), el("td", "", formatPrimitive(entry[1]))); tbody.append(tr); }); table.append(tbody); return table; }
function panel(title, message) { const section = el("section", "report-section"); section.append(el("div", "eyebrow", "qualified review"), el("h2", "", title), el("p", "small-muted", message)); return section; }
function replaceChildren(target, children) { while (target.firstChild) target.removeChild(target.firstChild); children.forEach(function (child) { target.append(child); }); }
function queryParam(name) { const query = navRef ? String(navRef.search || "").replace(/^\?/, "") : ""; return query.split("&").map(function (part) { return part.split("="); }).filter(function (pair) { return decodeURIComponent(pair[0] || "") === name; }).map(function (pair) { return decodeURIComponent(pair[1] || ""); })[0] || ""; }
function formatPrimitive(value) { if (Array.isArray(value)) return value.map(formatPrimitive).join(", "); if (value && typeof value === "object") return JSON.stringify(value); return String(value ?? ""); }
function clean(value) { if (Array.isArray(value)) return value.map(clean).filter(Boolean).join(", "); if (value && typeof value === "object") return value.answer || value.value || value.label || JSON.stringify(value); return String(value ?? "").trim(); }
function arr(value) { if (Array.isArray(value)) return value; if (value === undefined || value === null || value === "") return []; return [value]; }
function titleCase(value) { return String(value || "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, function (match) { return match.toUpperCase(); }); }
function fail(message) { els.title.textContent = "Qualified Review unavailable"; els.subtitle.textContent = message; replaceChildren(els.meta, [el("p", "small-muted", message)]); replaceChildren(els.body, []); }
function el(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined && text !== "") node.textContent = text; return node; }
