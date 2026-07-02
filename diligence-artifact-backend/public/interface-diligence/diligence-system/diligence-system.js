const RAIL_PHASES = [
  { id: "CREATED", label: "Intake Opened", sub: "matter intake", phases: ["CREATED"], why: "The matter has been opened and the workflow is preparing source collection." },
  { id: "AGENT_1A_URL_MANIFEST", label: "Public URL Mapping", sub: "source map", phases: ["AGENT_1A_URL_MANIFEST"], why: "Maps the visible public URLs that may support the diligence review." },
  { id: "AGENT_1B_EXTRACT", label: "Source Extraction", sub: "source capture", phases: ["AGENT_1B_EXTRACT"], why: "Extracts approved public source material for the report record." },
  { id: "M6_BUCKET_INDEX", label: "Source Routing", sub: "evidence lanes", phases: ["M6_BUCKET_INDEX"], why: "Routes collected sources into target, product, legal, and data review lanes." },
  { id: "M9", label: "Legal Document Stack Review", sub: "legal/governance stack", phases: ["M9"], why: "Maps visible legal and governance documents for downstream review." },
  { id: "M7_TARGET_PROFILE", label: "Target Profile Review", sub: "entity profile", phases: ["M7_TARGET_PROFILE"], why: "Builds the target profile from approved public source material." },
  { id: "M7_TARGET_PROFILE_FORENSICS", label: "Target Profile Forensics", sub: "traceability check", phases: ["M7_TARGET_PROFILE_FORENSICS"], why: "Checks the target profile record for source traceability." },
  { id: "M8_TARGET_FEATURE_PROFILE", label: "Product Activity Profile", sub: "feature/activity review", phases: ["M8_TARGET_FEATURE_PROFILE"], why: "Builds the product activity profile and visible feature map." },
  { id: "M8_TARGET_FEATURE_PROFILE_FORENSICS", label: "Product Activity Forensics", sub: "traceability check", phases: ["M8_TARGET_FEATURE_PROFILE_FORENSICS"], why: "Checks the product activity profile for source traceability." },
  { id: "M10", label: "Data Provenance Review", sub: "data/control posture", phases: ["M10"], why: "Maps visible data provenance, control signals, and proof gaps." },
  { id: "M10_FORENSICS", label: "Data Provenance Forensics", sub: "traceability check", phases: ["M10_FORENSICS"], why: "Checks the data provenance record for source traceability." },
  { id: "M11", label: "Exposure Review", sub: "triggered + controlled", phases: ["M11"], why: "Evaluates visible exposure signals and controlled positions." },
  { id: "M12", label: "Quality Challenge", sub: "quality gate", phases: ["M12"], why: "Challenges the exposure profile before final report preparation." },
  { id: "NORMALIZED_COMPILER", label: "Report Compilation", sub: "compiled handoff", phases: ["NORMALIZED_COMPILER"], why: "Compiles the locked review artifacts into the report handoff." },
  { id: "RENDERER", label: "Report Rendering", sub: "public report", phases: ["RENDERER"], why: "Builds the public report page from the compiled handoff." },
  { id: "COMPLETE", label: "Report Ready", sub: "ready for review", phases: ["COMPLETE"], why: "The diligence report is ready. Qualified Review is the next step." }
];

const PHASE_TEXT = {
  CREATED: "The diligence matter has been opened. Preparing source collection.",
  AGENT_1A_URL_MANIFEST: "Public URL mapping is identifying the visible source map.",
  AGENT_1B_EXTRACT: "Source extraction is capturing approved public source material.",
  M6_BUCKET_INDEX: "Source routing is organizing collected material into review lanes.",
  M9: "Legal document stack review is mapping visible legal and governance materials.",
  M7_TARGET_PROFILE: "Target profile review is building the entity profile.",
  M7_TARGET_PROFILE_FORENSICS: "Target profile forensics is checking source traceability.",
  M8_TARGET_FEATURE_PROFILE: "Product activity profile is mapping visible product features and activity.",
  M8_TARGET_FEATURE_PROFILE_FORENSICS: "Product activity forensics is checking source traceability.",
  M10: "Data provenance review is mapping visible data and control signals.",
  M10_FORENSICS: "Data provenance forensics is checking source traceability.",
  M11: "Exposure review is evaluating visible exposure and control positions.",
  M12: "Quality challenge is checking the review record before report preparation.",
  NORMALIZED_COMPILER: "Report compilation is assembling the locked diligence handoff.",
  RENDERER: "Report rendering is preparing the public report page.",
  COMPLETE: "The diligence report is ready."
};

