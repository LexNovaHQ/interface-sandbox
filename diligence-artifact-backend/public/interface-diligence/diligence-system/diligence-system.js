const PUBLIC_STAGES = [
  {
    id: "SOURCE_LEGAL",
    label: "Source + Legal",
    sub: "Phases 1–2 · discovery, cartography and legal signals",
    phases: [
      "CREATED",
      "AGENT_1A_URL_MANIFEST",
      "AGENT_1B_EXTRACT",
      "M6_BUCKET_INDEX",
      "P2_SOURCE_INVENTORY_CARTOGRAPHY",
      "P2_LOCATOR_SPINE",
      "P2_PROFILE_ROUTE_MATRIX",
      "P2_SEMANTIC_NAVIGATION_OVERLAY",
      "M9",
      "P2A_TARGET_PROFILE_SOURCE_INDEX",
      "P2B_DOMAIN_DERIVATION_SOURCE_INDEX",
      "P2C_ACTIVITY_PROFILE_SOURCE_INDEX",
      "P2D_DATA_PRIVACY_NAVIGATION_INDEX",
      "P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX",
      "P2G_PHASE_ROUTER",
      "P2_INDEX_COMPILER_VALIDATION"
    ],
    why: "Collects approved sources, builds the navigation indexes and derives the legal signal layer."
  },
  {
    id: "TARGET_FEATURE",
    label: "Target + Feature",
    sub: "Phases 3–6 · target, domain and activity profiles",
    phases: [
      "M7_TARGET_PROFILE",
      "P3_DOMAIN_DERIVATION_LAYER",
      "M7_TARGET_PROFILE_FORENSICS",
      "M8_FEATURE_CANDIDATE_INVENTORY",
      "M8_TARGET_FEATURE_PROFILE",
      "M8_TARGET_FEATURE_PROFILE_FORENSICS"
    ],
    why: "Builds and tests the target, domain and product-activity profiles."
  },
  {
    id: "DATA_PROVENANCE",
    label: "Data Provenance",
    sub: "Phases 7–9 · data, controls, obligations and forensics",
    phases: [
      "DATA_PROVENANCE_PROFILE_LAYER4",
      "DATA_PROVENANCE_PROFILE_LAYER5",
      "DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY",
      "DOMAIN_CONTROL_OBLIGATION_PROFILE",
      "DATA_PROVENANCE_PROFILE_FORENSICS"
    ],
    why: "Maps data provenance, domain-control obligations and forensic traceability."
  },
  {
    id: "EXPOSURE_REGISTRY",
    label: "Exposure Registry",
    sub: "Phase 10 · triggered and controlled exposure",
    phases: ["M11"],
    why: "Routes the active registry and evaluates triggered exposure against visible controls."
  },
  {
    id: "CHALLENGE_GATE",
    label: "Challenge Gate",
    sub: "Phase 11 · adversarial operator challenge",
    phases: ["M12"],
    why: "Challenges the exposure record and routes targeted reinvestigation without false blocking."
  },
  {
    id: "VALIDATION",
    label: "Validation",
    sub: "Phases 12–16 · compiler, Qualified Review, submission, Diligence-QA and assembly",
    phases: [
      "NORMALIZED_COMPILER",
      "NORMALIZED_REPORT_RENDERER",
      "RENDERER",
      "QUALIFIED_REVIEW",
      "QUALIFIED_REVIEW_SUBMISSION",
      "DILIGENCE_QA_COMPLETE",
      "ASSEMBLY_ENGINE",
      "COMPLETE"
    ],
    why: "Compiles the report and carries the matter through Qualified Review, Diligence-QA and Review-Ready assembly."
  }
];

