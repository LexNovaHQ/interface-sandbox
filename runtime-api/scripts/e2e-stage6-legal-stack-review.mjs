#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { buildLegalStackReviewInput } from "../src/diligence/adapters/legalStackReviewInputAdapter.js";

const DEFAULT_RUNTIME_URL = "https://lexnova-runtime-api-24qnalslaa-uc.a.run.app";
const runtimeUrl = process.env.RUNTIME_URL || process.env.LEXNOVA_RUNTIME_URL || DEFAULT_RUNTIME_URL;
const token = process.env.RUNTIME_ACCESS_TOKEN;
const stage5CachePath = process.env.STAGE5_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage5-target-feature-profile.json");
const stage6CachePath = process.env.STAGE6_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage6-legal-stack-review.json");

function fail(message, detail) {
  console.error(JSON.stringify({ ok: false, error: message, detail: detail || null }, null, 2));
  process.exit(1);
}
function writeJson(filePath, value) { fs.mkdirSync(path.dirname(filePath), { recursive: true }); fs.writeFileSync(filePath, JSON.stringify(value, null, 2)); }
function normalizeBase(value) { const raw = String(value || "").trim(); if (!raw) return ""; const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`; try { return new URL(withScheme).toString().replace(/\/+$/, ""); } catch (error) { fail("RUNTIME_URL must be valid", { received: raw, error: error.message }); } }
function readStage5Cache(filePath) { if (!fs.existsSync(filePath)) fail("Stage 5 cache missing. Run e2e:stage5:features first in the same workflow/job.", { cache_path: filePath }); const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")); if (parsed?.cache_version !== "stage5_target_feature_profile_e2e_cache_v1") fail("Bad Stage 5 cache version", { cache_version: parsed?.cache_version }); if (!parsed.source_bundle || !parsed.evidence_junction || !parsed.target_feature_profile) fail("Stage 5 cache incomplete", { keys: Object.keys(parsed || {}) }); return parsed; }
async function readJson(response) { const text = await response.text(); try { return JSON.parse(text); } catch { return { non_json_body: text.slice(0, 3000) }; } }
async function postJson(base, routePath, body) { const response = await fetch(`${base}${routePath}`, { method: "POST", headers: { "content-type": "application/json", "x-runtime-access-token": token }, body: JSON.stringify(body) }); const json = await readJson(response); if (!response.ok || json?.ok === false) fail(`Request failed: ${routePath}`, { status: response.status, body: json }); return json; }
function tokenDrift(actual, estimated) { const a = Number(actual || 0); const e = Number(estimated || 0); if (!a || !e) return null; return Number((a / e).toFixed(3)); }
function textContains(text, terms) { const lower = String(text || "").toLowerCase(); return terms.some((term) => lower.includes(term)); }
function embeddedArtifactGuard(input, review) { const text = (input.source_bundle?.evidence_buffer || []).map((record) => record.clean_text_lossless || "").join("\n\n"); const legalStack = Array.isArray(review?.legal_stack) ? review.legal_stack : []; const byType = Object.fromEntries(legalStack.map((doc) => [doc.document_type, doc])); return { has_dpa_evidence: textContains(text, ["data processing addendum", "data processing agreement", "annexure c"]), has_aup_evidence: textContains(text, ["acceptable use", "prohibited use", "usage restrictions"]), has_sla_evidence: textContains(text, ["service level agreement", "uptime", "availability commitment", "service credits", "annexure a"]), dpa_status: byType.DPA?.evidence_status || null, aup_status: byType.AUP?.evidence_status || null, sla_status: byType.SLA?.evidence_status || null, dpa_exists: byType.DPA?.exists ?? null, aup_exists: byType.AUP?.exists ?? null, sla_exists: byType.SLA?.exists ?? null }; }
function isObject(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function assertArray(value, label) { if (!Array.isArray(value)) fail(`${label} must be an array`, { value }); }
function assertObject(value, label) { if (!isObject(value)) fail(`${label} must be an object`, { value }); }
function assertAbsent(value, label) { if (value !== undefined) fail(`${label} must not be emitted in Stage 6A`, { value }); }
function assertNoForbiddenKeys(value, forbiddenKeys, basePath = "") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(item, forbiddenKeys, `${basePath}/${index}`));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${basePath}/${key}`;
    if (forbiddenKeys.has(key)) fail(`Forbidden key in legal_document_cartography: ${key}`, { path: childPath });
    assertNoForbiddenKeys(child, forbiddenKeys, childPath);
  }
}
function assertNoRegistryVaultReportLeakage(review) {
  const forbidden = new Set(["registry_ledger", "registry_evaluation", "final_status", "controlled_rows", "insufficient_evidence_rows", "operator_challenge", "report_data", "technical_audit_log", "assembly_route", "vault_confirmation_questions", "vault_prefill_suggestions", "vault_payload", "html"]);
  assertNoForbiddenKeys(review, forbidden, "");
}
function assertStage6ACanon(review) {
  assertArray(review.legal_stack, "legacy legal_stack");
  assertArray(review.document_stack_redline, "legacy document_stack_redline");
  if (typeof review.document_stack_synthesis !== "string") fail("legacy document_stack_synthesis must be a string", { value: review.document_stack_synthesis });
  assertArray(review.legal_stack_assessment, "legacy legal_stack_assessment");
  assertArray(review.limitations, "legacy limitations");
  if (review.legal_stack_review_version !== "legal_stack_review_v2") fail("legal_stack_review_version must equal legal_stack_review_v2", { value: review.legal_stack_review_version });
  if (review.stage_role !== "stage7_navigation_index") fail("stage_role must equal stage7_navigation_index", { value: review.stage_role });
  assertAbsent(review.data_provenance_profile, "data_provenance_profile");

  const cartography = review.legal_document_cartography;
  assertObject(cartography, "legal_document_cartography");
  assertArray(cartography.legal_document_inventory, "legal_document_cartography.legal_document_inventory");
  assertArray(cartography.legal_document_index, "legal_document_cartography.legal_document_index");
  assertArray(cartography.document_relationship_map, "legal_document_cartography.document_relationship_map");
  assertArray(cartography.document_control_signal_map, "legal_document_cartography.document_control_signal_map");
  assertArray(cartography.document_mismatch_signal_map, "legal_document_cartography.document_mismatch_signal_map");
  assertObject(cartography.legal_stack_summary_signals, "legal_document_cartography.legal_stack_summary_signals");
  assertArray(cartography.legal_stack_limitations, "legal_document_cartography.legal_stack_limitations");
  assertNoForbiddenKeys(cartography, new Set(["quote", "evidence_quote", "excerpt_text", "excerpt", "contradicts", "false_belief_note", "coverage_note", "narrative", "explanation", "analysis"]), "/legal_document_cartography");

  const navigation = review.stage7_navigation_index;
  assertObject(navigation, "stage7_navigation_index");
  assertArray(navigation.feature_to_document_section_index, "stage7_navigation_index.feature_to_document_section_index");
  assertArray(navigation.control_family_index, "stage7_navigation_index.control_family_index");
  assertArray(navigation.document_source_locator_index, "stage7_navigation_index.document_source_locator_index");
  assertArray(navigation.absence_unknown_index, "stage7_navigation_index.absence_unknown_index");
  assertArray(navigation.fallback_source_packet, "stage7_navigation_index.fallback_source_packet");
  assertAbsent(navigation.feature_to_data_flow_index, "stage7_navigation_index.feature_to_data_flow_index");
  assertAbsent(navigation.data_signal_index, "stage7_navigation_index.data_signal_index");
  assertNoRegistryVaultReportLeakage(review);
}

