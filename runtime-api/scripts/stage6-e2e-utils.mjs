import fs from "node:fs";
import path from "node:path";
import { runDiligenceStage } from "../src/diligence/stageRunnerLocked.js";

export const DEFAULT_RUNTIME_URL = "https://lexnova-runtime-api-24qnalslaa-uc.a.run.app";
export const DEFAULT_STAGE5_CACHE = path.join(process.cwd(), ".runtime-e2e-cache", "stage5-target-feature-profile.json");

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

export function fail(phase, message, detail = null, artifactPath = null) {
  const payload = { ok: false, phase, error: message, detail };
  if (artifactPath) {
    try { writeJson(artifactPath, payload); } catch {}
    payload.artifact_path = artifactPath;
  }
  console.error(JSON.stringify(payload, null, 2));
  process.exit(1);
}

export function inputFromStage5Cache(cache = {}) {
  return {
    source_bundle: cache.source_bundle,
    company_profile: cache.company_profile || cache.target_profile_v2,
    target_profile: cache.target_profile_v2 || cache.company_profile,
    target_feature_profile: cache.target_feature_profile || cache.feature_profile_v2,
    evidence_junction: cache.evidence_junction
  };
}

export function loadStage5Input(cachePath = process.env.STAGE5_E2E_CACHE_PATH || DEFAULT_STAGE5_CACHE) {
  if (!fs.existsSync(cachePath)) fail("stage6_e2e", "Stage 5 cache is required before Stage 6 audit.", { cache_path: cachePath });
  const cache = readJson(cachePath);
  return { input: inputFromStage5Cache(cache), cache, cache_path: cachePath };
}

function normalizeBase(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return new URL(withScheme).toString().replace(/\/+$/, "");
}

async function readResponseJson(response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { non_json_body: text.slice(0, 3000) }; }
}

export async function runStage6Runtime({ stageId, input, options = {}, env = process.env } = {}) {
  const runtimeUrl = env.RUNTIME_URL || env.LEXNOVA_RUNTIME_URL;
  const token = env.RUNTIME_ACCESS_TOKEN;
  if (runtimeUrl && token) {
    const base = normalizeBase(runtimeUrl || DEFAULT_RUNTIME_URL);
    const response = await fetch(`${base}/v1/diligence/stage`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-runtime-access-token": token },
      body: JSON.stringify({ stage: stageId, input, options })
    });
    const json = await readResponseJson(response);
    return { ok: response.ok && json?.ok !== false, audit_target: "remote", runtime_url: base, status: response.status, payload: json };
  }
  const payload = await runDiligenceStage({ stageId, input, options, env });
  return { ok: payload?.ok === true, audit_target: "local", runtime_url: null, status: payload?.status || (payload?.ok ? 200 : 500), payload };
}

export function stage6OutputCounts(stage6Review = {}) {
  const nav = stage6Review.stage7_navigation_index || {};
  const cartography = stage6Review.legal_document_cartography || {};
  const provenance = stage6Review.data_provenance_profile || {};
  return {
    legal_document_inventory_count: Array.isArray(cartography.legal_document_inventory) ? cartography.legal_document_inventory.length : 0,
    legal_document_index_count: Array.isArray(cartography.legal_document_index) ? cartography.legal_document_index.length : 0,
    document_relationship_map_count: Array.isArray(cartography.document_relationship_map) ? cartography.document_relationship_map.length : 0,
    document_control_signal_map_count: Array.isArray(cartography.document_control_signal_map) ? cartography.document_control_signal_map.length : 0,
    document_mismatch_signal_map_count: Array.isArray(cartography.document_mismatch_signal_map) ? cartography.document_mismatch_signal_map.length : 0,
    data_flow_profile_count: Array.isArray(provenance.data_flow_profile) ? provenance.data_flow_profile.length : 0,
    feature_to_legal_unit_index_count: Array.isArray(nav.feature_to_legal_unit_index) ? nav.feature_to_legal_unit_index.length : 0,
    feature_to_data_flow_index_count: Array.isArray(nav.feature_to_data_flow_index) ? nav.feature_to_data_flow_index.length : 0,
    control_family_index_count: Array.isArray(nav.control_family_index) ? nav.control_family_index.length : 0,
    data_signal_index_count: Array.isArray(nav.data_signal_index) ? nav.data_signal_index.length : 0,
    legal_unit_source_locator_index_count: Array.isArray(nav.legal_unit_source_locator_index) ? nav.legal_unit_source_locator_index.length : 0,
    absence_unknown_index_count: Array.isArray(nav.absence_unknown_index) ? nav.absence_unknown_index.length : 0,
    fallback_source_packet_count: Array.isArray(nav.fallback_source_packet) ? nav.fallback_source_packet.length : 0
  };
}

export function stage6AuditArtifact({ phase, stageId, cachePath, runtime, stage6Review, extra = {} }) {
  const guardrail = runtime.payload?.stage6_guardrail || runtime.payload?.stage6_summary?.stage6_guardrail || null;
  return {
    ok: runtime.ok,
    phase,
    stage_id: stageId,
    audit_target: runtime.audit_target,
    runtime_url: runtime.runtime_url,
    status: runtime.status,
    cache_path: cachePath,
    stage6_component: stage6Review?.stage6_component || null,
    schema_valid: runtime.ok,
    guardrail_ok: guardrail?.ok ?? (runtime.payload?.stage6_summary?.guardrail_ok ?? null),
    critical_count: guardrail?.critical?.length ?? (runtime.payload?.stage6_summary?.guardrail_critical_count ?? 0),
    repair_count: guardrail?.repairs?.length ?? (runtime.payload?.stage6_summary?.guardrail_repair_count ?? 0),
    warning_count: guardrail?.warnings?.length ?? (runtime.payload?.stage6_summary?.guardrail_warning_count ?? 0),
    output_counts: stage6OutputCounts(stage6Review),
    packet_summary: runtime.payload?.packet_summary || null,
    stage6_summary: runtime.payload?.stage6_summary || null,
    model_attempted: runtime.payload?.semantic_model_attempted ?? null,
    model_metadata: runtime.payload?.model_metadata || null,
    stage6_review: stage6Review || null,
    ...extra
  };
}
