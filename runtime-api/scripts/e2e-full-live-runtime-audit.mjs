#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const DEFAULT_RUNTIME_URL = "https://lexnova-runtime-api-24qnalslaa-uc.a.run.app";
const LIVE_RUN_ENDPOINT = "/v1/diligence/public-live-run";
const STATUS_ENDPOINT = "/v1/runtime-status";
const FORBIDDEN_STAGE_ENDPOINT = "/v1/diligence/stage";
const runtimeUrl = (process.env.RUNTIME_URL || process.env.LEXNOVA_RUNTIME_URL || DEFAULT_RUNTIME_URL).replace(/\/+$/, "");
const token = process.env.RUNTIME_ACCESS_TOKEN;
const targetUrl = process.env.AUDIT_TARGET_URL || process.env.TARGET_URL || "https://sarvam.ai";
const companyName = process.env.AUDIT_COMPANY_NAME || process.env.COMPANY_NAME || "Sarvam AI";
const outputRoot = process.env.AUDIT_OUTPUT_DIR || path.join(process.cwd(), ".runtime-e2e-cache", "full-runtime-audit");
const runId = `full_live_runtime_audit_${Date.now()}`;

const STAGE9_RETIRED_MAIN_KEYS = new Set([
  "executive_exposure_summary",
  "evidence_reviewed",
  "legal_risk_surface_map",
  "legal_stack_control_review",
  "supporting_registry_rows",
  "supporting_registry_items",
  "supporting_registry_references",
  "registry_reference",
  "threat_id",
  "registry_batch_meta"
]);

const STAGE10_RETIRED_KEYS = new Set([
  "legal_stack_review",
  "legal_stack_control_review",
  "legal_stack",
  "document_stack_status",
  "document_stack_redline",
  "legal_stack_assessment",
  "supporting_registry_rows",
  "supporting_registry_items",
  "supporting_registry_references",
  "registry_reference"
]);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeJson(value) {
  return JSON.stringify(value ?? null, null, 2);
}

function writeText(name, text) {
  ensureDir(outputRoot);
  const filePath = path.join(outputRoot, name);
  fs.writeFileSync(filePath, text, "utf8");
  return filePath;
}

function writeJson(name, value) {
  return writeText(name, safeJson(value));
}

function bytes(filePath) {
  return fs.statSync(filePath).size;
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    url.hash = "";
    if ((url.pathname || "") !== "/") url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return null;
  }
}

async function readJsonResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { non_json_body: text.slice(0, 10000) };
  }
}

async function getJson(url, headers = {}) {
  const response = await fetch(url, { method: "GET", headers });
  return { status: response.status, ok: response.ok, body: await readJsonResponse(response) };
}

async function postJson(url, payload, headers = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(payload)
  });
  return { status: response.status, ok: response.ok, body: await readJsonResponse(response) };
}

function scanKeys(value, retiredKeys, options = {}) {
  const findings = [];
  const maxFindings = options.maxFindings || 250;
  const skipPath = options.skipPath || (() => false);

  function walk(node, trail = []) {
    if (findings.length >= maxFindings || !node || typeof node !== "object" || skipPath(trail)) return;
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, trail.concat(String(index))));
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      const nextTrail = trail.concat(key);
      if (retiredKeys.has(key)) findings.push({ path: nextTrail.join("."), key });
      walk(child, nextTrail);
    }
  }

  walk(value, []);
  return findings;
}

function stage9MainBody(stage9ReportData = {}) {
  const reportData = safeObject(stage9ReportData.report?.report_data);
  const out = {};
  for (const [key, value] of Object.entries(reportData)) {
    if (key !== "forensic_ledger_appendix") out[key] = value;
  }
  return out;
}

