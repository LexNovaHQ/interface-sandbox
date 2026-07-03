(() => {
  const LANES = {
    "ai-product-data": { label: "AI Product & Data Legal Exposure", short: "AI Product & Data", active: true, state: "Active demo registry" },
    "saas-privacy-security": { label: "SaaS Privacy & Security", short: "SaaS Privacy & Security", active: false, state: "Not activated in demo" },
    "fintech-platforms": { label: "FinTech Platforms", short: "FinTech Platforms", active: false, state: "Not activated in demo" },
    "healthtech-digital-care": { label: "Health" + "Tech & Digital Care", short: "Health" + "Tech", active: false, state: "Not activated in demo" },
    "employment-hr-tech": { label: "Employment / HR Tech", short: "HR Tech", active: false, state: "Not activated in demo" },
    "adtech-martech-consumer-data": { label: "AdTech, MarTech & Consumer Data", short: "AdTech / MarTech", active: false, state: "Not activated in demo" },
    "digital-platforms-marketplaces": { label: "Digital Platforms & Marketplaces", short: "Digital Platforms", active: false, state: "Not activated in demo" },
    "banking-finance-technology": { label: "Banking / Finance Technology", short: "Finance Tech", active: false, state: "Not activated in demo" }
  };

  injectRegistrySelector();

  function injectRegistrySelector() {
    const form = document.getElementById("runForm");
    if (!form || document.getElementById("registryLane")) return;

    const block = document.createElement("div");
    block.className = "registry-selector-block";
    block.innerHTML = `<label class="label" for="registryLane">Active Vertical Registry</label><div class="registry-select-wrap"><select class="input registry-select" id="registryLane" name="registryLane" autocomplete="off"><option value="ai-product-data" selected>AI Product & Data Legal Exposure — active demo</option><option value="saas-privacy-security">SaaS Privacy & Security — not activated in demo</option><option value="fintech-platforms">FinTech Platforms — not activated in demo</option><option value="healthtech-digital-care">HealthTech & Digital Care — not activated in demo</option><option value="employment-hr-tech">Employment / HR Tech — not activated in demo</option><option value="adtech-martech-consumer-data">AdTech, MarTech & Consumer Data — not activated in demo</option><option value="digital-platforms-marketplaces">Digital Platforms & Marketplaces — not activated in demo</option><option value="banking-finance-technology">Banking / Finance Technology — not activated in demo</option></select></div><div class="registry-lane-state active" id="registryLaneState">Active demo registry</div><p class="registry-lane-description" id="registryLaneDescription">This demo uses the AI Product & Data exposure registry. Other TMT registry lanes use the same diligence architecture but are not activated in this demo environment.</p>`;
    form.prepend(block);

    const live = document.getElementById("runLiveBadge");
    if (live && !document.getElementById("activeRegistryBadge")) {
      const badge = document.createElement("span");
      badge.id = "activeRegistryBadge";
      badge.className = "registry-live-badge active";
      live.insertAdjacentElement("afterend", badge);
    }

    const sideStack = document.querySelector(".gate-side-stack");
    if (sideStack && !document.querySelector(".gate-registry-card")) {
      const card = document.createElement("article");
      card.className = "card gate-card gate-registry-card";
      card.innerHTML = `<div class="eyebrow">Registry Architecture</div><h2>Vertical registry engine</h2><p class="small-muted">The report architecture stays stable. The active registry swaps in the exposure taxonomy, public triggers, visible-control rules, and remediation routes for the selected domain.</p><div class="registry-mini-list"><span>Target profile</span><span>Activity profile</span><span>Data / asset provenance</span><span>Legal document stack</span><span>Exposure registry</span><span>Review-ready route</span></div>`;
      sideStack.querySelector(".gate-resume-card")?.insertAdjacentElement("afterend", card);
    }

    form.addEventListener("submit", guardInactiveRegistry, true);
    document.getElementById("registryLane")?.addEventListener("change", syncRegistryLane);
    window.getActiveRegistryLane = getActiveRegistryLane;
    syncRegistryLane();
  }

  function getActiveRegistryLane() {
    const value = document.getElementById("registryLane")?.value || "ai-product-data";
    return { id: value, ...(LANES[value] || LANES["ai-product-data"]) };
  }

  function syncRegistryLane() {
    const lane = getActiveRegistryLane();
    const state = document.getElementById("registryLaneState");
    const description = document.getElementById("registryLaneDescription");
    const badge = document.getElementById("activeRegistryBadge");
    const runButton = document.getElementById("runButton");
    if (state) {
      state.textContent = lane.state;
      state.className = `registry-lane-state ${lane.active ? "active" : "inactive"}`;
    }
    if (description) {
      description.textContent = lane.active
        ? "This demo uses the AI Product & Data exposure registry. Other TMT registry lanes use the same diligence architecture but are not activated in this demo environment."
        : `${lane.label} uses the same vertical diligence architecture, but this registry lane is not activated in the current demo environment.`;
    }
    if (badge) {
      badge.textContent = `Registry: ${lane.short} — ${lane.active ? "Active" : "Not activated"}`;
      badge.className = `registry-live-badge ${lane.active ? "active" : "inactive"}`;
    }
    if (runButton && !document.getElementById("runIdValue")?.textContent?.startsWith("LN-")) {
      runButton.disabled = !lane.active;
      runButton.textContent = lane.active ? "Start Diligence Run" : "Registry Not Activated in Demo";
    }
  }

  function guardInactiveRegistry(event) {
    const lane = getActiveRegistryLane();
    if (lane.active) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const status = document.getElementById("statusMessage");
    if (status) {
      status.textContent = `${lane.label} is not activated in this demo. Select AI Product & Data to run the live registry.`;
      status.style.color = "var(--danger)";
    }
    syncRegistryLane();
  }
})();

