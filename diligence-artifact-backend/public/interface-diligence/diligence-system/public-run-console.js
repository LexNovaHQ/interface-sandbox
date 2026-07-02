(() => {
  const POLL_MS = 10000;
  const RUN_ID_PATTERN = /^LN-\d{8}-\d{6}-[A-Z0-9-]+-\d{6}$/i;
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
        message(`Watching ${runId}. Current diligence phase: ${run.current_phase || "unknown"}.`);
      }
    } catch (error) {
      stop();
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
    if (nodes.phase) nodes.phase.textContent = run.current_phase || "-";
    if (nodes.artifacts) nodes.artifacts.textContent = String(count || 0);
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
