#!/usr/bin/env node

import { buildEvidenceRefinerInput } from "../src/diligence/adapters/sourceBundleAdapter.js";

const runtimeUrl = process.env.RUNTIME_URL || process.env.LEXNOVA_RUNTIME_URL;
const token = process.env.RUNTIME_ACCESS_TOKEN;
const primaryUrl = process.env.TEST_PRIMARY_URL || "https://sarvam.ai";
const companyName = process.env.TEST_COMPANY_NAME || "Sarvam AI";

function fail(message, detail) {
  console.error(JSON.stringify({ ok: false, error: message, detail: detail || null }, null, 2));
  process.exit(1);
}

function normalizeRuntimeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withScheme);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error(`Unsupported protocol: ${parsed.protocol}`);
    return parsed.toString().replace(/\/+$/, "");
  } catch (error) {
    fail("RUNTIME_URL must be a valid http(s) URL or hostname", {
      received: raw,
      normalized_attempt: withScheme,
      error: error?.message || String(error)
    });
  }
}

async function readJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { non_json_body: text.slice(0, 3000) };
  }
}

async function postJson(base, path, body) {
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-runtime-access-token": token },
    body: JSON.stringify(body)
  });
  const json = await readJson(response);
  if (!response.ok || json?.ok === false) fail(`Request failed: ${path}`, { status: response.status, body: json });
  return json;
}

function preview(value, maxChars = Number(process.env.STAGE4_OUTPUT_PREVIEW_CHARS || 3500)) {
  return JSON.stringify(value || {}).slice(0, maxChars);
}

function stableString(value) {
  return JSON.stringify(value || {});
}

function normalizeUrlForCompare(value) {
  try {
    const parsed = new URL(String(value || "").trim());
    parsed.hash = "";
    parsed.search = "";
    return parsed.toString().replace(/\/+$/, "").toLowerCase();
  } catch {
    return String(value || "").trim().replace(/\/+$/, "").toLowerCase();
  }
}

function collectSources(discovery = {}) {
  const buckets = ["product_profile_sources", "legal_governance_sources", "docs_developer_sources", "commercial_sources", "update_sources"];
  const byUrl = new Map();
  for (const bucket of buckets) {
    for (const record of Array.isArray(discovery[bucket]) ? discovery[bucket] : []) {
      if (!record?.url || byUrl.has(record.url)) continue;
      byUrl.set(record.url, { ...record, source_bucket: bucket });
    }
  }
  if (byUrl.size === 0 && Array.isArray(discovery.candidate_sources)) {
    for (const record of discovery.candidate_sources) {
      if (!record?.url || byUrl.has(record.url)) continue;
      byUrl.set(record.url, { ...record, source_bucket: "candidate_sources" });
    }
  }
  return [...byUrl.values()].slice(0, Number(process.env.STAGE4_CAPTURE_LIMIT || 8));
}

function assertPromptMetadata(stageName, response) {
  const metadata = response?.prompt_metadata || {};
  const missing = [];
  if (!metadata.prompt_root) missing.push("prompt_root");
  if (!metadata.shared_sha256) missing.push("shared_sha256");
  if (!metadata.stage_sha256) missing.push("stage_sha256");
  if (!metadata.combined_characters) missing.push("combined_characters");
  if (missing.length) fail(`${stageName} is missing prompt metadata`, { missing, prompt_metadata: metadata });
  return {
    prompt_root: metadata.prompt_root,
    shared_sha256: metadata.shared_sha256,
    stage_sha256: metadata.stage_sha256,
    combined_characters: metadata.combined_characters
  };
}

function countPossibleFeatures(targetFeatureProfile = {}) {
  const json = stableString(targetFeatureProfile);
  const structuralCount = [
    targetFeatureProfile.features,
    targetFeatureProfile.product_features,
    targetFeatureProfile.atomic_features,
    targetFeatureProfile.feature_inventory,
    targetFeatureProfile.target_features,
    targetFeatureProfile.product_feature_map,
    targetFeatureProfile.raw_feature_candidates
  ].reduce((sum, value) => sum + (Array.isArray(value) ? value.length : 0), 0);
  const keywordHits = (json.match(/feature|model|api|developer|platform|product|classification|INT|EXT|UNI/gi) || []).length;
  return { structural_count: structuralCount, keyword_hits: keywordHits };
}

