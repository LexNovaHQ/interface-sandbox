const RAIL_PHASES = [
  { id: "INTAKE", label: "Intake", sub: "target submitted", phases: ["CREATED"], why: "Creates an isolated run and prepares the backend artifact folder." },
  { id: "SOURCE_DISCOVERY", label: "Source Discovery", sub: "manifest + extraction", phases: ["AGENT_1A_URL_MANIFEST", "AGENT_1B_EXTRACT", "M6_BUCKET_INDEX"], why: "Collects and routes public source material into the evidence lanes." },
  { id: "LEGAL_CARTOGRAPHY", label: "Legal Cartography", sub: "document map", phases: ["M9"], why: "Maps visible legal and governance documents without turning them into legal conclusions." },
  { id: "TARGET_PROFILE", label: "Target Profile", sub: "entity + market", phases: ["M7_TARGET_PROFILE", "M7_TARGET_PROFILE_FORENSICS"], why: "Builds the target profile and records source-level forensics." },
  { id: "FEATURE_PROFILE", label: "Feature Profile", sub: "product activity", phases: ["M8_TARGET_FEATURE_PROFILE", "M8_TARGET_FEATURE_PROFILE_FORENSICS"], why: "Identifies product activity, archetypes, and surface signals." },
  { id: "DATA_PROVENANCE", label: "Data Provenance", sub: "data/control posture", phases: ["M10", "M10_FORENSICS"], why: "Maps visible data flows, control signals, and unresolved proof requests." },
  { id: "EXPOSURE_REGISTRY", label: "Exposure Registry", sub: "triggered + controlled", phases: ["M11"], why: "Evaluates the registry and emits both triggered and controlled rows." },
  { id: "OPERATOR_CHALLENGE", label: "Operator Challenge", sub: "quality gate", phases: ["M12"], why: "Challenges the exposure profile before final compilation." },
  { id: "FINAL_COMPILER", label: "Final Compiler", sub: "compiled handoff", phases: ["NORMALIZED_COMPILER"], why: "Compiles the locked profile artifacts into the final report handoff and the separate Qualified Review handoff branch." },
  { id: "REPORT_RENDERER", label: "Report Renderer", sub: "public report", phases: ["RENDERER"], why: "Builds the public report payload from the final handoff." },
  { id: "COMPLETE", label: "Complete", sub: "report ready", phases: ["COMPLETE"], why: "The diligence report is ready to open. Qualified Review is a separate post-report page." }
];

const PHASE_TEXT = {
  CREATED: "Run created. Preparing source discovery.",
  AGENT_1A_URL_MANIFEST: "Building the public URL manifest.",
  AGENT_1B_EXTRACT: "Extracting public source material.",
  M6_BUCKET_INDEX: "Routing sources into target, product, legal, and data buckets.",
  M9: "Mapping visible legal and governance documents.",
  M7_TARGET_PROFILE: "Building target profile.",
  M7_TARGET_PROFILE_FORENSICS: "Checking target profile forensics.",
  M8_TARGET_FEATURE_PROFILE: "Building product and feature profile.",
  M8_TARGET_FEATURE_PROFILE_FORENSICS: "Checking feature profile forensics.",
  M10: "Building data provenance profile.",
  M10_FORENSICS: "Checking data provenance forensics.",
  M11: "Evaluating exposure registry.",
  M12: "Running operator challenge gate.",
  NORMALIZED_COMPILER: "Compiling final handoff.",
  RENDERER: "Rendering report payload.",
  COMPLETE: "Report ready."
};

const TERMINAL_FAILURES = new Set(["REPAIR_REQUIRED", "CONTROLLED_FAILURE"]);
const POLL_MS = 10000;
const RUN_ID_PATTERN = /^LN-\d{8}-\d{6}-[A-Z0-9-]+-\d{6}$/i;
let pollTimer = null;
let currentRunId = "";

const els = {
  form: document.getElementById("runForm"),
  runButton: document.getElementById("runButton"),
  targetUrl: document.getElementById("targetUrl"),
  targetLabel: document.getElementById("targetLabel"),
  statusMessage: document.getElementById("statusMessage"),
  runIdValue: document.getElementById("runIdValue"),
  statusValue: document.getElementById("statusValue"),
  phaseValue: document.getElementById("phaseValue"),
  artifactValue: document.getElementById("artifactValue"),
  activePhaseTitle: document.getElementById("activePhaseTitle"),
  activePhaseText: document.getElementById("activePhaseText"),
  terminalNotice: document.getElementById("terminalNotice"),
  openReportButton: document.getElementById("openReportButton"),
  phaseRail: document.getElementById("phaseRail"),
  mobileFunnel: document.getElementById("mobileFunnel"),
  mobileFunnelLabel: document.getElementById("mobileFunnelLabel"),
  progressLine: document.getElementById("progressLine")
};

