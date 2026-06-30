const runId = new URLSearchParams(location.search).get("run_id") || "";
const title = document.getElementById("handoffTitle");
const subtitle = document.getElementById("handoffSubtitle");
const meta = document.getElementById("handoffMeta");
const body = document.getElementById("handoffBody");
const back = document.getElementById("backToReport");

if (!runId) showError("Missing run_id in Qualified Review URL.");
else {
  back.href = "report.html?run_id=" + encodeURIComponent(runId);
  fetch("/public/diligence-system/qualified-review/" + encodeURIComponent(runId)).then((res) => res.json().then((json) => ({ res, json }))).then(({ res, json }) => {
    if (!res.ok) throw new Error(json.message || json.error || "Qualified Review not ready");
    const renderer = json.qualified_review_renderer_payload || {};
    const handoff = json.qualified_review_handoff || {};
    const questions = Array.isArray(renderer.questions) ? renderer.questions : Array.isArray(handoff.question_handoff?.questions) ? handoff.question_handoff.questions : [];
    title.textContent = renderer.public_label || handoff.public_label || "Qualified Review";
    subtitle.textContent = renderer.renderer_type || handoff.handoff_type || "Qualified Review payload loaded.";
    meta.replaceChildren(table({ run_id: json.run_id || runId, renderer_type: renderer.renderer_type || "missing", handoff_type: handoff.handoff_type || "missing", question_count: questions.length }));
    body.replaceChildren(renderQuestions(questions));
  }).catch((error) => showError(error.message || String(error)));
}

function renderQuestions(questions) {
  const section = node("section", "report-section");
  section.append(node("div", "eyebrow", "qualified review renderer"), node("h2", "", "Qualified Review Questions"));
  if (!questions.length) {
    section.append(node("p", "small-muted", "No question-level rows were emitted."));
    return section;
  }
  questions.slice(0, 79).forEach((q) => {
    const block = node("div", "array-block");
    block.append(node("div", "block-title", q.question_id || "Question"));
    block.append(table({ question: q.public_question_label || q.prompt || q.field_key, prefill_status: q.prefill_status, answer_type: q.answer_type, field_type: q.field_type, suggested_answer: q.suggested_answer || "" }));
    section.append(block);
  });
  return section;
}

function table(object) { const t = node("table", "kv"); const tb = document.createElement("tbody"); for (const [k, v] of Object.entries(object || {})) { const tr = document.createElement("tr"); tr.append(node("th", "", titleCase(k)), node("td", "", format(v))); tb.append(tr); } t.append(tb); return t; }
function format(value) { if (Array.isArray(value)) return value.map(format).join(", "); if (value && typeof value === "object") return JSON.stringify(value); return String(value ?? ""); }
function titleCase(value) { return String(value || "").replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()); }
function showError(message) { title.textContent = "Qualified Review unavailable"; subtitle.textContent = message; meta.textContent = message; body.replaceChildren(); }
function node(tag, cls, text) { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined && text !== "") el.textContent = text; return el; }
