#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const outputRoot = path.resolve(process.env.AUDIT_OUTPUT_DIR || path.join(process.cwd(), ".runtime-e2e-cache", "full-runtime-audit"));
const summaryPath = process.env.GITHUB_STEP_SUMMARY || null;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function readJson(name) {
  const filePath = path.join(outputRoot, name);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return { __parse_error: error.message, __artifact_name: name };
  }
}

function writeText(name, text) {
  fs.mkdirSync(outputRoot, { recursive: true });
  const filePath = path.join(outputRoot, name);
  fs.writeFileSync(filePath, text, "utf8");
  return filePath;
}

function writeJson(name, value) {
  return writeText(name, `${JSON.stringify(value, null, 2)}\n`);
}

function hashText(text) {
  return crypto.createHash("sha256").update(String(text)).digest("hex");
}

function artifactInfo(name) {
  const filePath = path.join(outputRoot, name);
  if (!fs.existsSync(filePath)) return { name, exists: false, bytes: 0, sha256: null };
  const text = fs.readFileSync(filePath, "utf8");
  return { name, exists: true, bytes: Buffer.byteLength(text), sha256: hashText(text) };
}

function validationStatus(validation = {}) {
  if (!validation || typeof validation !== "object") return "UNKNOWN";
  if (validation.reinvestigation_required === true) return "REINVESTIGATE";
  if (validation.ok === true) return "PASS";
  if (validation.ok === false && validation.blocking === false) return "REINVESTIGATE";
  if (validation.ok === false) return "FAIL";
  return "UNKNOWN";
}

function stageStatus(stage = {}) {
  if (!stage || typeof stage !== "object") return "MISSING";
  if (stage.__parse_error) return "PARSE_ERROR";
  return validationStatus(stage.validation || stage.schemaValidation || stage.guardrail || {});
}

function countFor(stageId, artifact) {
  const value = safeObject(artifact);
  if (stageId === "5A") return asArray(value.admitted_functions).length;
  if (stageId === "5B") return asArray(value.feature_tags).length;
  if (stageId === "5C") return asArray(value.complete_feature_records).length;
  if (stageId === "5D") return asArray(value.target_feature_profile?.feature_inventory).length;
  return 0;
}

function windowCountFor(stageId, artifact) {
  const value = safeObject(artifact);
  if (stageId === "5A") return asArray(value.feature_evidence_windows).length;
  if (stageId === "5B") return asArray(value.supplemental_evidence_windows).length;
  if (stageId === "5C") return asArray(value.supplemental_evidence_windows).length;
  return 0;
}

function reinvestigationRequests(artifact) {
  const validation = safeObject(artifact?.validation);
  return [
    ...asArray(validation.reinvestigation_requests),
    ...asArray(validation.issues).filter((issue) => issue?.code && !asArray(validation.reinvestigation_requests).some((known) => known?.issue_id === issue.issue_id))
  ];
}

const artifacts = {
  runtime: readJson("stage5-canonical-runtime-summary.json"),
  stage5a: readJson("stage5a-product-function-discovery.json"),
  stage5b: readJson("stage5b-archetype-surface-tagging.json"),
  stage5c: readJson("stage5c-complete-feature-records.json"),
  stage5d: readJson("stage5d-target-feature-profile-integrator.json"),
  profile: readJson("stage5-final-target-feature-profile.json"),
  validation: readJson("stage5-validation-summary.json"),
  ledger: readJson("stage5-source-window-ledger.json"),
  custody: readJson("stage5-lossless-custody-manifest.json")
};

const stageRows = [
  { id: "5A", label: "Product Function Discovery", file: "stage5a-product-function-discovery.json", artifact: artifacts.stage5a },
  { id: "5B", label: "Archetype / Surface Tagging", file: "stage5b-archetype-surface-tagging.json", artifact: artifacts.stage5b },
  { id: "5C", label: "Complete Feature Record Builder", file: "stage5c-complete-feature-records.json", artifact: artifacts.stage5c },
  { id: "5D", label: "Final target_feature_profile Integrator", file: "stage5d-target-feature-profile-integrator.json", artifact: artifacts.stage5d }
].map((row) => ({
  ...row,
  status: stageStatus(row.artifact),
  primary_count: countFor(row.id, row.artifact),
  source_window_count: windowCountFor(row.id, row.artifact),
  reinvestigation_request_count: reinvestigationRequests(row.artifact).length,
  artifact: artifactInfo(row.file)
}));

