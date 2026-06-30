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
      const questions = Array.isArray(renderer.questions) ? renderer.questions : Array.isArray(handoff.question_handoff?.questions) ? handoff.question_handoff.questions : [];
      const sectionPages = Array.isArray(renderer.section_pages) ? renderer.section_pages : Array.isArray(handoff.section_pages) ? handoff.section_pages : [];
      const progressRail = Array.isArray(renderer.progress_rail) ? renderer.progress_rail : Array.isArray(handoff.progress_rail) ? handoff.progress_rail : [];

      title.textContent = renderer.public_label || handoff.public_label || "Qualified Review";
      subtitle.textContent = "Post-report reviewer confirmation system connected to " + (json.run_id || runId) + ".";
      meta.replaceChildren(table({
        run_id: json.run_id || runId,
        system_boundary: json.system_boundary?.qualified_review_is_separate_system ? "Separate post-report system" : "Qualified Review",
        report_ready: json.report_ready,
        renderer_type: renderer.renderer_type || "missing",
        handoff_type: handoff.handoff_type || "missing",
        question_count: questions.length,
        forbidden_public_actions: Array.isArray(renderer.render_contract?.forbidden_public_actions) ? renderer.render_contract.forbidden_public_actions.join(", ") : "Download JSON"
      }));

      renderQualifiedReviewRail(progressRail, sectionPages);
      body.replaceChildren(renderQuestionSections({ sectionPages, questions }), renderFinalGate(renderer, handoff));
    })
    .catch((error) => showError(error.message || String(error)));
}

function renderQualifiedReviewRail(progressRail, sectionPages) {
  const pages = sectionPages.length ? sectionPages : progressRail;
  const firstNeedingReview = pages.findIndex((page) => Number(page.remaining_count || 0) > 0 || page.status === "NEEDS_CONFIRMATION");
  const activeIndex = firstNeedingReview >= 0 ? firstNeedingReview + 1 : pages.length + 1;
  const steps = [
    { label: "Report handoff", sub: "diligence report rendered", state: "complete" },
    ...pages.map((page, index) => ({
      label: page.section_title || page.label || page.section_id || `Section ${index + 1}`,
      sub: `${page.question_count || ""} questions`.trim(),
      state: index + 1 < activeIndex ? "complete" : index + 1 === activeIndex ? "active" : "pending"
    })),
    { label: "Final review gate", sub: "confirmation before assembly", state: activeIndex > pages.length ? "active" : "pending" }
  ];

  rail.replaceChildren(node("div", "rail"));
  const mount = rail.firstChild;
  mount.append(node("div", "rail-chip", "Qualified Review rail"));
  steps.forEach((step) => {
    const row = node("div", "rail-stage " + step.state);
    row.append(node("span", "rail-dot"), node("div", "", ""));
    row.lastChild.append(node("div", "rail-node", step.label), node("div", "rail-sub", step.sub), node("div", "rail-why", step.state === "complete" ? "Completed or loaded." : "Reviewer confirmation required."));
    mount.append(row);
  });
}

function renderQuestionSections({ sectionPages, questions }) {
  const wrapper = node("div", "value-list");
  const pages = sectionPages.length ? sectionPages : inferPages(questions);

  pages.forEach((page) => {
    const section = node("section", "report-section");
    const ids = Array.isArray(page.question_ids) ? new Set(page.question_ids) : null;
    const rows = ids ? questions.filter((question) => ids.has(question.question_id)) : questions.filter((question) => question.section_id === page.section_id);
    section.append(
      node("div", "eyebrow", page.section_id || "qualified_review_section"),
      node("h2", "", page.section_title || page.title || page.section_id || "Qualified Review Section"),
      node("p", "small-muted", "This section is editable reviewer-confirmation material. Public prefill is not final.")
    );

    rows.forEach((q) => {
      const block = node("div", "array-block");
      block.append(node("div", "block-title", q.question_id || "Question"));
      block.append(table({
        question: q.public_question_label || q.prompt || q.field_key,
        prefill_status: q.prefill_status,
        answer_type: q.answer_type,
        field_type: q.field_type,
        evidence_mode: q.evidence_mode,
        suggested_answer: q.suggested_answer || "",
        document_impact: Array.isArray(q.document_impact) ? q.document_impact.join(", ") : q.document_impact
      }));
      section.append(block);
    });

    wrapper.append(section);
  });

  return wrapper;
}

function renderFinalGate(renderer, handoff) {
  const section = node("section", "report-section");
  section.append(node("div", "eyebrow", "final review gate"), node("h2", "", "Final Review Gate"));
  section.append(table({
    requires_confirmation_before_assembly: renderer.final_review_gate?.requires_confirmation_before_assembly ?? handoff.final_review_gate?.requires_confirmation_before_assembly,
    blocks_draft_preparation_until_confirmed: renderer.final_review_gate?.blocks_draft_preparation_until_confirmed ?? handoff.final_review_gate?.blocks_draft_preparation_until_confirmed,
    no_document_assembly: renderer.render_contract?.no_document_assembly,
    no_legal_advice: renderer.render_contract?.no_legal_advice
  }));
  return section;
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

function format(value) { if (Array.isArray(value)) return value.map(format).join(", "); if (value && typeof value === "object") return JSON.stringify(value); return String(value ?? ""); }
function titleCase(value) { return String(value || "").replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()); }
function showError(message) { title.textContent = "Qualified Review unavailable"; subtitle.textContent = message; meta.textContent = message; if (rail) rail.textContent = message; body.replaceChildren(); }
function node(tag, cls, text) { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined && text !== "") el.textContent = text; return el; }