function countPossibleLegalFindings(legalStackReview = {}) {
  const json = stableString(legalStackReview);
  const structuralCount = [
    legalStackReview.legal_documents,
    legalStackReview.document_inventory,
    legalStackReview.governance_documents,
    legalStackReview.stack_findings,
    legalStackReview.legal_stack_findings,
    legalStackReview.gaps,
    legalStackReview.risks,
    legalStackReview.legal_stack,
    legalStackReview.document_stack_redline
  ].reduce((sum, value) => sum + (Array.isArray(value) ? value.length : 0), 0);
  const keywordHits = (json.match(/terms|privacy|dpa|processor|governance|legal|risk|gap|policy|sla|data/gi) || []).length;
  return { structural_count: structuralCount, keyword_hits: keywordHits };
}

function extractSourceAudit(sourceBundle = {}) {
  const artifactInventory = Array.isArray(sourceBundle.artifact_inventory) ? sourceBundle.artifact_inventory : [];
  const discoveryCandidates = Array.isArray(sourceBundle.discovery_candidates) ? sourceBundle.discovery_candidates : [];
  const admitted = artifactInventory
    .filter((item) => String(item.admission_status || item.status || "").toUpperCase() !== "FILTERED")
    .map((item) => ({
      id: item.artifact_id || item.source_id || item.id || null,
      url: item.source_url || item.url || null,
      normalized_url: normalizeUrlForCompare(item.source_url || item.url || ""),
      class: item.artifact_class || item.source_family || item.zone || null,
      zone: item.zone || null,
      hash: item.source_hash || item.clean_text_sha256 || null
    }))
    .filter((item) => item.id || item.url || item.hash);
  const filtered = discoveryCandidates
    .filter((item) => /DISCOVERY_ONLY|FILTERED|EXCLUDED|REJECTED/i.test(String(item.status || item.admission_status || "")))
    .map((item) => ({
      id: item.candidate_id || item.artifact_id || item.source_id || null,
      url: item.source_url || item.url || null,
      normalized_url: normalizeUrlForCompare(item.source_url || item.url || ""),
      status: item.status || item.admission_status || null
    }))
    .filter((item) => item.id || item.url);
  return {
    admitted,
    filtered,
    legal_governance: admitted.filter((item) => /terms|privacy|dpa|processor|subprocessor|sla|security|trust|governance|policy|data/i.test(`${item.class || ""} ${item.zone || ""} ${item.url || ""}`)),
    product_docs: admitted.filter((item) => /product|model|docs|developer|api|homepage|context|mechanical/i.test(`${item.class || ""} ${item.zone || ""} ${item.url || ""}`))
  };
}

function buildCoverageContext(coverageGaps = []) {
  return {
    upstream_coverage_gaps: coverageGaps,
    compliance_instruction: "Carry these upstream coverage gaps forward in limitations. Do not invent missing source families or assume unavailable update/blog/release evidence exists. If a gap is irrelevant to a classification, still mark it as an evidence limitation."
  };
}