if (!token) fail("RUNTIME_ACCESS_TOKEN is required");
const base = normalizeBase(runtimeUrl);
const cache = readStage5Cache(stage5CachePath);
console.log(JSON.stringify({ ok: true, step: "start", phase: "stage_6_legal_stack_review_e2e", cache_path: stage5CachePath, runtime_url: base }, null, 2));

const adapterResult = buildLegalStackReviewInput({ sourceBundle: cache.source_bundle, evidenceJunction: cache.evidence_junction, targetFeatureProfile: cache.target_feature_profile, runId: `stage6_legal_stack_review_input_${Date.now()}`, budget: { max_input_chars: Number(process.env.STAGE6_MAX_INPUT_CHARS || 120000), max_estimated_tokens: Number(process.env.STAGE6_MAX_ESTIMATED_TOKENS || 60000), max_single_source_chars: Number(process.env.STAGE6_MAX_SINGLE_SOURCE_CHARS || 60000), prompt_overhead_tokens: Number(process.env.STAGE6_PROMPT_OVERHEAD_TOKENS || 25000) } });
if (!adapterResult.ok) fail("Legal Stack Review input adapter failed", adapterResult);
const stage6Input = adapterResult.legal_stack_review_input;
console.log(JSON.stringify({ ok: true, step: "stage6_adapter_complete", budget_status: stage6Input.input_budget.budget_status, estimated_total_prompt_tokens: stage6Input.input_budget.estimated_total_prompt_tokens, included_sources: stage6Input.input_budget.included_sources.length, excluded_sources: stage6Input.input_budget.excluded_sources.length }, null, 2));

