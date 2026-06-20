import crypto from "node:crypto";

const DEFAULT_MAX_INPUT_CHARS = 120000;
const DEFAULT_MAX_ESTIMATED_TOKENS = 60000;
const DEFAULT_MAX_SINGLE_SOURCE_CHARS = 60000;
const DEFAULT_PROMPT_OVERHEAD_TOKENS = 25000;
const ESTIMATED_CHARS_PER_TOKEN = 3;
const LEGAL_SOURCE_FAMILIES = new Set(["legal_profile", "governance_profile"]);

function nowIso() { return new Date().toISOString(); }
function sha256(value) { return crypto.createHash("sha256").update(String(value || ""), "utf8").digest("hex"); }
function cleanText(record = {}) { return record?.text?.clean_text_lossless || record?.clean_text_lossless || ""; }
function titleOf(record = {}) { return record?.structure?.title || record?.title || ""; }
function normalizeLimit(value) { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : null; }
function enforcementMode(value) { return String(value || "guidance").trim().toLowerCase() === "hard" ? "hard" : "guidance"; }
function shouldEnforce(budget = {}) { return enforcementMode(budget.enforcement_mode || budget.mode) === "hard"; }
function estimateSourceTokens(chars) { return Math.ceil(Number(chars || 0) / ESTIMATED_CHARS_PER_TOKEN); }
function estimateTotalPromptTokens(sourceChars, promptOverheadTokens = DEFAULT_PROMPT_OVERHEAD_TOKENS) { return estimateSourceTokens(sourceChars) + promptOverheadTokens; }
function asObject(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function asArray(value) { return Array.isArray(value) ? value : []; }

function fullTextExpansionMode(batch = {}, budget = {}) {
  const mode = String(budget.stage7_source_text_mode || budget.source_text_mode || "").trim().toLowerCase();
  if (["full", "full_text", "raw_full_text", "expansion"].includes(mode)) return true;
  if (["profile", "profile_only", "manifest", "manifest_only"].includes(mode)) return false;
  return Boolean(batch?.reinvestigation_request);
}

function sourceSpecificity(record = {}) {
  const url = String(record.final_url || record.url || "").toLowerCase();
  const title = String(titleOf(record) || "").toLowerCase();
  const text = cleanText(record).toLowerCase();
  let score = 0;
  if (record.source_family === "legal_profile") score += 30;
  if (record.source_family === "governance_profile") score += 25;
  if (/terms|privacy|dpa|data-processing|acceptable-use|aup|sla|service-level|security|trust|subprocessor|compliance|legal/.test(url)) score += 40;
  if (/terms|privacy|dpa|data processing|acceptable use|prohibited use|sla|service level|security|trust|subprocessor|compliance/.test(title)) score += 30;
  if (/data processing addendum|data processing agreement|acceptable use|service level agreement|sub-?processors?|annexure|schedule|addendum|prohibited use|support services|limitation of liability|disclaimer|governing law|privacy policy/.test(text)) score += 30;
  score += Math.min(cleanText(record).length, 40000) / 4000;
  return score;
}

function sortSources(records = []) { return [...records].sort((a, b) => sourceSpecificity(b) - sourceSpecificity(a)); }

function allSourceRecords(sourceBundle = {}, evidenceJunction = {}) {
  const fromArchive = Array.isArray(sourceBundle?.raw_footprint?.source_records) ? sourceBundle.raw_footprint.source_records : [];
  if (fromArchive.length) return fromArchive;
  const packets = evidenceJunction?.downstream_packets || {};
  const seen = new Set();
  const out = [];
  for (const key of ["stage6a_legal_document_cartography", "stage6b_data_provenance", "governance_review", "registry_matching", "registry_ledger_evaluation"]) {
    for (const record of Array.isArray(packets?.[key]?.source_records) ? packets[key].source_records : []) {
      const id = record.evidence_source_id || `${record.source_family}|${record.url}|${record.final_url}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(record);
    }
  }
  return out;
}

function legalGovernanceRecords(sourceBundle = {}, evidenceJunction = {}) {
  return allSourceRecords(sourceBundle, evidenceJunction).filter((record) => LEGAL_SOURCE_FAMILIES.has(record.source_family));
}

function artifactFromRecord(record = {}, options = {}) {
  const text = cleanText(record);
  return {
    evidence_source_id: record.evidence_source_id || null,
    source_family: record.source_family || "unknown",
    source_url: record.url || null,
    final_url: record.final_url || null,
    title: titleOf(record),
    word_count: record?.text?.word_count || record.word_count || 0,
    clean_text_sha256: record?.text?.clean_text_sha256 || record.clean_text_sha256 || sha256(text),
    clean_text_length: text.length,
    estimated_source_tokens: estimateSourceTokens(text.length),
    coverage_status: record?.quality?.coverage_status || record.coverage_status || "unknown",
    full_text_in_evidence_buffer: options.fullTextInEvidenceBuffer !== false
  };
}

function evidenceFromRecord(record = {}) {
  const text = cleanText(record);
  return {
    evidence_source_id: record.evidence_source_id || null,
    source_family: record.source_family || "unknown",
    source_url: record.url || null,
    final_url: record.final_url || null,
    title: titleOf(record),
    clean_text_sha256: record?.text?.clean_text_sha256 || record.clean_text_sha256 || sha256(text),
    word_count: record?.text?.word_count || record.word_count || 0,
    estimated_source_tokens: estimateSourceTokens(text.length),
    clean_text_lossless: text,
    evidence_policy: { admitted_source: true, discovery_only: false, full_text_lossless: true, summarized: false, compressed: false, truncated_by_stage_7_adapter: false }
  };
}

function compactTargetProfile(profile = {}) {
  const object = asObject(profile?.target_profile || profile?.company_profile || profile);
  return {
    target_profile_version: object.target_profile_version || object.company_profile_version || "target_profile_v2",
    identity: asObject(object.identity),
    jurisdiction: asObject(object.jurisdiction),
    business_model: asObject(object.business_model),
    market_context: asObject(object.market_context),
    product_baseline: asObject(object.product_baseline),
    data_touchpoint_map: asArray(object.data_touchpoint_map),
    vault_baseline_candidates: asObject(object.vault_baseline_candidates),
    pipeline_assumptions: asArray(object.pipeline_assumptions),
    evidence: asArray(object.evidence),
    limitations: asArray(object.limitations),
    live_review_mode: object.live_review_mode || null
  };
}

function compactTargetFeatureProfile(profile = {}) {
  const object = asObject(profile?.target_feature_profile || profile?.feature_profile_v2 || profile);
  return {
    feature_profile_version: object.feature_profile_version || "feature_profile_v2",
    target_profile_ref: asObject(object.target_profile_ref),
    feature_inventory: asArray(object.feature_inventory),
    data_provenance_map: asArray(object.data_provenance_map),
    regulated_surface_map: asArray(object.regulated_surface_map),
    architecture_hints: asArray(object.architecture_hints),
    commercial_scan: asObject(object.commercial_scan),
    limitations: asArray(object.limitations),
    classification_quality: asObject(object.classification_quality),
    unresolved_feature_candidates: asArray(object.unresolved_feature_candidates)
  };
}

function navigationIndexFromProfiles(legalCartography = {}, dataProvenanceProfile = {}) {
  const legalIndex = asArray(legalCartography.legal_document_index);
  const dataFlows = asArray(dataProvenanceProfile.integrated_feature_data_flow_profile || dataProvenanceProfile.data_flow_profile || dataProvenanceProfile.data_flows);
  return {
    index_version: "stage7_navigation_index_from_profile_handoffs_v1",
    feature_to_data_flow_index: dataFlows.map((flow) => ({
      feature_id: flow.feature_id || flow.feature_ref || null,
      data_flow_id: flow.data_flow_id || flow.flow_id || null,
      provenance_refs: asArray(flow.provenance_refs || flow.legal_unit_refs || flow.evidence_refs)
    })).filter((row) => row.feature_id || row.data_flow_id),
    feature_to_legal_unit_index: legalIndex.flatMap((unit) => asArray(unit.feature_refs).map((featureId) => ({
      feature_id: featureId,
      legal_unit_id: unit.legal_unit_id || unit.unit_id || null,
      document_id: unit.document_id || null,
      control_families: asArray(unit.control_families_detected || unit.control_families)
    }))).filter((row) => row.feature_id || row.legal_unit_id)
  };
}

function stage6ReviewFromProfiles({ legalCartography = {}, dataProvenanceProfile = {}, stage6Review = null } = {}) {
  const object = asObject(stage6Review?.stage6_review || stage6Review);
  const legal = asObject(legalCartography || object.legal_document_cartography);
  const data = asObject(dataProvenanceProfile || object.data_provenance_profile);
  return {
    stage6_review_version: object.stage6_review_version || "stage6_profile_context_v1",
    stage6_component: "profile_handoff_context",
    stage_role: "stage7_profile_navigation_context",
    input_refs: asObject(object.input_refs),
    legal_document_cartography: legal,
    data_provenance_profile: data,
    stage7_navigation_index: asObject(object.stage7_navigation_index || navigationIndexFromProfiles(legal, data)),
    stage6_limitations: asArray(object.stage6_limitations || object.limitations)
  };
}

function stage7AdapterFromProfiles({ legalCartography = {}, dataProvenanceProfile = {}, stage6ToStage7Adapter = null, stage6Review = null } = {}) {
  const review = stage6ReviewFromProfiles({ legalCartography, dataProvenanceProfile, stage6Review });
  const object = asObject(stage6ToStage7Adapter?.stage6_to_stage7_adapter || stage6ToStage7Adapter);
  return {
    adapter_version: object.adapter_version || "stage7_runtime_adapter_from_profile_handoffs_v1",
    source_component: object.source_component || "profile_handoff_cache",
    compatibility_adapter_only: false,
    stage6_review_version: object.stage6_review_version || review.stage6_review_version,
    stage7_navigation_index: asObject(object.stage7_navigation_index || review.stage7_navigation_index),
    legal_document_cartography: asObject(object.legal_document_cartography || review.legal_document_cartography),
    data_provenance_profile: asObject(object.data_provenance_profile || review.data_provenance_profile)
  };
}

function normalizeBatch(batch = {}) {
  const rows = Array.isArray(batch.registry_rows) ? batch.registry_rows : [];
  return {
    run_id: batch.run_id || "pending-run-id",
    batch_id: batch.batch_id || `registry_batch_${Date.now()}`,
    batch_number: batch.batch_number || 1,
    batch_count: batch.batch_count || 1,
    batch_size: rows.length,
    registry_count_loaded: rows.length,
    registry_total_count: batch.registry_total_count || batch.registry_count_loaded || rows.length,
    registry_range: batch.registry_range || { start_position: 1, end_position: rows.length },
    expected_threat_ids: batch.expected_threat_ids || rows.map((row, index) => String(row.Threat_ID || row.threat_id || `MISSING_THREAT_ID_ROW_${index + 1}`)),
    registry_rows: rows,
    reinvestigation_request: batch.reinvestigation_request || null,
    batch_route_summary: batch.batch_route_summary || null
  };
}

function exclusionBase(record = {}) {
  const text = cleanText(record);
  return { ...artifactFromRecord(record), clean_text_length: text.length };
}

export function buildRegistryLedgerInput({
  sourceBundle = {},
  evidenceJunction = {},
  targetProfile = null,
  targetFeatureProfile = null,
  legalCartography = null,
  legal_cartography = null,
  dataProvenanceProfile = null,
  data_provenance_profile = null,
  stage6Review = null,
  stage6ToStage7Adapter = null,
  registryBatch = {},
  registryKey = {},
  runId = null,
  generatedAt = nowIso(),
  budget = {}
} = {}) {
  const batch = normalizeBatch(registryBatch);
  const legalProfile = asObject(legalCartography || legal_cartography || stage6Review?.legal_document_cartography || stage6ToStage7Adapter?.legal_document_cartography);
  const dataProfile = asObject(dataProvenanceProfile || data_provenance_profile || stage6Review?.data_provenance_profile || stage6ToStage7Adapter?.data_provenance_profile);
  const sortedRecords = sortSources(legalGovernanceRecords(sourceBundle, evidenceJunction));
  const expansionMode = fullTextExpansionMode(batch, budget);
  const maxInputChars = normalizeLimit(budget.max_input_chars) || DEFAULT_MAX_INPUT_CHARS;
  const maxEstimatedTokens = normalizeLimit(budget.max_estimated_tokens) || DEFAULT_MAX_ESTIMATED_TOKENS;
  const maxSingleSourceChars = normalizeLimit(budget.max_single_source_chars) || DEFAULT_MAX_SINGLE_SOURCE_CHARS;
  const promptOverheadTokens = normalizeLimit(budget.prompt_overhead_tokens) || DEFAULT_PROMPT_OVERHEAD_TOKENS;
  const hardMode = shouldEnforce(budget);
  const effectiveSourceTokenLimit = Math.max(0, maxEstimatedTokens - promptOverheadTokens);
  const hardTokenCharLimit = effectiveSourceTokenLimit * ESTIMATED_CHARS_PER_TOKEN;
  const effectiveCharLimit = Math.min(maxInputChars, hardTokenCharLimit);
  const included = [];
  const excluded = [];
  const budgetWarnings = [];
  let usedChars = 0;

  if (expansionMode) {
    for (const record of sortedRecords) {
      const text = cleanText(record);
      const textLength = text.length;
      const base = exclusionBase(record);
      if (!text) { excluded.push({ ...base, reason: "empty_clean_text" }); continue; }
      const singleOver = textLength > maxSingleSourceChars;
      const totalOver = usedChars + textLength > effectiveCharLimit;
      if (singleOver) budgetWarnings.push({ ...base, reason: "single_source_exceeds_guidance" });
      if (totalOver) budgetWarnings.push({ ...base, reason: "input_budget_guidance_exceeded" });
      if (hardMode && singleOver) { excluded.push({ ...base, reason: "single_source_exceeds_max_single_source_chars" }); continue; }
      if (hardMode && totalOver) { excluded.push({ ...base, reason: "input_budget_exceeded_by_source_selection" }); continue; }
      included.push(record);
      usedChars += textLength;
    }
  }

  const artifactInventory = expansionMode
    ? included.map((record) => artifactFromRecord(record, { fullTextInEvidenceBuffer: true }))
    : sortedRecords.map((record) => artifactFromRecord(record, { fullTextInEvidenceBuffer: false }));
  const evidenceBuffer = expansionMode ? included.map(evidenceFromRecord) : [];
  const estimatedSourceTokens = estimateSourceTokens(usedChars);
  const estimatedTotalPromptTokens = estimateTotalPromptTokens(usedChars, promptOverheadTokens);
  const hardFailure = expansionMode && hardMode && included.length === 0 && sortedRecords.some((record) => cleanText(record).length > 0);
  const limitations = [];
  if (!expansionMode) limitations.push("Stage 7 normal batch uses canonical profile handoffs plus legal/governance source manifest. Raw legal/governance lossless text is withheld from the model until row-level evidence expansion is requested.");
  if (excluded.length) limitations.push("Some admitted legal/governance sources were excluded because hard budget enforcement was explicitly enabled. They remain preserved in the Stage 3 evidence archive.");
  if (budgetWarnings.length && !hardMode) limitations.push("Stage 7 expansion source budget was exceeded in guidance mode; all non-empty legal/governance sources were still included to prevent silent under-reading.");
  if (hardFailure) limitations.push("No non-empty legal/governance source could fit inside the configured Stage 7 expansion budget without truncation.");

  const compactTarget = compactTargetProfile(targetProfile || sourceBundle?.target_input || {});
  const compactFeature = compactTargetFeatureProfile(targetFeatureProfile || {});
  const compactStage6 = stage6ReviewFromProfiles({ legalCartography: legalProfile, dataProvenanceProfile: dataProfile, stage6Review });
  const compactStage6Adapter = stage7AdapterFromProfiles({ legalCartography: legalProfile, dataProvenanceProfile: dataProfile, stage6ToStage7Adapter, stage6Review: compactStage6 });
  const sourceSelectionPolicy = expansionMode
    ? (hardMode ? "legal_governance_full_text_expansion_hard_budget" : "legal_governance_full_text_expansion_guidance")
    : "profile_handoff_plus_legal_governance_manifest_no_raw_text";
  const budgetStatus = hardFailure
    ? "TOKEN_BUDGET_EXCEEDED"
    : (expansionMode
      ? (excluded.length ? "PARTIAL_SOURCE_SELECTION" : (budgetWarnings.length ? "GUIDANCE_EXCEEDED_FULL_PACKET_INCLUDED" : "FULL_EXPANSION_PACKET_INCLUDED"))
      : "PROFILE_HANDOFF_MANIFEST_PACKET_INCLUDED");

  const adapterOutput = {
    registry_ledger_input_version: "registry_ledger_input_v1",
    run_id: runId || batch.run_id || `registry_ledger_input_${Date.now()}`,
    batch_id: batch.batch_id,
    generated_at: generatedAt,
    registry_batch_meta: {
      run_id: runId || batch.run_id,
      batch_id: batch.batch_id,
      batch_number: batch.batch_number,
      batch_count: batch.batch_count,
      batch_size: batch.batch_size,
      registry_count_loaded: batch.registry_rows.length,
      registry_total_count: batch.registry_total_count,
      registry_range: batch.registry_range,
      expected_threat_ids: batch.expected_threat_ids,
      stage7_source_text_mode: expansionMode ? "raw_full_text_expansion" : "profile_handoff_manifest_only"
    },
    registry_rows: batch.registry_rows,
    registry_key: registryKey,
    source_bundle: {
      run_id: sourceBundle.run_id || null,
      source_mode: sourceBundle.source_mode || "runtime_discovery_capture",
      target_input: sourceBundle.target_input || evidenceJunction.target_input || {},
      source_review: {
        source_bundle_version: sourceBundle.source_bundle_version || null,
        evidence_junction_version: evidenceJunction.evidence_junction_version || null,
        source_bundle_sha256: evidenceJunction.source_bundle_sha256 || sourceBundle?.scrape_meta?.hashes?.raw_footprint_sha256 || null,
        downstream_stage: "registry_ledger_evaluation",
        source_selection_policy: sourceSelectionPolicy,
        packet_source_count: sortedRecords.length,
        manifest_source_count: artifactInventory.length,
        included_source_count: evidenceBuffer.length,
        excluded_source_count: excluded.length,
        raw_full_text_included: expansionMode
      },
      artifact_inventory: artifactInventory,
      evidence_buffer: evidenceBuffer,
      limitations: [...(Array.isArray(sourceBundle?.source_discovery?.coverage_gaps) ? sourceBundle.source_discovery.coverage_gaps.map((gap) => typeof gap === "string" ? gap : JSON.stringify(gap)) : []), ...limitations]
    },
    target_profile: compactTarget,
    target_feature_profile: compactFeature,
    legal_cartography: legalProfile,
    data_provenance_profile: dataProfile,
    stage6_review: compactStage6,
    stage6_to_stage7_adapter: compactStage6Adapter,
    input_budget: {
      budget_status: budgetStatus,
      enforcement_mode: hardMode ? "hard" : "guidance",
      stage7_source_text_mode: expansionMode ? "raw_full_text_expansion" : "profile_handoff_manifest_only",
      max_input_chars: maxInputChars,
      max_estimated_tokens: maxEstimatedTokens,
      max_single_source_chars: maxSingleSourceChars,
      prompt_overhead_tokens: promptOverheadTokens,
      source_token_estimation_ratio_chars_per_token: ESTIMATED_CHARS_PER_TOKEN,
      estimated_input_chars: usedChars,
      estimated_source_tokens: estimatedSourceTokens,
      estimated_prompt_overhead_tokens: promptOverheadTokens,
      estimated_total_prompt_tokens: estimatedTotalPromptTokens,
      total_candidate_legal_governance_sources: sortedRecords.length,
      manifest_sources: artifactInventory,
      included_sources: artifactInventory.filter((item) => item.full_text_in_evidence_buffer),
      excluded_sources: excluded,
      budget_warnings: budgetWarnings,
      fail_loud_if_no_source_fits: hardMode,
      text_truncated: false,
      text_summarized: false,
      text_compressed: false
    },
    adapter_policy: {
      prompt_compatibility_mode: "target_profile_feature_profile_canonical_profile_handoff_fields",
      profiles_are_native_handoff_wrappers_not_summaries: true,
      full_target_profile_included: true,
      legal_cartography_profile_included: Boolean(Object.keys(legalProfile).length),
      data_provenance_profile_included: Boolean(Object.keys(dataProfile).length),
      legal_governance_source_manifest_included: true,
      raw_legal_governance_text_included_in_this_batch: expansionMode,
      raw_legal_governance_text_available_for_evidence_expansion: true,
      product_full_text_excluded_by_design: true,
      product_truth_from_target_feature_profile: true,
      stage6_truth_from_legal_cartography_and_data_provenance_profile: true,
      no_legacy_legal_stack_review: true,
      no_text_truncation: true,
      no_text_summary: true,
      no_text_compression: true,
      deterministic_packaging_is_not_conclusive_exclusion: true,
      batch_evaluation_required: true
    }
  };

  if (hardFailure) return { ok: false, status: 413, error_type: "TOKEN_BUDGET_EXCEEDED", error: "No legal/governance source could fit inside the configured Stage 7 expansion budget without truncation.", input_budget: adapterOutput.input_budget, registry_ledger_input: adapterOutput };
  return { ok: true, status: 200, registry_ledger_input: adapterOutput };
}
