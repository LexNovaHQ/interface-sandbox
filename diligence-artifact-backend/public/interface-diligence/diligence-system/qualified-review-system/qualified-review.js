(function () {
  "use strict";

  const VERSION = "interface_qualified_review_workspace.v2";
  const ALLOWED_SERVER_STATES = new Set(["confirmed", "edited", "not_applicable"]);
  const runId = new URLSearchParams(window.location.search || "").get("run_id") || "";
  const endpoint = runId ? `/public/diligence-system/qualified-review/${encodeURIComponent(runId)}` : "";
  const submitEndpoint = endpoint ? `${endpoint}/responses` : "";
  const storageKey = `interface-qualified-review-draft:${runId}`;

  const els = {
    title: document.getElementById("handoffTitle"),
    subtitle: document.getElementById("handoffSubtitle"),
    meta: document.getElementById("handoffMeta"),
    body: document.getElementById("handoffBody"),
    back: document.getElementById("backToReport"),
    annexure: document.getElementById("openAnnexure"),
    rail: document.getElementById("qualifiedReviewRail"),
    workflow: document.getElementById("qrWorkflowPanel"),
    nav: document.getElementById("qrNavigationPanel"),
    receipt: document.getElementById("qrReceiptPanel"),
    drawer: document.getElementById("qrValidationDrawer"),
    finalGate: document.getElementById("qrFinalGatePanel"),
    live: document.getElementById("qualifiedReviewLiveStatus")
  };

  const state = {
    payload: null,
    renderer: {},
    handoff: {},
    questions: new Map(),
    sections: [],
    active: 0,
    serverSubmission: null,
    receiptMeta: null,
    local: loadLocal()
  };

  window.InterfaceQualifiedReview = Object.freeze({
    version: VERSION,
    qualified_review_is_separate_system: true,
    shares_pipeline_run_id: true,
    no_document_assembly: true,
    collectResponses,
    saveLocal
  });

  document.addEventListener("change", handleChange, true);
  document.addEventListener("input", handleInput, true);
  document.addEventListener("click", handleClick, true);

  if (!runId) showError("Missing run_id in the Qualified Review URL.");
  else boot().catch((error) => showError(error?.message || String(error)));

  async function boot() {
    els.back.href = `report.html?run_id=${encodeURIComponent(runId)}`;
    els.annexure.href = `technical-annexure.html?run_id=${encodeURIComponent(runId)}`;
    const payload = await request(endpoint);
    const renderer = payload.qualified_review_renderer_payload || {};
    const handoff = payload.qualified_review_handoff || {};
    assertBoundary(renderer, handoff);
    const questions = Array.isArray(renderer.questions)
      ? renderer.questions
      : Array.isArray(handoff.question_handoff?.questions)
        ? handoff.question_handoff.questions
        : [];
    const sectionPages = renderer.question_sections || renderer.section_pages || handoff.question_handoff?.section_pages || handoff.section_pages || [];

    state.payload = payload;
    state.renderer = renderer;
    state.handoff = handoff;
    state.questions = new Map(questions.map((question) => [question.question_id, question]));
    state.sections = buildSections(sectionPages, questions);
    state.serverSubmission = payload.qualified_review_submission || null;
    hydrateServer(state.serverSubmission);
    renderShell();
    renderState();
    announce(`Qualified Review loaded. ${questions.length} review items across ${state.sections.length} sections.`);
  }

  function assertBoundary(renderer, handoff) {
    const contract = renderer.render_contract || {};
    if (contract.no_document_assembly !== true) throw new Error("QUALIFIED_REVIEW_NO_DOCUMENT_ASSEMBLY_NOT_LOCKED");
    if (renderer.renderer_type !== "qualified_review_renderer_payload") throw new Error("QUALIFIED_REVIEW_RENDERER_TYPE_INVALID");
    const explicitSeparate = handoff.qualified_review_is_separate_system ?? renderer.qualified_review_is_separate_system;
    const explicitShared = handoff.shares_pipeline_run_id ?? renderer.shares_pipeline_run_id;
    if (explicitSeparate === false) throw new Error("QUALIFIED_REVIEW_SEPARATE_SYSTEM_BOUNDARY_INVALID");
    if (explicitShared === false) throw new Error("QUALIFIED_REVIEW_RUN_ID_BOUNDARY_INVALID");
  }

  function renderShell() {
    els.title.textContent = "Qualified Review";
    els.subtitle.textContent = "Review the diligence findings, confirm or correct the proposed answer, record any reviewer limitation, and submit a review receipt.";
    els.meta.replaceChildren(renderMatterSummary());
    els.body.replaceChildren(...state.sections.map(renderSection));
  }

  function renderMatterSummary() {
    const target = state.renderer.target || state.handoff.target || "Target under review";
    const contract = state.renderer.render_contract || {};
    const grid = node("div", "qr-summary-grid");
    [
      ["Target", target],
      ["Run ID", state.payload?.run_id || state.renderer.run_id || runId],
      ["Target URL", state.renderer.target_url || state.handoff.target_url],
      ["Review items", state.questions.size],
      ["Sections", state.sections.length],
      ["Workspace", "Qualified Review"],
      ["Shared pipeline run", "Yes"],
      ["Document assembly", contract.no_document_assembly === true ? "Not performed" : "Boundary unavailable"]
    ].forEach(([label, value]) => {
      if (value === undefined || value === null || value === "") return;
      const item = node("div", "qr-summary-item");
      item.append(node("div", "qr-summary-label", label), node("div", "qr-summary-value", String(value)));
      grid.append(item);
    });
    return grid;
  }

  function renderSection(section, index) {
    const root = node("section", `qr-review-section ${index === state.active ? "active" : ""}`);
    root.dataset.qrSectionIndex = String(index);
    root.id = `qr-section-${stable(section.section_id || index + 1)}`;
    root.tabIndex = -1;
    const header = node("header", "qr-review-section-header");
    header.append(
      node("div", "eyebrow", `Section ${String(index + 1).padStart(2, "0")}`),
      node("h3", "", section.section_title || section.section_id || "Review section"),
      node("p", "small-muted", `${section.questions.length} review item${section.questions.length === 1 ? "" : "s"}. Confirm the prefill, correct it, qualify it with a limitation, or mark it not applicable.`)
    );
    const list = node("div", "qr-finding-list");
    section.questions.forEach((question) => list.append(renderFinding(question)));
    root.append(header, list, renderSectionAttestation(section, index));
    return root;
  }

  function renderFinding(question) {
    const draft = localResponse(question.question_id);
    const saved = serverResponse(question.question_id);
    const mode = draft?.mode || inferMode(saved, question);
    const answer = draft?.answer ?? saved?.answer_value ?? prefill(question);
    const limitation = draft?.limitation ?? saved?.reviewer_limitation ?? saved?.not_applicable_reason ?? "";
    const card = node("article", "qr-finding");
    card.dataset.questionId = question.question_id || "";
    card.dataset.reviewMode = mode;
    card.dataset.originalValue = stableValue(prefill(question));

    const top = node("div", "qr-finding-top");
    top.append(
      node("div", "qr-finding-id", question.question_id || question.field_key || "Review item"),
      node("span", "qr-source-badge", sourceBadge(question))
    );
    const title = node("h4", "", question.lawyer_question || question.public_question_label || question.field_key || "Review item");
    const layout = node("div", "qr-finding-layout");
    const answerPanel = node("div", "qr-answer-panel");
    answerPanel.append(renderDecisionGroup(question, mode), renderAnswerArea(question, answer, limitation), node("div", "qr-item-status", "Needs review"));
    const context = node("aside", "qr-context");
    context.append(
      contextBlock("Why this matters", whyThisMatters(question)),
      contextBlock("Source / basis", sourceBasis(question)),
      contextBlock("Affected review output", impactText(question))
    );
    layout.append(answerPanel, context);
    card.append(top, title, layout);
    queueMicrotask(() => updateFinding(card));
    return card;
  }

  function renderDecisionGroup(question, selected) {
    const fieldset = node("fieldset", "qr-decision-group");
    const legend = document.createElement("legend");
    legend.textContent = "Reviewer decision";
    const options = node("div", "qr-decision-options");
    [
      ["confirm", "Confirm"],
      ["correct", "Correct"],
      ["limitation", "Add limitation"],
      ["not_applicable", "Not applicable"]
    ].forEach(([value, label]) => {
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `review-mode-${question.question_id}`;
      input.value = value;
      input.checked = selected === value;
      input.dataset.reviewMode = value;
      const wrapper = node("label", "qr-decision-option");
      wrapper.append(input, node("span", "", label));
      options.append(wrapper);
    });
    fieldset.append(legend, options);
    return fieldset;
  }

  function renderAnswerArea(question, value, limitation) {
    const area = node("div", "qr-answer-area");
    const answerWrap = node("div", "qr-answer-control");
    const answerLabel = document.createElement("label");
    answerLabel.textContent = "Reviewed answer";
    const control = answerControl(question, value);
    control.dataset.qrAnswer = "true";
    answerWrap.append(answerLabel, control);

    const limitationWrap = node("div", "qr-limitation-field");
    const limitationLabel = document.createElement("label");
    limitationLabel.textContent = "Reviewer limitation / qualification";
    const note = document.createElement("textarea");
    note.className = "input";
    note.rows = 4;
    note.dataset.qrLimitation = "true";
    note.placeholder = "State the limitation, uncertainty or reason this item is not applicable.";
    note.value = limitation || "";
    limitationWrap.append(limitationLabel, note);
    area.append(answerWrap, limitationWrap);
    return area;
  }

  function answerControl(question, value) {
    const type = String(question.answer_type || "short_answer");
    if (type === "long_answer") {
      const control = document.createElement("textarea");
      control.className = "input";
      control.rows = 5;
      control.value = formatAnswer(value);
      return control;
    }
    if ((type === "dropdown" || type === "select") && Array.isArray(question.answer_options) && question.answer_options.length) {
      const control = document.createElement("select");
      control.className = "input";
      control.multiple = type === "select";
      const selected = new Set(asArray(value).map(String));
      if (!control.multiple) {
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Select one";
        control.append(placeholder);
      }
      question.answer_options.forEach((option) => {
        const item = document.createElement("option");
        item.value = String(option);
        item.textContent = String(option);
        item.selected = selected.has(String(option));
        control.append(item);
      });
      return control;
    }
    const control = document.createElement("input");
    control.className = "input";
    control.type = "text";
    control.value = formatAnswer(value);
    return control;
  }

  function renderSectionAttestation(section, index) {
    const wrap = node("div", "qr-section-attestation");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.dataset.sectionAttestation = String(index);
    checkbox.checked = state.local.section_attestations?.[String(index)] === true;
    const label = node("label", "qr-check-label");
    label.append(checkbox, node("span", "", `I reviewed this section and its ${section.questions.length} item${section.questions.length === 1 ? "" : "s"}.`));
    wrap.append(label, node("div", "small-muted", "Section attestation records review completion only. It does not assemble or generate any document."));
    return wrap;
  }

  function renderState(message = "") {
    updateAllFindings();
    applySectionVisibility();
    renderRail();
    renderWorkflow(message);
    renderNavigation();
    renderFinalGate(message);
    renderReceipt();
    renderAlerts();
    saveLocal();
  }

  function renderWorkflow(message) {
    const done = collectResponses().length;
    const total = state.questions.size;
    const percent = total ? Math.round(done / total * 100) : 0;
    const track = node("div", "qr-progress-track");
    const fill = node("div", "qr-progress-fill");
    fill.style.width = `${percent}%`;
    track.append(fill);
    const progress = node("div", "qr-progress");
    progress.append(track, node("div", "qr-progress-copy", `${done}/${total} reviewed · ${percent}%`));
    els.workflow.replaceChildren(progress, message ? node("div", "small-muted", message) : node("div", "small-muted", reviewStatusCopy(done, total)));
  }

  function renderNavigation() {
    const row = node("div", "qr-nav-actions");
    const left = node("div", "qr-nav-group");
    const right = node("div", "qr-nav-group");
    const previous = button("btn secondary", "Previous section", () => moveSection(-1));
    const next = button("btn secondary", "Next section", () => moveSection(1));
    const save = button("btn secondary", "Save review state", () => persist("save_progress"));
    previous.disabled = state.active === 0;
    next.disabled = state.active >= state.sections.length - 1;
    left.append(previous, next);
    right.append(save);
    row.append(left, right);
    els.nav.replaceChildren(row);
  }

  function renderFinalGate(message) {
    const ready = finalReady();
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.dataset.finalAttestation = "true";
    checkbox.checked = state.local.final_attestation === true;
    const label = node("label", "qr-check-label");
    label.append(checkbox, node("span", "", "I confirm this Qualified Review submission is complete for the reviewed questions and limitations."));
    const submit = button("btn", "Submit Qualified Review", () => persist("submit_final_gate"));
    submit.disabled = !ready;
    const actions = node("div", "qr-final-actions");
    actions.append(submit, linkButton("btn secondary", "Return to Report", els.back.href));
    els.finalGate.replaceChildren(
      node("div", "eyebrow", "Final review gate"),
      node("h2", "", ready ? "Ready to submit the review" : "Complete the review queue"),
      node("p", "small-muted", "Submission creates a Qualified Review receipt. It does not assemble documents or activate the Assembly Preview."),
      label,
      actions
    );
    if (message) els.finalGate.append(node("div", "small-muted", message));
  }

  function renderReceipt() {
    const submission = state.serverSubmission;
    if (!submission) {
      els.receipt.classList.add("hidden");
      els.receipt.replaceChildren();
      return;
    }
    const gate = submission.final_gate || {};
    const validation = submission.validation || {};
    const receipt = state.receiptMeta || {};
    els.receipt.classList.remove("hidden");
    const grid = node("div", "qr-receipt-grid");
    [
      ["Receipt status", gate.status || validation.status || "Saved"],
      ["Run ID", submission.run_id || runId],
      ["Saved at", submission.submitted_at || receipt.saved_at],
      ["Artifact", receipt.artifact_name || submission.artifact_type || "qualified_review_submission"],
      ["Version", receipt.version || submission.artifact_version],
      ["Responses received", submission.submitted_response_count],
      ["Resolved items", gate.resolved_question_count],
      ["Unresolved items", gate.unresolved_question_count],
      ["Document assembly", "Not performed"]
    ].forEach(([label, value]) => {
      if (value === undefined || value === null || value === "") return;
      const item = node("div", "qr-receipt-item");
      item.append(node("div", "qr-summary-label", label), node("div", "qr-summary-value", String(value)));
      grid.append(item);
    });
    const actions = node("div", "qr-receipt-actions no-print");
    actions.append(
      linkButton("btn", "Return to Report", els.back.href),
      linkButton("btn secondary", "Open Technical Annexure", els.annexure.href)
    );
    els.receipt.replaceChildren(
      node("div", "eyebrow", "Qualified Review receipt"),
      node("h2", "", gate.status === "PASS" ? "Review submitted" : "Review state saved"),
      node("p", "small-muted", "This receipt records the Qualified Review state for the shared run ID. No document was assembled."),
      grid,
      actions
    );
  }

  function renderAlerts() {
    const errors = state.serverSubmission?.validation?.blocking_errors || [];
    const warnings = state.serverSubmission?.validation?.warnings || [];
    if (!errors.length && !warnings.length) {
      els.drawer.classList.add("hidden");
      els.drawer.replaceChildren();
      return;
    }
    els.drawer.classList.remove("hidden");
    const list = node("div", "qr-alert-list");
    [...errors, ...warnings].slice(0, 30).forEach((item) => list.append(node("div", "qr-alert-item", cleanAlert(item))));
    els.drawer.replaceChildren(node("div", "eyebrow", "Review alerts"), node("h2", "", "Items requiring attention"), list);
  }

  function renderRail() {
    const list = node("div", "qr-rail-list");
    state.sections.forEach((section, index) => {
      const complete = section.questions.every((question) => responseForCard(question.question_id)) && sectionAttested(index);
      const item = button(`qr-rail-item ${complete ? "complete" : ""} ${index === state.active ? "active" : ""}`, "");
      item.dataset.qrSectionIndex = String(index);
      item.append(
        node("span", "qr-rail-index", String(index + 1).padStart(2, "0")),
        node("span", "qr-rail-text", section.section_title || section.section_id || `Section ${index + 1}`),
        node("span", "qr-rail-count", `${section.questions.filter((question) => responseForCard(question.question_id)).length}/${section.questions.length}`)
      );
      list.append(item);
    });
    els.rail.replaceChildren(list);
  }

  async function persist(reason) {
    const responses = collectResponses();
    if (reason === "submit_final_gate" && !finalReady()) {
      renderState("Complete every item, limitation note and attestation before final submission.");
      return;
    }
    renderWorkflow("Saving Qualified Review state...");
    try {
      const result = await request(submitEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          submitted_by: "public_qualified_review_ui",
          submitted_by_label: "Qualified Review UI",
          save_reason: reason,
          question_responses: responses,
          section_attestations: state.local.section_attestations || {},
          final_attestation: state.local.final_attestation === true,
          qualified_review_is_separate_system: true,
          shares_pipeline_run_id: true,
          no_document_assembly: true
        })
      });
      state.serverSubmission = result.qualified_review_submission || result.submission || result.artifact || null;
      state.receiptMeta = {
        artifact_name: result.artifact_name,
        version: result.version,
        saved_at: new Date().toISOString()
      };
      if (state.serverSubmission) hydrateServer(state.serverSubmission);
      state.local.last_saved_at = new Date().toISOString();
      saveLocal();
      const finalStatus = state.serverSubmission?.final_gate?.status;
      renderState(finalStatus === "PASS" ? "Qualified Review submitted. Receipt created; no document assembly was performed." : "Review state saved. Continue resolving the remaining items.");
      announce(finalStatus === "PASS" ? "Qualified Review submitted." : "Qualified Review state saved.");
    } catch (error) {
      renderState(`Save failed: ${error?.message || error}`);
      announce(`Save failed: ${error?.message || error}`);
    }
  }

  function collectResponses() {
    const rows = [];
    document.querySelectorAll(".qr-finding").forEach((card) => {
      const response = responseFromCard(card);
      if (response) rows.push(response);
    });
    return rows;
  }

  function responseFromCard(card) {
    const question = state.questions.get(card.dataset.questionId);
    if (!question) return null;
    const mode = selectedMode(card);
    const answer = answerValue(card, question.answer_type);
    const limitation = String(card.querySelector("[data-qr-limitation]")?.value || "").trim();
    if (!mode) return null;
    if (mode === "not_applicable") {
      if (!limitation) return null;
      return responseRow(question, "not_applicable", null, limitation, mode);
    }
    if (!hasValue(answer)) return null;
    if (mode === "limitation" && !limitation) return null;
    const answerState = mode === "confirm" ? "confirmed" : "edited";
    return responseRow(question, answerState, answer, limitation, mode);
  }

  function responseRow(question, answerState, answerValue, limitation, reviewMode) {
    return {
      question_id: question.question_id,
      answer_state: answerState,
      answer_value: answerValue,
      not_applicable_reason: limitation || "",
      reviewer_limitation: limitation || "",
      reviewer_decision: reviewMode,
      demo_disclaimer_accepted: question.demo_disclaimer_required === true,
      submitted_at: new Date().toISOString()
    };
  }

  function updateAllFindings() { document.querySelectorAll(".qr-finding").forEach(updateFinding); }
  function updateFinding(card) {
    const mode = selectedMode(card);
    card.dataset.reviewMode = mode || "";
    const answer = card.querySelector("[data-qr-answer]");
    if (answer) answer.disabled = mode === "confirm" || mode === "not_applicable";
    const response = responseFromCard(card);
    const status = card.querySelector(".qr-item-status");
    if (status) {
      status.textContent = response ? modeLabel(mode) : "Needs review";
      status.classList.toggle("ready", Boolean(response));
    }
  }

  function handleChange(event) {
    if (event.target.matches("[data-review-mode], [data-section-attestation], [data-final-attestation]")) {
      syncLocalFromDom();
      renderState();
    }
  }
  function handleInput(event) {
    if (event.target.matches("[data-qr-answer], [data-qr-limitation]")) {
      syncLocalFromDom();
      updateFinding(event.target.closest(".qr-finding"));
      renderWorkflow();
      renderRail();
      renderFinalGate();
    }
  }
  function handleClick(event) {
    const item = event.target.closest?.("[data-qr-section-index]");
    if (!item) return;
    const index = Number(item.dataset.qrSectionIndex);
    if (!Number.isInteger(index) || index < 0 || index >= state.sections.length) return;
    event.preventDefault();
    state.active = index;
    state.local.active_section = index;
    renderState();
    document.querySelector(`.qr-review-section[data-qr-section-index="${index}"]`)?.focus({ preventScroll: false });
  }

  function moveSection(delta) {
    state.active = Math.max(0, Math.min(state.sections.length - 1, state.active + delta));
    state.local.active_section = state.active;
    renderState();
    document.querySelector(`.qr-review-section[data-qr-section-index="${state.active}"]`)?.focus({ preventScroll: false });
  }

  function applySectionVisibility() {
    document.querySelectorAll(".qr-review-section").forEach((section, index) => {
      const active = index === state.active;
      section.classList.toggle("active", active);
      section.setAttribute("aria-hidden", active ? "false" : "true");
      section.inert = !active;
    });
  }

  function finalReady() {
    return state.questions.size > 0
      && collectResponses().length === state.questions.size
      && state.sections.every((_, index) => sectionAttested(index))
      && finalAttested();
  }
  function sectionAttested(index) { return document.querySelector(`[data-section-attestation="${index}"]`)?.checked === true; }
  function finalAttested() { return document.querySelector("[data-final-attestation]")?.checked === true; }

  function syncLocalFromDom() {
    const responses = {};
    document.querySelectorAll(".qr-finding").forEach((card) => {
      const question = state.questions.get(card.dataset.questionId);
      if (!question) return;
      responses[question.question_id] = {
        mode: selectedMode(card),
        answer: answerValue(card, question.answer_type),
        limitation: String(card.querySelector("[data-qr-limitation]")?.value || "").trim()
      };
    });
    const attestations = {};
    document.querySelectorAll("[data-section-attestation]").forEach((checkbox) => { attestations[checkbox.dataset.sectionAttestation] = checkbox.checked === true; });
    state.local.responses = responses;
    state.local.section_attestations = attestations;
    state.local.final_attestation = finalAttested();
    state.local.active_section = state.active;
    saveLocal();
  }

  function saveLocal() {
    try { localStorage.setItem(storageKey, JSON.stringify(state.local)); } catch { /* Browser storage is optional. */ }
  }
  function loadLocal() {
    if (!runId) return { responses: {}, section_attestations: {}, final_attestation: false, active_section: 0 };
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
      return {
        responses: parsed.responses || {},
        section_attestations: parsed.section_attestations || {},
        final_attestation: parsed.final_attestation === true,
        active_section: Number.isInteger(parsed.active_section) ? parsed.active_section : 0,
        last_saved_at: parsed.last_saved_at || ""
      };
    } catch { return { responses: {}, section_attestations: {}, final_attestation: false, active_section: 0 }; }
  }

  function hydrateServer(submission) {
    if (!submission?.question_responses) return;
    for (const row of submission.question_responses) {
      if (!row?.question_id || !ALLOWED_SERVER_STATES.has(row.answer_state)) continue;
      if (!state.local.responses[row.question_id]) {
        state.local.responses[row.question_id] = {
          mode: inferMode(row, state.questions.get(row.question_id)),
          answer: row.answer_value,
          limitation: row.reviewer_limitation || row.not_applicable_reason || ""
        };
      }
    }
    state.active = Math.max(0, Math.min(state.sections.length - 1, Number(state.local.active_section) || 0));
  }

  function buildSections(sectionPages, questions) {
    const pages = Array.isArray(sectionPages) && sectionPages.length ? sectionPages : inferSections(questions);
    return pages.map((page) => {
      const ids = Array.isArray(page.question_ids) ? new Set(page.question_ids) : null;
      const rows = Array.isArray(page.questions)
        ? page.questions
        : ids
          ? questions.filter((question) => ids.has(question.question_id))
          : questions.filter((question) => question.section_id === page.section_id);
      return { ...page, questions: rows, question_count: rows.length };
    });
  }
  function inferSections(questions) {
    const map = new Map();
    questions.forEach((question) => {
      if (!map.has(question.section_id)) map.set(question.section_id, { section_id: question.section_id, section_title: question.section_title, question_ids: [] });
      map.get(question.section_id).question_ids.push(question.question_id);
    });
    return [...map.values()];
  }

  function localResponse(id) { return state.local.responses?.[id] || null; }
  function serverResponse(id) { return state.serverSubmission?.question_responses?.find((row) => row.question_id === id) || null; }
  function responseForCard(id) { const card = document.querySelector(`.qr-finding[data-question-id="${cssEscape(id)}"]`); return card ? responseFromCard(card) : null; }
  function selectedMode(card) { return card.querySelector("[data-review-mode]:checked")?.value || ""; }
  function answerValue(card, type) {
    const control = card.querySelector("[data-qr-answer]");
    if (!control) return "";
    if (type === "select" && control.multiple) return [...control.selectedOptions].map((option) => option.value).filter(Boolean);
    return String(control.value || "").trim();
  }
  function inferMode(saved, question) {
    if (!saved) return "";
    if (saved.answer_state === "not_applicable") return "not_applicable";
    if (saved.reviewer_limitation || saved.not_applicable_reason) return "limitation";
    if (saved.answer_state === "edited" || stableValue(saved.answer_value) !== stableValue(prefill(question))) return "correct";
    return "confirm";
  }
  function prefill(question) { return question.suggested_answer ?? question.initial_answer_value ?? question.demo_prefill_value ?? ""; }
  function formatAnswer(value) { if (Array.isArray(value)) return value.join(", "); if (value && typeof value === "object") return ""; return String(value ?? ""); }
  function sourceBadge(question) { return question.prefill_source === "market_norm_demo" || question.demo_disclaimer_required === true ? "Demo assumption" : "Diligence prefill"; }
  function whyThisMatters(question) { return question.reviewer_instruction || question.why_this_matters || question.field_purpose || question.public_question_help || "This item requires reviewer confirmation before the review receipt can be final."; }
  function sourceBasis(question) {
    const parts = [];
    if (question.prefill_source) parts.push(`Prefill: ${label(question.prefill_source)}`);
    if (question.evidence_mode) parts.push(`Evidence: ${label(question.evidence_mode)}`);
    const sources = asArray(question.source_artifacts || question.source_artifact || question.source_refs).filter(Boolean);
    if (sources.length) parts.push(`Sources: ${sources.map(label).join(", ")}`);
    return parts.join("\n") || "Source basis not visible in the review payload.";
  }
  function impactText(question) { const impact = asArray(question.document_impact).map(label).filter(Boolean); return impact.length ? impact.join(", ") : "Qualified Review record"; }
  function contextBlock(labelText, value) { const block = node("div", "qr-context-block"); block.append(node("div", "qr-context-label", labelText), node("div", "qr-context-value", value || "Not stated")); return block; }
  function reviewStatusCopy(done, total) { if (!total) return "No review items were emitted."; if (done === total) return "All review items have a complete reviewer decision. Complete the attestations to submit."; return `${total - done} review item${total - done === 1 ? "" : "s"} remain unresolved.`; }
  function modeLabel(mode) { return ({ confirm: "Confirmed", correct: "Corrected", limitation: "Qualified with limitation", not_applicable: "Not applicable" })[mode] || "Needs review"; }
  function cleanAlert(value) { return String(value || "").replace(/_/g, " ").replace(/:/g, ": "); }
  function stableValue(value) { if (Array.isArray(value)) return value.map((item) => String(item ?? "").trim()).filter(Boolean).join("\u001f"); if (value === null || value === undefined) return ""; if (typeof value === "object") return JSON.stringify(value); return String(value).trim(); }
  function hasValue(value) { return Array.isArray(value) ? value.length > 0 : Boolean(String(value ?? "").trim()); }
  function asArray(value) { return Array.isArray(value) ? value : value === undefined || value === null || value === "" ? [] : [value]; }
  function label(value) { return String(value || "").replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (m) => m.toUpperCase()); }
  function stable(value) { return String(value || "item").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "item"; }
  function cssEscape(value) { return window.CSS?.escape ? window.CSS.escape(value) : String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&"); }
  function button(className, text, handler) { const item = document.createElement("button"); item.type = "button"; item.className = className; item.textContent = text; if (handler) item.addEventListener("click", handler); return item; }
  function linkButton(className, text, href) { const item = document.createElement("a"); item.className = className; item.textContent = text; item.href = href || "#"; return item; }
  function node(tag, className, textContent) { const element = document.createElement(tag); if (className) element.className = className; if (textContent !== undefined && textContent !== null) element.textContent = String(textContent); return element; }
  async function request(url, init) { const response = await fetch(url, init); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.message || payload.error || "Request failed"); return payload; }
  function announce(message) { if (els.live) els.live.textContent = message; }
  function showError(message) { els.title.textContent = "Qualified Review unavailable"; els.subtitle.textContent = message; els.meta.textContent = message; els.body.replaceChildren(); els.workflow.textContent = message; els.rail.textContent = message; announce(message); }
})();
