document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("runForm");
  const targetUrl = document.getElementById("targetUrl");
  const targetLabel = document.getElementById("targetLabel");
  const sourceDocuments = document.getElementById("sourceDocuments");
  const openReportButton = document.getElementById("openReportButton");

  if (!form || !sourceDocuments) return;

  form.addEventListener("submit", async (event) => {
    const files = Array.from(sourceDocuments.files || []);
    if (!files.length) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (!targetUrl.value.trim()) return message("Enter a public target URL first.", true);
    if (files.length > 4) return message("Upload limit is 4 source documents per run.", true);

    busy(true);
    hideReportLink();
    message(`Creating run with ${files.length} source document(s)...`);

    try {
      const formData = new FormData();
      formData.append("target_url", targetUrl.value.trim());
      if (targetLabel.value.trim()) formData.append("target", targetLabel.value.trim());
      files.forEach((file) => formData.append("documents", file, file.name));

      const created = await fetchJson("/public/diligence-system/jobs-with-documents", { method: "POST", body: formData });
      if (typeof updateState === "function") updateState({ run: created, artifacts: [] });
      message(`Run created with ${created.uploaded_source_documents?.document_count || files.length} uploaded source document(s). Starting backend worker...`);

      await fetchJson(`/public/diligence-system/jobs/${encodeURIComponent(created.run_id)}/advance`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ auto_continue: true })
      });

      message("Backend worker queued. Watching phase rail...");
      await pollUploadedRun(created.run_id);
    } catch (error) {
      message(error.message || String(error), true);
      busy(false);
    }
  }, true);

  async function pollUploadedRun(runId) {
    for (;;) {
      await sleep(10000);
      const status = await fetchJson(`/public/diligence-system/jobs/${encodeURIComponent(runId)}`);
      if (typeof updateState === "function") updateState(status);
      const run = status.run || status;
      if (run.status === "COMPLETE" || run.current_phase === "COMPLETE") {
        busy(false);
        const href = `report.html?run_id=${encodeURIComponent(runId)}`;
        if (openReportButton) {
          openReportButton.href = href;
          openReportButton.classList.remove("hidden");
        }
        message("Report ready. Opening report...");
        setTimeout(() => { window.location.href = href; }, 1200);
        return;
      }
      if (["REPAIR_REQUIRED", "CONTROLLED_FAILURE"].includes(run.status) || run.runner_state === "FAILED") {
        busy(false);
        message(`Run stopped: ${run.status || run.runner_state || "FAILED"}.`, true);
        return;
      }
    }
  }
});

async function fetchJson(path, init = {}) {
  const response = await fetch(path, init);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${response.status}: ${json.message || json.error || "Request failed"}`);
  return json;
}

function busy(value) {
  const button = document.getElementById("runButton");
  if (!button) return;
  button.disabled = Boolean(value);
  button.textContent = value ? "Running..." : "Start Public Review";
}

function message(value, error = false) {
  const node = document.getElementById("statusMessage");
  if (!node) return;
  node.textContent = value;
  node.style.color = error ? "var(--danger)" : "rgba(229,229,229,.62)";
}

function hideReportLink() {
  const link = document.getElementById("openReportButton");
  if (!link) return;
  link.classList.add("hidden");
  link.removeAttribute("href");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
