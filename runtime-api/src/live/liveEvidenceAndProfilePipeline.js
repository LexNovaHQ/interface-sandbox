import { buildInputIdentity } from "../source-discovery/sourceDiscoveryGuard.js";
import { runSourceDiscoveryOrchestrator } from "../source-discovery/sourceDiscoveryOrchestrator.js";
import { captureSources } from "../source-capture/sourceCapture.js";
import { runGeminiPool } from "../gemini/geminiPool.js";
import { buildEvidenceRefinerInput } from "../diligence/adapters/sourceBundleAdapter.js";
import { buildEvidenceJunction } from "../diligence/evidenceJunction.js";
import { buildStage5TargetFeaturePackage } from "../diligence/stage5TargetFeaturePackageBuilder.js";
import { runStage5ABatch2Pipeline } from "../diligence/stage5/stage5aPipelineConnector.js";
import { runStage5BBatch3Pipeline } from "../diligence/stage5/stage5bPipelineConnector.js";
import { runStage5MultiSubstageProfile } from "../diligence/stage5MultiSubstageRunner.js";
import { runStage5ProductFamilyScopedProfile } from "../diligence/stage5ProductFamilyLiveRunner.js";
import { appendReviewerDocumentSource, buildDocumentOnlySourceBundle } from "./reviewerDocumentSourceAdapter.js";
import { asArray, asText, logStage, normalizeUrl, SOURCE_BUCKETS } from "./liveRunShared.js";

