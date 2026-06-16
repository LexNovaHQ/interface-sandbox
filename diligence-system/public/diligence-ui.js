const state = {
  lastResult: null,
  health: null
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
  vaultStatus: document.getElementById("vaultStatus"),
  targetUrl: document.getElementById("targetUrl"),
  sourceMode: document.getElementById("sourceMode"),
  pastedMaterial: document.getElementById("pastedMaterial"),
  modeBadge: document.getElementById("modeBadge")
};

els.form.addEventListener("submit", handleRun);
els.pushVaultButton.addEventListener("click", handleVaultPush);
els.downloadButton.addEventListener("click", handleDownload);
els.sourceMode.addEventListener("change", updateInputRequirements);
els.targetUrl.addEventListener("blur", () => {
  const normalized = normalizeTargetUrl(els.targetUrl.value);
  if (normalized.ok && normalized.url) els.targetUrl.value = normalized.url;
});

document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => activateTab(btn.dataset.tab));
});

boot();

async function boot() {
  updateInputRequirements();
  await loadHealth();
  restoreLastResult();
}

async function loadHealth() {
  try {
    const response = await fetch("/health", { headers: { accept: "application/json" } });
    const health = await response.json();
    state.health = health;

    if (els.modeBadge) {
      const mode = health.mode || "unknown";
      const fetcher = health.hybrid_fetcher?.version || "no_fetcher";
      els.modeBadge.textContent = `${mode} · ${fetcher}`;
    }

    setStatus(
      `Runtime ready: mode=${health.mode || "unknown"} · models=${(health.models || []).join("/") || health.model || "N/A"} · prompt_live=${Boolean(health.prompt_live_ready)} · hybrid=${health.hybrid_fetcher?.version || "N/A"}`
    );
  } catch (err) {
    if (els.modeBadge) els.modeBadge.textContent = "unknown";
    setStatus(`Runtime health check unavailable: ${err.message || String(err)}`);
  }
}

