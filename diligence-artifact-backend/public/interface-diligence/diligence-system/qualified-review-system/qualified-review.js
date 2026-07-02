const runId = new URLSearchParams(location.search).get("run_id") || "";
const endpoint = runId ? `/public/diligence-system/qualified-review/${encodeURIComponent(runId)}` : "";
const submitEndpoint = endpoint ? `${endpoint}/responses` : "";
const assemblyHref = runId ? `/interface-diligence/diligence-system/assembly-engine.html?run_id=${encodeURIComponent(runId)}` : "#";
const states = new Set(["confirmed", "edited", "not_applicable"]);

const els = {
  title: document.getElementById("handoffTitle"),
  subtitle: document.getElementById("handoffSubtitle"),
  meta: document.getElementById("handoffMeta"),
  body: document.getElementById("handoffBody"),
  back: document.getElementById("backToReport"),
  rail: document.getElementById("qualifiedReviewRail"),
  workflow: document.getElementById("qrWorkflowPanel"),
  nav: document.getElementById("qrNavigationPanel"),
  drawer: document.getElementById("qrValidationDrawer"),
  finalGate: document.getElementById("qrFinalGatePanel")
};

const state = {
  json: null,
  renderer: {},
  handoff: {},
  questions: new Map(),
  sections: [],
  responses: new Map(),
  active: 0,
  submission: null
};

if (!runId) showError("Missing review ID in the Qualified Review URL.");
else boot().catch((error) => showError(error.message || String(error)));

document.addEventListener("input", handleInput, true);
document.addEventListener("change", handleInput, true);
document.addEventListener("click", handleClick, true);

async function boot() {
  els.back.href = "report.html?run_id=" + encodeURIComponent(runId);
  const payload = await req(endpoint);
  const renderer = payload.qualified_review_renderer_payload || {};
  const handoff = payload.qualified_review_handoff || {};
  const rows = Array.isArray(renderer.questions) ? renderer.questions : Array.isArray(handoff.question_handoff?.questions) ? handoff.question_handoff.questions : [];
  const sections = buildQuestionSections({ sectionPages: renderer.question_sections || renderer.section_pages || handoff.section_pages || [], questions: rows });

  state.json = payload;
  state.renderer = renderer;
  state.handoff = handoff;
  state.questions = new Map(rows.map((row) => [row.question_id, row]));
  state.sections = sections;
  hydrate(payload.qualified_review_submission);

  window.__qualifiedReviewPayload = { json: payload, renderer, handoff, questions: rows, questionSections: sections };
  renderShell();
  renderState();
}

function renderShell() {
  els.title.textContent = "Qualified Review";
  els.subtitle.textContent = "Review the prefilled answers, correct what the diligence system could not verify, and lock the inputs before draft preparation.";
  els.meta.replaceChildren(renderReviewSummary());
  renderRail();
  els.body.replaceChildren(renderQuestionSections());
}

function renderReviewSummary() {
  const wrap = node("div", "qr-summary-grid");
  const target = state.renderer.target || state.handoff.target || "Target under review";
  wrap.append(
    summaryItem("Company", target),
    summaryItem("Review ID", state.json?.run_id || runId),
    summaryItem("Review date", new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })),
    summaryItem("Status", statusLabel(resolvedCount(), state.questions.size, state.submission?.final_gate?.status)),
    summaryItem("Questions", String(state.questions.size)),
    summaryItem("Task", "Review, section-attest, submit final")
  );
  return wrap;
}

function renderQuestionSections() {
  const wrapper = node("div", "value-list qr-section-stack");
  state.sections.forEach((page, index) => {
    const sectionNode = node("section", "report-section qr-form-section");
    sectionNode.dataset.qrSectionIndex = String(index);
    sectionNode.append(
      node("div", "eyebrow", `Section ${index + 1}`),
      node("h2", "", page.section_title || page.section_id || "Qualified Review Section"),
      node("p", "small-muted", `${page.question_count || page.questions?.length || 0} questions. Edit only what needs correction; unchanged answers are accepted once the section is attested.`)
    );
    (page.questions || []).forEach((question) => sectionNode.append(renderQuestionCard(question)));
    sectionNode.append(renderSectionAttestation(page, index));
    wrapper.append(sectionNode);
  });
  return wrapper;
}

