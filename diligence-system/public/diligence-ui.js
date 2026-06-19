const state = {
  lastResult: null,
  health: null
};

const els = {
  form: document.getElementById("diligenceForm"),
  runButton: document.getElementById("runButton"),
  statusText: document.getElementById("statusText"),
  progressLine: document.getElementById("progressLine"),
  result: document.getElementById("result"),
  vault: document.getElementById("vault"),
  reportTab: document.getElementById("tab-report"),
  jsonTab: document.getElementById("tab-json"),
  auditTab: document.getElementById("tab-audit"),
  vaultTab: document.getElementById("tab-vault"),
  pushVaultButton: document.getElementById("pushVaultButton"),
  downloadButton: document.getElementById("downloadButton"),
  vaultStatus: document.getElementById("vaultStatus"),
  targetUrl: document.getElementById("targetUrl"),
  sourceMode: document.getElementById("sourceMode"),
  pastedMaterial: document.getElementById("pastedMaterial"),
  modeBadge: document.getElementById("modeBadge"),
  diagnosticMode: document.getElementById("diagnosticMode"),
  runUntil: document.getElementById("runUntil"),
  runtimeTracePanel: document.getElementById("runtimeTracePanel")
};

els.form.addEventListener("submit", handleRun);
els.pushVaultButton.addEventListener("click", handleVaultPush);
els.downloadButton.addEventListener("click", handleDownload);
els.sourceMode.addEventListener("change", updateInputRequirements);
els.targetUrl.addEventListener("blur", () => {
  const normalized = normalizeTargetUrl(els.targetUrl.value);
  if (normalized.ok && normalized.url) els.targetUrl.value = normalized.url;
});

document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => activateTab(btn.dataset.tab));
});

boot();

async function boot() {
  updateInputRequirements();
  await loadHealth();
  restoreLastResult();
}

async function loadHealth() {
  try {
    const response = await fetch("/health", { headers: { accept: "application/json" } });
    const health = await response.json();
    state.health = health;

    if (els.modeBadge) {
      const mode = health.mode || "unknown";
      const fetcher = health.hybrid_fetcher?.version || "no_fetcher";
      els.modeBadge.textContent = `${mode} Â· ${fetcher}`;
    }

    setStatus(
      `Runtime ready: mode=${health.mode || "unknown"} Â· models=${(health.models || []).join("/") || health.model || "N/A"} Â· prompt_live=${Boolean(health.prompt_live_ready)} Â· hybrid=${health.hybrid_fetcher?.version || "N/A"}`
    );
  } catch (err) {
    if (els.modeBadge) els.modeBadge.textContent = "unknown";
    setStatus(`Runtime health check unavailable: ${err.message || String(err)}`);
  }
}