function buildLegalEvidenceContext(evidenceInput = {}) {
  const records = Array.isArray(evidenceInput.raw_footprint?.source_records) ? evidenceInput.raw_footprint.source_records : [];
  const legalDocs = records
    .filter((record) => /legal_governance/i.test(record.source_family || ""))
    .map((record) => ({
      evidence_source_id: record.evidence_source_id,
      url: record.final_url || record.url,
      source_family: record.source_family,
      title: record.structure?.title || "",
      clean_text_sha256: record.text?.clean_text_sha256 || null,
      word_count: record.text?.word_count || 0,
      clean_text_lossless: record.text?.clean_text_lossless || ""
    }))
    .filter((record) => record.url && record.clean_text_lossless);

  if (!legalDocs.length) {
    fail("No full admitted legal/governance documents available for Legal Stack Review", {
      raw_source_count: records.length,
      source_families: records.map((record) => ({ id: record.evidence_source_id, url: record.final_url || record.url, family: record.source_family }))
    });
  }

  return {
    instruction: [
      "Use these full admitted first-party legal/governance documents as the controlling evidence for document-existence findings.",
      "Recognition is Gemini-only: inspect the full text for embedded annexures, addenda, schedules, incorporated sections, and document headings before marking DPA, SLA, AUP, Subprocessor list, security/trust terms, or support terms absent.",
      "If a DPA or SLA is embedded inside a Terms page or other admitted legal page, mark that document as existing and cite the containing URL plus the embedded heading or evidence quote.",
      "Do not mark embedded legal artifacts absent merely because they are not standalone URLs."
    ].join(" "),
    legal_governance_documents: legalDocs
  };
}

function requireAnyReference(stageName, output, candidates, description) {
  const json = stableString(output);
  const hits = candidates.filter((candidate) => [candidate.id, candidate.url, candidate.normalized_url, candidate.hash].filter(Boolean).some((token) => json.includes(token)));
  if (!hits.length) fail(`${stageName} output has no admitted-source trace for ${description}`, { candidate_count: candidates.length, candidates: candidates.slice(0, 10), output_keys: Object.keys(output || {}), preview: preview(output) });
  return hits;
}

function assertNoFilteredSourceLeak(stageName, output, filteredSources) {
  const json = stableString(output);
  const leaked = filteredSources.filter((source) => [source.id, source.url, source.normalized_url].filter(Boolean).filter((item) => item.length > 8).some((token) => json.includes(token)));
  if (leaked.length) fail(`${stageName} output references filtered/excluded source(s)`, { leaked, preview: preview(output) });
}

function assertBoundaryCompliance(stageName, output) {
  const json = stableString(output);
  const violations = [];
  const affirmativeLawFirmPatterns = [/\bwe are (a )?law firm\b/i, /\bas (your|a|the) lawyer\b/i, /\bas (your|an|the) attorney\b/i, /\battorney-client relationship\b/i, /\bsolicitor-client relationship\b/i, /\bprivileged legal counsel\b/i, /\bwe represent\b/i];
  for (const pattern of affirmativeLawFirmPatterns) if (pattern.test(json)) violations.push(pattern.toString());
  const legalAdviceMatches = [...json.matchAll(/legal advice/gi)];
  for (const match of legalAdviceMatches) {
    const start = Math.max(0, match.index - 40);
    const context = json.slice(start, match.index + 80);
    if (!/not legal advice|not constitute legal advice|does not constitute legal advice/i.test(context)) violations.push(`unqualified legal advice phrase near: ${context}`);
  }
  if (violations.length) fail(`${stageName} output violates Lex Nova boundary language`, { violations, preview: preview(output) });
}

function assertCoverageGapAcknowledged(stageName, output, coverageGaps = []) {
  const hasCoverageGap = coverageGaps.length > 0;
  const json = stableString(output);
  const acknowledged = /coverage_gap|coverage gap|not found|insufficient|missing|unavailable|not located|not discovered|updates|blog|releases/i.test(json);
  if (hasCoverageGap && !acknowledged) fail(`${stageName} output does not acknowledge upstream coverage gap(s)`, { coverage_gaps: coverageGaps, preview: preview(output) });
  return { acknowledged: hasCoverageGap ? acknowledged : true };
}

function documentStatusMap(legalStackReview = {}) {
  const docs = Array.isArray(legalStackReview.legal_stack) ? legalStackReview.legal_stack : [];
  const map = new Map();
  for (const doc of docs) {
    const key = String(doc.document_type || doc.type || doc.name || "").trim().toUpperCase();
    if (key) map.set(key, doc);
  }
  return map;
}