function stage10MainBody(stage10Handoff = {}) {
  const copy = JSON.parse(JSON.stringify(stage10Handoff || {}));
  if (copy.stage10_source_packet) delete copy.stage10_source_packet.forensic_ledger_appendix;
  if (copy.assembly_handoff?.stage10_source_packet) delete copy.assembly_handoff.stage10_source_packet.forensic_ledger_appendix;
  return copy;
}

function collectUsageMetadata(value) {
  const records = [];
  const seen = new Set();

  function walk(node, trail = []) {
    if (!node || typeof node !== "object") return;
    if (node.usage_metadata && typeof node.usage_metadata === "object") {
      const key = `${trail.join(".")}:${JSON.stringify(node.usage_metadata)}`;
      if (!seen.has(key)) {
        seen.add(key);
        records.push({ path: trail.join("."), usage_metadata: node.usage_metadata });
      }
    }
    if (Array.isArray(node)) node.forEach((item, index) => walk(item, trail.concat(String(index))));
    else for (const [key, child] of Object.entries(node)) walk(child, trail.concat(key));
  }

  walk(value, []);
  const totals = {};
  for (const record of records) {
    for (const [key, value] of Object.entries(record.usage_metadata || {})) {
      if (typeof value === "number" && Number.isFinite(value)) totals[key] = (totals[key] || 0) + value;
    }
  }
  return { usage_metadata_count: records.length, totals, records };
}

function writeManifest(extra = {}) {
  const files = fs.existsSync(outputRoot)
    ? fs.readdirSync(outputRoot).filter((name) => name !== "16-artifact-manifest.json").sort()
    : [];
  const manifest = {
    ok: extra.ok !== false,
    audit_phase: "full_live_runtime_audit",
    generated_at: nowIso(),
    runtime_url: runtimeUrl,
    live_endpoint: LIVE_RUN_ENDPOINT,
    target_url: targetUrl,
    company_name: companyName,
    run_id: runId,
    ...extra,
    files: files.map((name) => {
      const filePath = path.join(outputRoot, name);
      return { name, bytes: bytes(filePath), sha256: sha256(filePath) };
    })
  };
  writeJson("16-artifact-manifest.json", manifest);
  return manifest;
}

function fail(message, detail = {}) {
  writeJson("99-failure.json", { ok: false, audit_phase: "full_live_runtime_audit", error: message, detail, generated_at: nowIso() });
  writeManifest({ ok: false, failure: message });
  console.error(JSON.stringify({ ok: false, phase: "full_live_runtime_audit", error: message, detail }, null, 2));
  process.exit(1);
}

function createSummaryMarkdown({ runtimeStatus, liveRunResult, leakageAudit, failedChecks }) {
  const validation = safeObject(liveRunResult.validation);
  const metrics = safeObject(liveRunResult.metrics);
  const stage10 = safeObject(liveRunResult.stage10_handoff);
  const functionalVault = safeObject(stage10.functional_intake_vault);
  const stageNames = asArray(liveRunResult.stage_status).map((entry) => `${entry.stage}:${entry.status}`).join(" → ");
  return `# Full Live Runtime Audit\n\n` +
    `- Audit phase: full_live_runtime_audit\n` +
    `- Runtime URL: ${runtimeUrl}\n` +
    `- Live endpoint: ${LIVE_RUN_ENDPOINT}\n` +
    `- Target: ${companyName} (${targetUrl})\n` +
    `- Runtime status OK: ${runtimeStatus.ok === true || runtimeStatus.body?.ok === true}\n` +
    `- Live run OK: ${liveRunResult.ok === true}\n` +
    `- Stage 9 validation OK: ${validation.stage9?.ok === true}\n` +
    `- Stage 10 validation OK: ${validation.stage10?.ok === true}\n` +
    `- HTML bytes: ${metrics.html_bytes || 0}\n` +
    `- Source count: ${metrics.source_count || 0}\n` +
    `- Stage 7 rows: ${metrics.stage7_rows || 0}\n` +
    `- Stage 8 rows: ${metrics.stage8_rows || 0}\n` +
    `- Functional Vault sections: ${Object.keys(safeObject(functionalVault.functional_sections)).length}\n` +
    `- Vault confirmation questions: ${asArray(stage10.vault_confirmation_questions).length}\n` +
    `- Legacy leakage OK: ${leakageAudit.ok === true}\n` +
    `- Failed checks: ${failedChecks.length ? failedChecks.join(", ") : "none"}\n\n` +
    `## Stage timeline\n\n${stageNames || "No stage timeline returned."}\n`;
}

