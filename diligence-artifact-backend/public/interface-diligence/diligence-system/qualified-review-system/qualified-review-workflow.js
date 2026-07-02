(() => {
  const runId = new URLSearchParams(location.search).get("run_id") || "";
  if (!runId) return;

  const endpoint = `/public/diligence-system/qualified-review/${encodeURIComponent(runId)}`;
  const submitEndpoint = `${endpoint}/responses`;
  const states = new Set(["confirmed", "edited", "not_applicable"]);
  const questions = new Map();
  const responses = new Map();
  let sections = [];
  let active = 0;
  let submission = null;
  let panel;
  let navPanel;
  let drawer;

  document.addEventListener("input", handleFormInput, true);
  document.addEventListener("change", handleFormInput, true);
  document.addEventListener("click", handleSectionNavigation, true);
  boot().catch((error) => fatal(error));

  async function boot() {
    const payload = await req(endpoint);
    const renderer = payload.qualified_review_renderer_payload || {};
    const handoff = payload.qualified_review_handoff || {};
    const rows = Array.isArray(renderer.questions) ? renderer.questions : handoff.question_handoff?.questions || [];
    const pages = Array.isArray(renderer.question_sections) ? renderer.question_sections : buildSections(rows);
    rows.forEach((row) => questions.set(row.question_id, row));
    sections = pages.map((page) => ({ ...page, questions: (page.questions || []).map((q) => questions.get(q.question_id) || q) }));
    hydrate(payload.qualified_review_submission);
    await waitForCards();
    enhanceCards();
    mountWorkflowPanel();
    applySectionVisibility();
    renderState();
  }

  function handleFormInput(event) {
    const card = event.target.closest?.(".array-block");
    if (card) updateCard(card);
    renderState();
  }

  function handleSectionNavigation(event) {
    const trigger = event.target.closest("[data-qr-section-index]");
    if (!trigger) return;
    const index = Number(trigger.dataset.qrSectionIndex);
    if (!Number.isInteger(index) || index < 0 || index >= sections.length) return;
    event.preventDefault();
    active = index;
    applySectionVisibility();
    renderState();
  }

  function enhanceCards() {
    document.querySelectorAll(".array-block").forEach((card) => {
      if (card.dataset.qrWorkflow === "true") return;
      const qid = idFromCard(card);
      const q = questions.get(qid);
      if (!q) return;
      card.dataset.qrWorkflow = "true";
      card.dataset.qrOriginalValue = stableValue(answerValue(card, q.answer_type));

      const saved = responses.get(qid);
      const na = document.createElement("input");
      na.type = "checkbox";
      na.dataset.qrNa = "true";
      const naToggle = labelWrap("qr-na-toggle", na, "This does not apply");
      card.append(naToggle);

      const reason = input("Optional reason");
      reason.dataset.qrReason = "true";
      card.append(field("Reason", reason, "qr-na-reason"));

      const status = div("qr-row-status", "Needs review");
      status.dataset.qrStatus = "true";
      card.append(status);

      if (saved) fillSaved(card, saved);
      updateCard(card);
    });
  }

  function mountWorkflowPanel() {
    panel = document.getElementById("qrWorkflowPanel") || document.createElement("section");
    navPanel = document.getElementById("qrNavigationPanel") || document.createElement("section");
    drawer = document.getElementById("qrValidationDrawer") || document.createElement("section");
    panel.classList.add("qr-workflow-card");
    navPanel.classList.add("qr-navigation-card", "no-print");
    drawer.classList.add("qr-alert-card", "hidden");
    if (!panel.id) panel.id = "qrWorkflowPanel";
    if (!navPanel.id) navPanel.id = "qrNavigationPanel";
    if (!drawer.id) drawer.id = "qrValidationDrawer";
    const anchor = document.getElementById("handoffBody");
    if (!panel.isConnected) anchor?.parentElement?.insertBefore(panel, anchor);
    if (!navPanel.isConnected) anchor?.parentElement?.insertBefore(navPanel, anchor);
    if (!drawer.isConnected) anchor?.parentElement?.append(drawer);
  }

  function renderState(message = "") {
    if (!panel || !navPanel || !drawer) return;
    const total = questions.size;
    const done = resolvedCount();
    const section = sections[active] || {};
    const sectionDoneCount = sectionResolved(section);
    const status = statusLabel(done, total, submission?.final_gate?.status);
    panel.replaceChildren(
      div("eyebrow", "Workflow"),
      h("Review progress"),
      progress(done, total),
      compactStats({ active_section: section.section_title || section.section_id || "Review section", section_progress: `${sectionDoneCount}/${section.questions?.length || 0}`, total_progress: `${done}/${total}`, current_status: status }),
      notice(message || statusMessage(done, total, status), status !== "Submitted")
    );
    navPanel.replaceChildren(nav(done, total));
    renderDrawer();
    renderRail();
    updateTabs();
    updateCardBadges();
  }

  function nav(done, total) {
    const row = div("qr-nav-actions", "");
    const prevButton = plain("Previous section", () => { active = Math.max(0, active - 1); applySectionVisibility(); renderState(); });
    const nextButton = plain("Next section", () => { active = Math.min(sections.length - 1, active + 1); applySectionVisibility(); renderState(); });
    const saveButton = plain("Save progress", () => persistSubmission("save_progress"));
    const submitButton = plain("Submit final", () => persistSubmission("submit_final_gate"));
    prevButton.disabled = active === 0;
    nextButton.disabled = active >= sections.length - 1;
    submitButton.disabled = done !== total || total === 0;
    row.append(prevButton, nextButton, saveButton, submitButton);
    return row;
  }

  async function persistSubmission(reason) {
    const rows = collectCurrentResponses();
    if (reason === "submit_final_gate" && rows.length !== questions.size) {
      renderState("Complete every answer or mark it not applicable before submitting.");
      return;
    }
    renderState("Saving your review...");
    try {
      const payload = await req(submitEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ submitted_by: "public_qualified_review_ui", submitted_by_label: "Qualified Review UI", save_reason: reason, question_responses: rows })
      });
      submission = payload.qualified_review_submission || null;
      hydrate(submission);
      renderState(submission?.final_gate?.status === "PASS" ? "Review submitted. This review is ready for the next step." : "Saved. Continue reviewing unresolved questions before submitting.");
    } catch (error) {
      renderState(`Save failed: ${error.message || error}`);
    }
  }

  function collectCurrentResponses({ includeIncomplete = false } = {}) {
    const rows = [];
    document.querySelectorAll(".array-block").forEach((card) => {
      const q = questions.get(idFromCard(card));
      if (!q) return;
      const row = rowFromCard(card, q);
      if (row) rows.push(row);
      else if (includeIncomplete) rows.push(null);
    });
    return rows.filter(Boolean);
  }

  function rowFromCard(card, q) {
    const na = card.querySelector("[data-qr-na]")?.checked === true;
    const reason = String(card.querySelector("[data-qr-reason]")?.value || "").trim();
    if (na) {
      return { question_id: q.question_id, answer_state: "not_applicable", answer_value: null, not_applicable_reason: reason || "", demo_disclaimer_accepted: q.demo_disclaimer_required === true, submitted_at: new Date().toISOString() };
    }
    const value = answerValue(card, q.answer_type);
    if (!has(value)) return null;
    const current = stableValue(value);
    const original = card.dataset.qrOriginalValue || "";
    if (current === original) {
      return { question_id: q.question_id, answer_state: "confirmed", answer_value: value, not_applicable_reason: "", demo_disclaimer_accepted: q.demo_disclaimer_required === true, submitted_at: new Date().toISOString() };
    }
    return { question_id: q.question_id, answer_state: "edited", answer_value: value, not_applicable_reason: "", demo_disclaimer_accepted: q.demo_disclaimer_required === true, submitted_at: new Date().toISOString() };
  }

  function stableValue(value) {
    if (Array.isArray(value)) return value.map((item) => String(item ?? "").trim()).filter(Boolean).join("\u001f");
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return "";
    return String(value).trim();
  }

  function resolvedCount() {
    return collectCurrentResponses().length;
  }

  function unresolvedCards() {
    return [...document.querySelectorAll(".array-block")].filter((card) => {
      const q = questions.get(idFromCard(card));
      return q && !rowFromCard(card, q);
    });
  }

  function renderDrawer() {
    const errors = submission?.validation?.blocking_errors || [];
    const warnings = submission?.validation?.warnings || [];
    const hasAlerts = errors.length || warnings.length;
    drawer.classList.toggle("hidden", !hasAlerts);
    if (!hasAlerts) {
      drawer.replaceChildren();
      return;
    }
    drawer.replaceChildren(
      div("eyebrow", "Review alerts"),
      h("Items to fix"),
      compactStats({ items_to_fix: errors.length, notes: warnings.length }),
      list("Please resolve", errors.slice(0, 20)),
      list("Notes", warnings.slice(0, 20))
    );
  }

  function renderRail() {
    const rail = document.getElementById("qualifiedReviewRail");
    if (!rail) return;
    const wrap = div("qr-rail-list", "");
    sections.forEach((s, i) => {
      const complete = sectionDone(s);
      const cls = `qr-rail-item ${complete ? "complete" : ""} ${i === active ? "active" : ""}`;
      const node = button(cls, "");
      node.dataset.qrSectionIndex = String(i);
      node.append(span("qr-rail-index", String(i + 1).padStart(2, "0")), span("qr-rail-text", s.section_title || s.section_id || "Section"), span("qr-rail-count", `${sectionResolved(s)}/${s.questions?.length || 0}`));
      wrap.append(node);
    });
    rail.replaceChildren(wrap);
  }

  function applySectionVisibility() {
    document.querySelectorAll("#handoffBody .qr-form-section, #handoffBody .report-section").forEach((sectionNode, i) => {
      const isActive = i === active;
      sectionNode.style.display = isActive ? "block" : "none";
      sectionNode.dataset.active = String(isActive);
    });
  }

  function hydrate(saved) {
    if (!saved?.question_responses) return;
    submission = saved;
    responses.clear();
    saved.question_responses.forEach((r) => {
      if (r?.question_id && states.has(r.answer_state)) responses.set(r.question_id, { question_id: r.question_id, answer_state: r.answer_state, answer_value: r.answer_value, not_applicable_reason: r.not_applicable_reason || "", demo_disclaimer_accepted: r.demo_disclaimer_accepted === true, submitted_at: r.submitted_at || new Date().toISOString() });
    });
  }

  function buildSections(rows) { const m = new Map(); rows.forEach((q) => { if (!m.has(q.section_id)) m.set(q.section_id, { section_id: q.section_id, section_title: q.section_title, questions: [] }); m.get(q.section_id).questions.push(q); }); return [...m.values()]; }
  function sectionDone(s) { return (s?.questions || []).length > 0 && s.questions.every((q) => { const card = cardByQuestion(q.question_id); return card && rowFromCard(card, q); }); }
  function sectionResolved(s) { return (s?.questions || []).filter((q) => { const card = cardByQuestion(q.question_id); return card && rowFromCard(card, q); }).length; }
  function updateTabs() { document.querySelectorAll("[data-qr-section-index]").forEach((el) => { const index = Number(el.dataset.qrSectionIndex); const s = sections[index]; el.classList.toggle("active", index === active); el.classList.toggle("complete", Boolean(s && sectionDone(s))); }); }
  function updateCardBadges() { document.querySelectorAll(".array-block").forEach(updateCard); }
  function updateCard(card) { const q = questions.get(idFromCard(card)); if (!q) return; const row = rowFromCard(card, q); const na = card.querySelector("[data-qr-na]")?.checked === true; const control = answerControl(card); if (control) control.disabled = na; card.dataset.qrNa = String(na); card.classList.toggle("qr-resolved", Boolean(row)); const status = card.querySelector("[data-qr-status]"); if (status) status.textContent = row ? rowStatus(row.answer_state) : "Needs review"; }
  function fillSaved(card, saved) { const c = answerControl(card); const na = card.querySelector("[data-qr-na]"); const reason = card.querySelector("[data-qr-reason]"); if (na) na.checked = saved.answer_state === "not_applicable"; if (reason) reason.value = saved.not_applicable_reason || ""; if (c && saved.answer_state !== "not_applicable") setControlValue(c, saved.answer_value); card.classList.add("qr-resolved"); }
  function cardByQuestion(qid) { return [...document.querySelectorAll(".array-block")].find((card) => idFromCard(card) === qid) || null; }
  function answerControl(card) { return card.querySelector("textarea.input, select.input, input.input:not([data-qr-reason])"); }
  function answerValue(card, type) { const c = answerControl(card); if (!c) return ""; if (type === "select" && c.multiple) return [...c.selectedOptions].map((o) => o.value).filter(Boolean); return String(c.value || "").trim(); }
  function setControlValue(control, value) { if (control.multiple && Array.isArray(value)) { [...control.options].forEach((opt) => { opt.selected = value.map(String).includes(opt.value); }); return; } control.value = fmt(value); }
  function idFromCard(card) { return String(card.querySelector(".block-title")?.textContent || "").match(/QR-\d{3}/)?.[0] || ""; }
  function rowStatus(state) { return state === "not_applicable" ? "Not applicable" : state === "edited" ? "Edited" : "Prefilled"; }
  function statusLabel(done, total, serverStatus) { if (serverStatus === "PASS") return "Submitted"; if (done === 0) return "Review needed"; if (done === total && total > 0) return "Ready to submit"; return "In progress"; }
  function statusMessage(done, total, status) { if (status === "Submitted") return "Review submitted. This review is ready for the next step."; if (status === "Ready to submit") return "All questions are complete. Submit when ready."; return `Review the fields that need attention. ${done}/${total} complete.`; }
  function progress(done, total) { const pct = total ? Math.round((done / total) * 100) : 0; const wrap = div("qr-progress", ""); wrap.append(div("qr-progress-top", `${pct}% complete`)); const bar = div("qr-progress-track", ""); const fill = div("qr-progress-fill", ""); fill.style.width = `${pct}%`; bar.append(fill); wrap.append(bar); return wrap; }
  function compactStats(o) { const g = div("qr-compact-stats", ""); Object.entries(o).forEach(([k, v]) => { const t = div("qr-compact-stat", ""); t.append(div("qr-stat-label", title(k)), div("qr-stat-value", String(v))); g.append(t); }); return g; }
  function list(titleText, items) { const box = div("qr-alert-list", ""); box.append(div("block-title", titleText)); if (!items.length) box.append(div("small-muted", "None.")); items.forEach((item) => box.append(div("notice", cleanAlert(String(item))))); return box; }
  function field(name, el, cls = "") { const w = div(`form-grid ${cls}`, ""); w.append(label(name), el); return w; }
  function input(ph) { const i = document.createElement("input"); i.className = "input"; i.type = "text"; i.placeholder = ph; return i; }
  function plain(text, fn) { const b = button("btn secondary", text); if (fn) b.addEventListener("click", fn); return b; }
  function button(cls, text) { const b = document.createElement("button"); b.className = cls; b.type = "button"; b.textContent = text || ""; return b; }
  function notice(text, warn) { const n = div("notice qr-workflow-notice", text); n.classList.toggle("ready", !warn); return n; }
  function label(text) { const l = document.createElement("label"); l.className = "label"; l.textContent = text; return l; }
  function labelWrap(cls, inputEl, text) { const l = document.createElement("label"); l.className = cls; l.append(inputEl, span("", text)); return l; }
  function h(text) { const n = document.createElement("h2"); n.textContent = text; return n; }
  function span(cls, text) { const n = document.createElement("span"); if (cls) n.className = cls; n.textContent = text; return n; }
  function div(cls, text) { const n = document.createElement("div"); n.className = cls; n.textContent = text; return n; }
  function title(v) { return String(v).replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()); }
  function fmt(v) { if (Array.isArray(v)) return v.join(", "); if (v && typeof v === "object") return ""; return String(v ?? ""); }
  function has(v) { return Array.isArray(v) ? v.length > 0 : Boolean(String(v ?? "").trim()); }
  function cleanAlert(v) { return v.replace(/_/g, " ").replace(/:/g, ": "); }
  function fatal(e) { const mount = document.getElementById("qrWorkflowPanel") || document.getElementById("handoffBody"); mount?.prepend(notice(`Review workspace failed: ${e.message || e}`, true)); }
  async function req(url, init) { const res = await fetch(url, init); const json = await res.json().catch(() => ({})); if (!res.ok) throw new Error(json.message || json.error || "Request failed"); return json; }
  function waitForCards() { return new Promise((resolve) => { const started = Date.now(); const timer = setInterval(() => { if (document.querySelector(".array-block") || Date.now() - started > 8000) { clearInterval(timer); resolve(); } }, 100); }); }
})();
