const CENTRAL_PHASES = [
  {
    sequence: 1,
    id: "SOURCE_DISCOVERY",
    label: "Source Discovery",
    sub: "URL manifest, source extraction and root routing",
    jobs: ["CREATED", "AGENT_1A_URL_MANIFEST", "AGENT_1B_EXTRACT", "M6_BUCKET_INDEX"]
  },
  {
    sequence: 2,
    id: "CARTOGRAPHY_INDEX",
    label: "Cartography and Index",
    sub: "Source inventory, navigation indexes, legal cartography and route validation",
    jobs: [
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
    ]
  },
  {
    sequence: 3,
    id: "TARGET_PROFILE_REVIEW",
    label: "Target Profile Review",
    sub: "Target profile and model-led sector/domain derivation",
    jobs: ["M7_TARGET_PROFILE", "P3_DOMAIN_DERIVATION_LAYER"]
  },
  {
    sequence: 4,
    id: "TARGET_PROFILE_FORENSICS",
    label: "Target Profile Forensics",
    sub: "Source traceability and target-profile integrity review",
    jobs: ["M7_TARGET_PROFILE_FORENSICS"]
  },
  {
    sequence: 5,
    id: "ACTIVITY_PROFILE_REVIEW",
    label: "Activity Profile Review",
    sub: "Activity candidate inventory and product-feature profile",
    jobs: ["M8_FEATURE_CANDIDATE_INVENTORY", "M8_TARGET_FEATURE_PROFILE"]
  },
  {
    sequence: 6,
    id: "ACTIVITY_PROFILE_FORENSICS",
    label: "Activity Profile Forensics",
    sub: "Activity-profile source traceability and integrity review",
    jobs: ["M8_TARGET_FEATURE_PROFILE_FORENSICS"]
  },
  {
    sequence: 7,
    id: "DATA_PROVENANCE_PROFILE",
    label: "Data Provenance Profile",
    sub: "Data, asset, role, flow, retention, security and control posture",
    jobs: ["DATA_PROVENANCE_PROFILE_LAYER4", "DATA_PROVENANCE_PROFILE_LAYER5"]
  },
  {
    sequence: 8,
    id: "DOMAIN_CONTROL_OBLIGATION_PROFILE",
    label: "Domain Control Obligation Profile",
    sub: "Sector-specific control and obligation candidate resolution",
    jobs: ["DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY", "DOMAIN_CONTROL_OBLIGATION_PROFILE"]
  },
  {
    sequence: 9,
    id: "DATA_PROVENANCE_FORENSICS",
    label: "Data Provenance Forensics",
    sub: "Final provenance and control traceability review",
    jobs: ["DATA_PROVENANCE_PROFILE_FORENSICS"]
  },
  {
    sequence: 10,
    id: "EXPOSURE_PROFILE",
    label: "Exposure Profile",
    sub: "Mounted registry routing, triggered exposure and visible controls",
    jobs: ["M11"]
  },
  {
    sequence: 11,
    id: "OPERATOR_CHALLENGE",
    label: "Operator Challenge",
    sub: "Adversarial challenge and targeted reinvestigation",
    jobs: ["M12"]
  },
  {
    sequence: 12,
    id: "COMPILER",
    label: "Compiler",
    sub: "Normalized handoff and structured report rendering",
    jobs: ["NORMALIZED_COMPILER", "NORMALIZED_REPORT_RENDERER", "RENDERER"]
  },
  {
    sequence: 13,
    id: "QUALIFIED_REVIEW",
    label: "Qualified Review",
    sub: "Reviewer-controlled values, limitations and section attestations",
    jobs: ["QUALIFIED_REVIEW"]
  },
  {
    sequence: 14,
    id: "QUALIFIED_REVIEW_SUBMISSION",
    label: "Qualified Review Submission",
    sub: "Immutable reviewed-value ledger and activation manifest",
    jobs: ["QUALIFIED_REVIEW_SUBMISSION"]
  },
  {
    sequence: 15,
    id: "DILIGENCE_QA_COMPLETE",
    label: "Diligence-QA Complete",
    sub: "Final reviewed-matter validation before assembly",
    jobs: ["DILIGENCE_QA_COMPLETE"]
  },
  {
    sequence: 16,
    id: "ASSEMBLY_ENGINE",
    label: "Assembly Engine",
    sub: "Review-Ready document and output assembly",
    jobs: ["ASSEMBLY_ENGINE", "COMPLETE"]
  }
];