function renderQuestionCard(q) {
  const block = node("div", "array-block qr-question-card");
  block.dataset.questionId = q.question_id || "";
  block.dataset.qrOriginalValue = stableValue(prefillValue(q));

  const saved = state.responses.get(q.question_id);
  const isDemo = q.prefill_source === "market_norm_demo" || q.demo_disclaimer_required === true;
  const badge = isDemo ? "Demo assumption" : "Diligence prefill";
  const helper = isDemo ? "Suggestion — demo assumption. Edit if inaccurate." : "Suggestion — prefilled from the diligence review. Edit only if inaccurate.";

  const top = node("div", "qr-question-top");
  top.append(node("div", "block-title", q.question_id || "QR"), node("div", "qr-badge-row", ""));
  top.lastChild.append(node("span", "qr-badge", badge), node("span", "qr-badge neutral", "Needs review"));

  const layout = node("div", "qr-question-layout");
  const answerPanel = node("div", "qr-answer-panel");
  answerPanel.append(
    node("p", "small-muted qr-question-helper qr-instruction", helper),
    renderAnswerControl(q, saved),
    renderNotApplicableControl(saved),
    node("div", "qr-row-status", "Needs review")
  );

  const contextPanel = node("aside", "qr-context-panel");
  contextPanel.append(
    contextBlock("Why this matters", whyThisMatters(q)),
    contextBlock("Source / basis", sourceBasis(q)),
    contextBlock("Used in", renderDocumentImpact(q), true)
  );

  layout.append(answerPanel, contextPanel);
  block.append(top, node("h3", "qr-question-title", q.lawyer_question || q.public_question_label || q.field_key || "Question"), layout);

  if (saved) fillSaved(block, saved);
  queueMicrotask(() => updateCard(block));
  return block;
}