const PHASE_TEXT = {
  CREATED: "The matter is open and ready for public-source collection.",
  AGENT_1A_URL_MANIFEST: "Public URL mapping is identifying the visible source footprint.",
  AGENT_1B_EXTRACT: "Source extraction is capturing approved public material.",
  M6_BUCKET_INDEX: "Source discovery is routing evidence into controlled review lanes.",
  P2_SOURCE_INVENTORY_CARTOGRAPHY: "Cartography is building the source inventory.",
  P2_LOCATOR_SPINE: "Cartography is resolving evidence locators.",
  P2_PROFILE_ROUTE_MATRIX: "The profile route matrix is assigning downstream navigation.",
  P2_SEMANTIC_NAVIGATION_OVERLAY: "Semantic navigation support is being applied to the deterministic index.",
  M9: "Legal cartography is mapping visible legal and governance materials.",
  P2A_TARGET_PROFILE_SOURCE_INDEX: "The target-profile source index is being compiled.",
  P2B_DOMAIN_DERIVATION_SOURCE_INDEX: "The domain-derivation source index is being compiled.",
  P2C_ACTIVITY_PROFILE_SOURCE_INDEX: "The activity-profile source index is being compiled.",
  P2D_DATA_PRIVACY_NAVIGATION_INDEX: "The data and privacy navigation index is being compiled.",
  P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX: "The domain-control obligation index is being compiled.",
  P2G_PHASE_ROUTER: "The central phase router is assembling the route plan.",
  P2_INDEX_COMPILER_VALIDATION: "The cartography and routing layer is being validated.",
  M7_TARGET_PROFILE: "Target profile review is building the entity profile.",
  P3_DOMAIN_DERIVATION_LAYER: "Model-led domain derivation is resolving the primary domain and overlays.",
  M7_TARGET_PROFILE_FORENSICS: "Target-profile forensics is testing source traceability.",
  M8_FEATURE_CANDIDATE_INVENTORY: "The activity candidate inventory is being assembled.",
  M8_TARGET_FEATURE_PROFILE: "Activity profile review is mapping visible product behaviour and features.",
  M8_TARGET_FEATURE_PROFILE_FORENSICS: "Activity-profile forensics is testing source traceability.",
  DATA_PROVENANCE_PROFILE_LAYER4: "Data provenance batches are resolving the data and control posture.",
  DATA_PROVENANCE_PROFILE_LAYER5: "The data provenance profile is being validated and compiled.",
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY: "Domain-control obligation candidates are being inventoried.",
  DOMAIN_CONTROL_OBLIGATION_PROFILE: "The domain-control obligation profile is being resolved.",
  DATA_PROVENANCE_PROFILE_FORENSICS: "Data provenance forensics is testing the final traceability record.",
  M11: "The active exposure registry is evaluating triggered and controlled positions.",
  M12: "The operator challenge is testing the exposure record and reinvestigation routes.",
  NORMALIZED_COMPILER: "The compiler is assembling the locked diligence handoff.",
  NORMALIZED_REPORT_RENDERER: "The report renderer is preparing the structured diligence report.",
  RENDERER: "The report renderer is preparing the structured diligence report.",
  QUALIFIED_REVIEW: "Qualified Review is resolving reviewer-controlled fields and limitations.",
  QUALIFIED_REVIEW_SUBMISSION: "The reviewed matter is being submitted into the immutable final-value ledger.",
  DILIGENCE_QA_COMPLETE: "Diligence-QA is validating the reviewed matter before assembly.",
  ASSEMBLY_ENGINE: "The Assembly Engine is preparing Review-Ready outputs.",
  COMPLETE: "The diligence workflow is complete."
};

const TERMINAL_FAILURES = new Set(["CRITICAL_FAILURE", "CONTROLLED_FAILURE"]);
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
  workflowStatus: document.getElementById("workflowStatus"),
  progressLine: document.getElementById("progressLine"),
  runLiveBadge: document.getElementById("runLiveBadge"),
  runProgress: document.getElementById("runProgress"),
  runProgressFill: document.getElementById("runProgressFill"),
  runProgressText: document.getElementById("runProgressText"),
  runElapsedValue: document.getElementById("runElapsedValue"),
  lastCheckedValue: document.getElementById("lastCheckedValue")
};

renderWorkflowStatus({ current_phase: "CREATED", status: "IDLE", runner_state: "IDLE" });
updateRunMonitor({ current_phase: "", status: "IDLE", runner_state: "IDLE" }, 0);
els.form?.addEventListener("submit", startRun);
attachRunFromUrl();
window.publicDiligencePhaseFor = publicPhaseFor;
window.updateDiligenceGateRunMonitor = updateRunMonitor;
window.setDiligenceGateMonitorAttention = setMonitorAttention;