const JOB_TEXT = {
  CREATED: "The matter record is open and the Source Discovery phase is ready to begin.",
  AGENT_1A_URL_MANIFEST: "Public URL mapping is identifying the visible source footprint.",
  AGENT_1B_EXTRACT: "Source extraction is capturing approved public material.",
  M6_BUCKET_INDEX: "Source discovery is routing captured evidence into the 17-root structure.",
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
  M7_TARGET_PROFILE: "Target Profile Review is building the entity and product target record.",
  P3_DOMAIN_DERIVATION_LAYER: "Phase 3 is deriving the primary sector/domain package and AI overlay automatically.",
  M7_TARGET_PROFILE_FORENSICS: "Target-profile forensics is testing source traceability.",
  M8_FEATURE_CANDIDATE_INVENTORY: "The activity candidate inventory is being assembled.",
  M8_TARGET_FEATURE_PROFILE: "Activity Profile Review is mapping visible product behaviour and features.",
  M8_TARGET_FEATURE_PROFILE_FORENSICS: "Activity-profile forensics is testing source traceability.",
  DATA_PROVENANCE_PROFILE_LAYER4: "Data provenance batches are resolving the data and control posture.",
  DATA_PROVENANCE_PROFILE_LAYER5: "The data provenance profile is being validated and compiled.",
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY: "Domain-control obligation candidates are being inventoried.",
  DOMAIN_CONTROL_OBLIGATION_PROFILE: "The domain-control obligation profile is being resolved.",
  DATA_PROVENANCE_PROFILE_FORENSICS: "Data provenance forensics is testing the final traceability record.",
  M11: "The automatically mounted exposure registry is evaluating triggered and controlled positions.",
  M12: "Operator Challenge is testing the exposure record and reinvestigation routes.",
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
  lastCheckedValue: document.getElementById("lastCheckedValue"),
  derivedDomainPanel: document.getElementById("derivedDomainPanel"),
  domainDerivationState: document.getElementById("domainDerivationState"),
  derivedSectorValue: document.getElementById("derivedSectorValue"),
  primaryPackageValue: document.getElementById("primaryPackageValue"),
  aiOverlayValue: document.getElementById("aiOverlayValue"),
  mountedRegistryValue: document.getElementById("mountedRegistryValue")
};

renderWorkflowStatus({ status: "IDLE", runner_state: "IDLE" });
renderDomainSelection({});
updateRunMonitor({ status: "IDLE", runner_state: "IDLE" }, 0);
els.form?.addEventListener("submit", startRun);
attachRunFromUrl();

window.publicDiligencePhaseFor = publicPhaseFor;
window.updateDiligenceGateRunMonitor = updateRunMonitor;
window.updateDiligenceDerivedDomain = renderDomainSelection;
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
  renderDomainSelection({});

  try {
    const created = await api("/public/diligence-system/jobs", {
      method: "POST",
      body: JSON.stringify({ target_url: targetUrl, target: target || undefined })
    });
    currentRunId = created.run_id;
    updateBrowserRunId(currentRunId);
    updateState({ run: created, artifacts: [], domain_selection: created.domain_selection || {} });
    setMessage("Run created. Starting Source Discovery...");

    await api(`/public/diligence-system/jobs/${encodeURIComponent(currentRunId)}/advance`, {
      method: "POST",
      body: JSON.stringify({ auto_continue: true })
    });

    setMessage("Workflow queued. Watching the exact execution phase...");
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
      if (els.openReportButton) {
        els.openReportButton.href = href;
        els.openReportButton.classList.remove("hidden");
      }
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
    const phase = publicPhaseForRun(run);
    setMessage(`Watching run ${currentRunId}. Current phase: ${phase.label}.`);
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
  const phase = publicPhaseForRun(run);
  const status = run.status || "RUNNING";
  const runner = run.runner_state || "";

  if (run.run_id && !currentRunId) currentRunId = run.run_id;
  if (run.root_url && els.targetUrl && !els.targetUrl.value.trim()) els.targetUrl.value = run.root_url;
  if (run.target && els.targetLabel && !els.targetLabel.value.trim()) els.targetLabel.value = run.target;

  if (els.runIdValue) els.runIdValue.textContent = run.run_id || currentRunId || "-";
  if (els.statusValue) els.statusValue.textContent = [status, runner].filter(Boolean).join(" / ") || "-";
  if (els.phaseValue) els.phaseValue.textContent = phase.label;
  if (els.artifactValue) els.artifactValue.textContent = String(artifactCount || 0);
  if (els.activePhaseTitle) els.activePhaseTitle.textContent = phase.label;
  if (els.activePhaseText) els.activePhaseText.textContent = phase.description;
  if (els.terminalNotice) els.terminalNotice.innerHTML = badgeHtml(status, runner, run.runner_last_error || "");

  renderDomainSelection(payload.domain_selection || {});
  updateRunMonitor(run, artifactCount);
  renderWorkflowStatus(run);
}