const TERMINAL_FAILURES = new Set(["REPAIR_REQUIRED", "CONTROLLED_FAILURE"]);
const POLL_MS = 10000;
const RUN_ID_PATTERN = /^LN-\d{8}-\d{6}-[A-Z0-9-]+-\d{6}$/i;
let pollTimer = null;
let currentRunId = "";
let runSessionStartedAt = 0;
let elapsedTimer = null;

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
  progressLine: document.getElementById("progressLine"),
  runLiveBadge: document.getElementById("runLiveBadge"),
  runProgress: document.getElementById("runProgress"),
  runProgressFill: document.getElementById("runProgressFill"),
  runProgressText: document.getElementById("runProgressText"),
  runElapsedValue: document.getElementById("runElapsedValue"),
  lastCheckedValue: document.getElementById("lastCheckedValue")
};

renderRail({ current_phase: "CREATED", status: "IDLE", runner_state: "IDLE" });
updateRunMonitor({ current_phase: "", status: "IDLE", runner_state: "IDLE" }, 0);
els.form.addEventListener("submit", startRun);
attachRunFromUrl();
window.publicDiligencePhaseFor = publicPhaseFor;
window.updateDiligenceGateRunMonitor = updateRunMonitor;
window.setDiligenceGateMonitorAttention = setMonitorAttention;

async function startRun(event) {
  event.preventDefault();
  const targetUrl = els.targetUrl.value.trim();
  const target = els.targetLabel.value.trim();
  if (!targetUrl) return setMessage("Enter a public target URL first.", true);

  stopPolling();
  resetRunClock();
  startRunClock();
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
    setMessage("Run created. Starting diligence workflow...");

    await api(`/public/diligence-system/jobs/${encodeURIComponent(currentRunId)}/advance`, {
      method: "POST",
      body: JSON.stringify({ auto_continue: true })
    });

    setMessage("Workflow queued. Watching the live diligence rail...");
    await pollOnce();
    pollTimer = setInterval(pollOnce, POLL_MS);
  } catch (error) {
    setMessage(error.message || String(error), true);
    setMonitorAttention(error.message || String(error));
    renderRail({ current_phase: "CREATED", status: "CONTROLLED_FAILURE", runner_state: "FAILED" });
    setBusy(false);
    stopRunClock();
  }
}

