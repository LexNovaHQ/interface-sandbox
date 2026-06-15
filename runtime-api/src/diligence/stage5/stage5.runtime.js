import crypto from "node:crypto";
import { runStage5A } from "./5a/5a.runtime.js";
import { runStage5B } from "./5b/5b.runtime.js";
import { runStage5C } from "./5c/5c.runtime.js";
import { runStage5D } from "./5d/5d.runtime.js";
import { PLACEHOLDER_PATTERNS, STAGE5_CANONICAL_VERSION } from "./stage5.dictionary.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function exactString(value) {
  return typeof value === "string" ? value : "";
}

function violation(message, details = {}) {
  const error = new Error(message);
  error.code = "LOSSLESS_PRIMARY_EVIDENCE_VIOLATION";
  error.details = details;
  return error;
}

export function computeSourceSha256(text = "") {
  return crypto.createHash("sha256").update(String(text)).digest("hex");
}

function sourceText(record = {}) {
  if (typeof record.clean_text_lossless === "string") return record.clean_text_lossless;
  if (typeof record.text?.clean_text_lossless === "string") return record.text.clean_text_lossless;
  return "";
}

function sourceId(record = {}, index = 0) {
  return asText(record.source_id || record.evidence_source_id || record.id) || `SRC_${String(index + 1).padStart(3, "0")}`;
}

function sourceUrl(record = {}) {
  return asText(record.source_url || record.final_url || record.url);
}

function sourceTitle(record = {}) {
  return asText(record.source_title || record.title || record.structure?.title);
}

function sourceFamily(record = {}, fallback = "product_family") {
  return asText(record.source_family || record.family_id || record.family) || fallback;
}

function losslessPolicy(record = {}) {
  const existing = record.lossless_policy || record.evidence_policy || {};
  return {
    full_text_lossless: existing.full_text_lossless === false ? false : true,
    summarized: existing.summarized === true ? true : false,
    compressed: existing.compressed === true ? true : false,
    truncated: existing.truncated === true ? true : false,
    normalized: existing.normalized === true ? true : false
  };
}

function metadataSidecar(stage5Input = {}, adapterResult = {}) {
  const keys = [
    "product_family_primary_sources",
    "product_family_secondary_sources",
    "product_family_supporting_sources",
    "product_family_duplicate_sources",
    "product_family_discovery_sources",
    "product_family_non_feature_context_sources"
  ];
  return keys.flatMap((key) => [
    ...asArray(stage5Input[key]).map((row) => ({ ...row, metadata_source: key })),
    ...asArray(adapterResult[key]).map((row) => ({ ...row, metadata_source: key }))
  ]);
}

function routedFamilySources(container = {}) {
  return asArray(container.routed_family_sources).flatMap((family) =>
    asArray(family.sources).map((source) => ({
      ...source,
      source_family: source.source_family || family.family_id,
      family_label: family.family_label
    }))
  );
}

function rawSourceBundleRecords(container = {}) {
  const sourceRecords = asArray(container.raw_footprint?.source_records);
  const productFamily = sourceRecords.filter((record) => sourceFamily(record, "").toLowerCase() === "product_family");
  return productFamily.length ? productFamily : sourceRecords;
}

function evidenceBufferRecords(container = {}) {
  return asArray(container.source_bundle?.evidence_buffer || container.evidence_buffer);
}

function candidateSources({ stage5Input = {}, adapterResult = {} } = {}) {
  return [
    ...asArray(stage5Input?.primary_evidence?.sources),
    ...asArray(adapterResult?.primary_evidence?.sources),
    ...routedFamilySources(stage5Input),
    ...routedFamilySources(adapterResult),
    ...routedFamilySources(stage5Input?.stage3_output || {}),
    ...routedFamilySources(adapterResult?.stage3_output || {}),
    ...evidenceBufferRecords(stage5Input),
    ...evidenceBufferRecords(adapterResult?.target_feature_profile_input || {}),
    ...evidenceBufferRecords(adapterResult || {}),
    ...rawSourceBundleRecords(stage5Input?.sourceBundle || {}),
    ...rawSourceBundleRecords(stage5Input?.source_bundle || {}),
    ...rawSourceBundleRecords(adapterResult?.sourceBundle || {}),
    ...rawSourceBundleRecords(adapterResult?.source_bundle || {})
  ];
}

