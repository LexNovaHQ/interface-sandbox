import fs from "node:fs";
import path from "node:path";
import { buildInputIdentity } from "../source-discovery/sourceDiscoveryGuard.js";
import { runSourceDiscoveryOrchestrator } from "../source-discovery/sourceDiscoveryOrchestrator.js";
import { captureSources } from "../source-capture/sourceCapture.js";
import { runGeminiPool } from "../gemini/geminiPool.js";
import { runDiligenceStage } from "../diligence/stageRunner.js";
import { buildEvidenceRefinerInput } from "../diligence/adapters/sourceBundleAdapter.js";
import { buildEvidenceJunction } from "../diligence/evidenceJunction.js";
import { buildStage5TargetFeaturePackage } from "../diligence/stage5TargetFeaturePackageBuilder.js";
import { buildRegistryLedgerInput } from "../diligence/adapters/registryLedgerInputAdapter.js";
import { buildPriorityRowPlan, mergePriorityRows, validatePriorityMerge } from "../diligence/priorityRowPlanner.js";
import { buildStage9Report } from "../diligence/stage9ReportAssembler.js";
import { validateStage9Report } from "../diligence/stage9ReportValidator.js";
import { renderLegalExposureReport } from "../report-renderer/legalExposureReportRendererV2.js";
import { assembleStage10VaultHandoff } from "../handoff/stage9ToVaultHandoffAdapter.js";
import { validateReviewReadyHandoff } from "../handoff/reviewReadyHandoffValidator.js";
import { appendReviewerDocumentSource, buildDocumentOnlySourceBundle, hasReviewerDocumentText } from "./reviewerDocumentSourceAdapter.js";
import { compactSourceBundleForOperatorChallenge } from "./liveRunShared.js";

const SOURCE_BUCKETS = ["company_profile_sources", "product_profile_sources", "legal_profile_sources", "governance_profile_sources"];
const VALID_STATUSES = new Set(["TRIGGERED", "CONTROLLED", "NOT_TRIGGERED", "NOT_APPLICABLE", "INSUFFICIENT_EVIDENCE"]);

function nowIso() {
  return new Date().toISOString();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value) {
  return String(value || "").trim();
}

function normalizeUrl(value) {
  const raw = asText(value);
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    url.hash = "";
    if ((url.pathname || "") !== "/") url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return null;
  }
}

function readJsonFile(candidatePaths, label) {
  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) return JSON.parse(fs.readFileSync(candidate, "utf8"));
  }
  throw new Error(`${label} not found. Checked: ${candidatePaths.join(", ")}`);
}

function loadRuntimeData() {
  const cwd = process.cwd();
  return {
    registryRuntime: readJsonFile([
      path.join(cwd, "data", "runtime", "registry.runtime.json"),
      path.join(cwd, "..", "data", "runtime", "registry.runtime.json")
    ], "registry.runtime.json"),
    registryKey: readJsonFile([
      path.join(cwd, "data", "runtime", "registry_key.runtime.json"),
      path.join(cwd, "..", "data", "runtime", "registry_key.runtime.json")
    ], "registry_key.runtime.json")
  };
}

function logStage(logs, stage, status, meta = {}) {
  logs.push({ stage, status, at: nowIso(), ...meta });
}

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

function itemId(row, index) {
  return asText(row?.Threat_ID || row?.threat_id || `ROW_${index + 1}`);
}

function itemName(row) {
  return asText(row?.Threat_Name || row?.threat_name || "Unnamed row");
}

function normalizeRegistryRow(row, index) {
  return { ...row, Threat_ID: itemId(row, index), Threat_Name: itemName(row), _registry_index: index, _registry_position: index + 1 };
}

function makeBatch({ rows, batchNumber, batchCount, totalRows, runId }) {
  return {
    run_id: runId,
    batch_id: `live_stage7_batch_${batchNumber}_of_${batchCount}_${Date.now()}`,
    batch_number: batchNumber,
    batch_count: batchCount,
    batch_size: rows.length,
    registry_total_count: totalRows,
    registry_count_loaded: totalRows,
    registry_range: { start_position: rows[0]?._registry_position || 1, end_position: rows[rows.length - 1]?._registry_position || rows.length },
    expected_threat_ids: rows.map((row) => row.Threat_ID),
    registry_rows: rows
  };
}

