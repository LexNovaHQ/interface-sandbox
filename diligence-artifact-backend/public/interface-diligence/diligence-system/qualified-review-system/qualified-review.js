const runId = new URLSearchParams(location.search).get("run_id") || "";
const title = document.getElementById("handoffTitle");
const subtitle = document.getElementById("handoffSubtitle");
const meta = document.getElementById("handoffMeta");
const body = document.getElementById("handoffBody");
const back = document.getElementById("backToReport");
const rail = document.getElementById("qualifiedReviewRail");
const tabs = document.getElementById("qualifiedReviewTabs");

if (!runId) showError("Missing review ID in the Qualified Review URL.");
else {
  back.href = "report.html?run_id=" + encodeURIComponent(runId);
  fetch("/public/diligence-system/qualified-review/" + encodeURIComponent(runId))
    .then((res) => res.json().then((json) => ({ res, json })))
    .then(({ res, json }) => {
      if (!res.ok) throw new Error(json.message || json.error || "Qualified Review is not ready yet.");
      const renderer = json.qualified_review_renderer_payload || {};
      const handoff = json.qualified_review_handoff || {};
      const questions = Array.isArray(renderer.questions) ? renderer.questions : Array.isArray(handoff.question_handoff?.questions) ? handoff.question_handoff.questions : [];
      const questionSections = Array.isArray(renderer.question_sections) ? renderer.question_sections : buildQuestionSections({ sectionPages: renderer.section_pages || handoff.section_pages || [], questions });

      window.__qualifiedReviewPayload = { json, renderer, handoff, questions, questionSections };
      title.textContent = renderer.public_label || handoff.public_label || "Qualified Review";
      subtitle.textContent = "Review and confirm the working answers for " + (renderer.target || handoff.target || json.run_id || runId) + ".";
      meta.replaceChildren(renderReviewSummary({ json, renderer, handoff, questions }));
      renderSectionTabs(questionSections);
      renderQualifiedReviewRail(questionSections);
      body.replaceChildren(renderQuestionSections({ questionSections }));
    })
    .catch((error) => showError(error.message || String(error)));
}

function renderReviewSummary({ json, renderer, handoff, questions }) {
  const wrap = node("div", "qr-summary-grid");
  const target = renderer.target || handoff.target || "Target under review";
  wrap.append(
    summaryItem("Company", target),
    summaryItem("Review ID", json.run_id || runId),
    summaryItem("Review date", new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })),
    summaryItem("Review status", "Review needed"),
    summaryItem("Questions", String(questions.length)),
    summaryItem("Reviewer task", "Confirm, edit, or mark not applicable")
  );
  return wrap;
}

function renderSectionTabs(questionSections) {
  if (!tabs) return;
  tabs.replaceChildren();
  questionSections.forEach((page, index) => {
    const button = node("button", "qr-section-tab" + (index === 0 ? " active" : ""), shortSectionLabel(page.section_title || page.section_id || `Section ${index + 1}`));
    button.type = "button";
    button.dataset.qrSectionIndex = String(index);
    tabs.append(button);
  });
}

function renderQualifiedReviewRail(questionSections) {
  const wrap = node("div", "qr-rail-list");
  questionSections.forEach((page, index) => {
    const row = node("button", "qr-rail-item" + (index === 0 ? " active" : ""));
    row.type = "button";
    row.dataset.qrSectionIndex = String(index);
    row.append(
      node("span", "qr-rail-index", String(index + 1).padStart(2, "0")),
      node("span", "qr-rail-text", page.section_title || page.section_id || `Section ${index + 1}`),
      node("span", "qr-rail-count", `${page.question_count || page.questions?.length || 0}`)
    );
    wrap.append(row);
  });
  rail.replaceChildren(wrap);
}

function renderQuestionSections({ questionSections }) {
  const wrapper = node("div", "value-list qr-section-stack");
  questionSections.forEach((page, index) => {
    const section = node("section", "report-section qr-form-section");
    section.dataset.qrSectionIndex = String(index);
    section.append(
      node("div", "eyebrow", `Section ${index + 1}`),
      node("h2", "", page.section_title || page.section_id || "Qualified Review Section"),
      node("p", "small-muted", `${page.question_count || page.questions?.length || 0} questions. Confirm the suggested answers or revise them before submission.`)
    );
    (page.questions || []).forEach((question) => section.append(renderQuestionCard(question)));
    wrapper.append(section);
  });
  return wrapper;
}