async function handleRun(event) {
  event.preventDefault();

  const formData = new FormData(els.form);
  const sourceMode = String(formData.get("source_mode") || "url").trim();
  const pastedMaterial = String(formData.get("pasted_public_material") || "").trim();
  const normalized = normalizeTargetUrl(String(formData.get("target_url") || ""));

  if (sourceMode !== "text" && !normalized.ok) {
    setStatus(normalized.message || "Enter a valid public URL, for example https://sarvam.ai or sarvam.ai.");
    els.targetUrl.focus();
    return;
  }

  if (sourceMode === "text" && !pastedMaterial) {
    setStatus("Pasted public material is required when source mode is text-only.");
    els.pastedMaterial.focus();
    return;
  }

  const payload = {
    target_url: sourceMode === "text" ? "N/A" : normalized.url,
    company_name: String(formData.get("company_name") || "").trim(),
    source_mode: sourceMode,
    pasted_public_material: pastedMaterial,
    debug_trace: Boolean(els.diagnosticMode?.checked),
    run_until: String(formData.get("run_until") || "").trim()
  };
  if (payload.run_until) payload.debug_trace = true;

  if (payload.target_url !== "N/A") {
    els.targetUrl.value = payload.target_url;
  }

  try {
    setRunning(true);
    setProgress(12);
    setRail("input");
    setStatus(`Input accepted: ${payload.source_mode} Â· ${payload.target_url}. Sending runtime payload to server...`);

    const response = await fetch("/api/diligence/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    setProgress(55);
    setRail("runtime");
    setStatus("Diligence runtime executing or returning diagnostics...");

    const result = await safeReadJson(response);
    if (!response.ok || !result.ok) {
      const diagnostic = buildErrorResult({ response, result, payload });
      state.lastResult = diagnostic;
      localStorage.setItem("interface_diligence_last_result", JSON.stringify(diagnostic));
      renderResult(diagnostic);
      setProgress(100);
      setRail("report");
      setStatus(`Run returned diagnostic failure: ${diagnostic.error || diagnostic.status || `HTTP_${response.status}`}`);
      return;
    }

    setProgress(86);
    setRail("report");
    setStatus("Report received. Rendering output...");

    state.lastResult = result;
    localStorage.setItem("interface_diligence_last_result", JSON.stringify(result));
    renderResult(result);

    setProgress(100);
    setRail(result.status === "GUARDRAIL_FAILED" ? "report" : "vault");
    setStatus(`${result.status === "GUARDRAIL_FAILED" ? "Guardrail failed" : "Completed"}. Run ID: ${result.run_id || "N/A"}`);
  } catch (err) {
    setProgress(0);
    const diagnostic = buildErrorResult({ error: err, payload });
    state.lastResult = diagnostic;
    renderResult(diagnostic);
    setStatus(`Run failed before a normal response: ${err.message || String(err)}`);
  } finally {
    setRunning(false);
  }
}

function normalizeTargetUrl(rawValue) {
  let value = String(rawValue || "").trim();
  if (!value) return { ok: false, url: "", message: "Target URL is required unless source mode is text-only." };

  value = value.replace(/^http:\/\//i, "https://");
  if (!/^https:\/\//i.test(value)) {
    value = `https://${value}`;
  }

  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { ok: false, url: "", message: "Only http/https URLs are allowed." };
    }
    if (!parsed.hostname || !parsed.hostname.includes(".")) {
      return { ok: false, url: "", message: "Enter a valid domain, for example sarvam.ai." };
    }
    return { ok: true, url: parsed.toString(), message: "" };
  } catch {
    return { ok: false, url: "", message: "Enter a valid public URL, for example https://sarvam.ai or sarvam.ai." };
  }
}

function updateInputRequirements() {
  const mode = els.sourceMode.value;
  const isTextOnly = mode === "text";
  els.targetUrl.toggleAttribute("aria-required", !isTextOnly);
  els.pastedMaterial.toggleAttribute("aria-required", isTextOnly);
  els.targetUrl.placeholder = isTextOnly ? "Optional in text-only mode" : "https://example.ai or example.ai";
  els.pastedMaterial.placeholder = isTextOnly
    ? "Required in text-only mode. Paste public product/legal/governance text only."
    : "Paste public product/legal/governance text only. Do not paste confidential material.";
}

function renderResult(result) {
  els.result.classList.remove("hidden");
  els.vault.classList.remove("hidden");

  els.reportTab.innerHTML = result.html_report || buildFallbackReportHtml(result);
  els.jsonTab.textContent = JSON.stringify(buildVisibleJson(result), null, 2);
  els.auditTab.textContent = buildAuditText(result);
  els.vaultTab.textContent = JSON.stringify(result.vault_assembly_handoff || {}, null, 2);
  renderRuntimeTracePanel(result);

  activateTab("report");
  setTimeout(() => document.getElementById("result").scrollIntoView({ behavior: "smooth", block: "start" }), 100);
}

