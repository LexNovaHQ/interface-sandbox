/* DILIGENCE_LIVE_CONSOLE_V1_START */
(function diligenceLiveConsoleV1() {
  const ACTIVE_RUN_KEY = "interface_diligence_active_run_id";
  const LAST_RESULT_KEY = "interface_diligence_last_result";
  const POLL_MS = 1500;

  const state = {
    runId: null,
    timer: null,
    lastJobState: null,
    lastScratchpad: null,
    lastForensics: null,
    lastArtifacts: null,
    lastError: null
  };

  const els = {};

  function init() {
    bindEls();
    installEvents();
    restoreRunId();
    renderAll();

    if (state.runId) {
      startPolling();
      refresh("init");
    }
  }

  function bindEls() {
    els.root = document.getElementById("liveConsole");
    els.status = document.getElementById("liveConsoleStatus");
    els.timeline = document.getElementById("liveConsoleTimeline");
    els.forensics = document.getElementById("liveConsoleForensics");
    els.artifacts = document.getElementById("liveConsoleArtifacts");
    els.artifactCount = document.getElementById("liveConsoleArtifactCount");
    els.refresh = document.getElementById("liveConsoleRefresh");
  }

  function installEvents() {
    if (els.refresh) {
      els.refresh.addEventListener("click", () => refresh("manual"));
    }

    window.addEventListener("interface:diligence-job-state", (event) => {
      recordJobState(event.detail || {});
    });

    window.addEventListener("storage", (event) => {
      if (event.key === ACTIVE_RUN_KEY || event.key === LAST_RESULT_KEY) {
        restoreRunId();
        if (state.runId) refresh("storage");
      }
    });
  }

  function restoreRunId() {
    const activeRunId = safeLocalStorageGet(ACTIVE_RUN_KEY);
    if (activeRunId) {
      setRunId(activeRunId);
      return;
    }

    try {
      const last = JSON.parse(safeLocalStorageGet(LAST_RESULT_KEY) || "null");
      if (last && last.run_id) setRunId(last.run_id);
    } catch {
      // Ignore malformed local storage.
    }
  }

  function setRunId(runId) {
    const next = String(runId || "").trim();
    if (!next) return;

    if (state.runId !== next) {
      state.runId = next;
      state.lastError = null;
      renderAll();
    }

    startPolling();
  }

  function recordJobState(detail = {}) {
    if (detail.runId) setRunId(detail.runId);
    if (detail.jobState) state.lastJobState = detail.jobState;
    if (detail.diagnostic) state.lastError = detail.diagnostic;
    if (detail.result && detail.result.run_id) setRunId(detail.result.run_id);

    renderAll();

    if (state.runId) {
      refresh(detail.type || "event");
    }
  }

  function startPolling() {
    if (state.timer) return;
    state.timer = window.setInterval(() => {
      if (!state.runId) return;
      refresh("poll");
    }, POLL_MS);
  }

  function stopPollingIfTerminal() {
    const status = String(state.lastJobState?.status || "").toUpperCase();
    if (!["COMPLETE", "FAILED", "CONTROLLED_FAILURE"].includes(status)) return;

    if (state.timer) {
      window.clearInterval(state.timer);
      state.timer = null;
    }
  }

  async function refresh(reason = "refresh") {
    if (!state.runId) {
      renderAll();
      return;
    }

    try {
      const [jobState, scratchpad, forensics, artifacts] = await Promise.all([
        fetchJson(`/api/diligence/jobs/${encodeURIComponent(state.runId)}`),
        fetchJson(`/api/diligence/jobs/${encodeURIComponent(state.runId)}/scratchpad`),
        fetchJson(`/api/diligence/jobs/${encodeURIComponent(state.runId)}/forensics`),
        fetchJson(`/api/diligence/jobs/${encodeURIComponent(state.runId)}/artifacts`)
      ]);

      if (jobState && jobState.ok !== false) state.lastJobState = jobState;
      if (scratchpad && scratchpad.ok !== false) state.lastScratchpad = scratchpad;
      if (forensics && forensics.ok !== false) state.lastForensics = forensics;
      if (artifacts && artifacts.ok !== false) state.lastArtifacts = artifacts;

      state.lastError = null;
      renderAll(reason);
      stopPollingIfTerminal();
    } catch (err) {
      state.lastError = {
        error: "LIVE_CONSOLE_REFRESH_FAILED",
        message: err.message || String(err),
        run_id: state.runId
      };
      renderAll(reason);
    }
  }

  async function fetchJson(url) {
    const response = await fetch(url, { headers: { accept: "application/json" } });
    const text = await response.text();

    let parsed = {};
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = {
          ok: false,
          error: "NON_JSON_RESPONSE",
          message: text.slice(0, 2000)
        };
      }
    }

    if (!response.ok) {
      return {
        ok: false,
        error: parsed.error || `HTTP_${response.status}`,
        message: parsed.message || response.statusText,
        payload: parsed
      };
    }

    return parsed;
  }

  function renderAll(reason = "") {
    if (!els.root) return;
    renderStatus(reason);
    renderTimeline();
    renderForensics();
    renderArtifacts();
  }

  function renderStatus(reason = "") {
    if (!els.status) return;

    if (!state.runId) {
      els.status.innerHTML = `<span>${esc("No active durable run yet.")}</span>`;
      return;
    }

    const job = state.lastJobState || {};
    const progress = Number(job.progress?.percent ?? job.progress_percent ?? 0);
    const status = job.status || "UNKNOWN";
    const next = job.next_node || "N/A";
    const failed = job.failed_node || "N/A";
    const completed = job.completed_node || "N/A";
    const message = job.latest_message || job.message || "Waiting for runtime state.";

    els.status.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">
        ${metric("Run ID", state.runId)}
        ${metric("Status", status)}
        ${metric("Progress", Number.isFinite(progress) ? `${progress}%` : "N/A")}
        ${metric("Next node", next)}
        ${metric("Completed", completed)}
        ${metric("Failed", failed)}
      </div>
      <div style="margin-top:10px;color:rgba(229,229,229,.78);">${esc(message)}</div>
      ${state.lastError ? `<pre style="white-space:pre-wrap;margin-top:10px;color:#ffb4a8;">${esc(JSON.stringify(state.lastError, null, 2))}</pre>` : ""}
      <div style="margin-top:8px;color:rgba(229,229,229,.45);font-size:11px;">last refresh: ${esc(new Date().toLocaleTimeString())}${reason ? ` · ${esc(reason)}` : ""}</div>
    `;
  }

  function renderTimeline() {
    if (!els.timeline) return;

    const view = normalizeScratchpad(state.lastScratchpad);
    const events = view.events.slice(-30).reverse();

    if (!events.length) {
      els.timeline.innerHTML = "No scratchpad events available yet.";
      return;
    }

    els.timeline.innerHTML = `
      <div style="display:grid;gap:8px;">
        ${events.map((event) => {
          const node = event.node_id || event.nodeId || event.phase_id || event.phase || "";
          const type = event.event_type || event.type || event.status || "EVENT";
          const time = event.timestamp || event.created_at || event.at || event.sequence || "";
          const summary = event.summary || event.message || event.note || event.basis || "";
          const refs = event.evidence_refs || event.artifact_refs || event.refs || [];
          return `
            <div style="border:1px solid rgba(197,160,89,.20);border-radius:12px;padding:10px;background:rgba(255,255,255,.025);">
              <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                <strong style="color:#C5A059;">${esc(node ? `${node} · ${type}` : type)}</strong>
                <span style="color:rgba(229,229,229,.48);">${esc(time)}</span>
              </div>
              ${summary ? `<div style="margin-top:6px;color:rgba(229,229,229,.78);">${esc(summary)}</div>` : ""}
              ${refs.length ? `<div style="margin-top:6px;color:rgba(229,229,229,.55);font-size:11px;">refs: ${esc(refs.slice(0, 8).join(", "))}${refs.length > 8 ? "..." : ""}</div>` : ""}
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderForensics() {
    if (!els.forensics) return;

    const payload = normalizeForensics(state.lastForensics);
    if (!payload || !Object.keys(payload).length) {
      els.forensics.textContent = "No failure forensics recorded.";
      return;
    }

    els.forensics.textContent = JSON.stringify(payload, null, 2);
  }

  function renderArtifacts() {
    if (!els.artifacts) return;

    const artifacts = normalizeArtifacts(state.lastArtifacts);
    if (els.artifactCount) {
      els.artifactCount.textContent = `${artifacts.length} artifact${artifacts.length === 1 ? "" : "s"}`;
    }

    if (!artifacts.length) {
      els.artifacts.innerHTML = "Artifacts will appear after nodes complete.";
      return;
    }

    els.artifacts.innerHTML = `
      <div style="display:grid;gap:8px;">
        ${artifacts.map((artifact) => {
          const item = artifact && typeof artifact === "object" ? artifact : { name: String(artifact) };
          const node = item.node_id || item.nodeId || item.phase_id || item.id || "artifact";
          const path = item.path || item.artifact_path || item.filename || item.name || "";
          const status = item.status || (item.exists === false ? "missing" : "available");
          return `
            <div style="border:1px solid rgba(197,160,89,.18);border-radius:12px;padding:9px;background:rgba(255,255,255,.02);">
              <strong style="color:rgba(229,229,229,.86);">${esc(node)}</strong>
              <div style="margin-top:4px;color:rgba(229,229,229,.58);font-size:11px;">${esc(status)}${path ? ` · ${esc(path)}` : ""}</div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function normalizeScratchpad(payload) {
    const body = payload?.scratchpad || payload?.public_scratchpad || payload?.view || payload || {};
    const candidates = [
      body.timeline,
      body.events,
      body.recent_events,
      body.node_timeline,
      body.scratchpad_events,
      body.run_events,
      body?.scratchpad?.events
    ].filter(Array.isArray);

    let events = candidates.flat();

    if (!events.length && body.nodes && typeof body.nodes === "object") {
      events = Object.entries(body.nodes).map(([nodeId, node]) => ({
        node_id: nodeId,
        event_type: node.status || "NODE",
        summary: node.summary || node.latest_message || "",
        timestamp: node.updated_at || node.completed_at || node.started_at || ""
      }));
    }

    return { events };
  }

  function normalizeForensics(payload) {
    const body = payload?.forensics || payload?.failure_forensics || payload?.latest_failure || payload || {};
    if (body.ok === false && body.error) return body;
    if (body.latest_failure) return body.latest_failure;
    if (body.failure) return body.failure;
    if (body.ok === true && Object.keys(body).length <= 1) return {};
    if (body.ok === true && body.forensics == null && body.latest_failure == null && body.failure == null) return {};
    return body;
  }

  function normalizeArtifacts(payload) {
    const body = payload?.artifacts || payload?.artifact_list || payload?.items || payload || [];
    if (Array.isArray(body)) return body;
    if (Array.isArray(body.artifacts)) return body.artifacts;
    if (body.by_node && typeof body.by_node === "object") {
      return Object.entries(body.by_node).map(([nodeId, artifact]) => ({
        node_id: nodeId,
        ...(artifact && typeof artifact === "object" ? artifact : { value: artifact })
      }));
    }
    return [];
  }

  function metric(label, value) {
    return `
      <div style="border:1px solid rgba(197,160,89,.18);border-radius:12px;padding:8px;background:rgba(255,255,255,.025);">
        <div style="color:rgba(229,229,229,.48);font-size:10px;letter-spacing:.12em;text-transform:uppercase;">${esc(label)}</div>
        <div style="margin-top:3px;color:rgba(229,229,229,.90);font-weight:800;word-break:break-word;">${esc(value ?? "N/A")}</div>
      </div>
    `;
  }

  function safeLocalStorageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  window.DiligenceLiveConsole = {
    setRunId,
    recordJobState,
    refresh,
    render: renderAll
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
 /* DILIGENCE_LIVE_CONSOLE_V1_END */