const evidence = safeObject(artifacts.validation || artifacts.runtime?.evidence);
const custody = safeObject(artifacts.custody);
const ledger = asArray(artifacts.ledger);
const profile = safeObject(artifacts.profile);

const contractChecks = {
  stage5_runtime_artifact_present: Boolean(artifacts.runtime),
  target_feature_profile_present: Boolean(artifacts.profile && Object.keys(profile).length),
  downstream_handoff_version: profile.feature_profile_version || null,
  downstream_feature_count: asArray(profile.feature_inventory).length,
  clean_text_lossless_present: evidence.clean_text_lossless_present === true,
  source_sha256_present: evidence.source_sha256_present === true,
  all_windows_verbatim: evidence.all_windows_verbatim === true,
  metadata_not_primary_evidence: evidence.metadata_not_primary_evidence === true,
  index_not_primary_evidence: evidence.index_not_primary_evidence === true,
  external_handoff_ok: evidence.external_handoff_ok === true,
  primary_source_count: evidence.primary_source_count ?? custody.source_count ?? 0,
  source_window_count: evidence.source_window_count ?? ledger.length
};

const overallStatus = stageRows.some((row) => ["FAIL", "MISSING", "PARSE_ERROR"].includes(row.status))
  ? "FAIL"
  : stageRows.some((row) => row.status === "REINVESTIGATE")
    ? "REINVESTIGATE"
    : "PASS";

const uiPayload = {
  artifact_type: "stage5_action_ui_summary",
  generated_at: new Date().toISOString(),
  audit_output_dir: outputRoot,
  overall_status: overallStatus,
  stage_rows: stageRows.map(({ artifact, ...row }) => ({ ...row, artifact })),
  contract_checks: contractChecks,
  reinvestigation_requests: stageRows.flatMap((row) => reinvestigationRequests(row.artifact).map((request) => ({ stage: row.id, ...request }))),
  artifact_files: [
    "stage5-canonical-runtime-summary.json",
    "stage5a-product-function-discovery.json",
    "stage5b-archetype-surface-tagging.json",
    "stage5c-complete-feature-records.json",
    "stage5d-target-feature-profile-integrator.json",
    "stage5-final-target-feature-profile.json",
    "stage5-lossless-custody-manifest.json",
    "stage5-source-window-ledger.json",
    "stage5-validation-summary.json"
  ].map(artifactInfo)
};

writeJson("stage5-action-ui-summary.json", uiPayload);

const lines = [];
lines.push("## Stage 5 Canonical Audit UI");
lines.push("");
lines.push(`**Overall Stage 5 status:** ${overallStatus}`);
lines.push("");
lines.push("| Substage | Status | Primary rows | Source windows | Reinvestigation requests | Artifact |");
lines.push("|---|---:|---:|---:|---:|---|");
for (const row of stageRows) {
  lines.push(`| ${row.id} — ${row.label} | ${row.status} | ${row.primary_count} | ${row.source_window_count} | ${row.reinvestigation_request_count} | ${row.file} |`);
}
lines.push("");
lines.push("### Evidence custody / handoff checks");
lines.push("");
lines.push("| Check | Value |");
lines.push("|---|---:|");
for (const [key, value] of Object.entries(contractChecks)) {
  lines.push(`| ${key} | ${String(value)} |`);
}

const markdown = `${lines.join("\n")}\n`;
writeText("stage5-action-ui-summary.md", markdown);

if (summaryPath) {
  fs.appendFileSync(summaryPath, `\n${markdown}\n`, "utf8");
}

if (overallStatus === "FAIL") {
  console.log("::warning title=Stage 5 audit UI::Stage 5 audit artifacts are missing, invalid, or failed. See stage5-action-ui-summary.json.");
} else if (overallStatus === "REINVESTIGATE") {
  console.log("::notice title=Stage 5 audit UI::Stage 5 completed with reinvestigation required. See stage5-action-ui-summary.json.");
} else {
  console.log("::notice title=Stage 5 audit UI::Stage 5 canonical audit UI summary published.");
}