function buildVisibleJson(result) {
  return {
    ok: result.ok,
    status: result.status,
    parse_status: result.parse_status,
    mode: result.mode,
    model: result.model,
    key_index: result.key_index,
    guardrail: result.guardrail || null,
    hybrid_source_review: result.hybrid_evidence_packet?.source_review || null,
    hybrid_warnings: result.hybrid_evidence_packet?.warnings || [],
    hybrid_candidate_links: result.hybrid_evidence_packet?.candidate_links || [],
    hybrid_direct_fetch_attempts: result.hybrid_evidence_packet?.direct_fetch_attempts || [],
    hybrid_artifact_inventory: result.hybrid_evidence_packet?.artifact_inventory || [],
    machine_json: result.machine_json || {},
    raw_output: result.raw_output || "",
    error: result.error || null,
    message: result.message || null,
    completed_nodes: result.completed_nodes || result.phase_stack?.completed_nodes || [],
    runtime_trace: result.runtime_trace || null,
    mechanical_validations: result.mechanical_validations || {},
    model_meta_by_phase: result.model_meta_by_phase || {},
    phase_top_level_presence: result.phase_top_level_presence || {},
    s0_counts: result.s0_counts || {}
  };
}

function buildAuditText(result) {
  const chunks = [];
  if (result.guardrail) chunks.push(`[SERVER_GUARDRAIL]\n${JSON.stringify(result.guardrail, null, 2)}`);
  if (result.hybrid_evidence_packet?.source_review) chunks.push(`[HYBRID_SOURCE_REVIEW]\n${JSON.stringify(result.hybrid_evidence_packet.source_review, null, 2)}`);
  if (result.hybrid_evidence_packet?.warnings?.length) chunks.push(`[HYBRID_WARNINGS]\n${JSON.stringify(result.hybrid_evidence_packet.warnings, null, 2)}`);
  if (result.technical_audit_log) chunks.push(`[MODEL_TECHNICAL_AUDIT_LOG]\n${result.technical_audit_log}`);
  if (result.operator_challenge_gate) chunks.push(`[OPERATOR_CHALLENGE_GATE]\n${JSON.stringify(result.operator_challenge_gate, null, 2)}`);
  if (result.runtime_trace) chunks.push(`[RUNTIME_TRACE]\n${JSON.stringify(compactRuntimeTraceForDisplay(result.runtime_trace), null, 2)}`);
  if (result.mechanical_validations) chunks.push(`[MECHANICAL_VALIDATIONS]\n${JSON.stringify(result.mechanical_validations, null, 2)}`);
  if (result.model_meta_by_phase) chunks.push(`[MODEL_META_BY_PHASE]\n${JSON.stringify(result.model_meta_by_phase, null, 2)}`);
  if (result.raw_output && !result.technical_audit_log) chunks.push(`[RAW_OUTPUT]\n${result.raw_output}`);
  return chunks.join("\n\n") || "No audit diagnostics returned.";
}

function buildFallbackReportHtml(result) {
  const title = result.status === "ERROR" || result.error ? "Runtime Diagnostic" : "No HTML report returned";
  return `
    <div class="interface-report guardrail-failed">
      <h1>${escapeHtml(title)}</h1>
      <p>The server returned no HTML report. Open the JSON and Audit tabs for diagnostics.</p>
      ${result.error ? `<p><strong>Error:</strong> ${escapeHtml(result.error)}</p>` : ""}
      ${result.message ? `<pre>${escapeHtml(result.message)}</pre>` : ""}
    </div>`;
}

function buildErrorResult({ response, result, error, payload }) {
  const status = response ? `HTTP_${response.status}` : "CLIENT_ERROR";
  const err = result?.error || error?.name || status;
  const message = result?.message || error?.message || "No additional message returned.";
  return {
    ok: false,
    status: "ERROR",
    parse_status: "ERROR_DIAGNOSTIC",
    error: err,
    message,
    target_url: payload?.target_url || "N/A",
    mode: state.health?.mode || "unknown",
    html_report: buildFallbackReportHtml({ status: "ERROR", error: err, message }),
    machine_json: result || {},
    runtime_trace: result?.runtime_trace || null,
    mechanical_validations: result?.mechanical_validations || {},
    model_meta_by_phase: result?.model_meta_by_phase || {},
    phase_top_level_presence: result?.phase_top_level_presence || {},
    s0_counts: result?.s0_counts || {},
    technical_audit_log: result?.technical_audit_log || "",
    operator_challenge_gate: result?.operator_challenge_gate || {},
    vault_assembly_handoff: result?.vault_assembly_handoff || {},
    raw_output: result?.raw_output || ""
  };
}