function publicPhaseFor(phase, status, runner, centralPhase = "", centralPhaseLabel = "") {
  return publicPhaseForRun({
    current_phase: phase,
    status,
    runner_state: runner,
    central_phase: centralPhase,
    central_phase_label: centralPhaseLabel
  });
}

function publicPhaseForRun(run = {}) {
  const idle = run.status === "IDLE" && !run.current_phase && !run.run_id;
  if (idle) {
    return {
      label: "Intake",
      description: "Waiting for a public target URL or existing matter/run ID.",
      progressLabel: "Waiting for intake.",
      sequence: 0
    };
  }

  if (isComplete(run)) {
    return {
      label: "Review-Ready Output",
      description: "The sixteen-phase diligence workflow is complete. Opening the structured report.",
      progressLabel: "Review-ready output complete.",
      sequence: 16
    };
  }

  const info = phaseInfoForRun(run);
  const rawJob = String(run.current_phase || "");
  const label = info
    ? `Phase ${info.sequence} — ${info.label}`
    : (run.central_phase_label || humanLabel(run.central_phase || rawJob || "Workflow Check"));
  const jobDescription = JOB_TEXT[rawJob] || info?.sub || "The diligence workflow is progressing.";

  if (isFailed(run)) {
    return {
      label,
      description: `${label} needs attention. Current job: ${rawJob || "unknown"}. Review the critical failure before continuing.`,
      progressLabel: "Run needs attention.",
      sequence: info?.sequence || 0
    };
  }

  return {
    label,
    description: rawJob ? `${jobDescription} Current job: ${rawJob}.` : jobDescription,
    progressLabel: `${label} in progress.`,
    sequence: info?.sequence || 0
  };
}

function renderWorkflowStatus(run = {}) {
  if (!els.workflowStatus) return;
  const active = phaseIndexForRun(run);
  const failed = isFailed(run);
  const limited = hasStatusToken(run, "LIMITATION") || hasStatusToken(run, "WARNING");
  const reinvestigating = hasStatusToken(run, "REINVESTIGATION");
  const idle = run.status === "IDLE" || (!run.current_phase && !run.run_id);
  const currentJob = String(run.current_phase || "");

  els.workflowStatus.innerHTML = CENTRAL_PHASES.map((phase, index) => {
    let state = "pending";
    let stateLabel = "Not started";

    if (!idle && index < active) {
      state = "complete";
      stateLabel = "Done";
    }

    if (!idle && index === active) {
      if (failed) {
        state = "failed";
        stateLabel = "Critical";
      } else if (reinvestigating) {
        state = "reinvestigating";
        stateLabel = "Reinvestigating";
      } else if (limited) {
        state = "limited";
        stateLabel = "Limited";
      } else {
        state = "active";
        stateLabel = "Current";
      }
    }

    if (isComplete(run)) {
      state = "complete";
      stateLabel = "Done";
    }

    const currentJobLine = !idle && index === active && currentJob
      ? `<div class="workflow-stage-job">Current job · ${escapeHtml(currentJob)}</div>`
      : "";

    return `<div class="workflow-stage ${state}" data-phase="${escapeHtml(phase.id)}">
      <span class="workflow-stage-index">${String(phase.sequence).padStart(2, "0")}</span>
      <div>
        <div class="workflow-stage-title">${escapeHtml(phase.label)}</div>
        <div class="workflow-stage-sub">${escapeHtml(phase.sub)}</div>
        ${currentJobLine}
      </div>
      <span class="workflow-stage-state">${escapeHtml(stateLabel)}</span>
    </div>`;
  }).join("");

  if (els.progressLine) els.progressLine.style.width = `${progressPercent(run)}%`;
}

function phaseInfoForRun(run = {}) {
  const index = phaseIndexForRun(run);
  return index >= 0 ? CENTRAL_PHASES[index] : null;
}

