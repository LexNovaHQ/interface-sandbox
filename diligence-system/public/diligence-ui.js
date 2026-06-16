const state = {
  lastResult: null
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
  vaultStatus: document.getElementById("vaultStatus")
};

els.form.addEventListener("submit", handleRun);
els.pushVaultButton.addEventListener("click", handleVaultPush);
els.downloadButton.addEventListener("click", handleDownload);

document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => activateTab(btn.dataset.tab));
});

restoreLastResult();

async function handleRun(event) {
  event.preventDefault();

  const formData = new FormData(els.form);
  const payload = {
    target_url: String(formData.get("target_url") || "").trim(),
    company_name: String(formData.get("company_name") || "").trim(),
    source_mode: String(formData.get("source_mode") || "url").trim(),
    pasted_public_material: String(formData.get("pasted_public_material") || "")
  };

  if (!payload.target_url && payload.source_mode !== "text") {
    setStatus("Target URL is required unless source mode is text-only.");
    return;
  }

  try {
    setRunning(true);
    setProgress(12);
    setRail("input");
    setStatus("Input accepted. Sending runtime payload to server...");

    const response = await fetch("/api/diligence/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    setProgress(55);
    setRail("runtime");
    setStatus("Diligence runtime executing...");

    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.message || result.error || `HTTP_${response.status}`);
    }

    setProgress(86);
    setRail("report");
    setStatus("Report received. Rendering output...");

    state.lastResult = result;
    localStorage.setItem("interface_diligence_last_result", JSON.stringify(result));
    renderResult(result);

    setProgress(100);
    setRail("vault");
    setStatus(`Completed. Run ID: ${result.run_id || "N/A"}`);
  } catch (err) {
    setProgress(0);
    setStatus(`Run failed: ${err.message || String(err)}`);
  } finally {
    setRunning(false);
  }
}

function renderResult(result) {
  els.result.classList.remove("hidden");
  els.vault.classList.remove("hidden");

  els.reportTab.innerHTML = result.html_report || `<div class="interface-report"><h2>No HTML report returned</h2><p>Open JSON tab for raw output.</p></div>`;
  els.jsonTab.textContent = JSON.stringify({
    parse_status: result.parse_status,
    status: result.status,
    machine_json: result.machine_json || {},
    raw_output: result.raw_output || ""
  }, null, 2);
  els.auditTab.textContent = result.technical_audit_log || JSON.stringify(result.operator_challenge_gate || {}, null, 2) || "No audit log returned.";
  els.vaultTab.textContent = JSON.stringify(result.vault_assembly_handoff || {}, null, 2);

  activateTab("report");
  setTimeout(() => document.getElementById("result").scrollIntoView({ behavior: "smooth", block: "start" }), 100);
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
    setRail("vault");
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
}