function collectBucket(discovery, bucket) {
  const out = [];
  const seen = new Set();
  for (const record of asArray(discovery?.[bucket])) {
    const url = normalizeUrl(record?.url || record?.final_url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({ ...record, url, source_bucket: bucket });
  }
  return out;
}

function collectSources(discovery) {
  const pools = Object.fromEntries(SOURCE_BUCKETS.map((bucket) => [bucket, collectBucket(discovery, bucket)]));
  const selected = [];
  const seen = new Set();
  const add = (record) => {
    if (!record?.url || seen.has(record.url)) return;
    seen.add(record.url);
    selected.push(record);
  };
  for (const bucket of SOURCE_BUCKETS) {
    for (const record of pools[bucket] || []) add(record);
  }
  return selected;
}

function stage4SourceRecords(sourceBundle, familyFilter = null) {
  return asArray(sourceBundle.raw_footprint?.source_records)
    .filter((record) => !familyFilter || record.source_family === familyFilter)
    .map((record) => ({
      evidence_source_id: record.evidence_source_id,
      source_family: record.source_family,
      url: record.url,
      final_url: record.final_url,
      title: record.structure?.title || record.title || "",
      word_count: record.text?.word_count || 0,
      clean_text_lossless: record.text?.clean_text_lossless || ""
    }));
}

function minimalCompanyProfile(targetInput = {}, mode = "document_text_only") {
  return {
    target_profile_version: "target_profile_v2",
    identity: {
      brand_name: targetInput.company_name || "Document review target",
      legal_name: null,
      domain: targetInput.primary_url || null,
      website: targetInput.primary_url || null
    },
    jurisdiction: { headquarters: null, operating_markets: [], data_sovereignty_signature: "Not established from reviewed public evidence" },
    business_model: { company_type: "Not established from reviewed public evidence", revenue_model: null },
    market_context: { industry: "Not established from reviewed public evidence", customer_segments: [] },
    product_baseline: { products: [targetInput.company_name || "Reviewer-supplied document review"], high_level_offering: mode === "document_text_only" ? "Reviewer-supplied document text review" : "Live diligence review" },
    data_touchpoint_map: [],
    vault_baseline_candidates: { baseline: {} },
    pipeline_assumptions: [],
    evidence: [],
    limitations: ["Company profile was minimized because no public target URL was supplied for this live review."],
    live_review_mode: mode
  };
}

function minimalTargetFeatureProfile(targetInput = {}, mode = "document_text_only") {
  return {
    feature_profile_version: "feature_profile_v2",
    target_profile_ref: { target_profile_version: "target_profile_v2", brand_name: targetInput.company_name || "Document review target", legal_name: null, domain: targetInput.primary_url || null },
    feature_inventory: [],
    data_provenance_map: [],
    regulated_surface_map: [],
    architecture_hints: [],
    commercial_scan: {},
    limitations: ["Product/activity classification was minimized because no public target URL was supplied. Registry routing will run universal and conditional document rows only."],
    live_review_mode: mode
  };
}

export function normalizeInput(input = {}) {
  const targetUrl = normalizeUrl(input.target_url || input.primary_url || input.url);
  const documentText = asText(input.document_text || input.documentText || input.doc_text || input.docText);
  const companyName = asText(input.company_name || input.companyName) || null;
  const documentLabel = asText(input.document_label || input.documentLabel) || "Reviewer supplied document text";
  if (!targetUrl && !documentText) {
    const error = new Error("Provide a public URL, document text, or both.");
    error.status = 400;
    error.error_type = "BAD_REQUEST";
    throw error;
  }
  return {
    targetInput: {
      primary_url: targetUrl,
      company_name: companyName,
      submitted_at: new Date().toISOString(),
      live_review_input_mode: targetUrl && documentText ? "url_and_document_text" : (targetUrl ? "url_only" : "document_text_only")
    },
    targetUrl,
    documentText,
    documentLabel
  };
}

async function buildUrlEvidence({ targetInput, options, logs, runId, documentText, documentLabel }) {
  logStage(logs, "source_discovery", "running", { mode: targetInput.live_review_input_mode });
  const identity = buildInputIdentity({ primary_url: targetInput.primary_url });
  const orchestrated = await runSourceDiscoveryOrchestrator({
    identity,
    company_name: targetInput.company_name,
    options: {
      sourceDiscoveryMode: options.sourceDiscoveryMode || process.env.LIVE_SOURCE_DISCOVERY_MODE || "sync_with_free_search",
      runFreeFirstPartySearch: options.runFreeFirstPartySearch === false ? false : process.env.LIVE_RUN_FREE_SEARCH === "false" ? false : true,
      anchorFetchMaxAnchors: Number(options.anchorFetchMaxAnchors || process.env.LIVE_ANCHOR_FETCH_MAX || 60),
      anchorLinkLimit: Number(options.anchorLinkLimit || process.env.LIVE_ANCHOR_LINK_LIMIT || Number.MAX_SAFE_INTEGER),
      anchorClassifyMaxOutputTokens: Number(options.anchorClassifyMaxOutputTokens || process.env.LIVE_ANCHOR_CLASSIFY_TOKENS || 8192),
      probe_timeout_ms: Number(options.probe_timeout_ms || process.env.LIVE_PROBE_TIMEOUT_MS || 8000)
    },
    runPool: runGeminiPool
  });
  const discoveryResponse = { ok: true, discovery: orchestrated.discovery, diagnostics: orchestrated.diagnostics };
  const sources = collectSources(orchestrated.discovery, options);
  logStage(logs, "source_discovery", "complete", { source_count: sources.length, counts: orchestrated.discovery?.counts || null });
  if (!sources.length) throw new Error("Source discovery returned no capturable public sources.");

  logStage(logs, "source_capture", "running", { source_count: sources.length });
  const capture = await captureSources(sources, {
    timeout_ms: Number(options.capture_timeout_ms || process.env.LIVE_CAPTURE_TIMEOUT_MS || 24000),
    max_fetch_bytes: Number(options.capture_max_bytes || process.env.LIVE_CAPTURE_MAX_BYTES || process.env.SOURCE_CAPTURE_MAX_BYTES || 30 * 1024 * 1024)
  });
  const captureResponse = { ok: true, capture };
  let sourceBundle = buildEvidenceRefinerInput({ targetInput, discoveryResponse, captureResponse, runId: `${runId}_source_bundle`, sourceMode: "live_review_url_capture" });

  let reviewerSource = null;
  if (documentText) {
    const appended = appendReviewerDocumentSource({ sourceBundle, documentText, documentLabel, targetInput });
    sourceBundle = appended.source_bundle;
    reviewerSource = appended.source_record;
  }
  const evidenceJunction = buildEvidenceJunction({ sourceBundle, runId: `${runId}_evidence_junction` });
  logStage(logs, "source_capture", "complete", { admitted_sources: sourceBundle.raw_footprint?.source_records?.length || 0, reviewer_document_included: Boolean(reviewerSource) });
  return { sourceBundle, evidenceJunction, reviewerSource };
}

function buildDocumentEvidence({ targetInput, documentText, documentLabel, runId, logs }) {
  logStage(logs, "reviewer_document_source", "running", { document_text_chars: documentText.length });
  const sourceBundle = buildDocumentOnlySourceBundle({ targetInput, documentText, documentLabel, runId: `${runId}_document_source_bundle` });
  const evidenceJunction = buildEvidenceJunction({ sourceBundle, runId: `${runId}_document_evidence_junction` });
  logStage(logs, "reviewer_document_source", "complete", { admitted_sources: sourceBundle.raw_footprint?.source_records?.length || 0 });
  return { sourceBundle, evidenceJunction, reviewerSource: sourceBundle.raw_footprint?.source_records?.[0] || null };
}

export async function buildLiveEvidence({ targetInput, targetUrl, documentText, documentLabel, hasDoc, options, logs, runId }) {
  if (targetUrl) return buildUrlEvidence({ targetInput, options, logs, runId, documentText: hasDoc ? documentText : "", documentLabel });
  return buildDocumentEvidence({ targetInput, documentText, documentLabel, runId, logs });
}

export async function buildProfiles({ targetInput, sourceBundle, evidenceJunction, mode, logs, runId, runStage }) {
  if (mode === "document_text_only") {
    logStage(logs, "company_profile", "skipped", { reason: "document_text_only_minimal_profile" });
    logStage(logs, "target_feature_profile", "skipped", { reason: "document_text_only_minimal_profile" });
    return { companyProfile: minimalCompanyProfile(targetInput), targetFeatureProfile: minimalTargetFeatureProfile(targetInput) };
  }

  logStage(logs, "company_profile", "running");
  const targetProfileSources = stage4SourceRecords(sourceBundle);
  const companyProfileSources = stage4SourceRecords(sourceBundle, "company_profile");
  if (!targetProfileSources.length) throw new Error("No Stage 4 target profile source records available.");
  const companyStage = await runStage("company_profile", {
    target_input: targetInput,
    source_bundle_version: sourceBundle.source_bundle_version,
    source_bundle_sha256: evidenceJunction.source_bundle_sha256 || null,
    evidence_junction_version: evidenceJunction.evidence_junction_version,
    target_profile_sources: targetProfileSources,
    company_profile_sources: companyProfileSources,
    input_policy: {
      target_profile_source_packet: true,
      company_family_only: false,
      product_feature_mapping_forbidden: true,
      legal_review_forbidden: true,
      registry_evaluation_forbidden: true,
      outside_browsing_forbidden: true
    }
  }, { pool: process.env.LIVE_COMPANY_POOL || process.env.STAGE4_COMPANY_POOL || "reasoning", maxOutputTokens: Number(process.env.LIVE_COMPANY_MAX_OUTPUT_TOKENS || 4096), timeoutMs: Number(process.env.LIVE_COMPANY_TIMEOUT_MS || 60000) });
  const companyProfile = companyStage.company_profile;
  logStage(logs, "company_profile", "complete", { company_name: companyProfile?.identity?.brand_name || null, target_profile_sources: targetProfileSources.length, company_sources: companyProfileSources.length });

  logStage(logs, "target_feature_profile", "running", { execution_mode: "stage5_multi_substage" });
  const adapterResult = buildStage5TargetFeaturePackage({
    sourceBundle,
    evidenceJunction,
    companyProfile,
    runId: `${runId}_stage5_input`,
    budget: {
      max_input_chars: Number(process.env.STAGE5_MAX_INPUT_CHARS || 120000),
      max_estimated_tokens: Number(process.env.STAGE5_MAX_ESTIMATED_TOKENS || 60000),
      max_single_source_chars: Number(process.env.STAGE5_MAX_SINGLE_SOURCE_CHARS || 45000),
      prompt_overhead_tokens: Number(process.env.STAGE5_PROMPT_OVERHEAD_TOKENS || 30000),
      max_product_family_packets: Number(process.env.STAGE5_MAX_PRODUCT_FAMILY_PACKETS || 8)
    }
  });
  if (!adapterResult.ok) {
    const error = new Error(adapterResult.error || "Target Feature Profile input adapter failed");
    error.status = adapterResult.status || 500;
    error.result = adapterResult;
    throw error;
  }

  if (process.env.STAGE5A_BATCH2_ENABLED !== "false") {
    try {
      const stage5aBatch2 = await runStage5ABatch2Pipeline({ adapterResult, companyProfile, runGeminiPool, logs, logStage, runId });
      adapterResult.stage5a_batch2 = stage5aBatch2;
      if (adapterResult.target_feature_profile_input && typeof adapterResult.target_feature_profile_input === "object") {
        adapterResult.target_feature_profile_input.stage5a_batch2 = {
          stage5a_product_function_mapping: stage5aBatch2.stage5a_product_function_mapping,
          stage5a_feature_package: stage5aBatch2.stage5a_feature_package,
          stage5a_validation: stage5aBatch2.stage5a_validation
        };
      }
    } catch (error) {
      logStage(logs, "stage5a_product_function_mapping", "failed", {
        error: error?.message || String(error),
        status: error?.status || null
      });
      if (process.env.STAGE5A_BATCH2_BLOCKING !== "false") throw error;
    }
  } else {
    logStage(logs, "stage5a_product_function_mapping", "skipped", { reason: "STAGE5A_BATCH2_ENABLED=false" });
  }

  if (process.env.STAGE5B_BATCH3_ENABLED !== "false") {
    try {
      const stage5bBatch3 = await runStage5BBatch3Pipeline({ adapterResult, runGeminiPool, logs, logStage, runId });
      adapterResult.stage5b_batch3 = stage5bBatch3;
      if (adapterResult.target_feature_profile_input && typeof adapterResult.target_feature_profile_input === "object") {
        adapterResult.target_feature_profile_input.stage5b_batch3 = {
          stage5b_archetype_surface_tagging: stage5bBatch3.stage5b_archetype_surface_tagging,
          stage5b_tag_package: stage5bBatch3.stage5b_tag_package,
          stage5b_validation: stage5bBatch3.stage5b_validation
        };
      }
    } catch (error) {
      logStage(logs, "stage5b_archetype_surface_tagging", "failed", {
        error: error?.message || String(error),
        status: error?.status || null
      });
      if (process.env.STAGE5B_BATCH3_BLOCKING !== "false") throw error;
    }
  } else {
    logStage(logs, "stage5b_archetype_surface_tagging", "skipped", { reason: "STAGE5B_BATCH3_ENABLED=false" });
  }

  try {
    const multiSubstageProfile = await runStage5MultiSubstageProfile({ adapterResult, logs, logStage });
    if (multiSubstageProfile) {
      logStage(logs, "target_feature_profile", "complete", {
        execution_mode: "stage5_multi_substage",
        feature_count: multiSubstageProfile?.feature_inventory?.length || 0,
        classification_status: multiSubstageProfile?.classification_quality?.status || null,
        stage5a_batch2_function_count: adapterResult.stage5a_batch2?.stage5a_product_function_mapping?.product_function_map?.length || 0,
        stage5a_batch2_features_for_5b_count: adapterResult.stage5a_batch2?.stage5a_feature_package?.features_for_5b?.length || 0,
        stage5b_batch3_feature_tag_count: adapterResult.stage5b_batch3?.stage5b_archetype_surface_tagging?.feature_tags?.length || 0,
        stage5b_batch3_features_for_5c_count: adapterResult.stage5b_batch3?.stage5b_tag_package?.feature_tags_for_5c?.length || 0,
        stage5b_batch3_tagging_failure_count: adapterResult.stage5b_batch3?.stage5b_tag_package?.tagging_failures?.length || 0,
        deterministic_cluster_count: adapterResult.stage5_candidate_clusters?.length || 0,
        deterministic_candidate_count: adapterResult.target_feature_candidate_index?.candidate_count || 0
      });
      return { companyProfile, targetFeatureProfile: multiSubstageProfile };
    }
  } catch (error) {
    logStage(logs, "target_feature_profile", "multi_substage_failed", {
      error: error?.message || String(error),
      validation_error_count: error?.validation_errors?.length || 0
    });
    if (process.env.STAGE5_LEGACY_FALLBACK !== "true") throw error;
  }

  if (process.env.STAGE5_LEGACY_FALLBACK === "true") {
    const familyScopedProfile = await runStage5ProductFamilyScopedProfile({ adapterResult, runStage, logs, logStage });
    if (familyScopedProfile) {
      logStage(logs, "target_feature_profile", "complete", { execution_mode: "stage5_product_family_scoped_lossless_classification_legacy_fallback", feature_count: familyScopedProfile?.feature_inventory?.length || 0, classification_status: familyScopedProfile?.classification_quality?.status || null, stage5a_batch2_function_count: adapterResult.stage5a_batch2?.stage5a_product_function_mapping?.product_function_map?.length || 0, stage5a_batch2_features_for_5b_count: adapterResult.stage5a_batch2?.stage5a_feature_package?.features_for_5b?.length || 0, stage5b_batch3_feature_tag_count: adapterResult.stage5b_batch3?.stage5b_archetype_surface_tagging?.feature_tags?.length || 0, stage5b_batch3_features_for_5c_count: adapterResult.stage5b_batch3?.stage5b_tag_package?.feature_tags_for_5c?.length || 0, stage5b_batch3_tagging_failure_count: adapterResult.stage5b_batch3?.stage5b_tag_package?.tagging_failures?.length || 0, deterministic_cluster_count: adapterResult.stage5_candidate_clusters?.length || 0, deterministic_candidate_count: adapterResult.target_feature_candidate_index?.candidate_count || 0 });
      return { companyProfile, targetFeatureProfile: familyScopedProfile };
    }

    const featureStage = await runStage("target_feature_profile", adapterResult.target_feature_profile_input, { pool: process.env.LIVE_FEATURE_POOL || process.env.STAGE5_FEATURE_POOL || "reasoning", maxOutputTokens: Number(process.env.LIVE_FEATURE_MAX_OUTPUT_TOKENS || 8192), timeoutMs: Number(process.env.LIVE_FEATURE_TIMEOUT_MS || 90000) });
    const targetFeatureProfile = featureStage.target_feature_profile;
    logStage(logs, "target_feature_profile", "complete", { execution_mode: "stage5_single_packet_legacy_fallback", feature_count: targetFeatureProfile?.feature_inventory?.length || 0, stage5_feature_discovery_count: featureStage.stage5_feature_discovery?.discovered_features?.length || 0, stage5a_batch2_function_count: adapterResult.stage5a_batch2?.stage5a_product_function_mapping?.product_function_map?.length || 0, stage5a_batch2_features_for_5b_count: adapterResult.stage5a_batch2?.stage5a_feature_package?.features_for_5b?.length || 0, stage5b_batch3_feature_tag_count: adapterResult.stage5b_batch3?.stage5b_archetype_surface_tagging?.feature_tags?.length || 0, stage5b_batch3_features_for_5c_count: adapterResult.stage5b_batch3?.stage5b_tag_package?.feature_tags_for_5c?.length || 0, stage5b_batch3_tagging_failure_count: adapterResult.stage5b_batch3?.stage5b_tag_package?.tagging_failures?.length || 0, product_family_discovery_source_count: adapterResult.product_family_discovery_sources?.length || 0, product_family_primary_source_count: adapterResult.product_family_primary_sources?.length || 0, product_family_secondary_source_count: adapterResult.product_family_secondary_sources?.length || 0, product_family_supporting_source_count: adapterResult.product_family_supporting_sources?.length || 0, product_family_duplicate_source_count: adapterResult.product_family_duplicate_sources?.length || 0, product_family_non_feature_context_count: adapterResult.product_family_non_feature_context_sources?.length || 0, deterministic_cluster_count: adapterResult.stage5_candidate_clusters?.length || 0, deterministic_candidate_count: adapterResult.target_feature_candidate_index?.candidate_count || 0 });
    return { companyProfile, targetFeatureProfile };
  }

  throw new Error("Stage 5 multi-substage runner returned no target_feature_profile and legacy fallback is disabled.");
}
