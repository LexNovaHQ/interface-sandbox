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
  let drawer;

  document.addEventListener("click", captureRowButtons, true);
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

  function captureRowButtons(event) {
    const button = event.target.closest("button");
    if (!button) return;
    const text = String(button.textContent || "").trim().toLowerCase();
    const state = button.dataset.qrState || (text === "confirm row" ? "confirmed" : "");
    if (!states.has(state)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const card = button.closest(".array-block");
    if (!card) return;
    const qid = idFromCard(card);
    const q = questions.get(qid);
    if (!q) return cardStatus(card, "Question metadata missing.", true);
    const row = collect(card, q, state);
    if (row.error) return cardStatus(card, row.error, true);
    responses.set(qid, row.value);
    card.dataset.qrState = state;
    cardStatus(card, `Saved locally as ${state}. Use Save Progress or Submit Final Gate to persist.`);
    renderState();
  }

  function enhanceCards() {
    document.querySelectorAll(".array-block").forEach((card) => {
      if (card.dataset.qrWorkflow === "true") return;
      const qid = idFromCard(card);
      const q = questions.get(qid);
      if (!q) return;
      card.dataset.qrWorkflow = "true";
      const saved = responses.get(qid);
      if (saved) fillSaved(card, saved);

      const reason = input("Not applicable reason, if used");
      reason.dataset.qrReason = "true";
      reason.value = saved?.not_applicable_reason || "";
      card.append(field("Not applicable reason", reason));

      if (q.demo_disclaimer_required === true) {
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.dataset.qrDemo = "true";
        cb.checked = saved?.demo_disclaimer_accepted === true;
        const line = document.createElement("label");
        line.className = "small-muted";
        line.append(cb, document.createTextNode(" I accept that this demo prefill is not diligence evidence."));
        card.append(line);
      }

      const status = div("small-muted", saved ? `Persisted state: ${saved.answer_state}` : "Not resolved yet.");
      status.dataset.qrStatus = "true";
      card.append(status);

      let actions = card.querySelector(".actions");
      if (!actions) { actions = div("actions no-print", ""); card.append(actions); }
      actions.append(btn("Save as edited", "edited"), btn("Mark N/A", "not_applicable"));
    });
  }

  function mountWorkflowPanel() {
    panel = document.createElement("section");
    panel.className = "card";
    panel.id = "qrWorkflowPanel";
    drawer = document.createElement("section");
    drawer.className = "card";
    drawer.id = "qrValidationDrawer";
    const anchor = document.getElementById("handoffBody");
    anchor?.parentElement?.insertBefore(panel, anchor);
    anchor?.parentElement?.insertBefore(drawer, anchor);
  }

  function renderState(message = "") {
    const total = questions.size;
    const done = [...responses.values()].filter((r) => states.has(r.answer_state)).length;
    const current = sections[active] || {};
    const server = submission?.final_gate || {};
    panel.replaceChildren(
      div("eyebrow", "qualified review workflow"),
      h("Operational QR Workflow"),
      grid({ active_section: `${active + 1}/${sections.length}`, current_section: current.section_title || current.section_id || "", client_resolved_rows: `${done}/${total}`, server_final_gate: server.status || "not submitted", ready_for_assembly: server.ready_for_assembly === true }),
      notice(message || workflowMessage(done, total, server), server.status !== "PASS"),
      nav()
    );
    renderDrawer();
    renderRail();
    updateCardBadges();
  }

  function nav() {
    const row = div("actions no-print", "");
    const prev = plain("Previous section", () => { active = Math.max(0, active - 1); applySectionVisibility(); renderState(); });
    const next = plain("Next section", () => { active = Math.min(sections.length - 1, active + 1); applySectionVisibility(); renderState(); });
    const save = plain("Save progress", () => save("save_progress"));
    const submit = plain("Submit final gate", () => save("submit_final_gate"));
    prev.disabled = active === 0;
    next.disabled = active >= sections.length - 1 || !sectionDone(sections[active]);
    submit.disabled = responses.size !== questions.size;
    row.append(prev, next, save, submit);
    return row;
  }

  async function save(reason) {
    renderState("Saving QR submission to backend...");
    try {
      const payload = await req(submitEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ submitted_by: "public_qualified_review_ui", submitted_by_label: "Qualified Review UI", save_reason: reason, question_responses: [...responses.values()] })
      });
      submission = payload.qualified_review_submission || null;
      hydrate(submission);
      renderState(submission?.final_gate?.status === "PASS" ? "Final gate PASS. qualified_review_submission is ready for assembler consumption." : "Saved. Final gate remains INCOMPLETE until all validation errors are resolved.");
    } catch (error) {
      renderState(`Save failed: ${error.message || error}`);
    }
  }

  function renderDrawer() {
    const errors = submission?.validation?.blocking_errors || [];
    const warnings = submission?.validation?.warnings || [];
    drawer.replaceChildren(div("eyebrow", "server validation"), h("Validation Drawer"), grid({ blocking_errors: errors.length, warnings: warnings.length, assembler_gate: submission?.assembler_input?.ready_for_assembly === true ? "READY" : "BLOCKED" }), list("Blocking errors", errors.slice(0, 50)), list("Warnings", warnings.slice(0, 50)));
  }

  function renderRail() {
    const rail = document.getElementById("qualifiedReviewRail");
    if (!rail) return;
    const wrap = div("rail", "");
    wrap.append(div("rail-chip", "Qualified Review rail"));
    [{ section_title: "Report handoff", questions: [], complete: true }, ...sections, { section_title: "Final review gate", questions: [], final: true }].forEach((s, i) => {
      const complete = s.complete || sectionDone(s) || (s.final && submission?.final_gate?.status === "PASS");
      const cls = complete ? "complete" : i === active + 1 ? "active" : "pending";
      const node = div(`rail-stage ${cls}`, "");
      node.append(span("rail-dot", ""), div("", ""));
      const right = node.lastChild;
      right.append(div("rail-node", s.section_title || s.section_id || "Section"), div("rail-sub", s.final ? (submission?.final_gate?.status || "not submitted") : s.questions?.length ? `${sectionResolved(s)}/${s.questions.length} resolved` : "complete"), div("rail-why", complete ? "Resolved." : "Reviewer action required."));
      wrap.append(node);
    });
    rail.replaceChildren(wrap);
  }

  function applySectionVisibility() {
    document.querySelectorAll("#handoffBody > .value-list > .report-section").forEach((section, i) => {
      section.style.display = i === active ? "block" : "none";
    });
    panel?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function collect(card, q, state) {
    const value = answerValue(card, q.answer_type);
    const reason = String(card.querySelector("[data-qr-reason]")?.value || "").trim();
    const demo = card.querySelector("[data-qr-demo]");
    if (state !== "not_applicable" && !has(value)) return { error: `${q.question_id}: answer required.` };
    if (state === "not_applicable" && !reason) return { error: `${q.question_id}: N/A reason required.` };
    if (q.demo_disclaimer_required === true && demo && !demo.checked) return { error: `${q.question_id}: accept demo disclaimer.` };
    return { value: { question_id: q.question_id, answer_state: state, answer_value: state === "not_applicable" ? null : value, not_applicable_reason: state === "not_applicable" ? reason : "", demo_disclaimer_accepted: q.demo_disclaimer_required === true ? Boolean(demo?.checked) : false, submitted_at: new Date().toISOString() } };
  }

  function hydrate(saved) {
    if (!saved?.question_responses) return;
    submission = saved;
    saved.question_responses.forEach((r) => { if (r?.question_id && states.has(r.answer_state)) responses.set(r.question_id, { question_id: r.question_id, answer_state: r.answer_state, answer_value: r.answer_value, not_applicable_reason: r.not_applicable_reason || "", demo_disclaimer_accepted: r.demo_disclaimer_accepted === true, submitted_at: r.submitted_at || new Date().toISOString() }); });
  }

  function buildSections(rows) { const m = new Map(); rows.forEach((q) => { if (!m.has(q.section_id)) m.set(q.section_id, { section_id: q.section_id, section_title: q.section_title, questions: [] }); m.get(q.section_id).questions.push(q); }); return [...m.values()]; }
  function sectionDone(s) { return (s?.questions || []).length > 0 && s.questions.every((q) => states.has(responses.get(q.question_id)?.answer_state)); }
  function sectionResolved(s) { return (s?.questions || []).filter((q) => states.has(responses.get(q.question_id)?.answer_state)).length; }
  function updateCardBadges() { document.querySelectorAll(".array-block").forEach((card) => { const s = responses.get(idFromCard(card)); const status = card.querySelector("[data-qr-status]"); if (status) status.textContent = s ? `Resolved: ${s.answer_state}` : "Not resolved yet."; }); }
  function fillSaved(card, saved) { const c = answerControl(card); if (c && saved.answer_state !== "not_applicable") c.value = fmt(saved.answer_value); card.dataset.qrState = saved.answer_state; }
  function answerControl(card) { return card.querySelector("textarea.input, select.input, input.input:not([data-qr-reason])"); }
  function answerValue(card, type) { const c = answerControl(card); if (!c) return ""; if (type === "select" && c.multiple) return [...c.selectedOptions].map((o) => o.value).filter(Boolean); return String(c.value || "").trim(); }
  function idFromCard(card) { return String(card.querySelector(".block-title")?.textContent || "").match(/QR-\d{3}/)?.[0] || ""; }
  function cardStatus(card, text, bad = false) { const n = card.querySelector("[data-qr-status]"); if (n) { n.textContent = text; n.style.color = bad ? "var(--danger)" : "rgba(229,229,229,.72)"; } }
  function workflowMessage(done, total, server) { if (server.status === "PASS") return "Assembler gate is READY. Use qualified_review_submission for final assembly."; return `Resolve all rows and submit final gate. Client resolved ${done}/${total}.`; }
  function list(title, items) { const box = div("value-list", ""); box.append(div("block-title", title)); if (!items.length) box.append(div("small-muted", "None.")); items.forEach((item) => box.append(div("notice", String(item)))); return box; }
  function grid(o) { const g = div("meta-grid", ""); Object.entries(o).forEach(([k, v]) => { const t = div("meta-tile", ""); t.append(div("k", title(k)), div("v", String(v))); g.append(t); }); return g; }
  function field(name, el) { const w = div("form-grid", ""); w.append(label(name), el); return w; }
  function input(ph) { const i = document.createElement("input"); i.className = "input"; i.type = "text"; i.placeholder = ph; return i; }
  function btn(text, state) { const b = plain(text); b.dataset.qrState = state; return b; }
  function plain(text, fn) { const b = document.createElement("button"); b.className = "btn secondary"; b.type = "button"; b.textContent = text; if (fn) b.addEventListener("click", fn); return b; }
  function notice(text, bad) { const n = div("notice", text); n.style.borderColor = bad ? "rgba(249,115,22,.35)" : "rgba(34,197,94,.35)"; return n; }
  function label(text) { const l = document.createElement("label"); l.className = "label"; l.textContent = text; return l; }
  function h(text) { const n = document.createElement("h2"); n.textContent = text; return n; }
  function span(cls, text) { const n = document.createElement("span"); n.className = cls; n.textContent = text; return n; }
  function div(cls, text) { const n = document.createElement("div"); n.className = cls; n.textContent = text; return n; }
  function title(v) { return String(v).replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()); }
  function fmt(v) { if (Array.isArray(v)) return v.join(", "); if (v && typeof v === "object") return JSON.stringify(v); return String(v ?? ""); }
  function has(v) { return Array.isArray(v) ? v.length > 0 : Boolean(String(v ?? "").trim()); }
  function fatal(e) { const body = document.getElementById("handoffBody"); body?.prepend(notice(`QR workflow failed: ${e.message || e}`, true)); }
  async function req(url, init) { const res = await fetch(url, init); const json = await res.json().catch(() => ({})); if (!res.ok) throw new Error(json.message || json.error || "Request failed"); return json; }
  function waitForCards() { return new Promise((resolve) => { const started = Date.now(); const timer = setInterval(() => { if (document.querySelector(".array-block") || Date.now() - started > 8000) { clearInterval(timer); resolve(); } }, 100); }); }
})();