function renderAnswerControl(q, saved) {
  const rawValue = saved && saved.answer_state !== "not_applicable" ? saved.answer_value : prefillValue(q);
  const label = node("label", "label", "Current answer");
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
    if (!control.multiple) {
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Select one";
      control.append(placeholder);
    }
    q.answer_options.forEach((option) => {
      const opt = document.createElement("option");
      opt.value = String(option);
      opt.textContent = String(option);
      if (selected.has(String(option))) opt.selected = true;
      control.append(opt);
    });
    if (!control.multiple) {
      const raw = formatAnswerValue(rawValue);
      control.value = q.answer_options.map(String).includes(raw) ? raw : "";
    }
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

function renderNotApplicableControl(saved) {
  const wrap = node("div", "qr-na-block");
  const na = document.createElement("input");
  na.type = "checkbox";
  na.dataset.qrNa = "true";
  na.checked = saved?.answer_state === "not_applicable";
  wrap.append(labelWrap("qr-na-toggle", na, "This does not apply"));

  const reason = document.createElement("input");
  reason.className = "input";
  reason.type = "text";
  reason.placeholder = "Optional reason";
  reason.dataset.qrReason = "true";
  reason.value = saved?.not_applicable_reason || "";
  wrap.append(field("Reason", reason, "qr-na-reason"));
  return wrap;
}

function renderSectionAttestation(section, index) {
  const wrap = node("div", "qr-section-attestation");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.dataset.qrSectionAttestation = String(index);
  wrap.append(
    labelWrap("qr-attestation-toggle", checkbox, `I have reviewed this section and confirm the answers are acceptable for draft preparation.`),
    node("div", "small-muted", "Section attestation is required before final submission. It does not change individual answers.")
  );
  return wrap;
}

function contextBlock(label, value, isNode = false) {
  const block = node("div", "qr-context-block");
  block.append(node("div", "qr-context-label", label));
  if (isNode) block.append(value);
  else block.append(node("div", "qr-context-value", value || "Not visible from the diligence payload."));
  return block;
}

function renderDocumentImpact(q) {
  const impact = asArray(q.document_impact).map(humanizeImpact).filter(Boolean);
  const wrap = node("div", "qr-impact-row");
  if (!impact.length) {
    wrap.append(node("span", "small-muted", "Draft preparation workspace"));
    return wrap;
  }
  impact.forEach((value) => wrap.append(node("span", "qr-impact-chip", value)));
  return wrap;
}

function renderState(message = "") {
  if (!els.workflow || !els.nav || !els.drawer || !els.finalGate) return;
  const total = state.questions.size;
  const done = resolvedCount();
  const activeSection = state.sections[state.active] || {};
  const sectionDoneCount = sectionResolved(activeSection);
  const finalReady = done === total && total > 0 && allSectionAttestationsChecked() && finalAttestationChecked();
  const status = statusLabel(done, total, state.submission?.final_gate?.status);

  els.workflow.replaceChildren(
    node("div", "eyebrow", "Workflow"),
    heading("Review progress"),
    progress(done, total),
    compactStats({ active_section: activeSection.section_title || activeSection.section_id || "Review section", section_progress: `${sectionDoneCount}/${activeSection.questions?.length || 0}`, total_progress: `${done}/${total}`, current_status: status }),
    notice(message || statusMessage(done, total, status), status !== "Submitted")
  );

  els.nav.replaceChildren(nav(done, total, finalReady));
  renderFinalGate(done, total, finalReady, message);
  renderDrawer();
  renderRail();
  applySectionVisibility();
  updateCardBadges();
}

function nav(done, total, finalReady) {
  const row = node("div", "qr-nav-actions");
  const left = node("div", "qr-nav-group");
  const right = node("div", "qr-nav-group");
  const prevButton = button("btn secondary", "Previous section", () => moveSection(-1));
  const nextButton = button("btn secondary", "Next section", () => moveSection(1));
  const saveButton = button("btn secondary", "Save progress", () => persistSubmission("save_progress"));
  const submitButton = button("btn", "Submit final review", () => persistSubmission("submit_final_gate"));
  prevButton.disabled = state.active === 0;
  nextButton.disabled = state.active >= state.sections.length - 1;
  submitButton.disabled = !finalReady;
  left.append(prevButton, nextButton);
  right.append(saveButton, submitButton);
  row.append(left, right);
  return row;
}

function renderFinalGate(done, total, finalReady, message = "") {
  const submitted = state.submission?.final_gate?.status === "PASS";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.dataset.qrFinalAttestation = "true";
  checkbox.checked = finalAttestationChecked();

  const proceed = document.createElement("a");
  proceed.className = "btn" + (submitted ? "" : " disabled");
  proceed.href = submitted ? assemblyHref : "#";
  proceed.textContent = "Proceed to Drafting";
  proceed.setAttribute("aria-disabled", submitted ? "false" : "true");
  if (!submitted) proceed.addEventListener("click", (event) => event.preventDefault());

  const submit = button("btn secondary", "Submit final review", () => persistSubmission("submit_final_gate"));
  submit.disabled = !finalReady;

  els.finalGate.replaceChildren(
    node("div", "eyebrow", "Final attestation"),
    heading("Ready for draft preparation"),
    node("p", "small-muted", `Complete all answers, attest each section, and submit the final review. Current completion: ${done}/${total}.`),
    labelWrap("qr-attestation-toggle", checkbox, "I have reviewed the prefilled answers and confirm they are acceptable for draft preparation."),
    node("div", "qr-final-actions", "")
  );
  els.finalGate.lastChild.append(submit, proceed);
  if (message) els.finalGate.append(notice(message, !submitted));
}

function renderDrawer() {
  const errors = state.submission?.validation?.blocking_errors || [];
  const warnings = state.submission?.validation?.warnings || [];
  const hasAlerts = errors.length || warnings.length;
  els.drawer.classList.toggle("hidden", !hasAlerts);
  if (!hasAlerts) {
    els.drawer.replaceChildren();
    return;
  }
  els.drawer.replaceChildren(
    node("div", "eyebrow", "Review alerts"),
    heading("Items to fix"),
    compactStats({ items_to_fix: errors.length, notes: warnings.length }),
    list("Please resolve", errors.slice(0, 20)),
    list("Notes", warnings.slice(0, 20))
  );
}

function renderRail() {
  const wrap = node("div", "qr-rail-list");
  state.sections.forEach((section, index) => {
    const complete = sectionDone(section) && sectionAttested(index);
    const row = button(`qr-rail-item ${complete ? "complete" : ""} ${index === state.active ? "active" : ""}`, "");
    row.dataset.qrSectionIndex = String(index);
    row.append(
      node("span", "qr-rail-index", String(index + 1).padStart(2, "0")),
      node("span", "qr-rail-text", section.section_title || section.section_id || `Section ${index + 1}`),
      node("span", "qr-rail-count", `${sectionResolved(section)}/${section.questions?.length || 0}`)
    );
    wrap.append(row);
  });
  els.rail.replaceChildren(wrap);
}

function handleInput(event) {
  const card = event.target.closest?.(".qr-question-card");
  if (card) updateCard(card);
  renderState();
}

function handleClick(event) {
  const trigger = event.target.closest?.("[data-qr-section-index]");
  if (!trigger) return;
  const index = Number(trigger.dataset.qrSectionIndex);
  if (!Number.isInteger(index) || index < 0 || index >= state.sections.length) return;
  event.preventDefault();
  state.active = index;
  renderState();
}

function moveSection(delta) {
  state.active = Math.max(0, Math.min(state.sections.length - 1, state.active + delta));
  renderState();
}

async function persistSubmission(reason) {
  const rows = collectCurrentResponses();
  if (reason === "submit_final_gate") {
    if (rows.length !== state.questions.size) return renderState("Complete every answer or mark it not applicable before submitting.");
    if (!allSectionAttestationsChecked()) return renderState("Attest every section before submitting the final review.");
    if (!finalAttestationChecked()) return renderState("Complete the final attestation before proceeding to draft preparation.");
  }
  renderState("Saving your review...");
  try {
    const payload = await req(submitEndpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ submitted_by: "public_qualified_review_ui", submitted_by_label: "Qualified Review UI", save_reason: reason, question_responses: rows })
    });
    state.submission = payload.qualified_review_submission || null;
    hydrate(state.submission);
    renderState(state.submission?.final_gate?.status === "PASS" ? "Review submitted. Use Proceed to Drafting when the assembly engine is ready." : "Saved. Continue reviewing unresolved questions before submitting.");
  } catch (error) {
    renderState(`Save failed: ${error.message || error}`);
  }
}

