import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assembleStage10VaultHandoff } from "../src/handoff/stage9ToVaultHandoffAdapter.js";
import { validateReviewReadyHandoff } from "../src/handoff/reviewReadyHandoffValidator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const runtimeRoot = path.resolve(__dirname, "..");
const cacheDir = path.join(runtimeRoot, ".runtime-e2e-cache");

const stage6CachePath = process.env.STAGE6_E2E_CACHE_PATH || path.join(cacheDir, "stage6-integrated-handoff.json");
const stage7ArtifactPath = process.env.STAGE7_AUDIT_EXPORT_PATH || path.join(cacheDir, "stage7-priority-ledger.json");
const stage8CorrectedLedgerPath = process.env.STAGE8_CORRECTED_LEDGER_PATH || path.join(cacheDir, "stage8-corrected-ledger.json");
const stage9Path = path.join(cacheDir, "stage9-report-data.json");
const handoffPath = path.join(cacheDir, "review-ready-remediation-handoff.json");
const previewPath = path.join(cacheDir, "vault-handoff-preview.json");
const validationPath = path.join(cacheDir, "stage10-handoff-validation.json");

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function countPrefillGroups(prefill) {
  return Object.fromEntries(Object.entries(prefill || {}).map(([group, fields]) => [group, Object.keys(fields || {}).length]));
}

function buildPreview(result, validation) {
  const handoff = result.assembly_handoff || {};
  const vault = result.functional_intake_vault || {};
  return {
    ok: validation.ok,
    stage: "10",
    node: result.node,
    run_id: result.run_id,
    handoff_id: result.handoff_envelope?.handoff_id,
    payload_type: result.handoff_envelope?.payload_type,
    payload_ref: result.persistence_plan?.payload_ref,
    vault_schema_version: vault.vault_schema_version,
    intake_mode: vault.intake_mode,
    target_profile: handoff.target_profile,
    feature_count: asArray(handoff.feature_map).length,
    threat_finding_count: asArray(handoff.threat_findings).length,
    legal_document_status_count: asArray(handoff.legal_document_status).length,
    functional_section_keys: Object.keys(vault.functional_sections || {}),
    vault_prefill_counts: countPrefillGroups(handoff.vault_prefill_suggestions),
    vault_confirmation_question_count: asArray(handoff.vault_confirmation_questions).length,
    selected_documents: handoff.assembly_handoff_intake?.document_routes?.selected_documents || [],
    selected_package: handoff.assembly_handoff_intake?.package_selection?.selected_package,
    source_packet_version: result.stage10_source_packet?.stage10_source_packet_version,
    persistence_plan: result.persistence_plan,
    validation_errors: validation.errors,
    validation_warnings: validation.warnings
  };
}

async function readJson(filePath, optional = false) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (optional && error?.code === "ENOENT") return null;
    throw error;
  }
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify({
  ok: true,
  phase: "stage_10_functional_intake_vault_start",
  input_path: stage9Path,
  stage6_cache_path: stage6CachePath,
  stage7_artifact_path: stage7ArtifactPath,
  stage8_corrected_ledger_path: stage8CorrectedLedgerPath,
  handoff_path: handoffPath,
  preview_path: previewPath,
  validation_path: validationPath
}, null, 2));

const stage9ReportData = await readJson(stage9Path);
const stage6Cache = await readJson(stage6CachePath, true);
const stage7Artifact = await readJson(stage7ArtifactPath, true);
const stage8Ledger = await readJson(stage8CorrectedLedgerPath, true);
const result = assembleStage10VaultHandoff({ stage9ReportData, stage6Cache: stage6Cache || {}, stage7Artifact: stage7Artifact || {}, stage8Ledger: stage8Ledger || {} });
const validation = validateReviewReadyHandoff(result);
const preview = buildPreview(result, validation);

await writeJson(handoffPath, result);
await writeJson(previewPath, preview);
await writeJson(validationPath, validation);

console.log(JSON.stringify({
  ok: validation.ok,
  phase: "stage_10_functional_intake_vault_complete",
  handoff_path: handoffPath,
  preview_path: previewPath,
  validation_path: validationPath,
  handoff_id: result.handoff_envelope?.handoff_id,
  target_profile: result.assembly_handoff?.target_profile,
  feature_count: asArray(result.assembly_handoff?.feature_map).length,
  threat_finding_count: asArray(result.assembly_handoff?.threat_findings).length,
  legal_document_status_count: asArray(result.assembly_handoff?.legal_document_status).length,
  vault_prefill_counts: countPrefillGroups(result.assembly_handoff?.vault_prefill_suggestions),
  vault_confirmation_question_count: asArray(result.assembly_handoff?.vault_confirmation_questions).length,
  selected_documents: result.assembly_handoff?.assembly_handoff_intake?.document_routes?.selected_documents || [],
  errors: validation.errors,
  warnings: validation.warnings
}, null, 2));

if (!validation.ok) {
  process.exitCode = 1;
}
