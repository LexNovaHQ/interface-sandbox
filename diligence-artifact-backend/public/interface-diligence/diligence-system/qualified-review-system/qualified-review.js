(function () {
  "use strict";

  const VERSION = "interface_qualified_review_section_attestation.v3";
  const runId = new URLSearchParams(window.location.search || "").get("run_id") || "";
  const endpoint = runId ? `/public/diligence-system/qualified-review/${encodeURIComponent(runId)}` : "";
  const els = {
    title: document.getElementById("handoffTitle"), subtitle: document.getElementById("handoffSubtitle"), meta: document.getElementById("handoffMeta"), body: document.getElementById("handoffBody"), back: document.getElementById("backToReport"), annexure: document.getElementById("openAnnexure"), rail: document.getElementById("qualifiedReviewRail"), workflow: document.getElementById("qrWorkflowPanel"), nav: document.getElementById("qrNavigationPanel"), receipt: document.getElementById("qrReceiptPanel"), drawer: document.getElementById("qrValidationDrawer"), finalGate: document.getElementById("qrFinalGatePanel"), live: document.getElementById("qualifiedReviewLiveStatus")
  };
  const state = { payload: null, handoff: {}, renderer: {}, draft: {}, sections: [], active: 0, saving: false, timer: null };

  window.InterfaceQualifiedReview = Object.freeze({ version: VERSION, confirmation_unit: "SECTION", per_question_confirmation_forbidden: true, saveDraft, submitReview });
  if (!runId) return showError("Missing run_id in the Qualified Review URL.");
  boot().catch((error) => showError(error?.message || String(error)));

  async function boot() {
    els.back.href = `report.html?run_id=${encodeURIComponent(runId)}`;
    els.annexure.href = `technical-annexure.html?run_id=${encodeURIComponent(runId)}`;
    applyPayload(await request(endpoint));
    announce(`Qualified Review loaded. ${fieldCount()} fields across ${state.sections.length} active sections.`);
  }

  function applyPayload(payload, preferredSectionId = "") {
    const previous = preferredSectionId || state.sections[state.active]?.section_id || "";
    state.payload = payload;
    state.handoff = payload.qualified_review_handoff || {};
    state.renderer = payload.qualified_review_renderer_payload || {};
    state.draft = payload.qualified_review_draft || { field_edits: {}, section_attestations: {} };
    assertBoundary();
    state.sections = Array.isArray(state.renderer.sections) ? state.renderer.sections : Array.isArray(state.handoff.sections) ? state.handoff.sections : [];
    const nextIndex = state.sections.findIndex((section) => section.section_id === previous);
    state.active = nextIndex >= 0 ? nextIndex : Math.min(state.active, Math.max(0, state.sections.length - 1));
    render();
  }

  function assertBoundary() {
    if (state.renderer.no_document_assembly !== true) throw new Error("QUALIFIED_REVIEW_NO_DOCUMENT_ASSEMBLY_NOT_LOCKED");
    if (state.renderer.confirmation_unit !== "SECTION" || state.renderer.per_question_confirmation_forbidden !== true) throw new Error("QUALIFIED_REVIEW_SECTION_CONFIRMATION_CONTRACT_INVALID");
  }

  function render() {
    els.title.textContent = "Qualified Review";
    els.subtitle.textContent = "Review and edit the active values, then attest each section once. Individual fields do not require confirmation clicks.";
    els.meta.replaceChildren(renderMatterSummary());
    els.body.replaceChildren(...state.sections.map(renderSection));
    renderRail();
    renderWorkflow();
    renderNavigation();
    renderFinalGate();
    renderReceipt();
    renderAlerts();
  }

  function renderMatterSummary() {
    const grid = node("div", "qr-summary-grid");
    const resolution = state.payload?.qr_registry_resolution_manifest || {};
    [
      ["Target", state.renderer.target || state.handoff.target || "Target under review"],
      ["Run ID", runId],
      ["Active fields", fieldCount()],
      ["Active sections", state.sections.length],
      ["Confirmation", "Per section"],
      ["Unresolved activation probes", resolution.counts?.unresolved_activation_probe_count || 0],
      ["Document assembly", "Not performed in this workspace"]
    ].forEach(([label, value]) => { const item = node("div", "qr-summary-item"); item.append(node("div", "qr-summary-label", label), node("div", "qr-summary-value", String(value))); grid.append(item); });
    return grid;
  }

  function renderSection(section, index) {
    const root = node("section", `qr-review-section ${index === state.active ? "active" : ""}`);
    root.dataset.qrSectionIndex = String(index);
    root.dataset.sectionId = section.section_id;
    root.id = `qr-section-${stable(section.section_id)}`;
    root.tabIndex = -1;
    const header = node("header", "qr-review-section-header");
    header.append(node("div", "eyebrow", `Section ${String(index + 1).padStart(2, "0")}`), node("h3", "", section.section_title || section.section_id), node("p", "small-muted", section.operator_task || "Review the active values in this section."));
    if ((section.activation_probe_field_ids || []).length) header.append(node("div", "qr-activation-probe-banner", "This section contains an applicability probe. Resolve it to activate or suppress the remaining package fields."));
    const list = node("div", "qr-finding-list");
    (section.fields || []).forEach((field) => list.append(renderField(field)));
    root.append(header, list, renderSectionAttestation(section));
    return root;
  }

  function renderField(field) {
    const edit = state.draft.field_edits?.[field.qr_field_id] || {};
    const card = node("article", "qr-finding");
    card.dataset.fieldId = field.qr_field_id;
    card.dataset.sectionId = field.section_id;
    const top = node("div", "qr-finding-top");
    top.append(node("div", "qr-finding-id", field.qr_field_id), node("span", `qr-source-badge ${field.activation_probe ? "probe" : ""}`, field.activation_probe ? "ACTIVATION PROBE" : field.source_badge || "PROPOSED"));
    const title = node("h4", "", field.ui?.prompt || field.label || field.qr_field_id);
    const layout = node("div", "qr-finding-layout");
    const answer = node("div", "qr-answer-panel");
    const controls = node("div", "qr-atomic-grid");
    (field.atomic_fields || []).forEach((atomic) => controls.append(renderAtomic(field, atomic, edit.atomic_values?.[atomic.atomic_key])));
    const na = checkboxControl("Not applicable", edit.not_applicable === true, "fieldNotApplicable");
    const limitation = document.createElement("textarea"); limitation.className = "input"; limitation.rows = 3; limitation.placeholder = "Optional reviewer limitation or qualification"; limitation.value = edit.limitation || ""; limitation.dataset.fieldLimitation = "true";
    answer.append(controls, na, limitation, node("div", "qr-item-status", "Finality is controlled by the section attestation below."));
    const context = node("aside", "qr-context");
    context.append(contextBlock("Source / basis", sourceSummary(field)), contextBlock("Affected documents", documentSummary(field)), contextBlock("Review state", edit.review_status || field.review_state || "UNCHANGED"));
    layout.append(answer, context);
    card.append(top, title, layout);
    card.addEventListener("input", () => fieldChanged(field.section_id));
    card.addEventListener("change", () => fieldChanged(field.section_id));
    return card;
  }

  function renderAtomic(field, atomic, editedValue) {
    const wrap = node("label", "qr-atomic-field");
    wrap.append(node("span", "qr-atomic-label", humanize(atomic.atomic_key)));
    const value = editedValue !== undefined ? editedValue : atomic.value;
    const control = atomicControl(value);
    control.dataset.atomicKey = atomic.atomic_key;
    control.dataset.fieldId = field.qr_field_id;
    wrap.append(control, node("span", "qr-atomic-source", atomic.source === "MARKET_BASED" ? "{MARKET BASED} — not diligence evidence" : atomic.source === "PHASE_12" ? "DILIGENCE DERIVED" : atomic.source || "UNRESOLVED"));
    return wrap;
  }

  function atomicControl(value) {
    if (typeof value === "boolean") {
      const select = document.createElement("select"); select.className = "input";
      [["true", "Yes"], ["false", "No"]].forEach(([v, label]) => { const option = document.createElement("option"); option.value = v; option.textContent = label; option.selected = String(value) === v; select.append(option); });
      select.dataset.valueType = "boolean"; return select;
    }
    if (Array.isArray(value) || (value && typeof value === "object")) {
      const area = document.createElement("textarea"); area.className = "input"; area.rows = 4; area.value = Array.isArray(value) ? value.join("\n") : JSON.stringify(value, null, 2); area.dataset.valueType = Array.isArray(value) ? "array" : "object"; return area;
    }
    const input = document.createElement("input"); input.className = "input"; input.type = typeof value === "number" ? "number" : "text"; input.value = value ?? ""; input.dataset.valueType = typeof value === "number" ? "number" : "string"; return input;
  }

  function renderSectionAttestation(section) {
    const saved = state.draft.section_attestations?.[section.section_id];
    const current = saved?.status === "ATTESTED" && saved.field_state_hash === section.attestation?.field_state_hash;
    const wrap = node("div", "qr-section-attestation");
    const buttonEl = button(current ? "btn secondary" : "btn primary", current ? "Section attested" : "Attest this section", () => attestSection(section, !current));
    buttonEl.disabled = state.saving;
    wrap.append(node("div", "qr-section-attestation-copy", current ? `Attested ${saved.attested_at ? new Date(saved.attested_at).toLocaleString() : ""}` : "I reviewed the values in this section and confirm the final state."), buttonEl, node("div", "small-muted", "Editing any value after attestation resets this section automatically."));
    return wrap;
  }

  function renderRail() {
    const list = node("div", "qr-rail-list");
    state.sections.forEach((section, index) => {
      const complete = isSectionAttested(section);
      const item = button(`qr-rail-item ${index === state.active ? "active" : ""} ${complete ? "complete" : ""}`, "", () => moveTo(index));
      item.append(node("span", "qr-rail-index", String(index + 1).padStart(2, "0")), node("span", "qr-rail-text", section.section_title), node("span", "qr-rail-count", complete ? "Attested" : `${(section.fields || []).length}`));
      list.append(item);
    });
    els.rail.replaceChildren(list);
  }

  function renderWorkflow(message = "") {
    const done = state.sections.filter(isSectionAttested).length;
    const total = state.sections.length;
    const percent = total ? Math.round(done / total * 100) : 0;
    const track = node("div", "qr-progress-track"); const fill = node("div", "qr-progress-fill"); fill.style.width = `${percent}%`; track.append(fill);
    const progress = node("div", "qr-progress"); progress.append(track, node("div", "qr-progress-copy", `${done}/${total} sections attested · ${percent}%`));
    els.workflow.replaceChildren(progress, node("div", "small-muted", message || (state.saving ? "Saving review state…" : "All field edits are saved to the shared run. No per-field confirmation is required.")));
  }

  function renderNavigation() {
    const row = node("div", "qr-nav-actions");
    const left = node("div", "qr-nav-group"); const right = node("div", "qr-nav-group");
    const previous = button("btn secondary", "Previous section", () => moveTo(state.active - 1)); previous.disabled = state.active === 0;
    const next = button("btn secondary", "Next section", () => moveTo(state.active + 1)); next.disabled = state.active >= state.sections.length - 1;
    const save = button("btn secondary", state.saving ? "Saving…" : "Save draft", () => saveDraft()); save.disabled = state.saving;
    left.append(previous, next); right.append(save); row.append(left, right); els.nav.replaceChildren(row);
  }

  function renderFinalGate() {
    const ready = finalReady();
    const unresolved = state.handoff.registry_resolution?.unresolved_activation_probe_field_ids || [];
    const submit = button("btn primary", state.payload?.qualified_review_submission_request ? "Submitted for compilation" : "Submit Qualified Review", submitReview);
    submit.disabled = !ready || state.saving || Boolean(state.payload?.qualified_review_submission_request);
    els.finalGate.replaceChildren(node("div", "eyebrow", "Final section gate"), node("h3", "", ready ? "All active sections are attested" : "Review is not ready for submission"), node("p", "small-muted", unresolved.length ? `Resolve activation probes: ${unresolved.join(", ")}.` : `${state.sections.filter(isSectionAttested).length}/${state.sections.length} active sections attested.`), node("div", "qr-final-actions", ""));
    els.finalGate.querySelector(".qr-final-actions").append(submit);
  }

  function renderReceipt() {
    const requestArtifact = state.payload?.qualified_review_submission_request;
    if (!requestArtifact) { els.receipt.classList.add("hidden"); els.receipt.replaceChildren(); return; }
    els.receipt.classList.remove("hidden");
    els.receipt.replaceChildren(node("div", "eyebrow", "Submission request saved"), node("h3", "", "Qualified Review is queued for final-value compilation"), node("p", "small-muted", `Requested ${requestArtifact.requested_at ? new Date(requestArtifact.requested_at).toLocaleString() : ""}. Document assembly has not started.`));
  }

  function renderAlerts() {
    const errors = state.draft.validation?.blocking_errors || [];
    if (!errors.length) { els.drawer.classList.add("hidden"); els.drawer.replaceChildren(); return; }
    els.drawer.classList.remove("hidden"); const list = node("div", "qr-alert-list"); errors.forEach((error) => list.append(node("div", "qr-alert-item", error))); els.drawer.replaceChildren(node("h3", "", "Review validation"), list);
  }

  async function saveDraft() {
    if (state.saving) return;
    state.saving = true; renderWorkflow(); renderNavigation();
    try {
      const preferred = state.sections[state.active]?.section_id || "";
      const payload = await request(`${endpoint}/draft`, { method: "PUT", body: JSON.stringify({ field_edits: collectFieldEdits(), reviewer_identity: "public_qualified_review_ui" }) });
      applyPayload(payload, preferred);
      announce("Qualified Review draft saved.");
    } finally { state.saving = false; renderWorkflow(); renderNavigation(); }
  }

  async function attestSection(section, attested) {
    await saveDraft();
    state.saving = true; renderWorkflow();
    try {
      const payload = await request(`${endpoint}/sections/${encodeURIComponent(section.section_id)}/attestation`, { method: "PUT", body: JSON.stringify({ attested, reviewer_identity: "public_qualified_review_ui" }) });
      state.draft = payload.qualified_review_draft || state.draft;
      render(); announce(attested ? `${section.section_title} attested.` : `${section.section_title} attestation removed.`);
    } finally { state.saving = false; renderWorkflow(); renderNavigation(); }
  }

  async function submitReview() {
    if (!finalReady()) return;
    await saveDraft();
    state.saving = true; renderFinalGate();
    try {
      await request(`${endpoint}/submit`, { method: "POST", body: JSON.stringify({ submitted_by: "public_qualified_review_ui" }) });
      applyPayload(await request(endpoint)); announce("Qualified Review submitted for final-value compilation.");
    } finally { state.saving = false; renderFinalGate(); }
  }

  function fieldChanged(sectionId) {
    if (state.draft.section_attestations?.[sectionId]) delete state.draft.section_attestations[sectionId];
    clearTimeout(state.timer); state.timer = setTimeout(() => saveDraft().catch((error) => showError(error.message)), 650);
    renderRail(); renderWorkflow("Section attestation reset because a field changed."); renderFinalGate();
  }

  function collectFieldEdits() {
    const edits = {};
    document.querySelectorAll("[data-field-id].qr-finding").forEach((card) => {
      const fieldId = card.dataset.fieldId; const atomic_values = {};
      card.querySelectorAll("[data-atomic-key]").forEach((control) => { atomic_values[control.dataset.atomicKey] = readControl(control); });
      edits[fieldId] = { atomic_values, limitation: card.querySelector("[data-field-limitation]")?.value || "", not_applicable: card.querySelector("[data-field-not-applicable]")?.checked === true };
    });
    return edits;
  }

  function readControl(control) {
    const type = control.dataset.valueType;
    if (type === "boolean") return control.value === "true";
    if (type === "number") return control.value === "" ? null : Number(control.value);
    if (type === "array") return control.value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
    if (type === "object") { try { return JSON.parse(control.value || "{}"); } catch { return control.value; } }
    return control.value;
  }

  function finalReady() { return state.sections.length > 0 && state.sections.every(isSectionAttested) && !(state.handoff.registry_resolution?.unresolved_activation_probe_field_ids || []).length; }
  function isSectionAttested(section) { const saved = state.draft.section_attestations?.[section.section_id]; return saved?.status === "ATTESTED" && saved.field_state_hash === section.attestation?.field_state_hash; }
  function fieldCount() { return state.sections.reduce((sum, section) => sum + (section.fields || []).length, 0); }
  function moveTo(index) { if (index < 0 || index >= state.sections.length) return; state.active = index; render(); document.getElementById(`qr-section-${stable(state.sections[index].section_id)}`)?.focus(); }
  function sourceSummary(field) { return (field.atomic_fields || []).map((atomic) => `${humanize(atomic.atomic_key)}: ${atomic.source === "MARKET_BASED" ? "{MARKET BASED}" : atomic.source === "PHASE_12" ? "Diligence derived" : atomic.source}`).join("\n"); }
  function documentSummary(field) { return (field.document_impacts || []).map((impact) => `${impact.document_id}: ${(impact.actions || []).join(" + ")}${impact.target ? ` — ${impact.target}` : ""}`).join("\n") || "No document impact registered"; }
  function contextBlock(label, value) { const root = node("div", "qr-context-block"); root.append(node("div", "qr-context-label", label), node("div", "qr-context-value", value || "Not available")); return root; }
  function checkboxControl(labelText, checked, dataKey) { const label = node("label", "qr-check-label"); const input = document.createElement("input"); input.type = "checkbox"; input.checked = checked; input.dataset[dataKey] = "true"; label.append(input, node("span", "", labelText)); return label; }
  function button(className, text, handler) { const item = document.createElement("button"); item.type = "button"; item.className = className; if (text) item.textContent = text; if (handler) item.addEventListener("click", handler); return item; }
  function node(tag, className = "", text = "") { const item = document.createElement(tag); if (className) item.className = className; if (text !== "") item.textContent = text; return item; }
  function humanize(value) { return String(value || "").replace(/\[\]$/, "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
  function stable(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
  function announce(message) { if (els.live) els.live.textContent = message; }
  async function request(url, options = {}) { const response = await fetch(url, { headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.message || payload.error || `Request failed (${response.status})`); return payload; }
  function showError(message) { els.drawer?.classList.remove("hidden"); els.drawer?.replaceChildren(node("h3", "", "Qualified Review unavailable"), node("div", "qr-alert-item", message)); announce(message); }
})();