function renderQuestionCard(q) {
  const block = node("div", "array-block qr-question-card");
  const badge = q.prefill_source === "market_norm_demo" ? "Demo assumption" : "Diligence prefill";
  const helper = q.prefill_source === "market_norm_demo"
    ? "This is a demo assumption. Confirm or replace it before using it."
    : "This answer was suggested from the diligence review. Confirm or revise it.";

  const top = node("div", "qr-question-top");
  top.append(node("div", "block-title", q.question_id || "QR"), node("span", "qr-badge", badge));
  block.append(top);
  block.append(node("h3", "qr-question-title", q.lawyer_question || q.public_question_label || q.field_key || "Question"));
  block.append(node("p", "small-muted qr-question-helper", helper));
  block.append(renderAnswerControl(q));
  block.append(renderDocumentImpact(q));

  if (q.demo_disclaimer_required) {
    block.append(node("div", "notice qr-demo-notice", q.demo_disclaimer_text || "Demo assumption only. This is not evidence from the diligence review."));
  }

  const actions = node("div", "actions no-print qr-card-actions");
  const confirm = node("button", "btn secondary", "Confirm as shown");
  confirm.type = "button";
  confirm.dataset.qrState = "confirmed";
  actions.append(confirm);
  block.append(actions);
  return block;
}

function renderAnswerControl(q) {
  const rawValue = q.suggested_answer ?? q.initial_answer_value ?? q.demo_prefill_value ?? "";
  const label = node("label", "label", "Suggested answer / reviewer answer");
  const type = String(q.answer_type || "short_answer");
  let control;
  if (type === "long_answer") {
    control = document.createElement("textarea");
    control.rows = 5;
    control.value = formatAnswerValue(rawValue);
  } else if ((type === "dropdown" || type === "select") && Array.isArray(q.answer_options) && q.answer_options.length) {
    control = document.createElement("select");
    control.multiple = type === "select";
    const selected = new Set(asArray(rawValue).map((value) => String(value)));
    q.answer_options.forEach((option) => {
      const opt = document.createElement("option");
      opt.value = String(option);
      opt.textContent = String(option);
      if (selected.has(String(option))) opt.selected = true;
      control.append(opt);
    });
    if (!control.multiple && !control.value && q.answer_options[0]) control.value = String(q.answer_options[0]);
  } else {
    control = document.createElement("input");
    control.type = "text";
    control.value = formatAnswerValue(rawValue);
  }
  control.className = "input qr-answer-input";
  const wrap = node("div", "form-grid qr-answer-field");
  wrap.append(label, control);
  return wrap;
}

function renderDocumentImpact(q) {
  const impact = asArray(q.document_impact).map(humanizeImpact).filter(Boolean);
  const wrap = node("div", "qr-impact-row");
  wrap.append(node("span", "qr-impact-label", "Used in"));
  if (!impact.length) {
    wrap.append(node("span", "small-muted", "Draft preparation workspace"));
    return wrap;
  }
  impact.forEach((value) => wrap.append(node("span", "qr-impact-chip", value)));
  return wrap;
}

function buildQuestionSections({ sectionPages, questions }) {
  const pages = sectionPages.length ? sectionPages : inferPages(questions);
  return pages.map((page) => {
    const ids = Array.isArray(page.question_ids) ? new Set(page.question_ids) : null;
    const rows = ids ? questions.filter((question) => ids.has(question.question_id)) : questions.filter((question) => question.section_id === page.section_id);
    return { ...page, questions: rows, question_count: page.question_count || rows.length };
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

function summaryItem(label, value) {
  const item = node("div", "qr-summary-item");
  item.append(node("div", "qr-summary-label", label), node("div", "qr-summary-value", value));
  return item;
}

function shortSectionLabel(value) {
  const text = String(value || "Section");
  return text.length > 24 ? text.slice(0, 22) + "…" : text;
}

function humanizeImpact(value) {
  const text = String(value || "").trim();
  const known = {
    privacy_policy: "Privacy Policy",
    terms_of_service: "Terms of Service",
    terms: "Terms of Service",
    dpa: "Data Processing Addendum",
    data_processing_addendum: "Data Processing Addendum",
    acceptable_use_policy: "Acceptable Use Policy",
    ai_policy: "AI Policy",
    internal_governance: "Internal Governance Pack",
    security_policy: "Security Policy",
    service_level_agreement: "Service Level Agreement"
  };
  return known[text] || titleCase(text);
}

function asArray(value) { return Array.isArray(value) ? value : value || value === 0 ? [value] : []; }
function formatAnswerValue(value) { if (Array.isArray(value)) return value.join(", "); if (value && typeof value === "object") return JSON.stringify(value); return String(value ?? ""); }
function titleCase(value) { return String(value || "").replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()); }
function showError(message) { title.textContent = "Qualified Review unavailable"; subtitle.textContent = message; meta.textContent = message; if (rail) rail.textContent = message; if (tabs) tabs.replaceChildren(); body.replaceChildren(); }
function node(tag, cls, text) { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined && text !== "") el.textContent = text; return el; }
