const RUNTIME_NODES = [
  { id: "JOB_CREATED", title: "Job created", sub: "run accepted" },
  { id: "PROMPT_BUNDLE_LOAD", title: "Prompt bundle", sub: "monolith + references loaded" },
  { id: "MODEL_CALL", title: "Model call", sub: "Gemini runs M1–M14" },
  { id: "TERMINAL_JSON_PARSE", title: "Terminal JSON", sub: "shape-only parse/repair" },
  { id: "REPORT_RENDER", title: "Report render", sub: "display-only HTML" },
  { id: "VAULT_HANDOFF", title: "Vault handoff", sub: "Assembly payload built" },
  { id: "COMPLETE", title: "Complete", sub: "result ready" }
];

const STALL_POLL_THRESHOLD = 3;
const ADVANCE_COOLDOWN_MS = 7000;
const ADVANCE_TIMEOUT_MS = 22000;

const state = {
  health: null,
  activeRunId: null,
  activeJob: null,
  lastResult: null,
  pollTimer: null,
  pollStartedAt: 0,
  lastJobSignature: "",
  unchangedPolls: 0,
  lastAdvanceAt: 0,
  advanceInFlight: false,
  advanceAttempts: 0
};

const els = {
  form: document.getElementById("diligenceForm"),
  runButton: document.getElementById("runButton"),
  refreshButton: document.getElementById("refreshButton"),
  statusText: document.getElementById("statusText"),
  progressLine: document.getElementById("progressLine"),
  runMeta: document.getElementById("runMeta"),
  nodeList: document.getElementById("nodeList"),
  nodeSummary: document.getElementById("nodeSummary"),
  result: document.getElementById("result"),
  vault: document.getElementById("vault"),
  reportTab: document.getElementById("tab-report"),
  jsonTab: document.getElementById("tab-json"),
  auditTab: document.getElementById("tab-audit"),
  vaultTab: document.getElementById("tab-vault"),
  downloadButton: document.getElementById("downloadButton"),
  copyVaultButton: document.getElementById("copyVaultButton"),
  vaultStatus: document.getElementById("vaultStatus"),
  targetUrl: document.getElementById("targetUrl"),
  targetName: document.getElementById("targetName"),
  sourceMode: document.getElementById("sourceMode"),
  pastedMaterial: document.getElementById("pastedMaterial"),
  modeBadge: document.getElementById("modeBadge")
};

boot();

function boot() {
  renderNodes({ current_node: "JOB_CREATED", status: "IDLE" });
  bindEvents();
  updateInputRequirements();
  loadHealth();
  restoreLastResult();
  resumeActiveRun();
}

function bindEvents() {
  els.form.addEventListener("submit", handleRun);
  els.refreshButton.addEventListener("click", () => state.activeRunId ? pollOnce(true) : loadHealth());
  els.downloadButton.addEventListener("click", handleDownload);
  els.copyVaultButton.addEventListener("click", handleCopyVault);
  els.sourceMode.addEventListener("change", updateInputRequirements);
  els.targetUrl.addEventListener("blur", () => {
    const normalized = normalizeTargetUrl(els.targetUrl.value);
    if (normalized.ok && normalized.url) els.targetUrl.value = normalized.url;
  });
  document.querySelectorAll(".tab").forEach((btn) => btn.addEventListener("click", () => activateTab(btn.dataset.tab)));
}

async function loadHealth() {
  try {
    const response = await fetch("/api/health", { headers: { accept: "application/json" } });
    const health = await safeReadJson(response);
    state.health = health;
    if (els.modeBadge) els.modeBadge.textContent = health.mode || "unknown";
    const bucketText = health.key_buckets ? Object.entries(health.key_buckets).map(([name, value]) => `${name}:${typeof value === "number" ? value : value?.key_count ?? value?.keyCount ?? "?"}`).join(" · ") : "key buckets unavailable";
    const refsLoaded = [
      `prompt=${Boolean(health.prompt_loaded)}`,
      `registry_key=${Boolean(health.registry_key_loaded)}`,
      `registry_yaml=${Boolean(health.registry_yaml_loaded)}`,
      `registry_rules=${Boolean(health.registry_evaluation_rules_loaded)}`,
      `vault_map=${Boolean(health.vault_map_loaded)}`
    ].join(" · ");
    setStatus(`Runtime ready: mode=${health.mode || "unknown"} · ${refsLoaded} · ${bucketText}`);
    renderMeta({
      mode: health.mode || "unknown",
      prompt: health.prompt_loaded ? "loaded" : "missing",
      registry_key: health.registry_key_loaded ? "loaded" : "missing",
      registry_yaml: health.registry_yaml_loaded ? "loaded" : "missing",
      registry_rules: health.registry_evaluation_rules_loaded ? "loaded" : "missing",
      vault_map: health.vault_map_loaded ? "loaded" : "missing",
      vault: health.vault_engine_configured ? "configured" : "local only"
    });
  } catch (err) {
    if (els.modeBadge) els.modeBadge.textContent = "unknown";
    setStatus(`Runtime health unavailable: ${err.message || String(err)}`);
  }
}