ensureDir(outputRoot);
if (!runtimeUrl) fail("RUNTIME_URL or LEXNOVA_RUNTIME_URL is required.");
if (!token) fail("RUNTIME_ACCESS_TOKEN is required for runtime-status smoke check.");

const authHeaders = { "x-runtime-access-token": token };
const targetInput = {
  primary_url: normalizeUrl(targetUrl),
  company_name: companyName,
  submitted_at: nowIso(),
  live_review_input_mode: "url_only"
};

if (!targetInput.primary_url) fail("Invalid AUDIT_TARGET_URL/TARGET_URL.", { targetUrl });

const liveRunRequest = {
  input: targetInput,
  options: {
    include_internal_artifacts: true,
    render_html: true,
    run_handoff: true
  }
};

writeJson("00-audit-request.json", {
  ok: true,
  audit_phase: "full_live_runtime_audit",
  run_id: runId,
  runtime_url: runtimeUrl,
  target_input: targetInput,
  endpoint_policy: "mirror_public_live_sandbox_run_only",
  endpoint: LIVE_RUN_ENDPOINT,
  status_endpoint: STATUS_ENDPOINT,
  forbidden_endpoint: FORBIDDEN_STAGE_ENDPOINT,
  options: liveRunRequest.options
});

const runtimeStatusResponse = await getJson(`${runtimeUrl}${STATUS_ENDPOINT}`, authHeaders);
writeJson("00-runtime-status.json", { status: runtimeStatusResponse.status, ok: runtimeStatusResponse.ok, body: runtimeStatusResponse.body });
if (!runtimeStatusResponse.ok || runtimeStatusResponse.body?.ok === false) {
  fail("Runtime status check failed.", { status: runtimeStatusResponse.status, body: runtimeStatusResponse.body });
}

const liveRunResponse = await postJson(`${runtimeUrl}${LIVE_RUN_ENDPOINT}`, liveRunRequest);
writeJson("01-live-run-result.full.json", liveRunResponse.body);

const liveRunResult = liveRunResponse.body || {};
const stage9ReportData = liveRunResult.stage9_report_data || null;
const stage10Handoff = liveRunResult.stage10_handoff || null;
const validation = safeObject(liveRunResult.validation);
const internal = safeObject(liveRunResult.internal_artifacts);
const htmlReport = typeof liveRunResult.html_report === "string" ? liveRunResult.html_report : "";