renderRail({ current_phase: "CREATED", status: "IDLE", runner_state: "IDLE" });
els.form.addEventListener("submit", startRun);
attachRunFromUrl();

async function startRun(event) {
  event.preventDefault();
  const targetUrl = els.targetUrl.value.trim();
  const target = els.targetLabel.value.trim();
  if (!targetUrl) return setMessage("Enter a public target URL first.", true);

  stopPolling();
  setBusy(true);
  setMessage("Creating isolated diligence run...");
  resetReportLink();

  try {
    const created = await api("/public/diligence-system/jobs", {
      method: "POST",
      body: JSON.stringify({ target_url: targetUrl, target: target || undefined })
    });
    currentRunId = created.run_id;
    updateBrowserRunId(currentRunId);
    updateState({ run: created, artifacts: [] });
    setMessage("Run created. Starting backend worker...");

    await api(`/public/diligence-system/jobs/${encodeURIComponent(currentRunId)}/advance`, {
      method: "POST",
      body: JSON.stringify({ auto_continue: true })
    });

    setMessage("Backend worker queued. Watching Diligence Engine phase rail...");
    await pollOnce();
    pollTimer = setInterval(pollOnce, POLL_MS);
  } catch (error) {
    setMessage(error.message || String(error), true);
    renderRail({ current_phase: "CREATED", status: "CONTROLLED_FAILURE", runner_state: "FAILED" });
    setBusy(false);
  }
}

async function attachRunFromUrl() {
  const runId = runIdFromLocation();
  if (!runId) return;

  stopPolling();
  currentRunId = runId;
  setBusy(true);
  resetReportLink();
  setMessage(`Attached to existing run ${runId}. Loading live state...`);

  try {
    await pollOnce({ fromAttach: true });
    if (currentRunId && !pollTimer) {
      pollTimer = setInterval(pollOnce, POLL_MS);
    }
  } catch (error) {
    stopPolling();
    setBusy(false);
    setMessage(error.message || String(error), true);
  }
}

async function pollOnce(_options = {}) {
  if (!currentRunId) return;
  try {
    const status = await api(`/public/diligence-system/jobs/${encodeURIComponent(currentRunId)}`);
    updateState(status);
    const run = status.run || status;
    if (isComplete(run)) {
      stopPolling();
      setBusy(false);
      const href = `report.html?run_id=${encodeURIComponent(currentRunId)}`;
      els.openReportButton.href = href;
      els.openReportButton.classList.remove("hidden");
      setMessage("Diligence report ready. Opening report...");
      setTimeout(() => { window.location.href = href; }, 1200);
      return;
    }
    if (isFailed(run)) {
      stopPolling();
      setBusy(false);
      const detail = run.runner_last_error ? ` ${run.runner_last_error}` : "";
      setMessage(`Run stopped: ${run.status || run.runner_state || "FAILED"}.${detail}`, true);
      return;
    }
    setMessage(`Watching run ${currentRunId}. Live Diligence Engine phase: ${run.current_phase || "unknown"}.`);
  } catch (error) {
    stopPolling();
    setBusy(false);
    setMessage(error.message || String(error), true);
    throw error;
  }
}