const legalStage = await postJson(base, "/v1/diligence/stage", { stage: "legal_stack_review", input: stage6Input, options: { pool: process.env.STAGE6_POOL || "reasoning", maxOutputTokens: Number(process.env.STAGE6_MAX_OUTPUT_TOKENS || 8192), timeoutMs: Number(process.env.STAGE6_TIMEOUT_MS || 90000) } });
const review = legalStage.legal_stack_review;
if (!review) fail("Legal Stack Review stage returned no review", legalStage);
if (!Array.isArray(review.legal_stack) || review.legal_stack.length !== 5) fail("Legal Stack Review legal_stack must contain five entries", review);
assertStage6ACanon(review);

writeJson(stage6CachePath, { cache_version: "stage6_legal_stack_review_e2e_cache_v1", generated_at: new Date().toISOString(), source_bundle: cache.source_bundle, evidence_junction: cache.evidence_junction, company_profile: cache.company_profile, target_feature_profile: cache.target_feature_profile, legal_stack_review_stage_result: legalStage, legal_stack_review: review });

const actualPromptTokens = legalStage.model_metadata?.usage_metadata?.promptTokenCount || null;
const guard = embeddedArtifactGuard(stage6Input, review);
console.log(JSON.stringify({ ok: true, phase: "stage_6_legal_stack_review_e2e", cache_path: stage6CachePath, cache_written: true, adapter_version: stage6Input.legal_stack_review_input_version, budget_status: stage6Input.input_budget.budget_status, estimated_total_prompt_tokens: stage6Input.input_budget.estimated_total_prompt_tokens, actual_prompt_tokens: actualPromptTokens, token_estimate_drift_ratio: tokenDrift(actualPromptTokens, stage6Input.input_budget.estimated_total_prompt_tokens), included_sources: stage6Input.input_budget.included_sources.length, excluded_sources: stage6Input.input_budget.excluded_sources.length, legal_stack_review_version: review.legal_stack_review_version, stage_role: review.stage_role, legal_stack_count: review.legal_stack.length, legal_stack_statuses: Object.fromEntries(review.legal_stack.map((doc) => [doc.document_type, { exists: doc.exists, evidence_status: doc.evidence_status, document_url: doc.document_url }])), redline_count: review.document_stack_redline?.length || 0, assessment_count: review.legal_stack_assessment?.length || 0, limitation_count: review.limitations?.length || 0, legal_document_inventory_count: review.legal_document_cartography?.legal_document_inventory?.length || 0, legal_document_index_count: review.legal_document_cartography?.legal_document_index?.length || 0, document_relationship_count: review.legal_document_cartography?.document_relationship_map?.length || 0, document_control_signal_count: review.legal_document_cartography?.document_control_signal_map?.length || 0, document_mismatch_signal_count: review.legal_document_cartography?.document_mismatch_signal_map?.length || 0, stage7_document_locator_count: review.stage7_navigation_index?.document_source_locator_index?.length || 0, embedded_artifact_guard: guard, validation_mode: legalStage.validation_mode, guardrail_validation_mode: legalStage.guardrail_validation_mode, runtime_instruction_configured: legalStage.prompt_metadata?.runtime_instruction_configured === true, model_metadata: legalStage.model_metadata || null }, null, 2));