function canonicalSourceFromRecord(record = {}, index = 0) {
  const cleanText = sourceText(record);
  if (!cleanText) return null;
  const id = sourceId(record, index);
  const sha = asText(record.source_sha256 || record.clean_text_sha256 || record.text?.clean_text_sha256) || computeSourceSha256(cleanText);
  return {
    source_id: id,
    source_url: sourceUrl(record),
    source_title: sourceTitle(record),
    source_family: sourceFamily(record),
    clean_text_lossless: exactString(cleanText),
    source_sha256: sha,
    lossless_policy: losslessPolicy(record)
  };
}

function sourceMergeKey(source = {}, index = 0) {
  return asText(source.source_id) || asText(source.source_url) || `SOURCE_${index}`;
}

function mergeLosslessSources(records = []) {
  const byKey = new Map();
  const duplicate_report = [];
  let sourceIndex = 0;
  for (const record of records) {
    const source = canonicalSourceFromRecord(record, sourceIndex);
    sourceIndex += 1;
    if (!source) continue;
    const key = sourceMergeKey(source, sourceIndex);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, source);
      continue;
    }
    const existingLen = existing.clean_text_lossless.length;
    const candidateLen = source.clean_text_lossless.length;
    duplicate_report.push({
      source_key: key,
      kept_length: Math.max(existingLen, candidateLen),
      replaced_length: Math.min(existingLen, candidateLen),
      policy: "lossless_fuller_source_wins"
    });
    if (candidateLen > existingLen) byKey.set(key, source);
  }
  return { sources: [...byKey.values()], duplicate_report };
}

export function buildNavigationSidecarFromSources(sources = []) {
  return asArray(sources).map((source) => ({
    source_id: source.source_id,
    source_url: source.source_url,
    source_title: source.source_title,
    source_family: source.source_family,
    clean_text_length: source.clean_text_lossless.length,
    source_sha256: source.source_sha256
  }));
}

export function buildStage5CanonicalInput({ companyProfile = {}, adapterResult = {}, stage5Input = {} } = {}) {
  const { sources: fullSources, duplicate_report } = mergeLosslessSources(candidateSources({ stage5Input, adapterResult }));
  const canonical = {
    stage5_input_version: "stage5_lossless_family_input_v1",
    target_profile_ref: stage5Input.target_profile_ref || adapterResult.target_profile_ref || {
      target_profile_version: companyProfile?.target_profile_version || "target_profile_v2",
      brand_name: companyProfile?.identity?.brand_name || "Unknown target",
      legal_name: companyProfile?.identity?.legal_name || "",
      domain: companyProfile?.identity?.domain || companyProfile?.identity?.website || ""
    },
    upstream_profile: companyProfile || {},
    primary_evidence: {
      family_id: "product_family",
      family_label: "Product / Feature Source Family",
      sources: fullSources
    },
    reference: {
      metadata_sidecar: metadataSidecar(stage5Input, adapterResult),
      navigation_index_sidecar: buildNavigationSidecarFromSources(fullSources),
      duplicate_lossless_source_report: duplicate_report
    }
  };
  assertLosslessPrimaryEvidence(canonical);
  return canonical;
}

export function assertLosslessPrimaryEvidence(input = {}) {
  if (!input.primary_evidence) throw violation("primary_evidence is required");
  const sources = input.primary_evidence.sources;
  if (!Array.isArray(sources) || !sources.length) throw violation("primary_evidence.sources must be non-empty");
  for (const [index, source] of sources.entries()) {
    if (!asText(source.source_id)) throw violation("source_id is required", { index });
    if (typeof source.clean_text_lossless !== "string" || source.clean_text_lossless.length <= 0) {
      throw violation("clean_text_lossless must be a non-empty string", { source_id: source.source_id || null });
    }
    if (source.clean_text_lossless === asText(source.source_url) || source.clean_text_lossless === asText(source.source_title)) {
      throw violation("metadata-only source cannot enter primary evidence", { source_id: source.source_id });
    }
    source.source_sha256 = asText(source.source_sha256) || computeSourceSha256(source.clean_text_lossless);
    if (source.source_sha256 !== computeSourceSha256(source.clean_text_lossless)) {
      throw violation("source_sha256 must match clean_text_lossless", { source_id: source.source_id });
    }
    const policy = source.lossless_policy || {};
    if (policy.full_text_lossless !== true || policy.summarized !== false || policy.compressed !== false || policy.truncated !== false || policy.normalized !== false) {
      throw violation("lossless_policy must prove unmodified full text custody", { source_id: source.source_id });
    }
  }
  return true;
}

