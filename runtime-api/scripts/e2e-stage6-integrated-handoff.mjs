#!/usr/bin/env node
import path from "node:path";
import { validateStage6ReviewGuardrail } from "../src/diligence/guardrails/stage6ReviewGuardrail.js";
import { buildStage6IntegratedHandoff, buildStage6ToStage7Adapter } from "../src/diligence/stage6IntegratedHandoffBuilder.js";
import { validateDiligenceStageOutput } from "../src/diligence/stageSchemaValidator.js";
import { fail, loadStage5Input, readJson, stage6AuditArtifact, stage6OutputCounts, writeJson } from "./stage6-e2e-utils.mjs";

const phase = "stage6_integrated_handoff_e2e";
const stage6aPath = process.env.STAGE6A_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage6a-legal-cartography.json");
const stage6bPath = process.env.STAGE6B_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage6b-data-provenance.json");
const outputPath = process.env.STAGE6_INTEGRATED_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage6-integrated-handoff.json");
const { input, cache_path: cachePath } = loadStage5Input();

const stage6a = readJson(stage6aPath).stage6_review;
const stage6b = readJson(stage6bPath).stage6_review;
if (!stage6a?.legal_document_cartography) fail(phase, "Stage 6A artifact missing legal_document_cartography.", { stage6aPath }, outputPath);
if (!stage6b?.data_provenance_profile) fail(phase, "Stage 6B artifact missing data_provenance_profile.", { stage6bPath }, outputPath);

const integrated = buildStage6IntegratedHandoff({
  stage6a_review: stage6a,
  stage6b_review: stage6b
});
const stage6ToStage7Adapter = buildStage6ToStage7Adapter(integrated);

const validation = validateDiligenceStageOutput("stage6Review", integrated);
const guardrail = validation.ok ? validateStage6ReviewGuardrail(integrated, { input, stageId: "stage6_integrated_handoff", semanticModelAttempted: true }) : null;
const artifact = {
  ok: validation.ok && guardrail?.ok === true,
  phase,
  stage_id: "stage6_integrated_handoff",
  cache_path: cachePath,
  stage6a_artifact_path: stage6aPath,
  stage6b_artifact_path: stage6bPath,
  schema_valid: validation.ok,
  validation_errors: validation.errors || [],
  guardrail_ok: guardrail?.ok ?? false,
  critical_count: guardrail?.critical?.length || 0,
  repair_count: guardrail?.repairs?.length || 0,
  warning_count: guardrail?.warnings?.length || 0,
  output_counts: stage6OutputCounts(integrated),
  cache_version: "stage6_canonical_e2e_cache_v1",
  source_bundle: input.source_bundle,
  evidence_junction: input.evidence_junction,
  company_profile: input.company_profile || input.target_profile || null,
  target_profile_v2: input.target_profile || input.company_profile || null,
  target_feature_profile: input.target_feature_profile || null,
  stage6_guardrail: guardrail,
  stage6_review: integrated,
  stage6_to_stage7_adapter: stage6ToStage7Adapter
};
writeJson(outputPath, artifact);

if (!validation.ok) fail(phase, "Integrated Stage 6 output failed schema validation.", validation.errors, outputPath);
if (!guardrail.ok) fail(phase, "Integrated Stage 6 output failed guardrail validation.", guardrail, outputPath);

console.log(JSON.stringify({ ok: true, phase, cache_path: cachePath, output_path: outputPath, output_counts: artifact.output_counts, guardrail_warning_count: artifact.warning_count }, null, 2));
