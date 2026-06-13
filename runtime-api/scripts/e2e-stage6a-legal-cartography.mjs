#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { runStage6ALegalCartography } from "../src/diligence/stage6aModelOverlayRunner.js";

const DEFAULT_RUNTIME_URL = "https://lexnova-runtime-api-24qnalslaa-uc.a.run.app";
const runtimeUrl = process.env.RUNTIME_URL || process.env.LEXNOVA_RUNTIME_URL || DEFAULT_RUNTIME_URL;
const token = process.env.RUNTIME_ACCESS_TOKEN;
const stage5CachePath = process.env.STAGE5_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage5-target-feature-profile.json");
const stage6aCachePath = process.env.STAGE6A_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage6a-legal-cartography.json");
const auditTarget = process.env.STAGE6A_AUDIT_TARGET || (token ? "remote" : "local");

const LEGACY_FIELDS = new Set([
  "legal_stack",
  "document_stack_redline",
  "document_stack_synthesis",
  "legal_stack_assessment",
  "limitations"
]);

const STAGE6B_FIELDS = new Set([
  "data_provenance_profile",
  "feature_to_data_flow_index",
  "data_signal_index"
]);

const REPORT_OR_CONCLUSION_FIELDS = new Set([
  "registry_ledger",
  "registry_evaluation",
  "threat_status",
  "triggered_threat_ids",
  "final_status",
  "report_data",
  "html",
  "vault_confirmation_questions",
  "vault_prefill_suggestions",
  "quote",
  "evidence_quote",
  "excerpt_text",
  "excerpt",
  "long_prose_explanation",
  "legal_conclusion",
  "compliance_verdict",
  "recommendation",
  "control_gap"
]);

function fail(message, detail) {
  console.error(JSON.stringify({ ok: false, error: message, detail: detail || null }, null, 2));
  process.exit(1);
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function normalizeBase(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withScheme).toString().replace(/\/+$/, "");
  } catch (error) {
    fail("RUNTIME_URL must be valid", { received: raw, error: error.message });
  }
}

function readStage5Cache(filePath) {
  if (!fs.existsSync(filePath)) fail("Stage 5 cache missing. Run e2e:stage5:features first in the same workflow/job.", { cache_path: filePath });
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (parsed?.cache_version !== "stage5_target_feature_profile_e2e_cache_v1") fail("Bad Stage 5 cache version", { cache_version: parsed?.cache_version });
  if (!parsed.source_bundle || !parsed.evidence_junction || !parsed.target_feature_profile) fail("Stage 5 cache incomplete", { keys: Object.keys(parsed || {}) });
  return parsed;
}

async function readJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { non_json_body: text.slice(0, 3000) };
  }
}

async function postJson(base, routePath, body) {
  const response = await fetch(`${base}${routePath}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-runtime-access-token": token
    },
    body: JSON.stringify(body)
  });
  const json = await readJson(response);
  if (!response.ok || json?.ok === false) fail(`Request failed: ${routePath}`, { status: response.status, body: json });
  return json;
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertArray(value, label) {
  if (!Array.isArray(value)) fail(`${label} must be an array`, { value });
}

function assertObject(value, label) {
  if (!isObject(value)) fail(`${label} must be an object`, { value });
}

function assertNoForbiddenKeys(value, forbiddenKeys, basePath = "") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(item, forbiddenKeys, `${basePath}/${index}`));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${basePath}/${key}`;
    if (forbiddenKeys.has(key)) fail(`Forbidden Stage 6A key: ${key}`, { path: childPath });
    assertNoForbiddenKeys(child, forbiddenKeys, childPath);
  }
}

function countFeatures(targetFeatureProfile = {}) {
  return Array.isArray(targetFeatureProfile.feature_inventory) ? targetFeatureProfile.feature_inventory.length : 0;
}

function overlayCounts(overlay = {}) {
  return {
    section_classification_overlay_count: overlay?.section_classification_overlay?.length || 0,
    document_relationship_overlay_count: overlay?.document_relationship_overlay?.length || 0,
    document_control_overlay_count: overlay?.document_control_overlay?.length || 0,
    document_mismatch_overlay_count: overlay?.document_mismatch_overlay?.length || 0,
    feature_section_overlay_count: overlay?.feature_section_overlay?.length || 0,
    overlay_limitations_count: overlay?.overlay_limitations?.length || 0
  };
}