function collectCurrentResponses() {
  const rows = [];
  document.querySelectorAll(".qr-question-card").forEach((card) => {
    const q = state.questions.get(idFromCard(card));
    if (!q) return;
    const row = rowFromCard(card, q);
    if (row) rows.push(row);
  });
  return rows;
}

function rowFromCard(card, q) {
  const na = card.querySelector("[data-qr-na]")?.checked === true;
  const reason = String(card.querySelector("[data-qr-reason]")?.value || "").trim();
  if (na) return { question_id: q.question_id, answer_state: "not_applicable", answer_value: null, not_applicable_reason: reason || "", demo_disclaimer_accepted: q.demo_disclaimer_required === true, submitted_at: new Date().toISOString() };

  const value = answerValue(card, q.answer_type);
  if (!has(value)) return null;
  const current = stableValue(value);
  const original = card.dataset.qrOriginalValue || "";
  if (current === original) return { question_id: q.question_id, answer_state: "confirmed", answer_value: value, not_applicable_reason: "", demo_disclaimer_accepted: q.demo_disclaimer_required === true, submitted_at: new Date().toISOString() };
  return { question_id: q.question_id, answer_state: "edited", answer_value: value, not_applicable_reason: "", demo_disclaimer_accepted: q.demo_disclaimer_required === true, submitted_at: new Date().toISOString() };
}

function updateCard(card) {
  const q = state.questions.get(idFromCard(card));
  if (!q) return;
  const row = rowFromCard(card, q);
  const na = card.querySelector("[data-qr-na]")?.checked === true;
  const control = answerControl(card);
  if (control) control.disabled = na;
  card.dataset.qrNa = String(na);
  card.classList.toggle("qr-resolved", Boolean(row));
  const status = card.querySelector(".qr-row-status");
  if (status) status.textContent = row ? rowStatus(row.answer_state) : "Needs review";
  const badges = card.querySelector(".qr-badge-row");
  const statusBadge = badges?.querySelector(".qr-badge.neutral, .qr-badge.ready");
  if (statusBadge) {
    statusBadge.textContent = row ? rowStatus(row.answer_state) : "Needs review";
    statusBadge.classList.toggle("ready", Boolean(row));
    statusBadge.classList.toggle("neutral", !row);
  }
}