async function startRun(event) {
  event.preventDefault();
  const targetUrl = els.targetUrl?.value.trim() || "";
  const target = els.targetLabel?.value.trim() || "";
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

    setMessage("Workflow queued. Watching the live diligence status...");
    await pollOnce();
    pollTimer = setInterval(pollOnce, POLL_MS);
  } catch (error) {
    setMessage(error.message || String(error), true);
    setMonitorAttention(error.message || String(error));
    renderWorkflowStatus({ current_phase: "CREATED", status: "CONTROLLED_FAILURE", runner_state: "FAILED" });
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
    if (currentRunId && !pollTimer) pollTimer = setInterval(pollOnce, POLL_MS);
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
    const publicStage = publicPhaseFor(run.current_phase || "", run.status || "", run.runner_state || "");
    setMessage(`Watching run ${currentRunId}. Current diligence stage: ${publicStage.label}.`);
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
  const publicStage = publicPhaseFor(phase, status, runner);

  if (run.run_id && !currentRunId) currentRunId = run.run_id;
  if (run.root_url && els.targetUrl && !els.targetUrl.value.trim()) els.targetUrl.value = run.root_url;
  if (run.target && els.targetLabel && !els.targetLabel.value.trim()) els.targetLabel.value = run.target;

  if (els.runIdValue) els.runIdValue.textContent = run.run_id || currentRunId || "-";
  if (els.statusValue) els.statusValue.textContent = [status, runner].filter(Boolean).join(" / ") || "-";
  if (els.phaseValue) els.phaseValue.textContent = publicStage.label;
  if (els.artifactValue) els.artifactValue.textContent = String(artifactCount || 0);
  if (els.activePhaseTitle) els.activePhaseTitle.textContent = publicStage.label;
  if (els.activePhaseText) els.activePhaseText.textContent = publicStage.description;
  if (els.terminalNotice) els.terminalNotice.innerHTML = badgeHtml(status, runner, run.runner_last_error || "");
  updateRunMonitor(run, artifactCount);
  renderWorkflowStatus(run);
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
  try { decoded = decodeURIComponent(raw); } catch { decoded = raw; }
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

function stageInfoFor(phase, status, runner) {
  const index = activeIndex({ current_phase: phase, status, runner_state: runner });
  return PUBLIC_STAGES[index] || PUBLIC_STAGES[0];
}

function publicPhaseFor(phase, status, runner) {
  if (status === "IDLE" && !phase) {
    return { label: "Intake", description: "Waiting for a public target URL or existing matter/run ID.", progressLabel: "Waiting for intake." };
  }
  const info = stageInfoFor(phase, status, runner);
  if (isComplete({ current_phase: phase, status, runner_state: runner })) {
    return { label: "Review-Ready Output", description: "The diligence workflow is complete. Opening the structured report.", progressLabel: "Review-ready output complete." };
  }
  if (isFailed({ current_phase: phase, status, runner_state: runner })) {
    return { label: info.label, description: `${info.label} needs attention. Review the critical failure before continuing.`, progressLabel: "Run needs attention." };
  }
  return {
    label: info.label,
    description: PHASE_TEXT[phase] || info.why || "The diligence workflow is progressing.",
    progressLabel: `${info.label} in progress.`
  };
}

function renderWorkflowStatus(run = {}) {
  if (!els.workflowStatus) return;
  const active = activeIndex(run);
  const failed = isFailed(run);
  const limited = String(run.status || "").includes("LIMITATION") || String(run.status || "").includes("WARNING");
  const idle = run.status === "IDLE" || (!run.current_phase && !run.run_id);

  els.workflowStatus.innerHTML = PUBLIC_STAGES.map((stage, index) => {
    let state = "pending";
    let stateLabel = "Pending";
    if (index < active) {
      state = "complete";
      stateLabel = "Done";
    }
    if (index === active) {
      if (idle) {
        state = "pending";
        stateLabel = index === 0 ? "Ready" : "Pending";
      } else if (failed) {
        state = "failed";
        stateLabel = "Critical";
      } else if (limited) {
        state = "limited";
        stateLabel = "Limited";
      } else {
        state = "active";
        stateLabel = "Current";
      }
    }
    if (isComplete(run) && index <= active) {
      state = "complete";
      stateLabel = "Done";
    }

    return `<div class="workflow-stage ${state}" data-stage="${escapeHtml(stage.id)}">
      <span class="workflow-stage-index">${String(index + 1).padStart(2, "0")}</span>
      <div><div class="workflow-stage-title">${escapeHtml(stage.label)}</div><div class="workflow-stage-sub">${escapeHtml(stage.sub)}</div></div>
      <span class="workflow-stage-state">${escapeHtml(stateLabel)}</span>
    </div>`;
  }).join("");

  if (els.progressLine) els.progressLine.style.width = `${progressPercent(run)}%`;
}

function activeIndex(run = {}) {
  if (isComplete(run)) return PUBLIC_STAGES.length - 1;
  const current = run.current_phase || (run.status === "CREATED" ? "CREATED" : "");
  const found = PUBLIC_STAGES.findIndex((stage) => stage.phases.includes(current));
  return found >= 0 ? found : 0;
}

function progressPercent(run = {}) {
  if (!run || run.status === "IDLE") return 0;
  if (isComplete(run)) return 100;
  const denominator = Math.max(1, PUBLIC_STAGES.length);
  return Math.max(2, Math.min(98, Math.round(((activeIndex(run) + 1) / denominator) * 100)));
}

function isComplete(run = {}) {
  return run.status === "COMPLETE" || run.current_phase === "COMPLETE";
}

function isFailed(run = {}) {
  return TERMINAL_FAILURES.has(run.status) || run.runner_state === "FAILED";
}

function setBusy(value) {
  if (!els.runButton) return;
  els.runButton.disabled = Boolean(value);
  els.runButton.textContent = value ? "Monitoring..." : "Start Diligence Run";
}

function setMessage(message, error = false) {
  if (!els.statusMessage) return;
  els.statusMessage.textContent = message;
  els.statusMessage.style.color = error ? "var(--danger)" : "rgba(229,229,229,.62)";
}

function resetReportLink() {
  if (!els.openReportButton) return;
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
  const publicStage = publicPhaseFor(run.current_phase || "", run.status || "", run.runner_state || "");
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
    if (complete) els.runProgressText.textContent = "Review-ready output complete. Opening the report automatically.";
    else if (failed) els.runProgressText.textContent = "Run needs attention. Review the critical failure before continuing.";
    else if (live) els.runProgressText.textContent = `Diligence workflow running: ${publicStage.label}. Keep this page open.`;
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
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