function renderRuntimeTracePanel(result) {
  if (!els.runtimeTracePanel) return;
  const trace = result?.runtime_trace || null;
  if (!trace && !result?.mechanical_validations && !result?.completed_nodes) {
    els.runtimeTracePanel.classList.add("hidden");
    els.runtimeTracePanel.innerHTML = "";
    return;
  }

  const completed = result.completed_nodes || result.phase_stack?.completed_nodes || [];
  const failedNode = result.phase_stack?.failed_node || null;
  const stages = trace?.stages || {};
  const stageRows = Object.values(stages).map((stage) => `
    <tr>
      <td>${escapeHtml(stage.node_id || "")}</td>
      <td>${escapeHtml(stage.status || "")}</td>
      <td>${escapeHtml(String(stage.duration_ms ?? ""))}</td>
      <td>${escapeHtml((stage.output_top_level_keys || []).join(", "))}</td>
      <td>${escapeHtml((stage.validation?.errors || []).join("; "))}</td>
    </tr>`).join("");

  els.runtimeTracePanel.innerHTML = `
    <div class="runtime-trace-head">
      <div>
        <p class="eyebrow">Runtime Trace</p>
        <strong>${escapeHtml(result.status || "N/A")}</strong>
      </div>
      <span>${escapeHtml(result.run_id || "N/A")}</span>
    </div>
    <div class="runtime-trace-grid">
      <div><span>Completed nodes</span><strong>${escapeHtml(completed.join(" -> ") || "N/A")}</strong></div>
      <div><span>Current/failed node</span><strong>${escapeHtml(failedNode || result.phase_stack?.next_node || "N/A")}</strong></div>
      <div><span>S0 counts</span><strong>${escapeHtml(JSON.stringify(result.s0_counts || {}))}</strong></div>
      <div><span>Models</span><strong>${escapeHtml(Object.keys(result.model_meta_by_phase || {}).join(", ") || "N/A")}</strong></div>
    </div>
    <div class="runtime-trace-table-wrap">
      <table class="runtime-trace-table">
        <thead><tr><th>Node</th><th>Status</th><th>ms</th><th>Output keys</th><th>Errors</th></tr></thead>
        <tbody>${stageRows || '<tr><td colspan="5">No per-stage trace returned.</td></tr>'}</tbody>
      </table>
    </div>
    <details open>
      <summary>P6 route plan summary</summary>
      <pre>${escapeHtml(JSON.stringify(trace?.p6?.route_plan_summary || {}, null, 2))}</pre>
    </details>
    <details>
      <summary>P6 batch plan</summary>
      <pre>${escapeHtml(JSON.stringify(trace?.p6?.model_batch_plan || [], null, 2))}</pre>
    </details>
    <details>
      <summary>Mechanical validations</summary>
      <pre>${escapeHtml(JSON.stringify(result.mechanical_validations || {}, null, 2))}</pre>
    </details>
    <details>
      <summary>Model meta</summary>
      <pre>${escapeHtml(JSON.stringify(result.model_meta_by_phase || {}, null, 2))}</pre>
    </details>
    <details>
      <summary>Errors and warnings</summary>
      <pre>${escapeHtml(JSON.stringify(collectTraceIssues(trace, result), null, 2))}</pre>
    </details>`;
  els.runtimeTracePanel.classList.remove("hidden");
}