async function attachRunFromUrl() {
  const runId = runIdFromLocation();
  if (!runId) return;

  stopPolling();
  resetRunClock();
  startRunClock();
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
    setMonitorAttention(error.message || String(error));
    stopRunClock();
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
      stopRunClock();
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
      stopRunClock();
      const detail = run.runner_last_error ? ` ${run.runner_last_error}` : "";
      setMessage(`Run stopped: ${run.status || run.runner_state || "FAILED"}.${detail}`, true);
      return;
    }
    const publicPhase = publicPhaseFor(run.current_phase || "", run.status || "", run.runner_state || "");
    setMessage(`Watching run ${currentRunId}. Current diligence phase: ${publicPhase.label}.`);
  } catch (error) {
    stopPolling();
    setBusy(false);
    setMessage(error.message || String(error), true);
    setMonitorAttention(error.message || String(error));
    stopRunClock();
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
  const publicPhase = publicPhaseFor(phase, status, runner);

  if (run.run_id && !currentRunId) currentRunId = run.run_id;
  if (run.root_url && els.targetUrl && !els.targetUrl.value.trim()) els.targetUrl.value = run.root_url;
  if (run.target && els.targetLabel && !els.targetLabel.value.trim()) els.targetLabel.value = run.target;

  els.runIdValue.textContent = run.run_id || currentRunId || "-";
  els.statusValue.textContent = [status, runner].filter(Boolean).join(" / ") || "-";
  els.phaseValue.textContent = publicPhase.label;
  els.artifactValue.textContent = String(artifactCount || 0);
  els.activePhaseTitle.textContent = publicPhase.label;
  els.activePhaseText.textContent = publicPhase.description;
  els.terminalNotice.innerHTML = badgeHtml(status, runner, run.runner_last_error || "");
  updateRunMonitor(run, artifactCount);
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

function publicPhaseFor(phase, status, runner) {
  if (status === "IDLE" && !phase) {
    return { label: "Intake", description: "Waiting for a public target URL or existing matter/run ID.", progressLabel: "Waiting for intake." };
  }
  const info = phaseInfoFor(phase, status, runner);
  if (isComplete({ current_phase: phase, status, runner_state: runner })) {
    return { label: "Report Ready", description: "The diligence report is ready. Opening the report automatically.", progressLabel: "Report ready." };
  }
  if (isFailed({ current_phase: phase, status, runner_state: runner })) {
    return { label: info.label, description: `${info.label} needs attention. Review the status before continuing.`, progressLabel: "Run needs attention." };
  }
  return {
    label: info.label,
    description: PHASE_TEXT[phase] || info.why || "The diligence workflow is progressing.",
    progressLabel: `${info.label} in progress.`
  };
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
  const pct = progressPercent(run);
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

function progressPercent(run = {}) {
  if (!run || run.status === "IDLE") return 0;
  if (isComplete(run)) return 100;
  const denominator = Math.max(1, RAIL_PHASES.length - 1);
  return Math.max(0, Math.min(98, Math.round((activeIndex(run) / denominator) * 100)));
}

function isComplete(run = {}) {
  return run.status === "COMPLETE" || run.current_phase === "COMPLETE";
}

function isFailed(run = {}) {
  return TERMINAL_FAILURES.has(run.status) || run.runner_state === "FAILED";
}

function setBusy(value) {
  els.runButton.disabled = Boolean(value);
  els.runButton.textContent = value ? "Monitoring..." : "Start Diligence Run";
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

function startRunClock() {
  if (!runSessionStartedAt) runSessionStartedAt = Date.now();
  if (!elapsedTimer) elapsedTimer = setInterval(updateElapsedClock, 1000);
  updateElapsedClock();
}

function stopRunClock() {
  if (elapsedTimer) clearInterval(elapsedTimer);
  elapsedTimer = null;
  updateElapsedClock();
}

function resetRunClock() {
  stopRunClock();
  runSessionStartedAt = 0;
  updateElapsedClock();
}

function updateElapsedClock() {
  if (!els.runElapsedValue) return;
  if (!runSessionStartedAt) {
    els.runElapsedValue.textContent = "Elapsed: 00:00";
    return;
  }
  const seconds = Math.max(0, Math.floor((Date.now() - runSessionStartedAt) / 1000));
  els.runElapsedValue.textContent = "Elapsed: " + formatElapsed(seconds);
}

function updateRunMonitor(run = {}, artifactCount = 0) {
  const idle = !currentRunId && !run.run_id && (run.status === "IDLE" || !run.current_phase);
  const failed = isFailed(run);
  const complete = isComplete(run);
  const live = !idle && !failed && !complete;
  const publicPhase = publicPhaseFor(run.current_phase || "", run.status || "", run.runner_state || "");
  const pct = progressPercent(run);
  if (live) startRunClock();
  if (complete || failed) stopRunClock();
  setLiveBadge(complete ? "Complete" : failed ? "Needs attention" : live ? "Live" : "Idle", complete ? "complete" : failed ? "attention" : live ? "live" : "idle");
  if (els.runProgress) {
    els.runProgress.setAttribute("aria-valuenow", String(pct));
    els.runProgress.classList.toggle("is-live", live);
  }
  if (els.runProgressFill) els.runProgressFill.style.width = `${pct}%`;
  if (els.runProgressText) {
    if (complete) els.runProgressText.textContent = "Report ready. Opening the report automatically.";
    else if (failed) els.runProgressText.textContent = "Run needs attention. Review the status before continuing.";
    else if (live) els.runProgressText.textContent = `Diligence workflow running: ${publicPhase.label}. Keep this page open.`;
    else els.runProgressText.textContent = "Waiting for intake.";
  }
  if (els.lastCheckedValue) {
    els.lastCheckedValue.textContent = live || complete || failed ? `Last checked: ${formatTime(new Date())}` : "Last checked: —";
  }
  if (artifactCount && els.artifactValue) els.artifactValue.textContent = String(artifactCount);
}

function setMonitorAttention(message) {
  setLiveBadge("Needs attention", "attention");
  if (els.runProgress) els.runProgress.classList.remove("is-live");
  if (els.runProgressText) els.runProgressText.textContent = message || "Run needs attention.";
  if (els.lastCheckedValue) els.lastCheckedValue.textContent = `Last checked: ${formatTime(new Date())}`;
}

function setLiveBadge(label, state) {
  if (!els.runLiveBadge) return;
  els.runLiveBadge.className = `gate-live-badge ${state || "idle"}`;
  els.runLiveBadge.innerHTML = `<span class="gate-live-dot"></span>${escapeHtml(label)}`;
}

function formatElapsed(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  if (!hours) return `${mm}:${ss}`;
  return `${String(hours).padStart(2, "0")}:${mm}:${ss}`;
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function badgeHtml(status, runner, error = "") {
  const failed = TERMINAL_FAILURES.has(status) || runner === "FAILED";
  const label = [status, runner].filter(Boolean).join(" / ") || "Idle";
  const detail = failed && error ? ` — ${error}` : "";
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