async function handleRun(event) {
  event.preventDefault();
  const payload = buildPayloadFromForm();
  if (!payload.ok) {
    setStatus(payload.message);
    payload.focus?.focus();
    return;
  }

  try {
    setRunning(true);
    setRail("input");
    setProgress(6);
    setStatus(`Input accepted. Creating monolith job for ${payload.body.source_mode}.`);
    clearResultPanels();

    const createResponse = await fetch("/api/diligence/run", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload.body)
    });
    const created = await safeReadJson(createResponse);

    if (!createResponse.ok || !created.ok || !created.run_id) {
      throw buildResponseError(createResponse, created, "MONOLITH_JOB_CREATE_FAILED");
    }

    state.activeRunId = created.run_id;
    state.activeJob = created;
    resetAdvanceWatch(created);
    localStorage.setItem("interface_monolith_active_run_id", created.run_id);
    setRail("runtime");
    setProgress(10);
    setStatus(`Job created: ${created.run_id}. Runtime nodes advancing server-side.`);
    renderJob(created);
    startPolling();
  } catch (err) {
    setRunning(false);
    const diagnostic = buildErrorResult(err, payload.body);
    state.lastResult = diagnostic;
    renderResult(diagnostic);
    setStatus(`Run failed: ${diagnostic.error || diagnostic.message}`);
    setProgress(100);
    setRail("report");
  }
}

function buildPayloadFromForm() {
  const formData = new FormData(els.form);
  const sourceMode = String(formData.get("source_mode") || "url").trim();
  const pastedMaterial = String(formData.get("pasted_public_material") || "").trim();
  const normalized = normalizeTargetUrl(String(formData.get("target_url") || ""));

  if (sourceMode !== "text" && !normalized.ok) {
    return { ok: false, message: normalized.message || "Enter a valid public URL.", focus: els.targetUrl };
  }
  if (sourceMode === "text" && !pastedMaterial) {
    return { ok: false, message: "Pasted public material is required for text-only mode.", focus: els.pastedMaterial };
  }

  const body = {
    source_mode: sourceMode,
    target_url: sourceMode === "text" ? "" : normalized.url,
    target_name: String(formData.get("target_name") || "").trim(),
    pasted_public_material: pastedMaterial,
    output_mode: "screen_report_plus_vault"
  };
  if (body.target_url) els.targetUrl.value = body.target_url;
  return { ok: true, body };
}

function startPolling() {
  stopPolling();
  state.pollStartedAt = Date.now();
  state.unchangedPolls = 0;
  state.lastAdvanceAt = 0;
  state.advanceInFlight = false;
  state.advanceAttempts = 0;
  pollOnce(false);
  state.pollTimer = setInterval(() => pollOnce(false), 1500);
}

function stopPolling() {
  if (state.pollTimer) clearInterval(state.pollTimer);
  state.pollTimer = null;
}

async function pollOnce(manual) {
  if (!state.activeRunId) return;
  try {
    const response = await fetch(`/api/diligence/jobs/${encodeURIComponent(state.activeRunId)}`, { headers: { accept: "application/json" } });
    const job = await safeReadJson(response);
    if (!response.ok || !job.ok) throw buildResponseError(response, job, "MONOLITH_JOB_STATUS_FAILED");
    state.activeJob = job;
    renderJob(job);
    trackJobMovement(job);

    if (shouldRequestAdvance(job)) {
      requestAdvance(job).catch((advanceErr) => {
        console.warn("Monolith advance fallback failed", advanceErr);
      });
    }

    if (job.result_ready || job.status === "SUCCEEDED") {
      await fetchResult(job.run_id);
      return;
    }
    if (job.status === "FAILED") {
      throw Object.assign(new Error(job.error?.message || "Monolith job failed."), { data: job, code: job.error?.error || "MONOLITH_JOB_FAILED" });
    }
    if (manual) {
      setStatus(`Refreshed: ${job.status} · current=${job.current_node || "N/A"} · next=${job.next_node || "N/A"}`);
      if (!["SUCCEEDED", "FAILED"].includes(job.status)) {
        requestAdvance(job, { force: true }).catch((advanceErr) => console.warn("Manual advance failed", advanceErr));
      }
    }
  } catch (err) {
    stopPolling();
    setRunning(false);
    const diagnostic = buildErrorResult(err, state.activeJob?.execution_payload || {});
    state.lastResult = diagnostic;
    renderResult(diagnostic);
    setStatus(`Status failed: ${diagnostic.error || diagnostic.message}`);
    setRail("report");
    setProgress(100);
  }
}


