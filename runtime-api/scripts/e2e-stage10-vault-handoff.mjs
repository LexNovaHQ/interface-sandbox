import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assembleStage10VaultHandoff } from "../src/handoff/stage9ToVaultHandoffAdapter.js";
import { validateReviewReadyHandoff } from "../src/handoff/reviewReadyHandoffValidator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const runtimeRoot = path.resolve(__dirname, "..");
const cacheDir = path.join(runtimeRoot, ".runtime-e2e-cache");

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
  return {
    ok: validation.ok,
    stage: "10",
    node: result.node,
    run_id: result.run_id,
    handoff_id: result.handoff_envelope?.handoff_id,
    payload_type: result.handoff_envelope?.payload_type,
    payload_ref: result.persistence_plan?.payload_ref,
    target_profile: handoff.target_profile,
    feature_count: asArray(handoff.feature_map).length,
    threat_finding_count: asArray(handoff.threat_findings).length,
    document_stack_count: asArray(handoff.document_stack_status).length,
    vault_prefill_counts: countPrefillGroups(handoff.vault_prefill_suggestions),
    vault_confirmation_question_count: asArray(handoff.vault_confirmation_questions).length,
    assembly_route_keys: Object.keys(handoff.assembly_route_recommendation || {}),
    remediation_roadmap_count: asArray(handoff.assembly_route_recommendation?.remediation_roadmap).length,
    document_route_count: asArray(handoff.assembly_route_recommendation?.document_routes).length,
    control_route_count: asArray(handoff.assembly_route_recommendation?.control_routes).length,
    persistence_plan: result.persistence_plan,
    validation_errors: validation.errors,
    validation_warnings: validation.warnings
  };
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify({
  ok: true,
  phase: "stage_10_vault_handoff_start",
  input_path: stage9Path,
  handoff_path: handoffPath,
  preview_path: previewPath,
  validation_path: validationPath
}, null, 2));

const stage9ReportData = await readJson(stage9Path);
const result = assembleStage10VaultHandoff(stage9ReportData);
const validation = validateReviewReadyHandoff(result, stage9ReportData);
const preview = buildPreview(result, validation);

await writeJson(handoffPath, result);
await writeJson(previewPath, preview);
await writeJson(validationPath, validation);

console.log(JSON.stringify({
  ok: validation.ok,
  phase: "stage_10_vault_handoff_complete",
  handoff_path: handoffPath,
  preview_path: previewPath,
  validation_path: validationPath,
  handoff_id: result.handoff_envelope?.handoff_id,
  target_profile: result.assembly_handoff?.target_profile,
  feature_count: asArray(result.assembly_handoff?.feature_map).length,
  threat_finding_count: asArray(result.assembly_handoff?.threat_findings).length,
  document_stack_count: asArray(result.assembly_handoff?.document_stack_status).length,
  remediation_roadmap_count: asArray(result.assembly_handoff?.assembly_route_recommendation?.remediation_roadmap).length,
  vault_prefill_counts: countPrefillGroups(result.assembly_handoff?.vault_prefill_suggestions),
  vault_confirmation_question_count: asArray(result.assembly_handoff?.vault_confirmation_questions).length,
  errors: validation.errors,
  warnings: validation.warnings
}, null, 2));

if (!validation.ok) {
  process.exitCode = 1;
}