function compactRuntimeTraceForDisplay(trace) {
  return {
    run_id: trace.run_id,
    started_at: trace.started_at,
    ended_at: trace.ended_at,
    active_runtime: trace.active_runtime,
    stages: trace.stages,
    gates: trace.gates,
    models: trace.models,
    p6: trace.p6,
    events: trace.events
  };
}

function collectTraceIssues(trace, result) {
  const events = trace?.events || [];
  return {
    result_error: result?.error || null,
    event_errors: events.filter((event) => (event.errors || []).length).map((event) => ({ node_id: event.node_id, summary: event.summary, errors: event.errors })),
    event_warnings: events.filter((event) => (event.warnings || []).length).map((event) => ({ node_id: event.node_id, summary: event.summary, warnings: event.warnings }))
  };
}

async function safeReadJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: "NON_JSON_RESPONSE",
      message: text.slice(0, 5000)
    };
  }
}

async function handleVaultPush() {
  if (!state.lastResult) {
    setVaultStatus("No diligence result available to push.");
    return;
  }

  const handoff = state.lastResult.vault_assembly_handoff || {};
  if (!Object.keys(handoff).length) {
    setVaultStatus("No vault_assembly_handoff object found in result.");
    return;
  }

  try {
    setVaultStatus("Pushing handoff payload to Vault Assembly Engine...");
    const response = await fetch("/api/vault/push", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        run_id: state.lastResult.run_id,
        target_url: state.lastResult.target_url,
        vault_assembly_handoff: handoff
      })
    });
    const result = await response.json();
    setVaultStatus(JSON.stringify(result, null, 2));
  } catch (err) {
    setVaultStatus(`Vault push failed: ${err.message || String(err)}`);
  }
}