function resetAdvanceWatch(job = {}) {
  state.lastJobSignature = jobSignature(job);
  state.unchangedPolls = 0;
  state.lastAdvanceAt = 0;
  state.advanceInFlight = false;
  state.advanceAttempts = 0;
}

function trackJobMovement(job = {}) {
  const signature = jobSignature(job);
  if (signature && signature === state.lastJobSignature) {
    state.unchangedPolls += 1;
  } else {
    state.lastJobSignature = signature;
    state.unchangedPolls = 0;
  }
}

function jobSignature(job = {}) {
  return [job.status || "", job.current_node || "", job.next_node || "", job.updated_at || "", job.events?.length || 0].join("|");
}

function shouldRequestAdvance(job = {}) {
  if (!state.activeRunId || state.advanceInFlight) return false;
  if (["SUCCEEDED", "FAILED"].includes(job.status)) return false;
  if (!job.advance_url && !job.run_id) return false;
  if (state.unchangedPolls < STALL_POLL_THRESHOLD) return false;
  if (Date.now() - state.lastAdvanceAt < ADVANCE_COOLDOWN_MS) return false;
  return true;
}

async function requestAdvance(job = {}, { force = false } = {}) {
  if (!state.activeRunId || state.advanceInFlight) return null;
  if (!force && !shouldRequestAdvance(job)) return null;

  const runId = job.run_id || state.activeRunId;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ADVANCE_TIMEOUT_MS);
  state.advanceInFlight = true;
  state.lastAdvanceAt = Date.now();
  state.advanceAttempts += 1;

  try {
    const response = await fetch(`/api/diligence/jobs/${encodeURIComponent(runId)}/advance`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ ui_fallback_advance: true }),
      signal: controller.signal
    });
    const advanced = await safeReadJson(response);
    if (response.ok && advanced.ok !== false) {
      state.activeJob = advanced;
      resetAdvanceWatch(advanced);
      renderJob(advanced);
      setStatus(`Advance fallback accepted: ${advanced.status || "RUNNING"} · current=${advanced.current_node || "N/A"} · next=${advanced.next_node || "N/A"}`);
      if (advanced.result_ready || advanced.status === "SUCCEEDED") await fetchResult(runId);
      return advanced;
    }
    throw buildResponseError(response, advanced, "MONOLITH_ADVANCE_FAILED");
  } catch (err) {
    if (err.name === "AbortError") {
      setStatus("Advance fallback still running server-side. Continuing status polling.");
      return null;
    }
    setStatus(`Advance fallback warning: ${err.message || String(err)}. Continuing status polling.`);
    return null;
  } finally {
    clearTimeout(timer);
    state.advanceInFlight = false;
  }
}

async function fetchResult(runId) {
  stopPolling();
  setStatus("Job complete. Fetching report output.");
  setProgress(96);
  const response = await fetch(`/api/diligence/jobs/${encodeURIComponent(runId)}/result`, { headers: { accept: "application/json" } });
  const result = await safeReadJson(response);
  if (!response.ok || !result.ok) throw buildResponseError(response, result, "MONOLITH_RESULT_FETCH_FAILED");

  state.lastResult = result;
  localStorage.setItem("interface_monolith_last_result", JSON.stringify(result));
  localStorage.removeItem("interface_monolith_active_run_id");
  setRunning(false);
  setProgress(100);
  setRail("vault");
  renderResult(result);
  setStatus(`Completed. Run ID: ${result.run_id || runId}`);
}

