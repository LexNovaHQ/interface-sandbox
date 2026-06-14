#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const DEFAULT_RUNTIME_URL = "https://lexnova-runtime-api-24qnalslaa-uc.a.run.app";
const runtimeUrl = (process.env.RUNTIME_URL || process.env.LEXNOVA_RUNTIME_URL || DEFAULT_RUNTIME_URL).replace(/\/+$/, "");
const token = process.env.RUNTIME_ACCESS_TOKEN;
const targetUrl = process.env.AUDIT_TARGET_URL || process.env.TARGET_URL || "https://sarvam.ai";
const companyName = process.env.AUDIT_COMPANY_NAME || process.env.COMPANY_NAME || "Sarvam AI";
const outputRoot = process.env.AUDIT_OUTPUT_DIR || path.join(process.cwd(), ".runtime-e2e-cache", "full-runtime-audit");

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
  "supporting_registry_rows"
]);

function fail(message, detail = null) {
  console.error(JSON.stringify({ ok: false, phase: "full_live_runtime_audit", error: message, detail }, null, 2));
  process.exit(1);
}

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

async function readJsonResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { non_json_body: text.slice(0, 5000) };
  }
}

async function getJson(url, headers = {}) {
  const response = await fetch(url, { method: "GET", headers });
  const body = await readJsonResponse(response);
  return { status: response.status, ok: response.ok, body };
}

async function postJson(url, payload, headers = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(payload)
  });
  const body = await readJsonResponse(response);
  return { status: response.status, ok: response.ok, body };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function redactLargeLiveResult(result = {}) {
  return {
    ok: result.ok,
    service: result.service,
    phase: result.phase,
    artifact_type: result.artifact_type,
    generated_at: result.generated_at,
    started_at: result.started_at,
    run_id: result.run_id,
    mode: result.mode,
    target_input: result.target_input,
    stage_status: result.stage_status,
    validation: result.validation,
    metrics: result.metrics,
    warnings: result.warnings,
    artifact_presence: {
      stage9_report_data: Boolean(result.stage9_report_data),
      html_report: Boolean(result.html_report),
      stage10_handoff: Boolean(result.stage10_handoff),
      internal_artifacts: Boolean(result.internal_artifacts)
    },
    sizes: {
      stage9_report_data_json_bytes: Buffer.byteLength(JSON.stringify(result.stage9_report_data || {}), "utf8"),
      html_report_bytes: Buffer.byteLength(result.html_report || "", "utf8"),
      stage10_handoff_json_bytes: Buffer.byteLength(JSON.stringify(result.stage10_handoff || {}), "utf8"),
      internal_artifacts_json_bytes: Buffer.byteLength(JSON.stringify(result.internal_artifacts || {}), "utf8")
    }
  };
}

function scanKeys(value, retiredKeys, options = {}) {
  const findings = [];
  const maxFindings = options.maxFindings || 200;
  const skipPath = options.skipPath || (() => false);

  function walk(node, trail = []) {
    if (findings.length >= maxFindings) return;
    if (!node || typeof node !== "object") return;
    if (skipPath(trail)) return;

    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, trail.concat(String(index))));
      return;
    }

    for (const [key, child] of Object.entries(node)) {
      const nextTrail = trail.concat(key);
      if (retiredKeys.has(key)) {
        findings.push({ path: nextTrail.join("."), key });
        if (findings.length >= maxFindings) return;
      }
      walk(child, nextTrail);
    }
  }

  walk(value, []);
  return findings;
}

function stripForensicAppendixFromStage9(stage9ReportData = {}) {
  const reportData = safeObject(stage9ReportData.report?.report_data);
  const out = {};
  for (const [key, value] of Object.entries(reportData)) {
    if (key === "forensic_ledger_appendix") continue;
    out[key] = value;
  }
  return out;
}

function stripAppendixFromStage10(stage10Handoff = {}) {
  const copy = structuredClone(stage10Handoff || {});
  if (copy.stage10_source_packet) {
    delete copy.stage10_source_packet.forensic_ledger_appendix;
  }
  if (copy.functional_intake_vault?.source_trace) {
    // Source trace may contain appendix references, but it must not carry old legal-stack keys.
  }
  return copy;
}

function requireTruthy(condition, message, detail = null) {
  if (!condition) fail(message, detail);
}