function assertKnownEmbeddedArtifactsForSarvam({ legalStackReview, legalEvidenceContext }) {
  const isSarvam = /sarvam\.ai/i.test(primaryUrl) || /sarvam/i.test(companyName);
  if (!isSarvam) return { fixture_applied: false };

  const sourceText = legalEvidenceContext.legal_governance_documents.map((doc) => doc.clean_text_lossless).join("\n\n");
  const hasDpaEvidence = /data processing addendum|\bDPA\b|annexure\s+c/i.test(sourceText);
  const hasSlaEvidence = /service level agreement|\bSLA\b|annexure\s+a/i.test(sourceText);
  const docs = documentStatusMap(legalStackReview);
  const dpa = docs.get("DPA") || docs.get("DATA PROCESSING ADDENDUM");
  const sla = docs.get("SLA") || docs.get("SERVICE LEVEL AGREEMENT");
  const failures = [];

  if (hasDpaEvidence && !(dpa && dpa.exists === true && !/N\/A/i.test(String(dpa.document_url || "")))) {
    failures.push({ artifact: "DPA", expected: "exists=true with containing document URL", observed: dpa || null });
  }
  if (hasSlaEvidence && !(sla && sla.exists === true && !/N\/A/i.test(String(sla.document_url || "")))) {
    failures.push({ artifact: "SLA", expected: "exists=true with containing document URL", observed: sla || null });
  }
  if (failures.length) {
    fail("Legal Stack Review failed embedded-artifact recognition fixture", {
      fixture: "sarvam.ai",
      evidence_detected_in_full_legal_text: { dpa: hasDpaEvidence, sla: hasSlaEvidence },
      failures,
      preview: preview(legalStackReview)
    });
  }
  return { fixture_applied: true, dpa_evidence_present: hasDpaEvidence, sla_evidence_present: hasSlaEvidence };
}

function runPromptComplianceAudit({ sourceBundle, coverageGaps, evidenceRefinerResponse, targetFeatureResponse, targetFeatureProfile, legalStackResponse, legalStackReview, legalEvidenceContext }) {
  const sourceAudit = extractSourceAudit(sourceBundle);
  if (!sourceAudit.admitted.length) fail("Prompt compliance audit could not find admitted source artifacts", { source_bundle_keys: Object.keys(sourceBundle || {}), preview: preview(sourceBundle) });
  if (!sourceAudit.legal_governance.length) fail("Prompt compliance audit could not find admitted legal/governance artifacts", { admitted: sourceAudit.admitted });
  if (!sourceAudit.product_docs.length) fail("Prompt compliance audit could not find admitted product/docs artifacts", { admitted: sourceAudit.admitted });

  const targetTraceHits = requireAnyReference("Target Feature Profile", targetFeatureProfile, sourceAudit.product_docs, "product/docs artifacts");
  const legalTraceHits = requireAnyReference("Legal Stack Review", legalStackReview, sourceAudit.legal_governance, "legal/governance artifacts");
  assertNoFilteredSourceLeak("Target Feature Profile", targetFeatureProfile, sourceAudit.filtered);
  assertNoFilteredSourceLeak("Legal Stack Review", legalStackReview, sourceAudit.filtered);
  assertBoundaryCompliance("Target Feature Profile", targetFeatureProfile);
  assertBoundaryCompliance("Legal Stack Review", legalStackReview);

  const targetCoverage = assertCoverageGapAcknowledged("Target Feature Profile", targetFeatureProfile, coverageGaps);
  const legalCoverage = assertCoverageGapAcknowledged("Legal Stack Review", legalStackReview, coverageGaps);
  const embeddedFixture = assertKnownEmbeddedArtifactsForSarvam({ legalStackReview, legalEvidenceContext });

  return {
    ok: true,
    prompt_metadata: {
      evidence_refiner: assertPromptMetadata("Evidence Refiner", evidenceRefinerResponse),
      target_feature_profile: assertPromptMetadata("Target Feature Profile", targetFeatureResponse),
      legal_stack_review: assertPromptMetadata("Legal Stack Review", legalStackResponse)
    },
    source_trace: {
      admitted_count: sourceAudit.admitted.length,
      filtered_count: sourceAudit.filtered.length,
      legal_governance_count: sourceAudit.legal_governance.length,
      product_docs_count: sourceAudit.product_docs.length,
      target_trace_hits: targetTraceHits.map((item) => ({ id: item.id, url: item.url, class: item.class, zone: item.zone })),
      legal_trace_hits: legalTraceHits.map((item) => ({ id: item.id, url: item.url, class: item.class, zone: item.zone }))
    },
    legal_evidence_context: {
      full_legal_documents_sent_to_gemini: true,
      legal_governance_document_count: legalEvidenceContext.legal_governance_documents.length,
      total_words: legalEvidenceContext.legal_governance_documents.reduce((sum, doc) => sum + (doc.word_count || 0), 0)
    },
    filtered_source_leakage: { target_feature_profile: 0, legal_stack_review: 0 },
    boundary_compliance: { target_feature_profile: "pass", legal_stack_review: "pass" },
    coverage_gap_handling: { target_feature_profile_acknowledged: targetCoverage.acknowledged, legal_stack_review_acknowledged: legalCoverage.acknowledged },
    embedded_artifact_fixture: embeddedFixture
  };
}