async function handleRun(event) {
  event.preventDefault();

  const formData = new FormData(els.form);
  const sourceMode = String(formData.get("source_mode") || "url").trim();
  const pastedMaterial = String(formData.get("pasted_public_material") || "").trim();
  const normalized = normalizeTargetUrl(String(formData.get("target_url") || ""));

  if (sourceMode !== "text" && !normalized.ok) {
    setStatus(normalized.message || "Enter a valid public URL, for example https://sarvam.ai or sarvam.ai.");
    els.targetUrl.focus();
    return;
  }

  if (sourceMode === "text" && !pastedMaterial) {
    setStatus("Pasted public material is required when source mode is text-only.");
    els.pastedMaterial.focus();
    return;
  }

  const payload = {
    target_url: sourceMode === "text" ? "N/A" : normalized.url,
    company_name: String(formData.get("company_name") || "").trim(),
    source_mode: sourceMode,
    pasted_public_material: pastedMaterial
  };

  if (payload.target_url !== "N/A") {
    els.targetUrl.value = payload.target_url;
  }

  try {
    setRunning(true);
    setProgress(12);
    setRail("input");
    setStatus(`Input accepted: ${payload.source_mode} · ${payload.target_url}. Sending runtime payload to server...`);

    const response = await fetch("/api/diligence/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    setProgress(55);
    setRail("runtime");
    setStatus("Diligence runtime executing or returning diagnostics...");

    const result = await safeReadJson(response);
    if (!response.ok || !result.ok) {
      const diagnostic = buildErrorResult({ response, result, payload });
      state.lastResult = diagnostic;
      localStorage.setItem("interface_diligence_last_result", JSON.stringify(diagnostic));
      renderResult(diagnostic);
      setProgress(100);
      setRail("report");
      setStatus(`Run returned diagnostic failure: ${diagnostic.error || diagnostic.status || `HTTP_${response.status}`}`);
      return;
    }

    setProgress(86);
    setRail("report");
    setStatus("Report received. Rendering output...");

    state.lastResult = result;
    localStorage.setItem("interface_diligence_last_result", JSON.stringify(result));
    renderResult(result);

    setProgress(100);
    setRail(result.status === "GUARDRAIL_FAILED" ? "report" : "vault");
    setStatus(`${result.status === "GUARDRAIL_FAILED" ? "Guardrail failed" : "Completed"}. Run ID: ${result.run_id || "N/A"}`);
  } catch (err) {
    setProgress(0);
    const diagnostic = buildErrorResult({ error: err, payload });
    state.lastResult = diagnostic;
    renderResult(diagnostic);
    setStatus(`Run failed before a normal response: ${err.message || String(err)}`);
  } finally {
    setRunning(false);
  }
}

function normalizeTargetUrl(rawValue) {
  let value = String(rawValue || "").trim();
  if (!value) return { ok: false, url: "", message: "Target URL is required unless source mode is text-only." };

  value = value.replace(/^http:\/\//i, "https://");
  if (!/^https:\/\//i.test(value)) {
    value = `https://${value}`;
  }

  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { ok: false, url: "", message: "Only http/https URLs are allowed." };
    }
    if (!parsed.hostname || !parsed.hostname.includes(".")) {
      return { ok: false, url: "", message: "Enter a valid domain, for example sarvam.ai." };
    }
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

function renderResult(result) {
  els.result.classList.remove("hidden");
  els.vault.classList.remove("hidden");

  els.reportTab.innerHTML = result.html_report || buildFallbackReportHtml(result);
  els.jsonTab.textContent = JSON.stringify(buildVisibleJson(result), null, 2);
  els.auditTab.textContent = buildAuditText(result);
  els.vaultTab.textContent = JSON.stringify(result.vault_assembly_handoff || {}, null, 2);

  activateTab("report");
  setTimeout(() => document.getElementById("result").scrollIntoView({ behavior: "smooth", block: "start" }), 100);
}

function buildVisibleJson(result) {
  return {
    ok: result.ok,
    status: result.status,
    parse_status: result.parse_status,
    mode: result.mode,
    model: result.model,
    key_index: result.key_index,
    guardrail: result.guardrail || null,
    hybrid_source_review: result.hybrid_evidence_packet?.source_review || null,
    hybrid_warnings: result.hybrid_evidence_packet?.warnings || [],
    hybrid_candidate_links: result.hybrid_evidence_packet?.candidate_links || [],
    hybrid_direct_fetch_attempts: result.hybrid_evidence_packet?.direct_fetch_attempts || [],
    hybrid_artifact_inventory: result.hybrid_evidence_packet?.artifact_inventory || [],
    machine_json: result.machine_json || {},
    raw_output: result.raw_output || "",
    error: result.error || null,
    message: result.message || null
  };
}

function buildAuditText(result) {
  const chunks = [];
  if (result.guardrail) chunks.push(`[SERVER_GUARDRAIL]\n${JSON.stringify(result.guardrail, null, 2)}`);
  if (result.hybrid_evidence_packet?.source_review) chunks.push(`[HYBRID_SOURCE_REVIEW]\n${JSON.stringify(result.hybrid_evidence_packet.source_review, null, 2)}`);
  if (result.hybrid_evidence_packet?.warnings?.length) chunks.push(`[HYBRID_WARNINGS]\n${JSON.stringify(result.hybrid_evidence_packet.warnings, null, 2)}`);
  if (result.technical_audit_log) chunks.push(`[MODEL_TECHNICAL_AUDIT_LOG]\n${result.technical_audit_log}`);
  if (result.operator_challenge_gate) chunks.push(`[OPERATOR_CHALLENGE_GATE]\n${JSON.stringify(result.operator_challenge_gate, null, 2)}`);
  if (result.raw_output && !result.technical_audit_log) chunks.push(`[RAW_OUTPUT]\n${result.raw_output}`);
  return chunks.join("\n\n") || "No audit diagnostics returned.";
}

function buildFallbackReportHtml(result) {
  const title = result.status === "ERROR" || result.error ? "Runtime Diagnostic" : "No HTML report returned";
  return `
    <div class="interface-report guardrail-failed">
      <h1>${escapeHtml(title)}</h1>
      <p>The server returned no HTML report. Open the JSON and Audit tabs for diagnostics.</p>
      ${result.error ? `<p><strong>Error:</strong> ${escapeHtml(result.error)}</p>` : ""}
      ${result.message ? `<pre>${escapeHtml(result.message)}</pre>` : ""}
    </div>`;
}

function buildErrorResult({ response, result, error, payload }) {
  const status = response ? `HTTP_${response.status}` : "CLIENT_ERROR";
  const err = result?.error || error?.name || status;
  const message = result?.message || error?.message || "No additional message returned.";
  return {
    ok: false,
    status: "ERROR",
    parse_status: "ERROR_DIAGNOSTIC",
    error: err,
    message,
    target_url: payload?.target_url || "N/A",
    mode: state.health?.mode || "unknown",
    html_report: buildFallbackReportHtml({ status: "ERROR", error: err, message }),
    machine_json: result || {},
    technical_audit_log: result?.technical_audit_log || "",
    operator_challenge_gate: result?.operator_challenge_gate || {},
    vault_assembly_handoff: result?.vault_assembly_handoff || {},
    raw_output: result?.raw_output || ""
  };
}

async function safeReadJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: "NON_JSON_RESPONSE",
      message: text.slice(0, 5000)
    };
  }
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
    setRail(result.status === "GUARDRAIL_FAILED" ? "report" : "vault");
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

  document.querySelectorAll(".mobile-funnel .seg").forEach((node) => {
    const stage = node.dataset.mobileStage;
    const idx = order.indexOf(stage);
    node.classList.toggle("active", stage === activeStage);
    node.classList.toggle("completed", idx >= 0 && idx < activeIndex);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}