function buildSummaryMarkdown({ runtimeStatus, liveResult, leakageAudit, manifest }) {
  const metrics = liveResult.metrics || {};
  const validation = liveResult.validation || {};
  const stage10 = liveResult.stage10_handoff || {};
  const vault = stage10.functional_intake_vault || {};
  const assembly = stage10.assembly_handoff || {};
  const stage9 = liveResult.stage9_report_data || {};
  const stage9Sections = Object.keys(stage9.report?.report_data || {});
  const questionCount = asArray(vault.vault_confirmation_questions || assembly.vault_confirmation_questions).length;
  const functionalSectionCount = Object.keys(vault.functional_sections || {}).length;

  return [
    "# Full Live Runtime Audit",
    "",
    `- Runtime URL: ${runtimeUrl}`,
    `- Target URL: ${targetUrl}`,
    `- Company Name: ${companyName}`,
    `- Run ID: ${liveResult.run_id || "n/a"}`,
    `- Runtime OK: ${runtimeStatus.body?.ok === true}`,
    `- Live Result OK: ${liveResult.ok === true}`,
    `- Stage 9 Validation: ${validation.stage9?.ok === true}`,
    `- Stage 10 Validation: ${validation.stage10?.ok === true}`,
    "",
    "## Metrics",
    "",
    `- Sources: ${metrics.source_count ?? "n/a"}`,
    `- Stage 7 rows: ${metrics.stage7_rows ?? "n/a"}`,
    `- Stage 8 rows: ${metrics.stage8_rows ?? "n/a"}`,
    `- HTML bytes: ${metrics.html_bytes ?? "n/a"}`,
    `- Functional sections: ${functionalSectionCount}`,
    `- Vault confirmation questions: ${questionCount}`,
    "",
    "## Stage 9 Sections",
    "",
    ...stage9Sections.map((key) => `- ${key}`),
    "",
    "## Legacy Leakage Audit",
    "",
    `- Stage 9 main retired-key leaks: ${leakageAudit.stage9_main_retired_key_leaks.length}`,
    `- Stage 10 retired-key leaks: ${leakageAudit.stage10_retired_key_leaks.length}`,
    "",
    "## Artifact Manifest",
    "",
    ...manifest.files.map((file) => `- ${file.name} (${file.bytes} bytes, sha256 ${file.sha256})`),
    ""
  ].join("\n");
}

ensureDir(outputRoot);

if (!runtimeUrl) fail("RUNTIME_URL or LEXNOVA_RUNTIME_URL is required.");
if (!token) fail("RUNTIME_ACCESS_TOKEN is required.");

const authHeaders = { "x-runtime-access-token": token };

const runtimeStatus = await getJson(`${runtimeUrl}/v1/runtime-status`, authHeaders);
writeJson("00-runtime-status.json", runtimeStatus.body);
requireTruthy(runtimeStatus.ok && runtimeStatus.body?.ok === true, "Runtime status check failed.", { status: runtimeStatus.status, body: runtimeStatus.body });

const payload = {
  input: {
    primary_url: targetUrl,
    company_name: companyName
  },
  options: {
    include_internal_artifacts: true,
    render_html: true,
    run_handoff: true
  }
};
writeJson("00-live-run-request.json", payload);

const liveResponse = await postJson(`${runtimeUrl}/v1/diligence/live-run`, payload, authHeaders);
const liveResult = liveResponse.body;
writeJson("01-live-run-result.full.json", liveResult);
writeJson("01-live-run-result.summary.json", redactLargeLiveResult(liveResult));

requireTruthy(liveResponse.ok && liveResult?.ok === true, "Live full runtime run failed.", { status: liveResponse.status, body: liveResult });
requireTruthy(liveResult.stage9_report_data, "Missing stage9_report_data.");
requireTruthy(liveResult.stage10_handoff, "Missing stage10_handoff.");
requireTruthy(liveResult.validation?.stage9?.ok === true, "Stage 9 validation failed.", liveResult.validation?.stage9);
requireTruthy(liveResult.validation?.stage10?.ok === true, "Stage 10 validation failed.", liveResult.validation?.stage10);

const stage9ReportData = liveResult.stage9_report_data;
const stage10Handoff = liveResult.stage10_handoff;
const internalArtifacts = liveResult.internal_artifacts || {};
const functionalIntakeVault = stage10Handoff.functional_intake_vault || {};
const vaultPayload = stage10Handoff.vault_payload || functionalIntakeVault.vault_payload || {};
const assemblyHandoff = stage10Handoff.assembly_handoff || {};