function repairCounts(repairs = []) {
  const dropCount = repairs.filter((repair) => String(repair?.code || "").startsWith("drop_")).length;
  return {
    normalizer_repair_count: repairs.length,
    normalizer_drop_count: dropCount
  };
}

function assertStage6ACanonOnly(review, meta = {}) {
  if (review?.legal_stack_review_version !== "legal_stack_review_v2") fail("legal_stack_review_version must equal legal_stack_review_v2", { value: review?.legal_stack_review_version });
  if (review?.stage_role !== "stage7_navigation_index") fail("stage_role must equal stage7_navigation_index", { value: review?.stage_role });

  for (const key of Object.keys(review || {})) {
    if (LEGACY_FIELDS.has(key)) fail(`Legacy Stage 6 field leaked into Stage 6A output: ${key}`);
    if (STAGE6B_FIELDS.has(key)) fail(`Stage 6B field leaked into Stage 6A output: ${key}`);
    if (REPORT_OR_CONCLUSION_FIELDS.has(key)) fail(`Report/conclusion field leaked into Stage 6A output: ${key}`);
  }

  assertNoForbiddenKeys(review, LEGACY_FIELDS, "");
  assertNoForbiddenKeys(review, STAGE6B_FIELDS, "");
  assertNoForbiddenKeys(review, REPORT_OR_CONCLUSION_FIELDS, "");

  const cartography = review.legal_document_cartography;
  assertObject(cartography, "legal_document_cartography");
  assertArray(cartography.legal_document_inventory, "legal_document_cartography.legal_document_inventory");
  assertArray(cartography.legal_document_index, "legal_document_cartography.legal_document_index");
  assertArray(cartography.document_relationship_map, "legal_document_cartography.document_relationship_map");
  assertArray(cartography.document_control_signal_map, "legal_document_cartography.document_control_signal_map");
  assertArray(cartography.document_mismatch_signal_map, "legal_document_cartography.document_mismatch_signal_map");
  assertObject(cartography.legal_stack_summary_signals, "legal_document_cartography.legal_stack_summary_signals");
  assertArray(cartography.legal_stack_limitations, "legal_document_cartography.legal_stack_limitations");

  const navigation = review.stage7_navigation_index;
  assertObject(navigation, "stage7_navigation_index");
  assertArray(navigation.feature_to_document_section_index, "stage7_navigation_index.feature_to_document_section_index");
  assertArray(navigation.control_family_index, "stage7_navigation_index.control_family_index");
  assertArray(navigation.document_source_locator_index, "stage7_navigation_index.document_source_locator_index");
  assertArray(navigation.absence_unknown_index, "stage7_navigation_index.absence_unknown_index");
  assertArray(navigation.fallback_source_packet, "stage7_navigation_index.fallback_source_packet");

  const admittedLegalSourceCount = Number(meta.packet_summary?.document_inventory_seed_count || cartography.legal_document_inventory.length || 0);
  const sourceHeadingCount = Number(meta.packet_summary?.section_index_seed_count || cartography.legal_document_index.length || 0);
  const stage5FeatureCount = Number(meta.stage5_feature_count || 0);

  if (admittedLegalSourceCount > 0 && cartography.legal_document_inventory.length === 0) fail("Admitted legal/governance sources exist but legal_document_inventory is empty", meta.packet_summary);
  if (sourceHeadingCount > 0 && cartography.legal_document_index.length === 0) fail("Source headings exist but legal_document_index is empty", meta.packet_summary);
  if (cartography.legal_document_index.length > 0 && navigation.document_source_locator_index.length === 0) fail("legal_document_index is non-empty but document_source_locator_index is empty");
  if (cartography.legal_document_inventory.length > 0 && cartography.document_control_signal_map.length === 0) fail("Legal documents exist but document_control_signal_map is empty");
  if (stage5FeatureCount > 0 && navigation.feature_to_document_section_index.length === 0) fail("Stage 5 features exist but feature_to_document_section_index is empty");
  if (meta.model_overlay_attempted !== true && process.env.STAGE6A_DISABLE_MODEL_OVERLAY !== "true") fail("Stage 6A model overlay was not attempted");
}