if (!runtimeUrl) fail("RUNTIME_URL or LEXNOVA_RUNTIME_URL is required");
if (!token) fail("RUNTIME_ACCESS_TOKEN is required");

const base = normalizeRuntimeUrl(runtimeUrl);
const targetInput = { primary_url: primaryUrl, company_name: companyName, submitted_at: new Date().toISOString() };
console.log(JSON.stringify({ ok: true, step: "start", phase: "stage_4_target_feature_and_legal_stack_e2e_v3", target: targetInput, runtime_url: base, capture_limit: Number(process.env.STAGE4_CAPTURE_LIMIT || 8) }, null, 2));

const discoveryResponse = await postJson(base, "/v1/source-discovery", {
  input: targetInput,
  options: {
    max_search_results_per_family: Number(process.env.STAGE4_MAX_SEARCH_RESULTS_PER_FAMILY || 4),
    probe_timeout_ms: Number(process.env.STAGE4_PROBE_TIMEOUT_MS || 8000)
  }
});
const sources = collectSources(discoveryResponse.discovery);
if (!sources.length) fail("Source discovery returned no capturable sources", { discovery_counts: discoveryResponse.discovery?.counts || null, coverage_gaps: discoveryResponse.discovery?.coverage_gaps || [] });
console.log(JSON.stringify({ ok: true, step: "source_discovery_complete", source_count: sources.length, discovery_counts: discoveryResponse.discovery?.counts || null, coverage_gaps: discoveryResponse.discovery?.coverage_gaps || [] }, null, 2));

const captureResponse = await postJson(base, "/v1/source-capture", {
  input: { sources },
  options: { timeout_ms: Number(process.env.STAGE4_CAPTURE_TIMEOUT_MS || 12000), max_sources: sources.length }
});
const evidenceInput = buildEvidenceRefinerInput({ targetInput, discoveryResponse, captureResponse, runId: `stage4_${Date.now()}` });
const sourceCounts = evidenceInput.scrape_meta?.coverage_summary?.source_counts || {};
if ((sourceCounts.fetch_ok || 0) === 0 || (sourceCounts.total_words || 0) === 0) fail("Source capture produced no usable text", { source_counts: sourceCounts });
console.log(JSON.stringify({ ok: true, step: "source_capture_and_adapter_complete", run_id: evidenceInput.run_id, source_counts: sourceCounts, raw_footprint_sha256: evidenceInput.scrape_meta.hashes.raw_footprint_sha256 }, null, 2));