function updateCardBadges() { document.querySelectorAll(".qr-question-card").forEach(updateCard); }
function applySectionVisibility() { document.querySelectorAll("#handoffBody .qr-form-section").forEach((sectionNode, index) => { const isActive = index === state.active; sectionNode.style.display = isActive ? "block" : "none"; sectionNode.dataset.active = String(isActive); }); }
function hydrate(saved) { state.submission = saved || null; state.responses.clear(); if (!saved?.question_responses) return; saved.question_responses.forEach((r) => { if (r?.question_id && states.has(r.answer_state)) state.responses.set(r.question_id, { question_id: r.question_id, answer_state: r.answer_state, answer_value: r.answer_value, not_applicable_reason: r.not_applicable_reason || "", demo_disclaimer_accepted: r.demo_disclaimer_accepted === true, submitted_at: r.submitted_at || new Date().toISOString() }); }); }
function buildQuestionSections({ sectionPages, questions }) { const pages = Array.isArray(sectionPages) && sectionPages.length ? sectionPages : inferPages(questions); return pages.map((page) => { const ids = Array.isArray(page.question_ids) ? new Set(page.question_ids) : null; const rows = ids ? questions.filter((question) => ids.has(question.question_id)) : questions.filter((question) => question.section_id === page.section_id); return { ...page, questions: rows, question_count: page.question_count || rows.length }; }); }
function inferPages(questions) { const seen = new Map(); questions.forEach((question) => { if (!seen.has(question.section_id)) seen.set(question.section_id, { section_id: question.section_id, section_title: question.section_title, question_ids: [], question_count: 0 }); const row = seen.get(question.section_id); row.question_ids.push(question.question_id); row.question_count += 1; }); return [...seen.values()]; }
function sectionDone(section) { return (section?.questions || []).length > 0 && section.questions.every((q) => { const card = cardByQuestion(q.question_id); return card && rowFromCard(card, q); }); }
function sectionResolved(section) { return (section?.questions || []).filter((q) => { const card = cardByQuestion(q.question_id); return card && rowFromCard(card, q); }).length; }
function sectionAttested(index) { return document.querySelector(`[data-qr-section-attestation="${index}"]`)?.checked === true; }
function allSectionAttestationsChecked() { return state.sections.length > 0 && state.sections.every((_, index) => sectionAttested(index)); }
function finalAttestationChecked() { return document.querySelector("[data-qr-final-attestation]")?.checked === true; }
function cardByQuestion(qid) { return [...document.querySelectorAll(".qr-question-card")].find((card) => idFromCard(card) === qid) || null; }
function idFromCard(card) { return card.dataset.questionId || String(card.querySelector(".block-title")?.textContent || "").match(/QR-\d{3}/)?.[0] || ""; }
function prefillValue(q) { return q.suggested_answer ?? q.initial_answer_value ?? q.demo_prefill_value ?? ""; }
function answerControl(card) { return card.querySelector("textarea.input, select.input, input.input:not([data-qr-reason]):not([data-qr-na]):not([data-qr-section-attestation]):not([data-qr-final-attestation])"); }
function answerValue(card, type) { const c = answerControl(card); if (!c) return ""; if (type === "select" && c.multiple) return [...c.selectedOptions].map((o) => o.value).filter(Boolean); return String(c.value || "").trim(); }
function stableValue(value) { if (Array.isArray(value)) return value.map((item) => String(item ?? "").trim()).filter(Boolean).join("\u001f"); if (value === null || value === undefined) return ""; if (typeof value === "object") return ""; return String(value).trim(); }
function resolvedCount() { return collectCurrentResponses().length; }
function rowStatus(stateValue) { return stateValue === "not_applicable" ? "Not applicable" : stateValue === "edited" ? "Edited" : "Prefilled"; }
function statusLabel(done, total, serverStatus) { if (serverStatus === "PASS") return "Submitted"; if (done === 0) return "Review needed"; if (done === total && total > 0 && allSectionAttestationsChecked() && finalAttestationChecked()) return "Ready to submit"; if (done === total && total > 0) return "Awaiting attestations"; return "In progress"; }
function statusMessage(done, total, status) { if (status === "Submitted") return "Review submitted. Proceed to Drafting is now available."; if (status === "Ready to submit") return "All answers and attestations are complete. Submit the final review."; if (status === "Awaiting attestations") return "All answers are complete. Attest each section and complete the final attestation."; return `Review the fields that need attention. ${done}/${total} complete.`; }
function whyThisMatters(q) { return q.reviewer_instruction || q.why_this_matters || q.field_purpose || q.public_question_help || "This answer controls how the downstream draft workspace treats the issue."; }
function sourceBasis(q) { const parts = []; if (q.prefill_source) parts.push(`Prefill: ${titleCase(q.prefill_source)}`); if (q.evidence_mode) parts.push(`Evidence: ${titleCase(q.evidence_mode)}`); const sources = asArray(q.source_artifacts || q.source_artifact || q.source_refs).filter(Boolean); if (sources.length) parts.push(`Sources: ${sources.map(titleCase).join(", ")}`); return parts.join("\n") || "Source basis not visible in renderer payload."; }
function progress(done, total) { const pct = total ? Math.round((done / total) * 100) : 0; const wrap = node("div", "qr-progress"); wrap.append(node("div", "qr-progress-top", `${pct}% complete`)); const bar = node("div", "qr-progress-track"); const fill = node("div", "qr-progress-fill"); fill.style.width = `${pct}%`; bar.append(fill); wrap.append(bar); return wrap; }
function compactStats(obj) { const grid = node("div", "qr-compact-stats"); Object.entries(obj).forEach(([key, value]) => { const item = node("div", "qr-compact-stat"); item.append(node("div", "qr-stat-label", titleCase(key)), node("div", "qr-stat-value", String(value))); grid.append(item); }); return grid; }
function list(titleText, items) { const box = node("div", "qr-alert-list"); box.append(node("div", "block-title", titleText)); if (!items.length) box.append(node("div", "small-muted", "None.")); items.forEach((item) => box.append(notice(cleanAlert(String(item)), true))); return box; }
function field(name, el, cls = "") { const wrap = node("div", `form-grid ${cls}`); wrap.append(node("label", "label", name), el); return wrap; }
function button(cls, text, fn) { const b = document.createElement("button"); b.className = cls; b.type = "button"; b.textContent = text || ""; if (fn) b.addEventListener("click", fn); return b; }
function labelWrap(cls, inputEl, text) { const label = document.createElement("label"); label.className = cls; label.append(inputEl, node("span", "", text)); return label; }
function heading(text) { const h = document.createElement("h2"); h.textContent = text; return h; }
function notice(text, warn) { const n = node("div", "notice qr-workflow-notice", text); n.classList.toggle("ready", !warn); return n; }
function summaryItem(label, value) { const item = node("div", "qr-summary-item"); item.append(node("div", "qr-summary-label", label), node("div", "qr-summary-value", value)); return item; }
function humanizeImpact(value) { const text = String(value || "").trim(); const known = { privacy_policy: "Privacy Policy", terms_of_service: "Terms of Service", terms: "Terms of Service", dpa: "Data Processing Addendum", data_processing_addendum: "Data Processing Addendum", acceptable_use_policy: "Acceptable Use Policy", ai_policy: "AI Policy", internal_governance: "Internal Governance Pack", security_policy: "Security Policy", service_level_agreement: "Service Level Agreement" }; return known[text] || titleCase(text); }
function asArray(value) { return Array.isArray(value) ? value : value || value === 0 ? [value] : []; }
function formatAnswerValue(value) { if (Array.isArray(value)) return value.join(", "); if (value && typeof value === "object") return ""; return String(value ?? ""); }
function titleCase(value) { return String(value || "").replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()); }
function cleanAlert(value) { return value.replace(/_/g, " ").replace(/:/g, ": "); }
function has(value) { return Array.isArray(value) ? value.length > 0 : Boolean(String(value ?? "").trim()); }
function node(tag, cls, text) { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined && text !== "") el.textContent = text; return el; }
async function req(url, init) { const res = await fetch(url, init); const json = await res.json().catch(() => ({})); if (!res.ok) throw new Error(json.message || json.error || "Request failed"); return json; }
function showError(message) { els.title.textContent = "Qualified Review unavailable"; els.subtitle.textContent = message; if (els.meta) els.meta.textContent = message; if (els.rail) els.rail.textContent = message; if (els.body) els.body.replaceChildren(); if (els.workflow) els.workflow.replaceChildren(notice(message, true)); }
