(() => {
  const runId = new URLSearchParams(location.search).get("run_id") || "";
  if (!runId) return;

  const endpoint = `/public/diligence-system/qualified-review/${encodeURIComponent(runId)}`;
  const submitEndpoint = `${endpoint}/responses`;
  const terminalStates = new Set(["confirmed", "edited", "not_applicable"]);
  const questions = new Map();
  const responses = new Map();
  let latestSubmission = null;
  let panel = null;

  document.addEventListener("click", onActionClick, true);
  boot().catch((error) => renderPanel(`Backend sync unavailable: ${error.message || error}`, true));

  async function boot() {
    const payload = await request(endpoint);
    const renderer = payload.qualified_review_renderer_payload || {};
    const handoff = payload.qualified_review_handoff || {};
    const rows = Array.isArray(renderer.questions) ? renderer.questions : Array.isArray(handoff.question_handoff?.questions) ? handoff.question_handoff.questions : [];
    rows.forEach((row) => questions.set(row.question_id, row));
    hydrate(payload.qualified_review_submission || null);
    await waitForCards();
    enhanceCards();
    renderPanel();
  }

  async function onActionClick(event) {
    const button = event.target.closest("button");
    if (!button) return;
    const label = String(button.textContent || "").trim().toLowerCase();
    const state = button.dataset.qrState || (label === "confirm row" ? "confirmed" : "");
    if (!terminalStates.has(state)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const card = button.closest(".array-block");
    if (!card) return;
    const qid = questionIdFromCard(card);
    const question = questions.get(qid);
    if (!question) return setCardStatus(card, "Question metadata missing; reload QR page.", true);
    const row = collectResponse(card, question, state);
    if (row.error) return setCardStatus(card, row.error, true);
    responses.set(qid, row.response);
    card.dataset.qrState = state;
    setCardStatus(card, `Saving ${qid} as ${state}...`);
    button.disabled = true;
    try {
      await saveSubmission(`row:${qid}:${state}`);
      setCardStatus(card, `Saved ${qid} as ${state}.`);
    } catch (error) {
      setCardStatus(card, `Save failed: ${error.message || error}`, true);
    } finally {
      button.disabled = false;
    }
  }

  function enhanceCards() {
    document.querySelectorAll(".array-block").forEach((card) => {
      if (card.dataset.qrBackendEnhanced === "true") return;
      const qid = questionIdFromCard(card);
      const question = questions.get(qid);
      if (!question) return;
      card.dataset.qrBackendEnhanced = "true";
      const saved = responses.get(qid);
      if (saved) applySaved(card, saved);

      const reason = document.createElement("input");
      reason.className = "input";
      reason.type = "text";
      reason.placeholder = "Not applicable reason, if used";
      reason.dataset.qrNaReason = "true";
      reason.value = saved?.not_applicable_reason || "";
      const reasonWrap = document.createElement("div");
      reasonWrap.className = "form-grid";
      reasonWrap.append(label("Not applicable reason"), reason);
      card.append(reasonWrap);

      if (question.demo_disclaimer_required === true) {
        const demo = document.createElement("label");
        demo.className = "small-muted";
        const box = document.createElement("input");
        box.type = "checkbox";
        box.dataset.qrDemoAccepted = "true";
        box.checked = saved?.demo_disclaimer_accepted === true;
        demo.append(box, document.createTextNode(" I accept that this demo prefill is not diligence evidence."));
        card.append(demo);
      }

      const status = document.createElement("div");
      status.className = "small-muted";
      status.dataset.qrBackendStatus = "true";
      status.textContent = saved ? `Saved state: ${saved.answer_state}` : "Backend state: not saved.";
      card.append(status);

      const actions = card.querySelector(".actions") || document.createElement("div");
      actions.classList.add("actions", "no-print");
      actions.append(action("Save as edited", "edited"), action("Mark N/A", "not_applicable"));
      if (!actions.parentElement) card.append(actions);
    });
  }

  async function saveSubmission(reason) {
    renderPanel(`Saving ${responses.size}/79 resolved QR rows...`);
    const payload = await request(submitEndpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ submitted_by: "public_qualified_review_ui", submitted_by_label: "Qualified Review UI", save_reason: reason, question_responses: Array.from(responses.values()) })
    });
    latestSubmission = payload.qualified_review_submission || null;
    hydrate(latestSubmission);
    renderPanel();
    return payload;
  }

  function collectResponse(card, question, state) {
    const value = answerValue(card, question.answer_type);
    const reason = String(card.querySelector("[data-qr-na-reason]")?.value || "").trim();
    const demo = card.querySelector("[data-qr-demo-accepted]");
    if (state !== "not_applicable" && !hasValue(value)) return { error: `${question.question_id}: answer is required.` };
    if (state === "not_applicable" && !reason) return { error: `${question.question_id}: not-applicable reason is required.` };
    if (question.demo_disclaimer_required === true && demo && !demo.checked) return { error: `${question.question_id}: accept the demo prefill disclaimer first.` };
    return { response: { question_id: question.question_id, answer_state: state, answer_value: state === "not_applicable" ? null : value, not_applicable_reason: state === "not_applicable" ? reason : "", demo_disclaimer_accepted: question.demo_disclaimer_required === true ? Boolean(demo?.checked) : false, submitted_at: new Date().toISOString() } };
  }

  function renderPanel(message = "", caution = false) {
    if (!panel) {
      panel = document.createElement("section");
      panel.className = "card";
      panel.id = "qrBackendPanel";
      const anchor = document.getElementById("handoffBody");
      anchor?.parentElement?.insertBefore(panel, anchor);
    }
    const gate = latestSubmission?.final_gate || {};
    const validation = latestSubmission?.validation || {};
    panel.replaceChildren(
      div("eyebrow", "backend validation"),
      heading("Qualified Review Submission"),
      tileGrid({ client_resolved_rows: `${responses.size}/79`, server_final_gate: gate.status || "not submitted", ready_for_assembly: gate.ready_for_assembly === true, server_resolved_rows: gate.required_question_count ? `${gate.resolved_question_count}/${gate.required_question_count}` : "not submitted", blocking_errors: validation.blocking_errors?.length || 0, warnings: validation.warnings?.length || 0 }),
      notice(message || statusText(), caution || gate.status !== "PASS"),
      actions()
    );
  }

  function actions() {
    const row = document.createElement("div");
    row.className = "actions no-print";
    const save = button("Save progress");
    save.addEventListener("click", () => saveSubmission("save_progress").catch((error) => renderPanel(error.message || String(error), true)));
    const submit = button("Submit final gate");
    submit.addEventListener("click", () => saveSubmission("submit_final_gate").catch((error) => renderPanel(error.message || String(error), true)));
    row.append(save, submit);
    return row;
  }

  function hydrate(submission) {
    if (!submission || !Array.isArray(submission.question_responses)) return;
    latestSubmission = submission;
    submission.question_responses.forEach((row) => {
      if (!row?.question_id || !terminalStates.has(row.answer_state)) return;
      responses.set(row.question_id, { question_id: row.question_id, answer_state: row.answer_state, answer_value: row.answer_value, not_applicable_reason: row.not_applicable_reason || "", demo_disclaimer_accepted: row.demo_disclaimer_accepted === true, submitted_at: row.submitted_at || new Date().toISOString() });
    });
  }

  function applySaved(card, saved) {
    const control = answerControl(card);
    if (control && saved.answer_state !== "not_applicable") control.value = formatControl(saved.answer_value);
    card.dataset.qrState = saved.answer_state;
  }

  function answerValue(card, type) {
    const control = answerControl(card);
    if (!control) return "";
    if (type === "select" && control.multiple) return Array.from(control.selectedOptions).map((option) => option.value).filter(Boolean);
    return String(control.value || "").trim();
  }

  function answerControl(card) { return card.querySelector("textarea.input, select.input, input.input:not([data-qr-na-reason])"); }
  function questionIdFromCard(card) { return String(card.querySelector(".block-title")?.textContent || "").match(/QR-\d{3}/)?.[0] || ""; }
  function setCardStatus(card, text, error = false) { const node = card.querySelector("[data-qr-backend-status]"); if (node) { node.textContent = text; node.style.color = error ? "var(--danger)" : "rgba(229,229,229,.72)"; } }
  function statusText() { const gate = latestSubmission?.final_gate; if (!gate) return "No persisted QR submission yet."; return `Server saved qualified_review_submission. Final gate: ${gate.status}. Resolved ${gate.resolved_question_count}/${gate.required_question_count}.`; }
  function hasValue(value) { return Array.isArray(value) ? value.length > 0 : Boolean(String(value ?? "").trim()); }
  function formatControl(value) { if (Array.isArray(value)) return value.join(", "); if (value && typeof value === "object") return JSON.stringify(value); return String(value ?? ""); }
  function action(text, state) { const b = button(text); b.dataset.qrState = state; return b; }
  function button(text) { const b = document.createElement("button"); b.className = "btn secondary"; b.type = "button"; b.textContent = text; return b; }
  function label(text) { const l = document.createElement("label"); l.className = "label"; l.textContent = text; return l; }
  function div(cls, text) { const d = document.createElement("div"); d.className = cls; d.textContent = text; return d; }
  function heading(text) { const h = document.createElement("h2"); h.textContent = text; return h; }
  function notice(text, caution) { const n = div("notice", text); n.style.borderColor = caution ? "rgba(249,115,22,.35)" : "rgba(34,197,94,.35)"; return n; }
  function tileGrid(object) { const grid = div("meta-grid", ""); Object.entries(object).forEach(([k, v]) => { const tile = div("meta-tile", ""); tile.append(div("k", titleCase(k)), div("v", String(v))); grid.append(tile); }); return grid; }
  function titleCase(value) { return String(value).replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()); }
  async function request(url, init) { const res = await fetch(url, init); const json = await res.json().catch(() => ({})); if (!res.ok) throw new Error(json.message || json.error || "Request failed"); return json; }
  function waitForCards() { return new Promise((resolve) => { const started = Date.now(); const timer = setInterval(() => { if (document.querySelector(".array-block") || Date.now() - started > 8000) { clearInterval(timer); resolve(); } }, 100); }); }
})();