const evidenceRefinerResponse = await postJson(base, "/v1/diligence/stage", { stage: "evidence_refiner", input: evidenceInput, options: { poolAlias: "json" } });
const sourceBundle = evidenceRefinerResponse.source_bundle;
if (!sourceBundle || JSON.stringify(sourceBundle).length < 500) fail("Evidence Refiner returned no usable source_bundle", { response_keys: Object.keys(evidenceRefinerResponse || {}), preview: preview(evidenceRefinerResponse) });
console.log(JSON.stringify({ ok: true, step: "evidence_refiner_complete", output_schema_key: evidenceRefinerResponse.output_schema_key, prompt_metadata: evidenceRefinerResponse.prompt_metadata, source_bundle_keys: Object.keys(sourceBundle || {}), preview: preview(sourceBundle, Number(process.env.STAGE4_STEP_PREVIEW_CHARS || 1200)) }, null, 2));

const coverageGaps = evidenceInput.scrape_meta.coverage_summary.coverage_gaps || [];
const coverageContext = buildCoverageContext(coverageGaps);
const legalEvidenceContext = buildLegalEvidenceContext(evidenceInput);

const targetFeatureResponse = await postJson(base, "/v1/diligence/stage", {
  stage: "target_feature_profile",
  input: { source_bundle: sourceBundle, coverage_context: coverageContext },
  options: { poolAlias: "reasoning" }
});
const targetFeatureProfile = targetFeatureResponse.target_feature_profile;
const featureSignals = countPossibleFeatures(targetFeatureProfile);
if (!targetFeatureProfile || JSON.stringify(targetFeatureProfile).length < 500 || (featureSignals.structural_count === 0 && featureSignals.keyword_hits < 5)) fail("Target Feature Profile returned an unexpectedly weak output", { response_keys: Object.keys(targetFeatureResponse || {}), feature_signals: featureSignals, preview: preview(targetFeatureResponse) });
console.log(JSON.stringify({ ok: true, step: "target_feature_profile_complete", output_schema_key: targetFeatureResponse.output_schema_key, prompt_metadata: targetFeatureResponse.prompt_metadata, feature_signals: featureSignals, target_feature_profile_keys: Object.keys(targetFeatureProfile || {}), preview: preview(targetFeatureProfile, Number(process.env.STAGE4_STEP_PREVIEW_CHARS || 1200)) }, null, 2));

const legalStackResponse = await postJson(base, "/v1/diligence/stage", {
  stage: "legal_stack_review",
  input: { source_bundle: sourceBundle, target_feature_profile: targetFeatureProfile, coverage_context: coverageContext, legal_evidence_context: legalEvidenceContext },
  options: { poolAlias: "reasoning" }
});
const legalStackReview = legalStackResponse.legal_stack_review;
const legalSignals = countPossibleLegalFindings(legalStackReview);
if (!legalStackReview || JSON.stringify(legalStackReview).length < 500 || (legalSignals.structural_count === 0 && legalSignals.keyword_hits < 5)) fail("Legal Stack Review returned an unexpectedly weak output", { response_keys: Object.keys(legalStackResponse || {}), legal_signals: legalSignals, preview: preview(legalStackResponse) });

const complianceAudit = runPromptComplianceAudit({ sourceBundle, coverageGaps, evidenceRefinerResponse, targetFeatureResponse, targetFeatureProfile, legalStackResponse, legalStackReview, legalEvidenceContext });
console.log(JSON.stringify({
  ok: true,
  service: "lexnova-runtime-api",
  phase: "stage_4_target_feature_and_legal_stack_e2e_v3",
  target: targetInput,
  run_id: evidenceInput.run_id,
  source_counts: sourceCounts,
  coverage_gaps: coverageGaps,
  target_feature: { ok: true, output_schema_key: targetFeatureResponse.output_schema_key, feature_signals: featureSignals, output_keys: Object.keys(targetFeatureProfile || {}), preview: preview(targetFeatureProfile, Number(process.env.STAGE4_FINAL_PREVIEW_CHARS || 1800)) },
  legal_stack: { ok: true, output_schema_key: legalStackResponse.output_schema_key, legal_signals: legalSignals, output_keys: Object.keys(legalStackReview || {}), preview: preview(legalStackReview, Number(process.env.STAGE4_FINAL_PREVIEW_CHARS || 1800)) },
  prompt_compliance_audit: complianceAudit
}, null, 2));