function renderJob(job) {
  renderNodes(job);
  const current = job.current_node || "JOB_CREATED";
  const progress = progressForJob(job);
  setProgress(progress);
  setRail(job.status === "SUCCEEDED" ? "vault" : current === "REPORT_RENDER" ? "report" : "runtime");
  setStatus(`${job.status || "RUNNING"}: current=${current} · next=${job.next_node || "none"}`);
  renderMeta({
    run: job.run_id || "N/A",
    status: job.status || "N/A",
    current,
    next: job.next_node || "none"
  });
}

function renderNodes(job) {
  const currentIndex = Math.max(0, RUNTIME_NODES.findIndex((node) => node.id === (job.current_node || "JOB_CREATED")));
  const status = job.status || "IDLE";
  els.nodeSummary.textContent = status.toLowerCase();
  els.nodeList.innerHTML = RUNTIME_NODES.map((node, index) => {
    const done = status === "SUCCEEDED" || index < currentIndex;
    const active = node.id === job.current_node || node.id === job.next_node;
    const fail = status === "FAILED" && active;
    const stateLabel = fail ? "fail" : done ? "done" : active ? "active" : "waiting";
    return `<li class="node-item ${done ? "done" : ""} ${active ? "active" : ""} ${fail ? "fail" : ""}">
      <span class="node-num">${String(index + 1).padStart(2, "0")}</span>
      <span><span class="node-title">${escapeHtml(node.title)}</span><span class="node-sub">${escapeHtml(node.sub)}</span></span>
      <span class="node-state">${stateLabel}</span>
    </li>`;
  }).join("");
}

function renderMeta(meta) {
  els.runMeta.innerHTML = Object.entries(meta).map(([key, value]) => `
    <div class="meta-pill"><span>${escapeHtml(key)}</span><strong>${escapeHtml(String(value ?? "N/A"))}</strong></div>
  `).join("");
}