function phaseIndexForRun(run = {}) {
  if (isComplete(run)) return CENTRAL_PHASES.length - 1;

  const centralPhase = String(run.central_phase || "");
  if (centralPhase) {
    const byCentral = CENTRAL_PHASES.findIndex((phase) => phase.id === centralPhase);
    if (byCentral >= 0) return byCentral;
  }

  const current = String(run.current_phase || "");
  if (current) {
    const byJob = CENTRAL_PHASES.findIndex((phase) => phase.jobs.includes(current));
    if (byJob >= 0) return byJob;
  }

  return run.run_id || run.status === "CREATED" ? 0 : -1;
}

function progressPercent(run = {}) {
  if (!run || run.status === "IDLE" || (!run.run_id && !run.current_phase)) return 0;
  if (isComplete(run)) return 100;
  const index = phaseIndexForRun(run);
  if (index < 0) return 0;
  return Math.max(2, Math.min(98, Math.round(((index + 1) / CENTRAL_PHASES.length) * 100)));
}

function renderDomainSelection(selection = {}) {
  if (!els.derivedDomainPanel) return;

  const resolved = selection?.resolved === true;
  const pendingLabel = "Pending Phase 3";
  const primaryPackage = String(selection?.primary_domain_package || "");
  const derivedSector = String(selection?.derived_sector || primaryPackage || "");
  const mountedPackages = Array.isArray(selection?.mounted_registry_packages)
    ? selection.mounted_registry_packages.filter(Boolean)
    : [];

  els.derivedDomainPanel.classList.toggle("resolved", resolved);
  els.derivedDomainPanel.classList.toggle("pending", !resolved);

  if (els.domainDerivationState) {
    els.domainDerivationState.textContent = resolved
      ? humanLabel(selection.primary_domain_status || selection.status || "Derived")
      : pendingLabel;
  }
  if (els.derivedSectorValue) {
    els.derivedSectorValue.textContent = resolved ? humanLabel(derivedSector || "Unresolved") : pendingLabel;
  }
  if (els.primaryPackageValue) {
    els.primaryPackageValue.textContent = resolved ? humanLabel(primaryPackage || "Universal report only") : pendingLabel;
  }
  if (els.aiOverlayValue) {
    els.aiOverlayValue.textContent = resolved ? aiMountLabel(selection.ai_overlay_status) : pendingLabel;
  }
  if (els.mountedRegistryValue) {
    els.mountedRegistryValue.textContent = resolved
      ? (mountedPackages.length ? mountedPackages.map(humanLabel).join(", ") : "No registry package mounted")
      : pendingLabel;
  }
}

function aiMountLabel(value) {
  const normalized = String(value || "");
  const labels = {
    AI_PRIMARY: "AI primary domain",
    AI_OVERLAY_MOUNTED: "AI overlay mounted",
    AI_CANDIDATE_ONLY: "AI candidate only",
    AI_NOT_VISIBLE: "AI not visible",
    PROVISIONAL: "Pending Phase 3"
  };
  return labels[normalized] || humanLabel(normalized || "Not evaluated");
}

function humanLabel(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .replace(/\bAi\b/g, "AI")
    .replace(/\bQa\b/g, "QA");
}

function hasStatusToken(run, token) {
  return [run.status, run.runner_state].some((value) => String(value || "").toUpperCase().includes(token));
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
  const phase = publicPhaseForRun(run);
  const pct = progressPercent(run);

  if (live) startRunClock();
  if (complete || failed) stopRunClock();

  setLiveBadge(
    complete ? "Complete" : failed ? "Needs attention" : live ? "Live" : "Idle",
    complete ? "complete" : failed ? "attention" : live ? "live" : "idle"
  );

  if (els.runProgress) {
    els.runProgress.setAttribute("aria-valuenow", String(pct));
    els.runProgress.classList.toggle("is-live", live);
  }
  if (els.runProgressFill) els.runProgressFill.style.width = `${pct}%`;
  if (els.runProgressText) {
    if (complete) els.runProgressText.textContent = "Review-ready output complete. Opening the report automatically.";
    else if (failed) els.runProgressText.textContent = "Run needs attention. Review the critical failure before continuing.";
    else if (live) els.runProgressText.textContent = `Diligence workflow running: ${phase.label}. Keep this page open.`;
    else els.runProgressText.textContent = "Waiting for intake.";
  }
  if (els.lastCheckedValue) {
    els.lastCheckedValue.textContent = live || complete || failed
      ? `Last checked: ${formatTime(new Date())}`
      : "Last checked: —";
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