function threatId(entry) {
  return asText(entry?.threat_id || entry?.Threat_ID);
}

function countsByStatus(rows = []) {
  return rows.reduce((acc, entry) => {
    const key = entry?.final_status || entry?.assessment_status || "UNKNOWN";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function coverage(expectedIds = [], emittedIds = []) {
  const expectedSet = new Set(expectedIds);
  const emittedSet = new Set(emittedIds);
  const missing = expectedIds.filter((id) => !emittedSet.has(id));
  const unexpected = emittedIds.filter((id) => !expectedSet.has(id));
  const duplicate = emittedIds.filter((id, index) => emittedIds.indexOf(id) !== index);
  return { ok: missing.length === 0 && unexpected.length === 0 && duplicate.length === 0 && expectedIds.length === emittedIds.length, expected_count: expectedIds.length, emitted_count: emittedIds.length, missing, unexpected, duplicate: [...new Set(duplicate)] };
}

function registryThreatId(row, index) {
  return asText(row?.Threat_ID || row?.threat_id || `ROW_${index + 1}`);
}

function threatName(row) {
  return asText(row?.threat_name || row?.Threat_Name || "Unnamed row");
}

function compactRegistryLogicReference(registryRows) {
  return registryRows.map((row, index) => ({
    entry_number: index + 1,
    threat_id: registryThreatId(row, index),
    threat_name: threatName(row),
    hunter_trigger: row?.hunter_trigger || null,
    archetype: row?.archetype || row?.Archetype || null,
    surface: row?.surface || row?.Surface || row?.surfaces || row?.Surfaces || null
  }));
}

function validateLedgerEntry(entry) {
  const id = threatId(entry);
  const errors = [];
  if (!id) errors.push("corrected entry missing threat_id");
  if (!entry?.threat_name) errors.push(`${id || "unknown"}: missing threat_name`);
  if (!Number.isInteger(entry?.entry_number) || entry.entry_number < 1) errors.push(`${id || "unknown"}: invalid entry_number`);
  if (!Array.isArray(entry?.conditions)) errors.push(`${id || "unknown"}: conditions must be an array`);
  if (typeof entry?.trigger_if_result !== "boolean") errors.push(`${id || "unknown"}: trigger_if_result must be boolean`);
  if (typeof entry?.exclude_if_result !== "boolean") errors.push(`${id || "unknown"}: exclude_if_result must be boolean`);
  if (!VALID_STATUSES.has(entry?.final_status)) errors.push(`${id || "unknown"}: invalid final_status ${entry?.final_status}`);
  if (!Array.isArray(entry?.feature_refs)) errors.push(`${id || "unknown"}: feature_refs must be an array`);
  if (typeof entry?.evidence_ref !== "string") errors.push(`${id || "unknown"}: evidence_ref must be string`);
  if (typeof entry?.reasoning_summary !== "string") errors.push(`${id || "unknown"}: reasoning_summary must be string`);
  return errors;
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function compareIds(expectedIds, actualIds) {
  const expected = new Set(expectedIds);
  const actual = new Set(actualIds);
  return {
    missing: expectedIds.filter((id) => !actual.has(id)),
    unexpected: actualIds.filter((id) => !expected.has(id)),
    duplicate: duplicateValues(actualIds)
  };
}

function validateChallengeOutput(output, expectedTotal) {
  const errors = [];
  const gate = output?.operator_challenge_gate;
  if (!gate || typeof gate !== "object") errors.push("operator_challenge_gate missing or invalid");
  else {
    if (typeof gate.completed !== "boolean") errors.push("operator_challenge_gate.completed must be boolean");
    if (!["PASS", "PASS_WITH_WARNINGS", "REOPENED", "FAIL_RETRY_REQUIRED"].includes(gate.result)) errors.push(`invalid operator challenge result: ${gate.result}`);
    if (gate.result !== "FAIL_RETRY_REQUIRED" && expectedTotal && gate.registry_count_evaluated !== expectedTotal) errors.push(`operator_challenge_gate.registry_count_evaluated expected ${expectedTotal}, received ${gate.registry_count_evaluated}`);
  }
  if (!Array.isArray(output?.corrected_ledger_entries)) errors.push("corrected_ledger_entries must be array");
  return errors;
}

function applyCorrections({ mergedLedger, challengeOutput, expectedIds }) {
  const errors = [];
  const originalIds = mergedLedger.map(threatId).filter(Boolean);
  const preCompare = compareIds(expectedIds, originalIds);
  if (preCompare.missing.length) errors.push(`pre-correction ledger missing threat_id(s): ${preCompare.missing.join(", ")}`);
  if (preCompare.unexpected.length) errors.push(`pre-correction ledger has unexpected threat_id(s): ${preCompare.unexpected.join(", ")}`);
  if (preCompare.duplicate.length) errors.push(`pre-correction ledger has duplicate threat_id(s): ${preCompare.duplicate.join(", ")}`);

  const correctedEntries = asArray(challengeOutput?.corrected_ledger_entries);
  const correctedIds = correctedEntries.map(threatId).filter(Boolean);
  const duplicateCorrected = duplicateValues(correctedIds);
  const originalIdSet = new Set(originalIds);
  const unknownCorrected = correctedIds.filter((id) => !originalIdSet.has(id));
  const correctedEntryErrors = correctedEntries.flatMap(validateLedgerEntry);
  if (duplicateCorrected.length) errors.push(`duplicate corrected threat_id(s): ${duplicateCorrected.join(", ")}`);
  if (unknownCorrected.length) errors.push(`unknown corrected threat_id(s): ${unknownCorrected.join(", ")}`);
  if (correctedEntryErrors.length) errors.push(...correctedEntryErrors);
  if (errors.length) return { ok: false, correction_errors: errors, corrected_count: correctedEntries.length, post_challenge_ledger: mergedLedger };

  const correctionMap = new Map(correctedEntries.map((entry) => [threatId(entry), entry]));
  const postChallengeLedger = mergedLedger.map((entry) => correctionMap.get(threatId(entry)) || entry);
  const postIds = postChallengeLedger.map(threatId).filter(Boolean);
  const postCompare = compareIds(expectedIds, postIds);
  const postErrors = [];
  if (postCompare.missing.length) postErrors.push(`post-correction ledger missing threat_id(s): ${postCompare.missing.join(", ")}`);
  if (postCompare.unexpected.length) postErrors.push(`post-correction ledger has unexpected threat_id(s): ${postCompare.unexpected.join(", ")}`);
  if (postCompare.duplicate.length) postErrors.push(`post-correction ledger has duplicate threat_id(s): ${postCompare.duplicate.join(", ")}`);
  return { ok: postErrors.length === 0, correction_errors: postErrors, corrected_count: correctedEntries.length, post_challenge_ledger: postChallengeLedger, correction_meta: { corrected_threat_ids: correctedIds, duplicate_corrected_threat_ids: duplicateCorrected, unknown_corrected_threat_ids: unknownCorrected, post_correction_missing_threat_ids: postCompare.missing, post_correction_unexpected_threat_ids: postCompare.unexpected, post_correction_duplicate_threat_ids: postCompare.duplicate } };
}

async function runStage(stageId, input, options = {}) {
  const result = await runDiligenceStage({ stageId, input, options, env: process.env });
  if (!result.ok) {
    const error = new Error(result.error || `${stageId} failed`);
    error.result = result;
    error.status = result.status || 500;
    throw error;
  }
  return result;
}

function normalizeInput(input = {}) {
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
      submitted_at: nowIso(),
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
  return { sourceBundle, evidenceJunction, discoveryResponse, captureResponse, reviewerSource };
}

function buildDocumentEvidence({ targetInput, documentText, documentLabel, runId, logs }) {
  logStage(logs, "reviewer_document_source", "running", { document_text_chars: documentText.length });
  const sourceBundle = buildDocumentOnlySourceBundle({ targetInput, documentText, documentLabel, runId: `${runId}_document_source_bundle` });
  const evidenceJunction = buildEvidenceJunction({ sourceBundle, runId: `${runId}_document_evidence_junction` });
  logStage(logs, "reviewer_document_source", "complete", { admitted_sources: sourceBundle.raw_footprint?.source_records?.length || 0 });
  return { sourceBundle, evidenceJunction, reviewerSource: sourceBundle.raw_footprint?.source_records?.[0] || null };
}

async function buildProfiles({ targetInput, sourceBundle, evidenceJunction, mode, logs, runId }) {
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

  logStage(logs, "target_feature_profile", "running");
  const adapterResult = buildStage5TargetFeaturePackage({
    sourceBundle,
    evidenceJunction,
    companyProfile,
    runId: `${runId}_stage5_input`,
    budget: {
      max_input_chars: Number(process.env.STAGE5_MAX_INPUT_CHARS || 120000),
      max_estimated_tokens: Number(process.env.STAGE5_MAX_ESTIMATED_TOKENS || 60000),
      max_single_source_chars: Number(process.env.STAGE5_MAX_SINGLE_SOURCE_CHARS || 45000),
      prompt_overhead_tokens: Number(process.env.STAGE5_PROMPT_OVERHEAD_TOKENS || 30000)
    }
  });
  if (!adapterResult.ok) {
    const error = new Error(adapterResult.error || "Target Feature Profile input adapter failed");
    error.status = adapterResult.status || 500;
    error.result = adapterResult;
    throw error;
  }
  const featureStage = await runStage("target_feature_profile", adapterResult.target_feature_profile_input, { pool: process.env.LIVE_FEATURE_POOL || process.env.STAGE5_FEATURE_POOL || "reasoning", maxOutputTokens: Number(process.env.LIVE_FEATURE_MAX_OUTPUT_TOKENS || 8192), timeoutMs: Number(process.env.LIVE_FEATURE_TIMEOUT_MS || 90000) });
  const targetFeatureProfile = featureStage.target_feature_profile;
  logStage(logs, "target_feature_profile", "complete", { feature_count: targetFeatureProfile?.feature_inventory?.length || 0, stage5_feature_discovery_count: featureStage.stage5_feature_discovery?.discovered_features?.length || 0, product_family_discovery_source_count: adapterResult.product_family_discovery_sources?.length || 0, product_family_primary_source_count: adapterResult.product_family_primary_sources?.length || 0, product_family_secondary_source_count: adapterResult.product_family_secondary_sources?.length || 0, product_family_supporting_source_count: adapterResult.product_family_supporting_sources?.length || 0, product_family_duplicate_source_count: adapterResult.product_family_duplicate_sources?.length || 0, product_family_non_feature_context_count: adapterResult.product_family_non_feature_context_sources?.length || 0, deterministic_cluster_count: adapterResult.stage5_candidate_clusters?.length || 0, deterministic_candidate_count: adapterResult.target_feature_candidate_index?.candidate_count || 0 });
  return { companyProfile, targetFeatureProfile };
}

async function runStage6Canonical({ sourceBundle, evidenceJunction, companyProfile, targetFeatureProfile, logs, runId }) {
  const stage6Input = {
    source_bundle: sourceBundle,
    evidence_junction: evidenceJunction,
    target_profile: companyProfile,
    company_profile: companyProfile,
    target_feature_profile: targetFeatureProfile
  };

  logStage(logs, "stage6a_legal_document_cartography", "running");
  const stage6A = await runStage("stage6a_legal_document_cartography", stage6Input, {
    pool: process.env.LIVE_STAGE6A_POOL || process.env.STAGE6_POOL || "reasoning",
    maxOutputTokens: Number(process.env.LIVE_STAGE6_MAX_OUTPUT_TOKENS || 24000),
    timeoutMs: Number(process.env.LIVE_STAGE6_TIMEOUT_MS || 120000)
  });
  logStage(logs, "stage6a_legal_document_cartography", "complete", { legal_units: stage6A.stage6_summary?.legal_document_index_count || 0 });

  logStage(logs, "stage6b_data_provenance", "running");
  const stage6B = await runStage("stage6b_data_provenance", stage6Input, {
    pool: process.env.LIVE_STAGE6B_POOL || process.env.STAGE6_POOL || "reasoning",
    maxOutputTokens: Number(process.env.LIVE_STAGE6_MAX_OUTPUT_TOKENS || 24000),
    timeoutMs: Number(process.env.LIVE_STAGE6_TIMEOUT_MS || 120000)
  });
  logStage(logs, "stage6b_data_provenance", "complete", { data_flows: stage6B.stage6_summary?.data_flow_profile_count || 0 });

  logStage(logs, "stage6_integrated_handoff", "running");
  const integrated = await runStage("stage6_integrated_handoff", {
    stage6a_review: stage6A.stage6_review,
    stage6b_review: stage6B.stage6_review,
    stage6_source_input: stage6Input
  }, {
    upstreamSemanticModelAttempted: stage6A.semantic_model_attempted === true || stage6B.semantic_model_attempted === true
  });
  logStage(logs, "stage6_integrated_handoff", "complete", {
    legal_units: integrated.stage6_summary?.legal_document_index_count || 0,
    data_flows: integrated.stage6_summary?.data_flow_profile_count || 0
  });

  return { stage6A, stage6B, integrated };
}
async function runStage7({ stage6Cache, registryRuntime, registryKey, logs, runId }) {
  logStage(logs, "registry_ledger_evaluation", "running");
  const rows = asArray(registryRuntime?.threats).map(normalizeRegistryRow);
  if (!rows.length) throw new Error("Runtime registry contains no rows.");
  const batchSize = Number(process.env.STAGE7_PRIORITY_BATCH_SIZE || process.env.STAGE7_BATCH_SIZE || 8);
  const plan = buildPriorityRowPlan({ rows, profile: stage6Cache.target_feature_profile, batchSize });
  const modelRows = [];
  const batchSummaries = [];
  for (let index = 0; index < plan.model_batches.length; index += 1) {
    const rowBatch = plan.model_batches[index];
    const batch = makeBatch({ rows: rowBatch, batchNumber: index + 1, batchCount: plan.model_batches.length, totalRows: rows.length, runId });
    const adapter = buildRegistryLedgerInput({
      sourceBundle: stage6Cache.source_bundle,
      evidenceJunction: stage6Cache.evidence_junction,
      targetProfile: stage6Cache.company_profile,
      targetFeatureProfile: stage6Cache.target_feature_profile,
      stage6Review: stage6Cache.stage6_review,
      stage6ToStage7Adapter: stage6Cache.stage6_to_stage7_adapter,
      registryBatch: batch,
      registryKey,
      runId,
      budget: { enforcement_mode: process.env.STAGE7_BUDGET_ENFORCEMENT_MODE || "guidance" }
    });
    if (!adapter.ok) {
      const error = new Error(adapter.error || "Stage 7 input adapter failed");
      error.status = adapter.status || 500;
      error.result = adapter;
      throw error;
    }
    const result = await runStage("registry_ledger_evaluation", adapter.registry_ledger_input, { pool: process.env.LIVE_REGISTRY_POOL || process.env.STAGE7_POOL || "registry", maxOutputTokens: Number(process.env.LIVE_REGISTRY_MAX_OUTPUT_TOKENS || 16384), timeoutMs: Number(process.env.LIVE_REGISTRY_TIMEOUT_MS || 120000) });
    const ledger = result.registry_ledger;
    if (!ledger || !Array.isArray(ledger.registry_evaluation_ledger)) throw new Error("Stage 7 returned no usable registry ledger.");
    const emittedIds = ledger.registry_evaluation_ledger.map((entry) => entry.threat_id);
    const batchCoverage = coverage(batch.expected_threat_ids, emittedIds);
    if (!batchCoverage.ok) {
      const error = new Error("Stage 7 batch coverage failed before merge.");
      error.result = { batch_number: batch.batch_number, coverage: batchCoverage };
      throw error;
    }
    modelRows.push(...ledger.registry_evaluation_ledger);
    batchSummaries.push({ batch_number: batch.batch_number, batch_count: batch.batch_count, expected_batch_size: batch.batch_size, ledger_count: ledger.registry_evaluation_ledger.length, expected_ids: batch.expected_threat_ids, emitted_ids: emittedIds, coverage: batchCoverage, final_status_counts: countsByStatus(ledger.registry_evaluation_ledger), model_metadata: result.model_metadata || null });
    logStage(logs, "registry_ledger_evaluation", "batch_complete", { batch_number: batch.batch_number, batch_count: batch.batch_count, ledger_count: ledger.registry_evaluation_ledger.length });
  }
  const modelCoverage = coverage(plan.model_rows.map((row) => row.Threat_ID), modelRows.map((entry) => entry.threat_id));
  if (!modelCoverage.ok) throw new Error(`Stage 7 model-row coverage failed: ${JSON.stringify(modelCoverage)}`);
  const merged = mergePriorityRows({ modelRows, deterministicRows: plan.deterministic_rows, sourceRows: rows });
  const validation = validatePriorityMerge({ mergedRows: merged, sourceRows: rows });
  if (!validation.ok) throw new Error(`Merged Stage 7 output failed validation: ${JSON.stringify(validation)}`);
  const stage7Artifact = { artifact_type: "stage7_priority_ledger_live_export", generated_at: nowIso(), run_id: runId, summary: { ok: true, phase: "stage_7_priority_complete", batch_size_config: batchSize, counts: plan.counts, routing_summary: plan.routing_summary, model_rows_returned: modelRows.length, model_coverage: modelCoverage, deterministic_rows: plan.deterministic_rows.length, merged_rows: merged.length, final_status_counts: countsByStatus(merged), validation, batch_summaries: batchSummaries }, active_archetypes: plan.active_archetypes, active_surfaces: plan.active_surfaces, route_records: plan.route_records, deterministic_rows: plan.deterministic_rows, model_rows: modelRows, merged_ledger: merged, source_row_count: rows.length };
  logStage(logs, "registry_ledger_evaluation", "complete", { merged_rows: merged.length, final_status_counts: countsByStatus(merged) });
  return stage7Artifact;
}

async function runStage8({ stage6Cache, stage7Artifact, registryRuntime, logs, runId }) {
  logStage(logs, "operator_challenge", "running");
  const mergedLedger = asArray(stage7Artifact.merged_ledger);
  if (!mergedLedger.length) throw new Error("Stage 8 requires a merged Stage 7 ledger.");
  const registryRows = asArray(registryRuntime?.threats);
  const expectedIds = registryRows.length ? registryRows.map(registryThreatId) : mergedLedger.map(threatId);
  const registryTotal = expectedIds.length || Number(stage7Artifact.source_row_count || mergedLedger.length);
  const stage8Input = {
    run_id: runId,
    registry_count_loaded: registryTotal,
    registry_total_count: registryTotal,
    registry_count_evaluated: mergedLedger.length,
    registry_evaluation_ledger: mergedLedger,
    registry_batch_meta: { run_id: stage7Artifact.run_id || runId, batch_id: "MERGED", is_merged_ledger: true, test_run: false, registry_count_loaded: registryTotal, registry_total_count: registryTotal, registry_count_evaluated: mergedLedger.length, stage7_artifact_type: stage7Artifact.artifact_type || null },
    source_bundle: compactSourceBundleForOperatorChallenge(stage6Cache.source_bundle),
    target_profile: stage6Cache.company_profile,
    target_feature_profile: stage6Cache.target_feature_profile,
    stage6_review: stage6Cache.stage6_review,
    stage6_to_stage7_adapter: stage6Cache.stage6_to_stage7_adapter,
    registry_logic_reference: compactRegistryLogicReference(registryRows),
    prior_stage_summaries: { stage7_summary: stage7Artifact.summary || null, active_archetypes: stage7Artifact.active_archetypes || [], active_surfaces: stage7Artifact.active_surfaces || [] },
    test_run: false
  };
  const result = await runStage("operator_challenge", stage8Input, { pool: process.env.LIVE_STAGE8_POOL || process.env.STAGE8_POOL || "reasoning", maxOutputTokens: Number(process.env.LIVE_STAGE8_MAX_OUTPUT_TOKENS || 8192), timeoutMs: Number(process.env.LIVE_STAGE8_TIMEOUT_MS || 120000) });
  const challengeOutput = result.operator_challenge;
  if (!challengeOutput) throw new Error("Stage 8 returned no operator_challenge output.");
  const outputErrors = validateChallengeOutput(challengeOutput, registryTotal);
  if (outputErrors.length) throw new Error(`Stage 8 output validation failed: ${outputErrors.join("; ")}`);
  const correctionResult = applyCorrections({ mergedLedger, challengeOutput, expectedIds });
  if (!correctionResult.ok) throw new Error(`Stage 8 correction merge validation failed: ${correctionResult.correction_errors.join("; ")}`);
  const stage8Export = { artifact_type: "stage8_operator_challenge_live_export", generated_at: nowIso(), run_id: runId, operator_challenge: challengeOutput, correction_result: { ok: correctionResult.ok, corrected_count: correctionResult.corrected_count, correction_errors: correctionResult.correction_errors, correction_meta: correctionResult.correction_meta || null }, model_metadata: result.model_metadata || null, prompt_metadata: result.prompt_metadata || null, validation_mode: result.validation_mode || null, guardrail_validation_mode: result.guardrail_validation_mode || null, summary: { registry_total: registryTotal, pre_challenge_status_counts: countsByStatus(mergedLedger), post_challenge_status_counts: countsByStatus(correctionResult.post_challenge_ledger), corrected_count: correctionResult.corrected_count, operator_result: challengeOutput.operator_challenge_gate?.result || null, reopened_rows: challengeOutput.operator_challenge_gate?.reopened_rows || [] } };
  const stage8Ledger = { artifact_type: "stage8_post_challenge_ledger", generated_at: nowIso(), run_id: runId, corrected_count: correctionResult.corrected_count, correction_meta: correctionResult.correction_meta || null, operator_challenge_gate: challengeOutput.operator_challenge_gate, post_challenge_ledger: correctionResult.post_challenge_ledger, final_status_counts: countsByStatus(correctionResult.post_challenge_ledger) };
  logStage(logs, "operator_challenge", "complete", { corrected_count: correctionResult.corrected_count, post_status_counts: countsByStatus(correctionResult.post_challenge_ledger) });
  return { stage8Export, stage8Ledger, stage8Input };
}

function buildStage6Cache({ sourceBundle, evidenceJunction, companyProfile, targetFeatureProfile, stage6A, stage6B, integrated }) {
  return {
    cache_version: "stage6_canonical_live_cache_v1",
    generated_at: nowIso(),
    source_bundle: sourceBundle,
    evidence_junction: evidenceJunction,
    company_profile: companyProfile,
    target_profile_v2: companyProfile,
    target_feature_profile: targetFeatureProfile,
    stage6a_stage_result: stage6A || null,
    stage6b_stage_result: stage6B || null,
    stage6_integrated_stage_result: integrated || null,
    stage6_review: integrated?.stage6_review || null,
    stage6_to_stage7_adapter: integrated?.stage6_to_stage7_adapter || null
  };
}
export async function runLiveDiligenceReview(input = {}, options = {}) {
  const logs = [];
  const warnings = [];
  const runId = `live_diligence_${Date.now()}`;
  const startedAt = nowIso();
  const { targetInput, targetUrl, documentText, documentLabel } = normalizeInput(input);
  const hasDoc = hasReviewerDocumentText({ document_text: documentText });
  const mode = targetUrl && hasDoc ? "url_and_document_text" : (targetUrl ? "url_only" : "document_text_only");

  logStage(logs, "live_run", "start", { run_id: runId, mode, has_url: Boolean(targetUrl), has_document_text: hasDoc, document_text_chars: documentText.length || 0 });

  const { registryRuntime, registryKey } = loadRuntimeData();
  let sourceBundle;
  let evidenceJunction;
  let reviewerSource = null;

  if (targetUrl) {
    const built = await buildUrlEvidence({ targetInput, options, logs, runId, documentText: hasDoc ? documentText : "", documentLabel });
    sourceBundle = built.sourceBundle;
    evidenceJunction = built.evidenceJunction;
    reviewerSource = built.reviewerSource;
  } else {
    const built = buildDocumentEvidence({ targetInput, documentText, documentLabel, runId, logs });
    sourceBundle = built.sourceBundle;
    evidenceJunction = built.evidenceJunction;
    reviewerSource = built.reviewerSource;
  }

  const { companyProfile, targetFeatureProfile } = await buildProfiles({ targetInput, sourceBundle, evidenceJunction, mode, logs, runId });
  const stage6Canonical = await runStage6Canonical({ sourceBundle, evidenceJunction, companyProfile, targetFeatureProfile, logs, runId });
  const stage6Cache = buildStage6Cache({ sourceBundle, evidenceJunction, companyProfile, targetFeatureProfile, stage6A: stage6Canonical.stage6A, stage6B: stage6Canonical.stage6B, integrated: stage6Canonical.integrated });
  const stage7Artifact = await runStage7({ stage6Cache, registryRuntime, registryKey, logs, runId: `${runId}_stage7` });
  const { stage8Export, stage8Ledger, stage8Input } = await runStage8({ stage6Cache, stage7Artifact, registryRuntime, logs, runId: `${runId}_stage8` });

  logStage(logs, "stage9_report", "running");
  const stage9ReportData = buildStage9Report({ stage6Cache, stage7Artifact, stage8Ledger, registryRuntime });
  const stage9Validation = validateStage9Report({ stage9Report: stage9ReportData, postChallengeLedger: asArray(stage8Ledger.post_challenge_ledger), registryRuntime });
  if (!stage9Validation.ok) {
    const error = new Error("Stage 9 report validation failed.");
    error.result = stage9Validation;
    throw error;
  }
  logStage(logs, "stage9_report", "complete", { consolidated_findings: stage9ReportData.report?.report_data?.exposure_findings?.consolidated_count || 0 });

  let htmlReport = null;
  if (options.render_html !== false) {
    logStage(logs, "html_report", "running");
    htmlReport = renderLegalExposureReport(stage9ReportData);
    logStage(logs, "html_report", "complete", { html_bytes: Buffer.byteLength(htmlReport, "utf8") });
  }

  let stage10Handoff = null;
  let stage10Validation = null;
  if (options.run_handoff !== false) {
    logStage(logs, "stage10_handoff", "running");
    stage10Handoff = assembleStage10VaultHandoff(stage9ReportData);
    stage10Validation = validateReviewReadyHandoff(stage10Handoff, stage9ReportData);
    if (!stage10Validation.ok) {
      const error = new Error("Stage 10 handoff validation failed.");
      error.result = stage10Validation;
      throw error;
    }
    logStage(logs, "stage10_handoff", "complete", { vault_questions: stage10Handoff.assembly_handoff?.vault_confirmation_questions?.length || 0 });
  }

  logStage(logs, "live_run", "complete", { run_id: runId });
  return {
    ok: true,
    artifact_type: "live_diligence_review_result",
    generated_at: nowIso(),
    started_at: startedAt,
    run_id: runId,
    mode,
    target_input: { ...targetInput, document_text_received: hasDoc, document_text_chars: documentText.length || 0 },
    stage_status: logs,
    stage9_report_data: stage9ReportData,
    html_report: htmlReport,
    stage10_handoff: stage10Handoff,
    validation: { stage9: stage9Validation, stage10: stage10Validation },
    metrics: {
      source_count: sourceBundle.raw_footprint?.source_records?.length || 0,
      reviewer_document_included: Boolean(reviewerSource),
      stage7_rows: stage7Artifact.merged_ledger?.length || 0,
      stage8_rows: stage8Ledger.post_challenge_ledger?.length || 0,
      stage8_corrected_count: stage8Ledger.corrected_count || 0,
      html_bytes: htmlReport ? Buffer.byteLength(htmlReport, "utf8") : 0
    },
    warnings,
    internal_artifacts: options.include_internal_artifacts === true ? { stage6Cache, stage7Artifact, stage8Export, stage8Ledger, stage8Input } : undefined
  };
}