async function api(path, init = {}) {
  const response = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers || {}) }
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${response.status}: ${json.message || json.error || "Request failed"}`);
  return json;
}

function updateState(payload = {}) {
  const run = payload.run || payload;
  const artifacts = Array.isArray(payload.artifacts) ? payload.artifacts : [];
  const artifactCount = artifacts.length || Number(run.artifact_count || 0);
  const phase = run.current_phase || "CREATED";
  const status = run.status || "RUNNING";
  const runner = run.runner_state || "";
  const phaseInfo = phaseInfoFor(phase, status, runner);

  if (run.run_id && !currentRunId) currentRunId = run.run_id;
  if (run.root_url && els.targetUrl && !els.targetUrl.value.trim()) els.targetUrl.value = run.root_url;
  if (run.target && els.targetLabel && !els.targetLabel.value.trim()) els.targetLabel.value = run.target;

  els.runIdValue.textContent = run.run_id || currentRunId || "-";
  els.statusValue.textContent = [status, runner].filter(Boolean).join(" / ") || "-";
  els.phaseValue.textContent = phase;
  els.artifactValue.textContent = String(artifactCount || 0);
  els.activePhaseTitle.textContent = phaseInfo.label;
  els.activePhaseText.textContent = `${PHASE_TEXT[phase] || phaseInfo.why} Current engine phase: ${phase}.`;
  els.terminalNotice.innerHTML = badgeHtml(status, runner, run.runner_last_error || "");
  renderRail(run);
}

function runIdFromLocation() {
  const params = new URLSearchParams(window.location.search || "");
  return sanitizeRunId(params.get("run_id") || params.get("runId") || hashRunId());
}

function hashRunId() {
  return String(window.location.hash || "").replace(/^#\/?/, "").trim();
}

function sanitizeRunId(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  const normalized = decoded.trim().toUpperCase();
  return RUN_ID_PATTERN.test(normalized) ? normalized : "";
}

function updateBrowserRunId(runId) {
  const sanitized = sanitizeRunId(runId);
  if (!sanitized || !window.history?.replaceState) return;
  const url = new URL(window.location.href);
  url.searchParams.set("run_id", sanitized);
  window.history.replaceState({}, "", url.toString());
}

function phaseInfoFor(phase, status, runner) {
  const index = activeIndex({ current_phase: phase, status, runner_state: runner });
  return RAIL_PHASES[index] || RAIL_PHASES[0];
}

function renderRail(run = {}) {
  const active = activeIndex(run);
  const failed = isFailed(run);
  const limited = String(run.status || "").includes("LIMITATION");
  els.phaseRail.innerHTML = `<div class="rail-chip"><span class="pulse"></span> Diligence Engine rail</div>` + RAIL_PHASES.map((phase, index) => {
    let state = "pending";
    if (index < active) state = "complete";
    if (index === active) state = failed ? "failed" : (limited ? "limited" : "active");
    if (isComplete(run) && index <= active) state = "complete";
    return `<div class="rail-stage ${state}"><span class="rail-dot"></span><div><div class="rail-node">${escapeHtml(phase.label)}</div><div class="rail-sub">${escapeHtml(phase.sub)}</div><div class="rail-why">${escapeHtml(phase.why)}</div></div></div>`;
  }).join("");
  renderMobile(active);
  const denominator = Math.max(1, RAIL_PHASES.length - 1);
  const pct = Math.max(0, Math.min(100, Math.round((active / denominator) * 100)));
  els.progressLine.style.width = `${pct}%`;
}

function renderMobile(active) {
  els.mobileFunnel.innerHTML = RAIL_PHASES.slice(0, -1).map((phase, index) => `<span class="seg ${index < active ? "complete" : index === active ? "active" : ""}"></span>`).join("") + `<span class="lbl" id="mobileFunnelLabel">${escapeHtml((RAIL_PHASES[active] || RAIL_PHASES[0]).label)}</span>`;
}

function activeIndex(run = {}) {
  if (isComplete(run)) return RAIL_PHASES.findIndex((phase) => phase.id === "COMPLETE");
  const current = run.current_phase || (run.status === "CREATED" ? "CREATED" : "");
  const found = RAIL_PHASES.findIndex((phase) => phase.phases.includes(current));
  return found >= 0 ? found : 0;
}

function isComplete(run = {}) {
  return run.status === "COMPLETE" || run.current_phase === "COMPLETE";
}

function isFailed(run = {}) {
  return TERMINAL_FAILURES.has(run.status) || run.runner_state === "FAILED";
}

function setBusy(value) {
  els.runButton.disabled = Boolean(value);
  els.runButton.textContent = value ? "Monitoring..." : "Run Diligence";
}

function setMessage(message, error = false) {
  els.statusMessage.textContent = message;
  els.statusMessage.style.color = error ? "var(--danger)" : "rgba(229,229,229,.62)";
}

function resetReportLink() {
  els.openReportButton.classList.add("hidden");
  els.openReportButton.removeAttribute("href");
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

function badgeHtml(status, runner, error = "") {
  const failed = TERMINAL_FAILURES.has(status) || runner === "FAILED";
  const label = [status, runner].filter(Boolean).join(" / ") || "Idle";
  const detail = failed && error ? ` â€” ${error}` : "";
  return `<span class="status-badge ${failed ? "failed" : ""}"><span class="dot"></span>${escapeHtml(label + detail)}</span>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}