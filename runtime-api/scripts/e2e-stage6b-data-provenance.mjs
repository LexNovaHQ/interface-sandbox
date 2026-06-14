#!/usr/bin/env node
import path from "node:path";
import { DEFAULT_RUNTIME_URL, fail, loadStage5Input, runStage6Runtime, stage6AuditArtifact, writeJson } from "./stage6-e2e-utils.mjs";

const phase = "stage6b_data_provenance_e2e";
const outputPath = process.env.STAGE6B_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage6b-data-provenance.json");
const { input, cache_path: cachePath } = loadStage5Input();
const provenanceRows = Array.isArray(input.target_feature_profile?.data_provenance_map) ? input.target_feature_profile.data_provenance_map : [];
if (!provenanceRows.length) fail(phase, "Stage 5 cache has no data_provenance_map rows for 6B.", { cache_path: cachePath }, outputPath);

const runtime = await runStage6Runtime({
  stageId: "stage6b_data_provenance",
  input,
  options: {
    disableSemanticClassification: false,
    maxDataFlows: Number(process.env.STAGE6_MAX_DATA_FLOWS || 40),
    textWindowChars: Number(process.env.STAGE6_TEXT_WINDOW_CHARS || 600),
    maxOutputTokens: Number(process.env.STAGE6B_SEMANTIC_MAX_OUTPUT_TOKENS || process.env.STAGE6_SEMANTIC_MAX_OUTPUT_TOKENS || 12000),
    timeoutMs: Number(process.env.STAGE6B_SEMANTIC_TIMEOUT_MS || process.env.STAGE6_SEMANTIC_TIMEOUT_MS || 90000),
    maxAttempts: Number(process.env.STAGE6_SEMANTIC_MAX_ATTEMPTS || 3)
  },
  env: {
    ...process.env,
    RUNTIME_URL: process.env.RUNTIME_URL || process.env.LEXNOVA_RUNTIME_URL || DEFAULT_RUNTIME_URL,
    STAGE6_E2E_FORCE_LOCAL: "false",
    STAGE6_AUDIT_TARGET: "remote",
    STAGE6_DISABLE_SEMANTIC_MODEL: "false"
  }
});

const stage6Review = runtime.payload?.stage6_review;
const artifact = stage6AuditArtifact({ phase, stageId: "stage6b_data_provenance", cachePath, runtime, stage6Review, extra: { stage5_provenance_count: provenanceRows.length } });
writeJson(outputPath, artifact);

if (runtime.audit_target !== "remote") fail(phase, "Stage 6B audit did not hit the live runtime.", artifact, outputPath);
if (!runtime.ok) fail(phase, "Stage 6B runtime failed.", runtime.payload, outputPath);
if (!stage6Review) fail(phase, "Stage 6B returned no stage6_review.", runtime.payload, outputPath);
if (stage6Review.stage6_component !== "stage6b_data_provenance") fail(phase, "Stage 6B returned wrong stage6_component.", { stage6_component: stage6Review.stage6_component }, outputPath);
if (stage6Review.legal_document_cartography) fail(phase, "Stage 6B output mixed in 6A cartography.", null, outputPath);
if (!stage6Review.data_provenance_profile) fail(phase, "Stage 6B missing data_provenance_profile.", null, outputPath);
if ((stage6Review.data_provenance_profile.data_flow_profile || []).length !== provenanceRows.length) fail(phase, "Stage 6B row count does not match Stage 5 provenance row count.", { stage5_provenance_count: provenanceRows.length, stage6_data_flow_count: stage6Review.data_provenance_profile.data_flow_profile?.length || 0 }, outputPath);
if (artifact.critical_count > 0 || artifact.guardrail_ok === false) fail(phase, "Stage 6B guardrail failed.", artifact, outputPath);
if (runtime.payload?.semantic_model_attempted !== true) fail(phase, "Stage 6B semantic model was not active.", runtime.payload, outputPath);

console.log(JSON.stringify({ ok: true, phase, cache_path: cachePath, output_path: outputPath, audit_target: runtime.audit_target, runtime_url: runtime.runtime_url, stage5_provenance_count: provenanceRows.length, output_counts: artifact.output_counts, guardrail_warning_count: artifact.warning_count, semantic_model_attempted: runtime.payload.semantic_model_attempted }, null, 2));