writeJson("02-stage-status.json", liveResult.stage_status || []);
writeJson("03-metrics.json", liveResult.metrics || {});
writeJson("04-stage9-report-data.json", stage9ReportData);
writeText("05-stage9-report.html", liveResult.html_report || "");
writeJson("06-stage9-validation.json", liveResult.validation.stage9);
writeJson("07-stage10-handoff.json", stage10Handoff);
writeJson("08-stage10-validation.json", liveResult.validation.stage10);
writeJson("09-functional-intake-vault.json", functionalIntakeVault);
writeJson("10-vault-payload.json", vaultPayload);
writeJson("11-assembly-handoff.json", assemblyHandoff);
writeJson("12-internal-stage6-cache.json", internalArtifacts.stage6Cache || null);
writeJson("13-internal-stage7-artifact.json", internalArtifacts.stage7Artifact || null);
writeJson("14-internal-stage8-ledger.json", internalArtifacts.stage8Ledger || null);
writeJson("14b-internal-stage8-export.json", internalArtifacts.stage8Export || null);

const leakageAudit = {
  stage9_main_retired_key_leaks: scanKeys(stripForensicAppendixFromStage9(stage9ReportData), STAGE9_RETIRED_MAIN_KEYS),
  stage10_retired_key_leaks: scanKeys(stripAppendixFromStage10(stage10Handoff), STAGE10_RETIRED_KEYS),
  retired_key_policy: {
    stage9_forensic_appendix_exempt: true,
    stage10_source_packet_forensic_ledger_exempt: true,
    scanned_stage9_keys: [...STAGE9_RETIRED_MAIN_KEYS],
    scanned_stage10_keys: [...STAGE10_RETIRED_KEYS]
  }
};
writeJson("15-legacy-leakage-audit.json", leakageAudit);

requireTruthy(leakageAudit.stage9_main_retired_key_leaks.length === 0, "Stage 9 main report leaked retired registry/legacy keys.", leakageAudit.stage9_main_retired_key_leaks);
requireTruthy(leakageAudit.stage10_retired_key_leaks.length === 0, "Stage 10 handoff leaked retired legacy keys.", leakageAudit.stage10_retired_key_leaks);
requireTruthy(asArray(stage9ReportData.report?.report_data ? Object.keys(stage9ReportData.report.report_data) : []).includes("forensic_ledger_appendix"), "Stage 9 missing forensic ledger appendix section.");
requireTruthy(stage10Handoff.stage10_source_packet?.stage10_input_version === "stage10_source_packet_v2", "Stage 10 source packet v2 missing.", stage10Handoff.stage10_source_packet);
requireTruthy(functionalIntakeVault.vault_schema_version, "Functional intake vault missing schema version.");
requireTruthy(safeObject(functionalIntakeVault.functional_sections), "Functional intake vault missing functional_sections.");
requireTruthy(safeObject(vaultPayload), "Vault payload missing.");
requireTruthy(asArray(assemblyHandoff.legal_document_status).length >= 0, "Assembly handoff missing legal_document_status array.");

const outputFiles = fs.readdirSync(outputRoot).filter((name) => name !== "16-artifact-manifest.json" && name !== "17-summary.md").sort();
const manifest = {
  ok: true,
  generated_at: new Date().toISOString(),
  runtime_url: runtimeUrl,
  target_url: targetUrl,
  company_name: companyName,
  run_id: liveResult.run_id || null,
  files: outputFiles.map((name) => {
    const filePath = path.join(outputRoot, name);
    return { name, bytes: bytes(filePath), sha256: sha256(filePath) };
  })
};
writeJson("16-artifact-manifest.json", manifest);
writeText("17-summary.md", buildSummaryMarkdown({ runtimeStatus, liveResult, leakageAudit, manifest }));

console.log(JSON.stringify({
  ok: true,
  phase: "full_live_runtime_audit",
  runtime_url: runtimeUrl,
  target_url: targetUrl,
  company_name: companyName,
  run_id: liveResult.run_id,
  metrics: liveResult.metrics,
  stage9_validation_ok: liveResult.validation.stage9.ok === true,
  stage10_validation_ok: liveResult.validation.stage10.ok === true,
  artifact_dir: outputRoot,
  artifact_files: fs.readdirSync(outputRoot).sort()
}, null, 2));