async function runRemoteStage6A(cache) {
  if (!token) fail("RUNTIME_ACCESS_TOKEN is required for remote Stage 6A audit", { audit_target: auditTarget });
  const base = normalizeBase(runtimeUrl);
  return postJson(base, "/v1/diligence/stage", {
    stage: "stage6a_legal_cartography",
    input: {
      source_bundle: cache.source_bundle,
      evidence_junction: cache.evidence_junction,
      company_profile: cache.company_profile,
      target_profile: cache.company_profile,
      target_feature_profile: cache.target_feature_profile
    },
    options: {
      pool: process.env.STAGE6A_POOL || "reasoning",
      maxOutputTokens: Number(process.env.STAGE6A_MAX_OUTPUT_TOKENS || 24000),
      timeoutMs: Number(process.env.STAGE6A_TIMEOUT_MS || 90000),
      maxSections: Number(process.env.STAGE6A_MAX_SECTIONS || 240),
      textWindowChars: Number(process.env.STAGE6A_TEXT_WINDOW_CHARS || 1800)
    }
  });
}

async function runLocalStage6A(cache) {
  return runStage6ALegalCartography({
    source_bundle: cache.source_bundle,
    evidence_junction: cache.evidence_junction,
    company_profile: cache.company_profile,
    target_profile: cache.company_profile,
    target_feature_profile: cache.target_feature_profile,
    runtime_options: {
      pool: process.env.STAGE6A_POOL || "reasoning",
      maxOutputTokens: Number(process.env.STAGE6A_MAX_OUTPUT_TOKENS || 24000),
      timeoutMs: Number(process.env.STAGE6A_TIMEOUT_MS || 90000),
      maxSections: Number(process.env.STAGE6A_MAX_SECTIONS || 240),
      textWindowChars: Number(process.env.STAGE6A_TEXT_WINDOW_CHARS || 1800)
    },
    env: process.env
  });
}

const cache = readStage5Cache(stage5CachePath);
console.log(JSON.stringify({ ok: true, step: "start", phase: "stage6a_legal_cartography_e2e", cache_path: stage5CachePath, audit_target: auditTarget, runtime_url: auditTarget === "remote" ? normalizeBase(runtimeUrl) : null }, null, 2));

const result = auditTarget === "remote" ? await runRemoteStage6A(cache) : await runLocalStage6A(cache);
if (!result?.ok) fail("Stage 6A Legal Cartography audit failed", result);

const review = result.legal_stack_review || result.cartography;
if (!review) fail("Stage 6A Legal Cartography returned no canonical output", result);

const meta = {
  packet_summary: result.packet_summary || null,
  stage5_feature_count: countFeatures(cache.target_feature_profile),
  model_overlay_attempted: result.model_overlay_attempted === true
};
assertStage6ACanonOnly(review, meta);

const overlaySummary = overlayCounts(result.normalized_overlay || {});
const repairSummary = repairCounts(result.overlay_repairs || []);
const countSummary = {
  legal_document_inventory_count: review.legal_document_cartography.legal_document_inventory.length,
  legal_document_index_count: review.legal_document_cartography.legal_document_index.length,
  document_relationship_map_count: review.legal_document_cartography.document_relationship_map.length,
  document_control_signal_map_count: review.legal_document_cartography.document_control_signal_map.length,
  document_mismatch_signal_map_count: review.legal_document_cartography.document_mismatch_signal_map.length,
  feature_to_document_section_index_count: review.stage7_navigation_index.feature_to_document_section_index.length,
  control_family_index_count: review.stage7_navigation_index.control_family_index.length,
  document_source_locator_index_count: review.stage7_navigation_index.document_source_locator_index.length,
  absence_unknown_index_count: review.stage7_navigation_index.absence_unknown_index.length,
  fallback_source_packet_count: review.stage7_navigation_index.fallback_source_packet.length
};

writeJson(stage6aCachePath, {
  cache_version: "stage6a_legal_cartography_e2e_cache_v1",
  generated_at: new Date().toISOString(),
  audit_target: auditTarget,
  source_bundle: cache.source_bundle,
  evidence_junction: cache.evidence_junction,
  company_profile: cache.company_profile,
  target_feature_profile: cache.target_feature_profile,
  stage6a_legal_cartography_stage_result: result,
  legal_stack_review: review
});

console.log(JSON.stringify({
  ok: true,
  phase: "stage6a_legal_cartography_e2e",
  cache_path: stage6aCachePath,
  cache_written: true,
  audit_target: auditTarget,
  stage_id: result.stage_id || "stage6a_legal_cartography",
  validation_mode: result.validation_mode || null,
  model_overlay_attempted: result.model_overlay_attempted === true,
  packet_summary: result.packet_summary || null,
  ...countSummary,
  ...overlaySummary,
  ...repairSummary,
  model_metadata: result.model_metadata || null
}, null, 2));
