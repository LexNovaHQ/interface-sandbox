const runId = new URLSearchParams(location.search).get("run_id") || "";
const title = document.getElementById("handoffTitle");
const subtitle = document.getElementById("handoffSubtitle");
const meta = document.getElementById("handoffMeta");
const body = document.getElementById("handoffBody");
const back = document.getElementById("backToReport");
const rail = document.getElementById("qualifiedReviewRail");

if (!runId) showError("Missing run_id in Qualified Review URL.");
else {
  back.href = "report.html?run_id=" + encodeURIComponent(runId);
  fetch("/public/diligence-system/qualified-review/" + encodeURIComponent(runId))
    .then((res) => res.json().then((json) => ({ res, json })))
    .then(({ res, json }) => {
      if (!res.ok) throw new Error(json.message || json.error || "Qualified Review not ready");
      const renderer = json.qualified_review_renderer_payload || {};
      const handoff = json.qualified_review_handoff || {};
      const bridge = renderer.bridge_contract || handoff.canonical_matrix_bridge || {};
      const questions = Array.isArray(renderer.questions) ? renderer.questions : Array.isArray(handoff.question_handoff?.questions) ? handoff.question_handoff.questions : [];
      const questionSections = Array.isArray(renderer.question_sections) ? renderer.question_sections : buildQuestionSections({ sectionPages: renderer.section_pages || handoff.section_pages || [], questions });
      const sectionPages = Array.isArray(renderer.section_pages) ? renderer.section_pages : Array.isArray(handoff.section_pages) ? handoff.section_pages : [];
      const progressRail = Array.isArray(renderer.progress_rail) ? renderer.progress_rail : Array.isArray(handoff.progress_rail) ? handoff.progress_rail : [];

      title.textContent = renderer.public_label || handoff.public_label || "Qualified Review";
      subtitle.textContent = "Post-report confirmation workflow for " + (renderer.target || handoff.target || json.run_id || runId) + ".";
      meta.replaceChildren(renderStatusPanel({ json, renderer, handoff, bridge, questions }));
      renderQualifiedReviewRail(progressRail, sectionPages, questionSections);
      body.replaceChildren(renderBridgeSummary({ renderer, bridge }), renderQuestionSections({ questionSections }), renderFinalGate(renderer, handoff));
    })
    .catch((error) => showError(error.message || String(error)));
}

function renderStatusPanel({ json, renderer, handoff, bridge, questions }) {
  const wrap = node("div", "value-list");
  wrap.append(tileGrid({
    run_id: json.run_id || runId,
    matrix_version: renderer.matrix_version || handoff.matrix_version || bridge.map_version || "missing",
    renderer_version: renderer.renderer_version || "missing",
    question_count: questions.length,
    backend_prefills: countWhere(questions, (q) => q.prefill_source === "backend_artifact"),
    demo_prefills: countWhere(questions, (q) => q.prefill_source === "market_norm_demo")
  }));
  return wrap;
}

function renderBridgeSummary({ renderer, bridge }) {
  const section = node("section", "card");
  section.append(node("div", "eyebrow", "canonical bridge"), node("h2", "", "Matrix-driven QR bridge"));
  section.append(node("p", "small-muted", renderer.ui_copy?.boundary_notice || "All prefilled answers require reviewer confirmation before draft preparation."));
  section.append(tileGrid({
    vault_payload_rows: bridge.vault_payload_contract?.row_count ?? renderer.summary_counts?.vault_payload_rows ?? "",
    india_qr_rows: bridge.india_contract?.row_count ?? renderer.summary_counts?.india_privacy_cyber_rows ?? "",
    backend_artifact_rows: bridge.prefill_contract?.backend_artifact_rows ?? renderer.summary_counts?.backend_artifact_rows ?? "",
    market_norm_demo_rows: bridge.prefill_contract?.market_norm_demo_rows ?? renderer.summary_counts?.market_norm_demo_rows ?? "",
    final_gate: renderer.final_review_gate?.blocks_draft_preparation_until_confirmed ? "Confirmation required" : "Check handoff"
  }));
  return section;
}