function handleDownload() {
  if (!state.lastResult) {
    setVaultStatus("No result available to download.");
    return;
  }

  const blob = new Blob([JSON.stringify(state.lastResult, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${state.lastResult.run_id || "diligence-result"}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function activateTab(tabName) {
  document.querySelectorAll(".tab").forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tabName));
  ["report", "json", "audit", "vault"].forEach((name) => {
    document.getElementById(`tab-${name}`).classList.toggle("hidden", name !== tabName);
  });
}

function restoreLastResult() {
  const raw = localStorage.getItem("interface_diligence_last_result");
  if (!raw) return;

  try {
    const result = JSON.parse(raw);
    state.lastResult = result;
    renderResult(result);
    setStatus(`Restored last run. Run ID: ${result.run_id || "N/A"}`);
    setProgress(100);
    setRail(result.status === "GUARDRAIL_FAILED" ? "report" : "vault");
  } catch {
    localStorage.removeItem("interface_diligence_last_result");
  }
}

function setRunning(isRunning) {
  els.runButton.disabled = isRunning;
  els.runButton.textContent = isRunning ? "Running Diligence System..." : "Run Diligence System";
}

function setStatus(message) {
  els.statusText.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
}

function setVaultStatus(message) {
  els.vaultStatus.textContent = typeof message === "string" ? message : JSON.stringify(message, null, 2);
}

function setProgress(value) {
  els.progressLine.style.width = `${Math.max(0, Math.min(100, value))}%`;
}

function setRail(activeStage) {
  const order = ["input", "runtime", "report", "vault"];
  const activeIndex = order.indexOf(activeStage);

  document.querySelectorAll(".rail-stage").forEach((node) => {
    const stage = node.dataset.stage;
    const idx = order.indexOf(stage);
    node.classList.toggle("active", stage === activeStage);
    node.classList.toggle("completed", idx >= 0 && idx < activeIndex);
  });

  document.querySelectorAll(".mobile-funnel .seg").forEach((node) => {
    const stage = node.dataset.mobileStage;
    const idx = order.indexOf(stage);
    node.classList.toggle("active", stage === activeStage);
    node.classList.toggle("completed", idx >= 0 && idx < activeIndex);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* DILIGENCE_DIAGNOSTIC_OVERLAY_V2_START */
(function diligenceDiagnosticOverlayV2() {
  const STORAGE_KEY = "interface_diligence_last_result";
  let lastRenderedSignature = "";

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getLastResult() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function ensureBox() {
    let box = document.getElementById("runtimeDiagnosticBox");
    if (box) return box;

    box = document.createElement("div");
    box.id = "runtimeDiagnosticBox";
    box.setAttribute("aria-live", "polite");
    box.style.cssText = [
      "display:block",
      "margin-top:16px",
      "border:1px solid rgba(197,160,89,.42)",
      "background:rgba(0,0,0,.38)",
      "border-radius:16px",
      "padding:14px",
      "color:rgba(229,229,229,.88)",
      "font-size:12px",
      "line-height:1.55",
      "max-height:620px",
      "overflow:auto",
      "white-space:normal",
      "position:relative",
      "z-index:5"
    ].join(";");

    const statusText = document.getElementById("statusText");
    if (statusText && statusText.parentNode) {
      statusText.parentNode.insertBefore(box, statusText.nextSibling);
    } else {
      document.body.prepend(box);
    }
    return box;
  }

  function forceReveal() {
    ["result", "vault"].forEach((id) => {
      const node = document.getElementById(id);
      if (!node) return;
      node.classList.remove("hidden");
      node.style.setProperty("display", "block", "important");
      node.style.setProperty("visibility", "visible", "important");
      node.style.setProperty("opacity", "1", "important");
      node.style.setProperty("height", "auto", "important");
      node.style.setProperty("overflow", "visible", "important");
    });

    ["tab-report", "tab-json", "tab-audit", "tab-vault"].forEach((id) => {
      const node = document.getElementById(id);
      if (!node) return;
      node.style.setProperty("visibility", "visible", "important");
      node.style.setProperty("opacity", "1", "important");
      node.style.setProperty("min-height", "80px", "important");
    });
  }

  function auditText(result) {
    const chunks = [];
    if (result?.guardrail) chunks.push("[SERVER_GUARDRAIL]\n" + JSON.stringify(result.guardrail, null, 2));
    if (result?.hybrid_evidence_packet?.source_review) chunks.push("[HYBRID_SOURCE_REVIEW]\n" + JSON.stringify(result.hybrid_evidence_packet.source_review, null, 2));
    if (result?.hybrid_evidence_packet?.warnings?.length) chunks.push("[HYBRID_WARNINGS]\n" + JSON.stringify(result.hybrid_evidence_packet.warnings, null, 2));
    if (result?.operator_challenge_gate) chunks.push("[OPERATOR_CHALLENGE_GATE]\n" + JSON.stringify(result.operator_challenge_gate, null, 2));
    if (result?.runtime_trace) chunks.push("[RUNTIME_TRACE]\n" + JSON.stringify(result.runtime_trace, null, 2));
    if (result?.mechanical_validations) chunks.push("[MECHANICAL_VALIDATIONS]\n" + JSON.stringify(result.mechanical_validations, null, 2));
    if (result?.model_meta_by_phase) chunks.push("[MODEL_META_BY_PHASE]\n" + JSON.stringify(result.model_meta_by_phase, null, 2));
    if (result?.technical_audit_log) chunks.push("[MODEL_TECHNICAL_AUDIT_LOG]\n" + result.technical_audit_log);
    if (result?.raw_output && !result?.technical_audit_log) chunks.push("[RAW_OUTPUT_HEAD]\n" + String(result.raw_output).slice(0, 12000));
    if (result?.error || result?.message) chunks.push("[ERROR_DIAGNOSTIC]\n" + JSON.stringify({ error: result.error || null, message: result.message || null }, null, 2));
    return chunks.join("\n\n") || "No audit diagnostics returned.";
  }

  function render(result, reason) {
    const box = ensureBox();

    if (!result) {
      box.innerHTML =
        '<strong style="color:#C5A059;letter-spacing:.12em;text-transform:uppercase;">Runtime diagnostics</strong>' +
        '<pre style="white-space:pre-wrap;color:rgba(229,229,229,.76);">No run result saved yet.</pre>';
      return;
    }

    forceReveal();

    const errors = result?.guardrail?.errors || [];
    const sourceReview = result?.hybrid_evidence_packet?.source_review || null;
    const isBad = result?.status === "GUARDRAIL_FAILED" || result?.ok === false || result?.error;
    const title = result?.status === "GUARDRAIL_FAILED"
      ? "Guardrail failed"
      : isBad
        ? "Runtime diagnostic"
        : "Run completed";

    const audit = auditText(result);

    box.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:8px;">
        <strong style="color:${isBad ? "#ffb4a8" : "#b7f7d0"};letter-spacing:.12em;text-transform:uppercase;">${esc(title)}</strong>
        <span style="color:rgba(229,229,229,.55);">${esc(result.run_id || reason || "diagnostic")}</span>
      </div>

      <div style="margin-bottom:8px;color:rgba(229,229,229,.72);">
        status=${esc(result.status || "N/A")} Â· parse=${esc(result.parse_status || "N/A")} Â· model=${esc(result.model || "N/A")} Â· key=${esc(result.key_index || "N/A")}
      </div>

      ${errors.length ? `
        <div style="margin:10px 0;color:#ffb4a8;">
          <strong>Guardrail errors</strong>
          <pre style="white-space:pre-wrap;margin:6px 0 0;">${esc(errors.join("\n"))}</pre>
        </div>` : ""}

      ${sourceReview ? `
        <div style="margin:10px 0;color:rgba(229,229,229,.78);">
          <strong>Hybrid source review</strong>
          <pre style="white-space:pre-wrap;margin:6px 0 0;">${esc(JSON.stringify(sourceReview, null, 2))}</pre>
        </div>` : ""}

      <details open>
        <summary style="cursor:pointer;color:#C5A059;font-weight:800;">Audit log</summary>
        <pre id="runtimeDiagnosticPre" style="white-space:pre-wrap;margin:10px 0 0;color:rgba(229,229,229,.84);font-family:ui-monospace,SFMono-Regular,Consolas,monospace;">${esc(audit)}</pre>
      </details>`;

    const auditTab = document.getElementById("tab-audit");
    if (auditTab) {
      auditTab.textContent = audit;
      document.querySelectorAll(".tab").forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === "audit"));
      ["report", "json", "audit", "vault"].forEach((name) => {
        const panel = document.getElementById("tab-" + name);
        if (!panel) return;
        const active = name === "audit";
        panel.classList.toggle("hidden", !active);
        panel.style.setProperty("display", active ? "block" : "none", "important");
        panel.style.setProperty("visibility", active ? "visible" : "hidden", "important");
      });
    }
  }

  function renderFromStorage(reason) {
    const result = getLastResult();
    const sig = JSON.stringify({
      reason,
      run_id: result?.run_id,
      status: result?.status,
      parse_status: result?.parse_status,
      guardrail: result?.guardrail
    });

    if (sig === lastRenderedSignature) return;
    lastRenderedSignature = sig;
    render(result, reason);
  }

  document.addEventListener("DOMContentLoaded", () => renderFromStorage("boot"));
  window.addEventListener("storage", () => renderFromStorage("storage"));

  const form = document.getElementById("diligenceForm");
  if (form) {
    form.addEventListener("submit", () => {
      const box = ensureBox();
      box.innerHTML =
        '<strong style="color:#C5A059;letter-spacing:.12em;text-transform:uppercase;">Running</strong>' +
        '<pre style="white-space:pre-wrap;color:rgba(229,229,229,.76);">Waiting for server response. Audit will appear here even if report rendering fails.</pre>';
    }, true);
  }

  setInterval(() => renderFromStorage("poll"), 1000);
  renderFromStorage("load");
})();
 /* DILIGENCE_DIAGNOSTIC_OVERLAY_V2_END */