writeJson("01-live-run-result.summary.json", {
  ok: liveRunResult.ok === true,
  http_status: liveRunResponse.status,
  phase: liveRunResult.phase || null,
  run_id: liveRunResult.run_id || null,
  mode: liveRunResult.mode || null,
  stage_status_count: asArray(liveRunResult.stage_status).length,
  has_stage9_report_data: Boolean(stage9ReportData),
  has_html_report: Boolean(htmlReport),
  has_stage10_handoff: Boolean(stage10Handoff),
  has_internal_stage6_cache: Boolean(internal.stage6Cache),
  has_internal_stage7_artifact: Boolean(internal.stage7Artifact),
  has_internal_stage8_ledger: Boolean(internal.stage8Ledger),
  stage9_validation_ok: validation.stage9?.ok === true,
  stage10_validation_ok: validation.stage10?.ok === true,
  metrics: liveRunResult.metrics || null,
  warnings: liveRunResult.warnings || []
});
writeJson("02-stage-status.json", liveRunResult.stage_status || []);
writeJson("03-metrics.json", liveRunResult.metrics || {});
writeJson("04-stage9-report-data.json", stage9ReportData);
writeText("05-stage9-report.html", htmlReport);
writeJson("06-stage9-validation.json", validation.stage9 || null);
writeJson("07-stage10-handoff.json", stage10Handoff);
writeJson("08-stage10-validation.json", validation.stage10 || null);
writeJson("09-functional-intake-vault.json", stage10Handoff?.functional_intake_vault || null);
writeJson("10-vault-payload.json", stage10Handoff?.vault_payload || null);
writeJson("11-assembly-handoff.json", stage10Handoff?.assembly_handoff || null);
writeJson("12-internal-stage6-cache.json", internal.stage6Cache || null);
writeJson("13-internal-stage7-artifact.json", internal.stage7Artifact || null);
writeJson("14-internal-stage8-ledger.json", internal.stage8Ledger || null);
writeJson("14b-internal-stage8-export.json", internal.stage8Export || null);
writeJson("18-token-usage.json", collectUsageMetadata(liveRunResult));

const leakageAudit = {
  ok: true,
  stage9_main_findings: scanKeys(stage9MainBody(stage9ReportData), STAGE9_RETIRED_MAIN_KEYS),
  stage10_main_findings: scanKeys(stage10MainBody(stage10Handoff), STAGE10_RETIRED_KEYS)
};
leakageAudit.ok = leakageAudit.stage9_main_findings.length === 0 && leakageAudit.stage10_main_findings.length === 0;
writeJson("15-legacy-leakage-audit.json", leakageAudit);

const failedChecks = [];
if (!liveRunResponse.ok || liveRunResult.ok !== true) failedChecks.push("live_run_not_ok");
if (!stage9ReportData) failedChecks.push("missing_stage9_report_data");
if (!htmlReport || Buffer.byteLength(htmlReport, "utf8") < 1000) failedChecks.push("missing_or_tiny_html_report");
if (!stage10Handoff) failedChecks.push("missing_stage10_handoff");
if (validation.stage9?.ok !== true) failedChecks.push("stage9_validation_failed");
if (validation.stage10?.ok !== true) failedChecks.push("stage10_validation_failed");
if (!stage10Handoff?.stage10_source_packet) failedChecks.push("missing_stage10_source_packet");
if (!stage10Handoff?.functional_intake_vault) failedChecks.push("missing_functional_intake_vault");
if (!stage10Handoff?.vault_payload) failedChecks.push("missing_vault_payload");
if (!stage10Handoff?.assembly_handoff) failedChecks.push("missing_assembly_handoff");
if (!Array.isArray(stage10Handoff?.assembly_handoff?.legal_document_status)) failedChecks.push("missing_legal_document_status");
if (!internal.stage6Cache) failedChecks.push("missing_internal_stage6_cache");
if (!internal.stage7Artifact) failedChecks.push("missing_internal_stage7_artifact");
if (!internal.stage8Ledger) failedChecks.push("missing_internal_stage8_ledger");
if (!leakageAudit.ok) failedChecks.push("legacy_leakage_detected");

writeText("17-summary.md", createSummaryMarkdown({ runtimeStatus: runtimeStatusResponse, liveRunResult, leakageAudit, failedChecks }));
writeManifest({ ok: failedChecks.length === 0, failed_checks: failedChecks });

if (failedChecks.length) {
  fail("Full live runtime audit failed pass conditions.", { failed_checks: failedChecks, leakageAudit });
}

console.log(JSON.stringify({ ok: true, phase: "full_live_runtime_audit", runtime_url: runtimeUrl, live_endpoint: LIVE_RUN_ENDPOINT, target_url: targetUrl, company_name: companyName, run_id: liveRunResult.run_id || runId, metrics: liveRunResult.metrics, artifact_dir: outputRoot }, null, 2));