function renderQualifiedReviewRail(progressRail, sectionPages, questionSections) {
  const pages = questionSections.length ? questionSections : sectionPages.length ? sectionPages : progressRail;
  const steps = [
    { label: "Report handoff", sub: "diligence report rendered", state: "complete" },
    ...pages.map((page) => ({
      label: page.section_title || page.label || page.section_id || "QR section",
      sub: `${page.question_count || 0} questions`,
      state: "active"
    })),
    { label: "Final review gate", sub: "confirm / edit all rows", state: "pending" }
  ];
  rail.replaceChildren(node("div", "rail"));
  const mount = rail.firstChild;
  mount.append(node("div", "rail-chip", "Qualified Review rail"));
  steps.forEach((step, index) => {
    const row = node("div", "rail-stage " + (index === 0 ? "complete" : step.state));
    row.append(node("span", "rail-dot"), node("div", "", ""));
    row.lastChild.append(node("div", "rail-node", step.label), node("div", "rail-sub", step.sub), node("div", "rail-why", index === 0 ? "Report is ready." : "Reviewer confirmation required."));
    mount.append(row);
  });
}

function renderQuestionSections({ questionSections }) {
  const wrapper = node("div", "value-list");
  questionSections.forEach((page) => {
    const section = node("section", "report-section");
    section.append(
      node("div", "eyebrow", page.section_id || "qualified_review_section"),
      node("h2", "", page.section_title || page.section_id || "Qualified Review Section"),
      node("p", "small-muted", `${page.question_count || 0} questions · ${page.backend_artifact_rows || 0} diligence prefills · ${page.market_norm_demo_rows || 0} demo prefills`)
    );
    (page.questions || []).forEach((question) => section.append(renderQuestionCard(question)));
    wrapper.append(section);
  });
  return wrapper;
}

function renderQuestionCard(q) {
  const block = node("div", "array-block");
  const badge = q.ui_badge || (q.prefill_source === "market_norm_demo" ? "Demo prefill — confirm" : "Diligence prefill — confirm");
  block.append(node("div", "block-title", `${q.question_id || "QR"} · ${badge}`));
  block.append(node("p", "", q.lawyer_question || q.public_question_label || q.field_key || "Question"));
  block.append(renderAnswerControl(q));
  if (q.demo_disclaimer_required) block.append(node("div", "notice", q.demo_disclaimer_text || "Demo prefill only. Confirm or edit before use."));
  block.append(tileGrid({
    field_key: q.field_key,
    answer_type: q.answer_type,
    evidence_status: q.evidence_status,
    destination_path: q.vault_payload_path || q.qualified_review_path || q.canonical_path,
    reviewer_action: q.reviewer_action || "Confirm or edit before draft preparation"
  }));
  block.append(renderChips(q.document_impact, "Document impact"));
  if (Array.isArray(q.source_field_hints) && q.source_field_hints.length) block.append(renderChips(q.source_field_hints, "Evidence mapping"));
  const actions = node("div", "actions no-print");
  const confirm = node("button", "btn secondary", "Confirm row");
  confirm.type = "button";
  confirm.addEventListener("click", () => {
    block.dataset.confirmed = "true";
    confirm.textContent = "Confirmed";
    confirm.disabled = true;
  });
  actions.append(confirm);
  block.append(actions);
  return block;
}

function renderAnswerControl(q) {
  const value = q.suggested_answer || q.initial_answer_value || q.demo_prefill_value || "";
  const label = node("label", "label", "Suggested answer / reviewer answer");
  const type = String(q.answer_type || "short_answer");
  let control;
  if (type === "long_answer") {
    control = document.createElement("textarea");
    control.rows = 4;
  } else if ((type === "dropdown" || type === "select") && Array.isArray(q.answer_options) && q.answer_options.length) {
    control = document.createElement("select");
    [value, ...q.answer_options].filter(Boolean).forEach((option, index) => {
      const opt = document.createElement("option");
      opt.value = String(option);
      opt.textContent = String(option);
      if (index === 0) opt.selected = true;
      control.append(opt);
    });
  } else {
    control = document.createElement("input");
    control.type = "text";
  }
  control.className = "input";
  control.value = value;
  const wrap = node("div", "form-grid");
  wrap.append(label, control);
  return wrap;
}

