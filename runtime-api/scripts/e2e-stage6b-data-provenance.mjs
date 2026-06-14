#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { runDiligenceStage } from "../src/diligence/stageRunnerLocked.js";

const stage5CachePath = process.env.STAGE5_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage5-target-feature-profile.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fail(message, detail = null) {
  console.error(JSON.stringify({ ok: false, phase: "stage6b_data_provenance_e2e", error: message, detail }, null, 2));
  process.exit(1);
}

function fixtureInput() {
  return {
    source_bundle: {
      source_bundle_version: "source_bundle_fixture_v1",
      evidence_buffer: [
        {
          evidence_source_id: "SRC_001",
          source_url: "https://example.com/privacy",
          source_type: "privacy_document",
          clean_text_lossless: "Example privacy notice says users provide account details, prompts, uploaded files, and usage data. It mentions retention, deletion requests, service providers, analytics, and AI processing."
        }
      ]
    },
    company_profile: {
      target_profile_version: "target_profile_v2",
      identity: { company_name: { value: "FixtureCo" } }
    },
    target_feature_profile: {
      feature_profile_version: "feature_profile_v2",
      feature_inventory: [
        {
          feature_id: "F001",
          feature_name: "AI workspace assistant",
          feature_role: "CORE",
          surface_tokens: ["web_app", "api"],
          confidence: "high"
        }
      ],
      data_provenance_map: [
        {
          provenance_id: "DP001",
          feature_id: "F001",
          data_origin: "user_provided",
          data_subject: "customer user",
          data_category: "prompt input and uploaded file",
          processing_context: "AI generation and summarization",
          storage_or_retention_signal: "retention and deletion described",
          training_or_finetuning_signal: "not used for fine tuning unless opted in",
          source_url: "https://example.com/privacy",
          evidence_refs: ["SRC_001"],
          confidence: "high"
        },
        {
          provenance_id: "DP002",
          feature_id: "F001",
          data_origin: "automatically_collected",
          data_subject: "customer user",
          data_category: "usage analytics and device data",
          processing_context: "security monitoring and analytics",
          storage_or_retention_signal: "stored in logs",
          training_or_finetuning_signal: "unknown",
          source_url: "https://example.com/privacy",
          evidence_refs: ["SRC_001"],
          confidence: "medium"
        }
      ],
      regulated_surface_map: [
        { feature_id: "F001", surface_token: "ai_generation" },
        { feature_id: "F001", surface_token: "personal_data_processing" }
      ],
      architecture_hints: [
        { feature_id: "F001", hint_type: "model_provider", hint_value: "hosted model provider" },
        { feature_id: "F001", hint_type: "cloud_provider", hint_value: "cloud hosted service" }
      ],
      product_feature_map: [],
      limitations: []
    },
    evidence_junction: {
      evidence_junction_version: "evidence_junction_fixture_v1"
    }
  };
}

function inputFromCache(cache) {
  return {
    source_bundle: cache.source_bundle,
    company_profile: cache.company_profile || cache.target_profile_v2,
    target_profile: cache.target_profile_v2 || cache.company_profile,
    target_feature_profile: cache.target_feature_profile || cache.feature_profile_v2,
    evidence_junction: cache.evidence_junction
  };
}

function loadInput() {
  if (fs.existsSync(stage5CachePath)) return { input: inputFromCache(readJson(stage5CachePath)), cache_mode: "stage5_cache", cache_path: stage5CachePath };
  return { input: fixtureInput(), cache_mode: "fixture_no_stage5_cache", cache_path: null };
}

const { input, cache_mode: cacheMode, cache_path: cachePath } = loadInput();
if (!Array.isArray(input.target_feature_profile?.data_provenance_map) || input.target_feature_profile.data_provenance_map.length === 0) {
  fail("Stage 6B E2E requires Stage 5 data_provenance_map rows.", { cache_mode: cacheMode, cache_path: cachePath });
}

const result = await runDiligenceStage({
  stageId: "stage6b_data_provenance",
  input,
  options: { disableSemanticClassification: true },
  env: { ...process.env, STAGE6_DISABLE_SEMANTIC_MODEL: "true" }
});

if (!result.ok) fail("Stage 6B runtime stage failed", result);
const review = result.stage6_review;
const dataFlowRows = review.data_provenance_profile?.data_flow_profile || [];
if (dataFlowRows.length !== input.target_feature_profile.data_provenance_map.length) {
  fail("Stage 6B did not preserve one data-flow row per Stage 5 provenance row.", {
    stage5_provenance_count: input.target_feature_profile.data_provenance_map.length,
    stage6_data_flow_count: dataFlowRows.length
  });
}
if (!review.stage7_navigation_index?.feature_to_data_flow_index?.length) fail("feature_to_data_flow_index was not derived.", result.stage6_summary);
if (!review.stage7_navigation_index?.data_signal_index?.length) fail("data_signal_index was not derived.", result.stage6_summary);

console.log(JSON.stringify({
  ok: true,
  phase: "stage6b_data_provenance_e2e",
  cache_mode: cacheMode,
  cache_path: cachePath,
  semantic_model_attempted: result.semantic_model_attempted,
  validation_mode: result.validation_mode,
  stage5_provenance_count: input.target_feature_profile.data_provenance_map.length,
  data_flow_profile_count: dataFlowRows.length,
  feature_to_data_flow_index_count: review.stage7_navigation_index.feature_to_data_flow_index.length,
  data_signal_index_count: review.stage7_navigation_index.data_signal_index.length,
  data_profile_limitation_count: review.data_provenance_profile.data_profile_limitations.length
}, null, 2));