export function assertWindowIsVerbatim(source = {}, window = {}) {
  if (!source || typeof source.clean_text_lossless !== "string") {
    const error = new Error("Source window cannot be verified without clean_text_lossless.");
    error.code = "SOURCE_WINDOW_NOT_VERBATIM";
    error.details = { source_id: window?.source_id || null, window_id: window?.window_id || null };
    throw error;
  }
  if (!Number.isInteger(window.char_start) || !Number.isInteger(window.char_end) || window.char_start < 0 || window.char_end <= window.char_start) {
    const error = new Error("Source window offsets must define a non-empty range.");
    error.code = "SOURCE_WINDOW_NOT_VERBATIM";
    error.details = { source_id: source.source_id, window_id: window.window_id };
    throw error;
  }
  if (source.clean_text_lossless.slice(window.char_start, window.char_end) !== window.verbatim_text) {
    const error = new Error("Source window is not an exact clean_text_lossless substring.");
    error.code = "SOURCE_WINDOW_NOT_VERBATIM";
    error.details = { source_id: source.source_id, window_id: window.window_id };
    throw error;
  }
  if (source.source_sha256 && window.source_sha256 !== source.source_sha256) {
    const error = new Error("Source window hash does not match source custody hash.");
    error.code = "SOURCE_WINDOW_NOT_VERBATIM";
    error.details = { source_id: source.source_id, window_id: window.window_id };
    throw error;
  }
  return true;
}

export function createVerbatimSourceWindow(source, range = {}, options = {}) {
  assertLosslessPrimaryEvidence({ primary_evidence: { sources: [source] } });
  const charStart = Math.max(0, Number(range.char_start ?? range.start ?? 0));
  const requestedEnd = Number(range.char_end ?? range.end ?? source.clean_text_lossless.length);
  const charEnd = Math.min(source.clean_text_lossless.length, Math.max(charStart + 1, requestedEnd));
  const window = {
    window_id: options.window_id || `${source.source_id}#${options.created_by_substage || "S5"}#W${String(options.window_index || 1).padStart(3, "0")}`,
    source_id: source.source_id,
    source_url: source.source_url,
    source_title: source.source_title,
    char_start: charStart,
    char_end: charEnd,
    verbatim_text: source.clean_text_lossless.slice(charStart, charEnd),
    source_sha256: source.source_sha256 || computeSourceSha256(source.clean_text_lossless),
    created_by_substage: options.created_by_substage || "S5",
    used_for: asArray(options.used_for),
    selection_reason: asText(options.selection_reason) || "bounded source window"
  };
  assertWindowIsVerbatim(source, window);
  return window;
}

export function collectSourceCustodyManifest(primaryEvidence = {}) {
  return {
    manifest_version: "stage5_source_custody_manifest_v1",
    source_count: asArray(primaryEvidence.sources).length,
    sources: asArray(primaryEvidence.sources).map((source) => ({
      source_id: source.source_id,
      source_url: source.source_url,
      source_title: source.source_title,
      source_family: source.source_family,
      clean_text_length: source.clean_text_lossless.length,
      source_sha256: source.source_sha256,
      lossless_policy: source.lossless_policy
    }))
  };
}

export function assertNoPlaceholderEvidence(value, path = "value") {
  if (typeof value === "string" && PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value))) {
    const error = new Error(`Placeholder evidence/source value blocked at ${path}`);
    error.code = "PLACEHOLDER_EVIDENCE_BLOCKED";
    throw error;
  }
  if (Array.isArray(value)) value.forEach((item, index) => assertNoPlaceholderEvidence(item, `${path}[${index}]`));
  else if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) assertNoPlaceholderEvidence(item, `${path}.${key}`);
}

export function sourceById(canonicalInput = {}) {
  return new Map(asArray(canonicalInput.primary_evidence?.sources).map((source) => [source.source_id, source]));
}

function isSourceCustodyError(error = {}) {
  return error?.code === "LOSSLESS_PRIMARY_EVIDENCE_VIOLATION";
}

function issueFromError(error = {}, substage = "STAGE5") {
  return {
    issue_id: `${substage}_REINVESTIGATION_${String(1).padStart(3, "0")}`,
    substage,
    code: asText(error.code) || `${substage}_REINVESTIGATION_REQUIRED`,
    message: asText(error.message) || "Reinvestigation required.",
    details: error.details || error.validation || {},
    required_action: "Re-run this substage with broader verbatim source windows from clean_text_lossless; do not use metadata or indexes as evidence.",
    blocking: false
  };
}