function renderFinalGate(renderer, handoff) {
  const section = node("section", "report-section");
  section.append(node("div", "eyebrow", "final review gate"), node("h2", "", "Final Review Gate"));
  section.append(table({
    requires_confirmation_before_assembly: renderer.final_review_gate?.requires_confirmation_before_assembly ?? handoff.final_review_gate?.requires_confirmation_before_assembly,
    blocks_draft_preparation_until_confirmed: renderer.final_review_gate?.blocks_draft_preparation_until_confirmed ?? handoff.final_review_gate?.blocks_draft_preparation_until_confirmed,
    no_document_assembly: renderer.render_contract?.no_document_assembly,
    no_legal_advice: renderer.render_contract?.no_legal_advice,
    forbidden_public_actions: Array.isArray(renderer.render_contract?.forbidden_public_actions) ? renderer.render_contract.forbidden_public_actions.join(", ") : "Download JSON"
  }));
  return section;
}

function buildQuestionSections({ sectionPages, questions }) {
  const pages = sectionPages.length ? sectionPages : inferPages(questions);
  return pages.map((page) => {
    const ids = Array.isArray(page.question_ids) ? new Set(page.question_ids) : null;
    const rows = ids ? questions.filter((question) => ids.has(question.question_id)) : questions.filter((question) => question.section_id === page.section_id);
    return { ...page, questions: rows, backend_artifact_rows: countWhere(rows, (q) => q.prefill_source === "backend_artifact"), market_norm_demo_rows: countWhere(rows, (q) => q.prefill_source === "market_norm_demo") };
  });
}

function inferPages(questions) {
  const seen = new Map();
  questions.forEach((question) => {
    if (!seen.has(question.section_id)) seen.set(question.section_id, { section_id: question.section_id, section_title: question.section_title, question_ids: [], question_count: 0 });
    const row = seen.get(question.section_id);
    row.question_ids.push(question.question_id);
    row.question_count += 1;
  });
  return [...seen.values()];
}

function renderChips(values, label) {
  const wrap = node("div", "small-muted", label + ": ");
  asArray(values).forEach((value) => wrap.append(node("span", "status-badge", String(value))));
  return wrap;
}

function tileGrid(object) {
  const grid = node("div", "meta-grid");
  Object.entries(object || {}).forEach(([key, value]) => {
    const tile = node("div", "meta-tile");
    tile.append(node("div", "k", titleCase(key)), node("div", "v", format(value)));
    grid.append(tile);
  });
  return grid;
}

function table(object) {
  const t = node("table", "kv");
  const tb = document.createElement("tbody");
  for (const [k, v] of Object.entries(object || {})) {
    const tr = document.createElement("tr");
    tr.append(node("th", "", titleCase(k)), node("td", "", format(v)));
    tb.append(tr);
  }
  t.append(tb);
  return t;
}

function countWhere(values, predicate) { return (Array.isArray(values) ? values : []).filter(predicate).length; }
function asArray(value) { return Array.isArray(value) ? value : value ? [value] : []; }
function format(value) { if (Array.isArray(value)) return value.map(format).join(", "); if (value && typeof value === "object") return JSON.stringify(value); return String(value ?? ""); }
function titleCase(value) { return String(value || "").replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()); }
function showError(message) { title.textContent = "Qualified Review unavailable"; subtitle.textContent = message; meta.textContent = message; if (rail) rail.textContent = message; body.replaceChildren(); }
function node(tag, cls, text) { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined && text !== "") el.textContent = text; return el; }