(() => {
  const POLL_MS = 10000;
  const RUN_ID_PATTERN = /^LN-\d{8}-\d{6}-[A-Z0-9-]+-\d{6}$/i;
  const FALLBACK_PHASE_LABELS = {
    CREATED: "Intake Opened",
    AGENT_1A_URL_MANIFEST: "Public URL Mapping",
    AGENT_1B_EXTRACT: "Source Extraction",
    M6_BUCKET_INDEX: "Source Routing",
    M9: "Legal Document Stack Review",
    M7_TARGET_PROFILE: "Target Profile Review",
    M7_TARGET_PROFILE_FORENSICS: "Target Profile Forensics",
    M8_TARGET_FEATURE_PROFILE: "Product Activity Profile",
    M8_TARGET_FEATURE_PROFILE_FORENSICS: "Product Activity Forensics",
    M10: "Data Provenance Review",
    M10_FORENSICS: "Data Provenance Forensics",
    M11: "Exposure Review",
    M12: "Quality Challenge",
    NORMALIZED_COMPILER: "Report Compilation",
    RENDERER: "Report Rendering",
    COMPLETE: "Report Ready"
  };
  let runId = "";
  let timer = null;

  const el = (id) => document.getElementById(id);
  const nodes = {
    input: el("attachRunId"),
    attach: el("attachRunButton"),
    resume: el("resumeRunButton"),
    status: el("statusMessage"),
    runId: el("runIdValue"),
    statusValue: el("statusValue"),
    phase: el("phaseValue"),
    artifacts: el("artifactValue"),
    report: el("openReportButton"),
    qualified: el("qualifiedReviewPageButton"),
    statusApi: el("statusApiLink"),
    reportPage: el("reportPageLink"),
    reportApi: el("reportApiLink"),
    qualifiedPage: el("qualifiedReviewPageLink"),
    qualifiedApi: el("qualifiedReviewApiLink")
  };

  nodes.attach?.addEventListener("click", () => attach(sanitize(nodes.input?.value || ""), true));
  nodes.resume?.addEventListener("click", resume);

  const initial = runIdFromLocation();
  if (initial) attach(initial, false);

  async function attach(id, writeUrl) {
    if (!id) return message("Enter a valid LN matter/run ID.", true);
    stop();
    runId = id;
    if (nodes.input) nodes.input.value = id;
    if (writeUrl) setUrl(id);
    setLinks(id, false);
    message(`Attached to ${id}. Loading matter status...`);
    await poll();
    if (runId && !timer) timer = setInterval(poll, POLL_MS);
  }

  async function resume() {
    if (!runId) return message("Attach a matter/run ID first.", true);
    message(`Requesting workflow continuation for ${runId}...`);
    await request(`/public/diligence-system/jobs/${encodeURIComponent(runId)}/advance`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ auto_continue: true })
    });
    message("Continuation requested. Watching matter status...");
    await poll();
    if (!timer) timer = setInterval(poll, POLL_MS);
  }

  async function poll() {
    if (!runId) return;
    try {
      const payload = await request(`/public/diligence-system/jobs/${encodeURIComponent(runId)}`);
      const run = payload.run || payload;
      render(run, payload.artifacts || []);
      if (isComplete(run)) {
        stop();
        setLinks(runId, true);
        message("Diligence report ready. Open the report first; Qualified Review is available from the completed report.");
        setTimeout(() => { window.location.href = `report.html?run_id=${encodeURIComponent(runId)}`; }, 1200);
      } else if (isStopped(run)) {
        stop();
        setLinks(runId, false);
        message(`Matter stopped: ${run.status || run.runner_state || "FAILED"}. ${run.runner_last_error || ""}`, true);
      } else {
        setLinks(runId, false);
        message(`Watching ${runId}. Current diligence phase: ${publicPhaseLabel(run)}.`);
      }
    } catch (error) {
      stop();
      window.setDiligenceGateMonitorAttention?.(error.message || String(error));
      message(error.message || String(error), true);
    }
  }

  async function request(path, init = {}) {
    const response = await fetch(path, init);
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`${response.status}: ${json.message || json.error || "Request failed"}`);
    return json;
  }

  function render(run, artifacts) {
    const count = Array.isArray(artifacts) ? artifacts.length : Number(run.artifact_count || 0);
    if (nodes.runId) nodes.runId.textContent = run.run_id || runId || "-";
    if (nodes.statusValue) nodes.statusValue.textContent = [run.status, run.runner_state].filter(Boolean).join(" / ") || "-";
    if (nodes.phase) nodes.phase.textContent = publicPhaseLabel(run);
    if (nodes.artifacts) nodes.artifacts.textContent = String(count || 0);
    window.updateDiligenceGateRunMonitor?.(run, count);
  }

  function publicPhaseLabel(run = {}) {
    const phase = run.current_phase || "";
    const normalized = window.publicDiligencePhaseFor?.(phase, run.status || "", run.runner_state || "");
    return normalized?.label || FALLBACK_PHASE_LABELS[phase] || "Workflow Check";
  }

  function setLinks(id, complete) {
    const encoded = encodeURIComponent(id);
    const alwaysPairs = [[nodes.statusApi, `/public/diligence-system/jobs/${encoded}`]];
    const postReportPairs = [
      [nodes.reportPage, `report.html?run_id=${encoded}`],
      [nodes.reportApi, `/public/diligence-system/report/${encoded}`],
      [nodes.report, `report.html?run_id=${encoded}`],
      [nodes.qualifiedPage, `qualified-review.html?run_id=${encoded}`],
      [nodes.qualifiedApi, `/public/diligence-system/qualified-review/${encoded}`],
      [nodes.qualified, `qualified-review.html?run_id=${encoded}`]
    ];

    alwaysPairs.forEach(([node, href]) => {
      if (!node) return;
      node.href = href;
      node.classList.remove("hidden");
    });

    postReportPairs.forEach(([node, href]) => {
      if (!node) return;
      node.href = href;
      node.classList.toggle("hidden", !complete);
    });

    nodes.resume?.classList.toggle("hidden", complete);
  }

  function runIdFromLocation() {
    const params = new URLSearchParams(window.location.search || "");
    return sanitize(params.get("run_id") || params.get("runId") || String(window.location.hash || "").replace(/^#\/?/, ""));
  }

  function sanitize(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    let decoded = raw;
    try { decoded = decodeURIComponent(raw); } catch { decoded = raw; }
    const normalized = decoded.trim().toUpperCase();
    return RUN_ID_PATTERN.test(normalized) ? normalized : "";
  }

  function setUrl(id) {
    if (!window.history?.replaceState) return;
    const url = new URL(window.location.href);
    url.searchParams.set("run_id", id);
    window.history.replaceState({}, "", url.toString());
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function isComplete(run) {
    return run.status === "COMPLETE" || run.current_phase === "COMPLETE";
  }

  function isStopped(run) {
    return run.runner_state === "FAILED" || run.status === "REPAIR_REQUIRED" || run.status === "CONTROLLED_FAILURE";
  }

  function message(text, error = false) {
    if (!nodes.status) return;
    nodes.status.textContent = text;
    nodes.status.style.color = error ? "var(--danger)" : "rgba(229,229,229,.62)";
  }
})();