function validationEnvelope(substage, issues = []) {
  const normalized = asArray(issues).filter(Boolean).map((issue, index) => ({
    issue_id: issue.issue_id || `${substage}_REINVESTIGATION_${String(index + 1).padStart(3, "0")}`,
    substage,
    code: issue.code || `${substage}_REINVESTIGATION_REQUIRED`,
    message: issue.message || "Reinvestigation required.",
    details: issue.details || {},
    required_action: issue.required_action || "Reinvestigate with broader verbatim windows from clean_text_lossless.",
    blocking: false
  }));
  return {
    ok: normalized.length === 0,
    reinvestigation_required: normalized.length > 0,
    blocking: false,
    next_action: normalized.length ? "REINVESTIGATE_WITH_BROADER_VERBATIM_WINDOWS" : "NONE",
    reinvestigation_requests: normalized,
    issues: normalized
  };
}

function fallbackStage5A(canonicalInput, error) {
  const validation = validationEnvelope("5A", [issueFromError(error, "5A")]);
  return {
    ok: true,
    stage5a_output_version: "stage5a_product_function_discovery_v3",
    target_profile_ref: canonicalInput.target_profile_ref,
    admitted_functions: [],
    core_products: [],
    rejected_or_uncertain_candidates: validation.reinvestigation_requests,
    feature_evidence_windows: [],
    prompt_input: null,
    validation,
    forensic_log: { substage: "5A", reinvestigation_required: true, recovered_without_runtime_failure: true }
  };
}

function fallbackStage5B(canonicalInput, error) {
  const validation = validationEnvelope("5B", [issueFromError(error, "5B")]);
  return {
    ok: true,
    stage5b_output_version: "stage5b_archetype_surface_tagging_v3",
    target_profile_ref: canonicalInput.target_profile_ref,
    feature_tags: [],
    tagging_failures: validation.reinvestigation_requests,
    inherited_feature_evidence_windows: [],
    supplemental_evidence_windows: [],
    feature_packets_for_5c: [],
    prompt_input: null,
    validation,
    forensic_log: { substage: "5B", reinvestigation_required: true, recovered_without_runtime_failure: true }
  };
}

function fallbackStage5C(canonicalInput, error) {
  const validation = validationEnvelope("5C", [issueFromError(error, "5C")]);
  return {
    ok: true,
    stage5c_output_version: "stage5c_complete_feature_records_v3",
    target_profile_ref: canonicalInput.target_profile_ref,
    complete_feature_records: [],
    feature_unknowns: validation.reinvestigation_requests,
    data_provenance_seeds: [],
    regulated_surface_seeds: [],
    vault_question_seeds: [],
    supplemental_evidence_windows: [],
    prompt_input: null,
    validation,
    forensic_log: { substage: "5C", reinvestigation_required: true, recovered_without_runtime_failure: true }
  };
}

function targetProfileRef(canonicalInput = {}) {
  const ref = canonicalInput.target_profile_ref || {};
  return {
    target_profile_version: String(ref.target_profile_version || "target_profile_v2"),
    brand_name: String(ref.brand_name || "Unknown target"),
    legal_name: String(ref.legal_name || ""),
    domain: String(ref.domain || "")
  };
}

function buildReinvestigationTargetFeatureProfile(canonicalInput, issues = []) {
  const requests = asArray(issues).flatMap((item) => asArray(item?.validation?.reinvestigation_requests || item?.validation?.issues || item?.reinvestigation_requests || item?.issues));
  const normalizedRequests = requests.length ? requests : [
    {
      issue_id: "5D_REINVESTIGATION_001",
      substage: "5D",
      code: "STAGE5D_REINVESTIGATION_REQUIRED",
      message: "Stage 5D could not safely assemble target_feature_profile from prior substage outputs.",
      required_action: "Re-run Stage 5 with broader verbatim source windows and preserve downstream handoff shape.",
      blocking: false
    }
  ];
  return {
    feature_profile_version: "feature_profile_v2",
    target_profile_ref: targetProfileRef(canonicalInput),
    feature_inventory: [],
    product_feature_map: [],
    data_provenance_map: [],
    regulated_surface_map: [],
    architecture_hints: [],
    classification_quality: {
      quality_version: "stage5_classification_quality_v2",
      status: "REINVESTIGATION_REQUIRED",
      reinvestigation_required: true,
      reinvestigation_attempted: false,
      reinvestigation_pass_count: 0,
      unresolved_feature_count: normalizedRequests.length,
      fallback_routing_required: true,
      reinvestigation_requests: normalizedRequests
    },
    unresolved_feature_candidates: normalizedRequests.map((request) => ({
      candidate_id: request.issue_id,
      reason: request.message,
      required_action: request.required_action,
      source_window_refs: []
    })),
    commercial_scan: {
      distinct_commercial_outcomes_seen: [],
      mapped_core_feature_ids: [],
      source_coverage: asArray(canonicalInput.primary_evidence?.sources).map((source) => ({
        source_id: source.source_id,
        source_url: source.source_url,
        source_family: source.source_family,
        coverage_status: "REINVESTIGATION_REQUIRED",
        mapped_feature_ids: [],
        unmapped_reason: "Feature windows require reinvestigation before safe mapping.",
        evidence_refs: []
      })),
      unmapped_outcomes_due_to_insufficient_detail: normalizedRequests.map((request) => request.message),
      completeness_status: "REINVESTIGATION_REQUIRED",
      completeness_warnings: normalizedRequests.map((request) => request.code)
    },
    vault_feature_candidates: { baseline: {}, archetypes: {}, compliance: {} },
    evidence: {
      field_evidence_refs: [],
      unresolved_questions: normalizedRequests.map((request) => ({
        question_id: request.issue_id,
        question: request.required_action,
        basis: request.message,
        source_window_refs: []
      }))
    },
    limitations: ["Stage 5 returned a contract-safe target_feature_profile requiring reinvestigation instead of failing the runtime."]
  };
}