function renderResult(result) {
  els.result.classList.remove("hidden");
  els.vault.classList.remove("hidden");
  els.reportTab.innerHTML = result.html_report || buildFallbackReportHtml(result);
  els.jsonTab.textContent = JSON.stringify(buildVisibleJson(result), null, 2);
  els.auditTab.textContent = buildAuditText(result);
  els.vaultTab.textContent = JSON.stringify(result.vault_assembly_handoff || {}, null, 2);
  renderVaultStatus(result);
  activateTab("report");
  setTimeout(() => document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
}

function renderVaultStatus(result) {
  const status = result.vault_push_status || {};
  const handoff = result.vault_assembly_handoff || {};
  els.vaultStatus.textContent = JSON.stringify({ vault_push_status: status, vault_assembly_handoff_present: Boolean(Object.keys(handoff).length), run_id: result.run_id || null }, null, 2);
}

function buildVisibleJson(result) {
  return {
    ok: result.ok,
    mode: result.mode,
    run_id: result.run_id,
    source_mode: result.source_mode,
    parse_report: result.parse_report || null,
    model_meta: result.model_meta || null,
    references_loaded: result.references_loaded || null,
    vault_push_status: result.vault_push_status || null,
    terminal_json: result.terminal_json || null,
    error: result.error || null,
    message: result.message || null,
    events: result.events || []
  };
}

function buildAuditText(result) {
  const chunks = [];
  if (result.events?.length) chunks.push(`[RUNTIME_EVENTS]\n${JSON.stringify(result.events, null, 2)}`);
  if (result.parse_report) chunks.push(`[PARSE_REPORT]\n${JSON.stringify(result.parse_report, null, 2)}`);
  if (result.model_meta) chunks.push(`[MODEL_META]\n${JSON.stringify(result.model_meta, null, 2)}`);
  if (result.references_loaded) chunks.push(`[REFERENCES_LOADED]\n${JSON.stringify(result.references_loaded, null, 2)}`);
  if (result.raw_model_output) chunks.push(`[RAW_MODEL_OUTPUT]\n${String(result.raw_model_output).slice(0, 20000)}`);
  if (result.error || result.message) chunks.push(`[ERROR]\n${JSON.stringify({ error: result.error || null, message: result.message || null }, null, 2)}`);
  return chunks.join("\n\n") || "No audit diagnostics returned.";
}

function buildFallbackReportHtml(result) {
  const title = result.error ? "Runtime Diagnostic" : "No HTML report returned";
  return `<div class="interface-report">
    <h1>${escapeHtml(title)}</h1>
    <p>The server returned no rendered report. Use the JSON, Audit, and Vault tabs for diagnostics.</p>
    ${result.error ? `<p><strong>Error:</strong> ${escapeHtml(result.error)}</p>` : ""}
    ${result.message ? `<pre>${escapeHtml(result.message)}</pre>` : ""}
  </div>`;
}

function clearResultPanels() {
  els.result.classList.add("hidden");
  els.vault.classList.add("hidden");
  els.reportTab.innerHTML = "";
  els.jsonTab.textContent = "";
  els.auditTab.textContent = "";
  els.vaultTab.textContent = "";
  els.vaultStatus.textContent = "No Vault handoff yet.";
}

function handleDownload() {
  if (!state.lastResult) {
    els.vaultStatus.textContent = "No result available to download.";
    return;
  }
  const blob = new Blob([JSON.stringify(state.lastResult, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${state.lastResult.run_id || "monolith-diligence-result"}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function handleCopyVault() {
  const handoff = state.lastResult?.vault_assembly_handoff || null;
  if (!handoff || !Object.keys(handoff).length) {
    els.vaultStatus.textContent = "No Vault handoff object available to copy.";
    return;
  }
  await navigator.clipboard.writeText(JSON.stringify(handoff, null, 2));
  els.vaultStatus.textContent = "Vault handoff copied to clipboard.";
}


function resumeActiveRun() {
  const activeRunId = localStorage.getItem("interface_monolith_active_run_id");
  if (!activeRunId || state.activeRunId) return;
  state.activeRunId = activeRunId;
  setRunning(true);
  setRail("runtime");
  setStatus(`Resuming active monolith job: ${activeRunId}`);
  renderMeta({ run: activeRunId, status: "resuming", current: "unknown", next: "status poll" });
  startPolling();
}

function restoreLastResult() {
  const raw = localStorage.getItem("interface_monolith_last_result");
  if (!raw) return;
  try {
    const result = JSON.parse(raw);
    state.lastResult = result;
    renderResult(result);
    setStatus(`Restored last result. Run ID: ${result.run_id || "N/A"}`);
    setProgress(100);
    setRail("vault");
  } catch {
    localStorage.removeItem("interface_monolith_last_result");
  }
}

function normalizeTargetUrl(rawValue) {
  let value = String(rawValue || "").trim();
  if (!value) return { ok: false, url: "", message: "Target URL is required unless source mode is text-only." };
  value = value.replace(/^http:\/\//i, "https://");
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) return { ok: false, url: "", message: "Only http/https URLs are allowed." };
    if (!parsed.hostname || !parsed.hostname.includes(".")) return { ok: false, url: "", message: "Enter a valid domain, for example sarvam.ai." };
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

function progressForJob(job) {
  const current = job.current_node || job.next_node || "JOB_CREATED";
  const idx = Math.max(0, RUNTIME_NODES.findIndex((node) => node.id === current));
  if (job.status === "SUCCEEDED") return 100;
  if (job.status === "FAILED") return 100;
  return Math.min(94, 8 + idx * 14);
}

function activateTab(tabName) {
  document.querySelectorAll(".tab").forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tabName));
  ["report", "json", "audit", "vault"].forEach((name) => {
    document.getElementById(`tab-${name}`).classList.toggle("hidden", name !== tabName);
  });
}

function setRunning(isRunning) {
  els.runButton.disabled = isRunning;
  els.runButton.textContent = isRunning ? "Running Monolith..." : "Run Monolith";
}

function setStatus(message) {
  els.statusText.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
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

async function safeReadJson(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); }
  catch { return { ok: false, error: "NON_JSON_RESPONSE", message: text.slice(0, 5000) }; }
}

function buildResponseError(response, result, fallback) {
  const err = new Error(result?.message || result?.error || `${fallback}: HTTP_${response.status}`);
  err.code = result?.error || fallback;
  err.data = result;
  err.status = response.status;
  return err;
}

function buildErrorResult(err, payload) {
  return {
    ok: false,
    mode: state.health?.mode || "monolith_job_runtime",
    run_id: state.activeRunId || null,
    source_mode: payload?.source_mode || null,
    error: err.code || err.name || "CLIENT_ERROR",
    message: err.message || String(err),
    job_state: err.data || state.activeJob || null,
    html_report: buildFallbackReportHtml({ error: err.code || err.name || "CLIENT_ERROR", message: err.message || String(err) }),
    terminal_json: null,
    vault_assembly_handoff: {},
    vault_push_status: null,
    events: err.data?.events || []
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