function fallbackStage5D(canonicalInput, stage5a, stage5b, stage5c, error) {
  const ownIssue = issueFromError(error, "5D");
  const profile = buildReinvestigationTargetFeatureProfile(canonicalInput, [stage5a, stage5b, stage5c, { validation: validationEnvelope("5D", [ownIssue]) }]);
  return {
    ok: true,
    stage5d_output_version: "stage5d_target_feature_profile_integrator_v2",
    target_feature_profile: profile,
    prompt_input: null,
    validation: validationEnvelope("5D", [ownIssue]),
    forensic_log: { substage: "5D", reinvestigation_required: true, recovered_without_runtime_failure: true }
  };
}

async function runOrReinvestigate({ substage, runner, fallback }) {
  try {
    return await runner();
  } catch (error) {
    if (isSourceCustodyError(error)) throw error;
    return fallback(error);
  }
}

function aggregateValidation(stage5a, stage5b, stage5c, stage5d) {
  const substages = { stage5a: stage5a.validation, stage5b: stage5b.validation, stage5c: stage5c.validation, stage5d: stage5d.validation };
  const requests = Object.values(substages).flatMap((validation) => asArray(validation?.reinvestigation_requests));
  return {
    ok: requests.length === 0,
    reinvestigation_required: requests.length > 0,
    blocking: false,
    next_action: requests.length ? "REINVESTIGATE_STAGE5_SUBSTAGES" : "NONE",
    reinvestigation_requests: requests,
    substages,
    stage5d: stage5d.validation
  };
}

export async function runStage5Runtime({ companyProfile, stage5Input, adapterResult, runContext = {}, modelPorts = {}, registryPorts = {}, schemaValidator = null } = {}) {
  const canonicalInput = buildStage5CanonicalInput({ companyProfile, adapterResult, stage5Input });
  const custody_manifest = collectSourceCustodyManifest(canonicalInput.primary_evidence);

  const stage5a = await runOrReinvestigate({
    substage: "5A",
    runner: () => runStage5A({ canonicalInput, modelPorts, runContext }),
    fallback: (error) => fallbackStage5A(canonicalInput, error)
  });
  const stage5b = await runOrReinvestigate({
    substage: "5B",
    runner: () => runStage5B({ canonicalInput, stage5a, registryPorts, modelPorts, runContext }),
    fallback: (error) => fallbackStage5B(canonicalInput, error)
  });
  const stage5c = await runOrReinvestigate({
    substage: "5C",
    runner: () => runStage5C({ canonicalInput, stage5a, stage5b, modelPorts, runContext }),
    fallback: (error) => fallbackStage5C(canonicalInput, error)
  });
  const stage5d = await runOrReinvestigate({
    substage: "5D",
    runner: () => runStage5D({ canonicalInput, stage5a, stage5b, stage5c, schemaValidator, runContext }),
    fallback: (error) => fallbackStage5D(canonicalInput, stage5a, stage5b, stage5c, error)
  });

  assertNoPlaceholderEvidence(stage5d.target_feature_profile, "target_feature_profile");
  const validation = aggregateValidation(stage5a, stage5b, stage5c, stage5d);
  return {
    ok: true,
    stage5_version: STAGE5_CANONICAL_VERSION,
    target_feature_profile: stage5d.target_feature_profile,
    substage_outputs: { stage5a, stage5b, stage5c, stage5d },
    custody_manifest,
    validation,
    forensic_log: {
      runtime: "runStage5Runtime",
      substages: ["5A", "5B", "5C", "5D"],
      run_id: runContext?.runId || runContext?.run_id || null,
      reinvestigation_required: validation.reinvestigation_required,
      runtime_failed: false
    }
  };
}
