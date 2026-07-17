import { buildCanonicalSelection as buildRb09CanonicalSelection } from "./canonical-selection.service.js";

export const PHASE1_RB18B_CANONICAL_SELECTION_SCHEMA_VERSION = "PHASE1_CANONICAL_SELECTION_RB18B_v2";

const EXTRACTABLE_DISPOSITIONS = new Set(["SELECTED_CANONICAL", "SELECTED_PARTIAL_CONTRIBUTOR", "LEGAL_INSTRUMENT"]);
const UNIQUE_BLOCK_MIN_CHARS = 120;
const UNIQUE_BLOCK_MIN_MEANINGFUL_TOKENS = 12;
const UNIQUE_BLOCK_MIN_NOVEL_TOKEN_RATIO = 0.22;
const UNIQUE_BLOCK_MAX_OWNER_JACCARD = 0.78;

export function buildRb18bCanonicalSelection({ canonicalInventory, fingerprintInventory, rootFeatureLaneClustering, legalClassification, semanticFeatureAdjudication, analysisCache = new Map() } = {}) {
  const base = buildRb09CanonicalSelection({ canonicalInventory, fingerprintInventory, rootFeatureLaneClustering, legalClassification, analysisCache });
  const fingerprints = new Map((fingerprintInventory?.fingerprints || []).map((item) => [item.candidate_id, item]));
  const semantic = new Map((semanticFeatureAdjudication?.decisions || []).map((item) => [item.candidate_id, item]));

  const decisions = (base.decisions || []).map((decision) => {
    const semanticDecision = semantic.get(decision.candidate_id) || null;
    const structuredCoverage = normalizeStructuredCoverage(decision);
    const enriched = {
      ...decision,
      structured_coverage: structuredCoverage,
      semantic_feature_key: semanticDecision?.semantic_feature_key || decision.feature_cluster,
      semantic_relationship: semanticDecision?.relationship || null,
      semantic_decision_id: semanticDecision?.decision_id || null,
      semantic_decision_source: semanticDecision?.decision_source || null,
      semantic_grouping_enforced: semanticDecision?.semantic_grouping_enforced === true,
      semantic_deterministic_corroborators: semanticDecision?.deterministic_corroborators || [],
      coverage_retained_without_body_extraction: false,
      unique_evidence_gate: null
    };

    if (decision.source_disposition === "LEGAL_INSTRUMENT" || decision.source_disposition === "SELECTED_CANONICAL" || !decision.extraction_authorized) return enriched;
    if (decision.extraction_scope === "STRUCTURED_COVERAGE_ONLY") return structuredCoverage
      ? suppressCoverageOnly(enriched, "STRUCTURED_COVERAGE_RETAINED_WITHOUT_BODY_EXTRACTION")
      : suppressNearDuplicate(enriched, "COVERAGE_SCOPE_WITHOUT_STRUCTURED_COVERAGE_SUPPRESSED");
    if (decision.source_disposition !== "SELECTED_PARTIAL_CONTRIBUTOR" || decision.extraction_scope !== "SELECTED_UNIQUE_SECTIONS") return enriched;

    const semanticUniqueDelta = semanticDecision?.relationship === "SAME_FEATURE_UNIQUE_DELTA";
    if (!semanticUniqueDelta) return structuredCoverage
      ? suppressCoverageOnly(enriched, "NON_UNIQUE_SEMANTIC_RELATIONSHIP_REDUCED_TO_STRUCTURED_COVERAGE")
      : suppressNearDuplicate(enriched, "PARTIAL_CONTRIBUTOR_REJECTED_WITHOUT_SEMANTIC_UNIQUE_DELTA");

    const qualified = qualifyingUniqueBlocks({
      decision,
      fingerprint: fingerprints.get(decision.candidate_id),
      analysis: analysisCache.get(decision.candidate_id),
      ownerFingerprint: fingerprints.get(decision.canonical_owner_candidate_id),
      ownerAnalysis: analysisCache.get(decision.canonical_owner_candidate_id)
    });

    if (!qualified.length) return structuredCoverage
      ? suppressCoverageOnly(enriched, "SEMANTIC_UNIQUE_DELTA_FAILED_DETERMINISTIC_NOVELTY_GATE_COVERAGE_RETAINED_ONLY")
      : suppressNearDuplicate(enriched, "SEMANTIC_UNIQUE_DELTA_FAILED_DETERMINISTIC_NOVELTY_GATE");

    return {
      ...enriched,
      selected_block_hashes: qualified.map((item) => item.sha256),
      unique_evidence_gate: {
        status: "QUALIFIED_UNIQUE_EVIDENCE",
        minimum_character_count: UNIQUE_BLOCK_MIN_CHARS,
        minimum_meaningful_token_count: UNIQUE_BLOCK_MIN_MEANINGFUL_TOKENS,
        minimum_novel_token_ratio: UNIQUE_BLOCK_MIN_NOVEL_TOKEN_RATIO,
        maximum_owner_jaccard: UNIQUE_BLOCK_MAX_OWNER_JACCARD,
        qualified_blocks: qualified,
        semantic_unique_delta: true
      },
      selection_reason: "SEMANTIC_UNIQUE_DELTA_CORROBORATED_BY_DETERMINISTIC_NOVELTY_GATE"
    };
  });

  return {
    ...base,
    schema_version: PHASE1_RB18B_CANONICAL_SELECTION_SCHEMA_VERSION,
    status: "COMPLETE",
    model_usage: semanticFeatureAdjudication?.model_usage || "NONE",
    selection_key: "ENTITY_ID_PLUS_PRIMARY_ROOT_PLUS_SEMANTIC_FEATURE_KEY_PLUS_EVIDENCE_LANE",
    variant_rule: "GENERIC_CANONICAL_PLUS_MANIFEST_ONLY_STRUCTURED_COVERAGE_PLUS_SEMANTICALLY_AND_DETERMINISTICALLY_QUALIFIED_UNIQUE_DELTAS",
    semantic_authority_rule: "SEMANTIC_RECOMMENDATION_NEVER_DIRECT_EXTRACTION_AUTHORITY",
    unique_evidence_rule: `SEMANTIC_UNIQUE_DELTA_AND_MIN_${UNIQUE_BLOCK_MIN_CHARS}_CHARS_${UNIQUE_BLOCK_MIN_MEANINGFUL_TOKENS}_TOKENS_${UNIQUE_BLOCK_MIN_NOVEL_TOKEN_RATIO}_NOVEL_RATIO_MAX_${UNIQUE_BLOCK_MAX_OWNER_JACCARD}_OWNER_JACCARD`,
    coverage_only_extraction_forbidden: true,
    partial_without_semantic_unique_delta_forbidden: true,
    counts: {
      ...base.counts,
      extraction_authorized: decisions.filter((item) => item.extraction_authorized).length,
      selected_canonicals: decisions.filter((item) => item.source_disposition === "SELECTED_CANONICAL").length,
      near_duplicates_suppressed: decisions.filter((item) => item.source_disposition === "SUPPRESSED_NEAR_DUPLICATE").length,
      template_variants_suppressed: decisions.filter((item) => item.source_disposition === "SUPPRESSED_TEMPLATE_VARIANT").length,
      coverage_only_manifest_rows: decisions.filter((item) => item.coverage_retained_without_body_extraction).length,
      partial_contributors: decisions.filter((item) => item.source_disposition === "SELECTED_PARTIAL_CONTRIBUTOR").length,
      qualifying_unique_delta_sources: decisions.filter((item) => item.unique_evidence_gate?.status === "QUALIFIED_UNIQUE_EVIDENCE").length,
      legal_instruments: decisions.filter((item) => item.source_disposition === "LEGAL_INSTRUMENT").length
    },
    disposition_counts: countBy(decisions, "source_disposition"),
    decisions
  };
}

export function assertRb18bCanonicalSelection(selection) {
  if (selection?.schema_version !== PHASE1_RB18B_CANONICAL_SELECTION_SCHEMA_VERSION || selection.final_extraction_authority !== true || selection.coverage_only_extraction_forbidden !== true || selection.partial_without_semantic_unique_delta_forbidden !== true || selection.semantic_authority_rule !== "SEMANTIC_RECOMMENDATION_NEVER_DIRECT_EXTRACTION_AUTHORITY") throw new Error("PHASE1_RB18B_CANONICAL_SELECTION_SCHEMA_INVALID");
  const seen = new Set();
  const canonicalByCluster = new Map();
  const materialClusters = new Set();

  for (const decision of selection.decisions || []) {
    if (!decision.selection_id || !decision.candidate_id || !decision.canonical_identity || !decision.entity_id || !decision.primary_root || !decision.feature_cluster || !decision.evidence_lane || !decision.source_disposition || !decision.extraction_scope) throw new Error("PHASE1_RB18B_CANONICAL_SELECTION_DECISION_INCOMPLETE");
    if (seen.has(decision.canonical_identity)) throw new Error(`PHASE1_RB18B_CANONICAL_SELECTION_DUPLICATE_DECISION:${decision.canonical_identity}`);
    seen.add(decision.canonical_identity);
    if (decision.extraction_authorized !== EXTRACTABLE_DISPOSITIONS.has(decision.source_disposition)) throw new Error(`PHASE1_RB18B_CANONICAL_SELECTION_AUTHORITY_DISPOSITION_MISMATCH:${decision.candidate_id}`);
    if (decision.extraction_scope === "STRUCTURED_COVERAGE_ONLY" && decision.extraction_authorized) throw new Error(`PHASE1_RB18B_COVERAGE_ONLY_EXTRACTION_AUTHORITY:${decision.candidate_id}`);
    if (decision.coverage_retained_without_body_extraction && (decision.extraction_authorized || decision.source_disposition !== "SUPPRESSED_TEMPLATE_VARIANT" || !decision.structured_coverage)) throw new Error(`PHASE1_RB18B_COVERAGE_LEDGER_INVALID:${decision.candidate_id}`);
    if (decision.extraction_authorized && (decision.fingerprint_fetch_status !== "FETCHED" || decision.fingerprint_extraction_eligible !== true || decision.content_materiality?.status !== "MATERIAL_CONTENT" || !decision.exact_content_hash || !decision.selected_block_hashes?.length)) throw new Error(`PHASE1_RB18B_AUTHORISED_WITHOUT_MATERIAL_EVIDENCE:${decision.candidate_id}`);
    if (decision.source_disposition === "SELECTED_PARTIAL_CONTRIBUTOR" && (decision.semantic_relationship !== "SAME_FEATURE_UNIQUE_DELTA" || decision.unique_evidence_gate?.status !== "QUALIFIED_UNIQUE_EVIDENCE")) throw new Error(`PHASE1_RB18B_PARTIAL_WITHOUT_SEMANTIC_AND_DETERMINISTIC_UNIQUE_EVIDENCE:${decision.candidate_id}`);
    if (decision.source_disposition === "LEGAL_INSTRUMENT" && decision.extraction_scope !== "FULL_DOCUMENT") throw new Error(`PHASE1_RB18B_LEGAL_SCOPE_INVALID:${decision.candidate_id}`);

    if (decision.evidence_lane !== "legal_instrument" && decision.fingerprint_extraction_eligible === true) {
      const key = clusterKey(decision);
      materialClusters.add(key);
      if (decision.source_disposition === "SELECTED_CANONICAL") canonicalByCluster.set(key, (canonicalByCluster.get(key) || 0) + 1);
    }
  }

  for (const key of materialClusters) if ((canonicalByCluster.get(key) || 0) !== 1) throw new Error(`PHASE1_RB18B_CANONICAL_WINNER_CARDINALITY:${key}:${canonicalByCluster.get(key) || 0}`);
  if ((selection.counts?.extraction_authorized || 0) !== (selection.decisions || []).filter((item) => item.extraction_authorized).length) throw new Error("PHASE1_RB18B_EXTRACTION_COUNT_MISMATCH");
  return { ok: true, decisions: seen.size, canonical_clusters: canonicalByCluster.size };
}

function suppressCoverageOnly(decision, reason) {
  return { ...decision, source_disposition: "SUPPRESSED_TEMPLATE_VARIANT", extraction_scope: "STRUCTURED_COVERAGE_ONLY", extraction_authorized: false, selected_block_hashes: [], coverage_retained_without_body_extraction: true, unique_evidence_gate: { status: "NO_BODY_EXTRACTION_COVERAGE_ONLY" }, selection_reason: reason };
}

function suppressNearDuplicate(decision, reason) {
  return { ...decision, source_disposition: "SUPPRESSED_NEAR_DUPLICATE", extraction_scope: "METADATA_ONLY", extraction_authorized: false, selected_block_hashes: [], coverage_retained_without_body_extraction: false, unique_evidence_gate: { status: "NO_QUALIFYING_UNIQUE_EVIDENCE" }, selection_reason: reason };
}

function qualifyingUniqueBlocks({ decision, fingerprint, analysis, ownerAnalysis }) {
  const selected = new Set(decision.selected_block_hashes || []);
  const blocks = analysis?.blocks || [];
  const ownerTokens = meaningfulTokens((ownerAnalysis?.blocks || []).join("\n"));
  if (!ownerTokens.size) return [];
  return (fingerprint?.block_hashes || []).filter((item) => selected.has(item.sha256)).map((item) => {
    const text = String(blocks[(item.block_index || 1) - 1] || "");
    const tokens = meaningfulTokens(text);
    const novelTokens = [...tokens].filter((token) => !ownerTokens.has(token));
    const novelTokenRatio = tokens.size ? novelTokens.length / tokens.size : 0;
    const ownerJaccard = jaccard(tokens, ownerTokens);
    return {
      sha256: item.sha256,
      block_index: item.block_index,
      character_count: item.character_count || text.length,
      meaningful_token_count: tokens.size,
      novel_token_count: novelTokens.length,
      novel_token_ratio: Number(novelTokenRatio.toFixed(4)),
      owner_jaccard: Number(ownerJaccard.toFixed(4))
    };
  }).filter((item) => item.character_count >= UNIQUE_BLOCK_MIN_CHARS && item.meaningful_token_count >= UNIQUE_BLOCK_MIN_MEANINGFUL_TOKENS && item.novel_token_ratio >= UNIQUE_BLOCK_MIN_NOVEL_TOKEN_RATIO && item.owner_jaccard <= UNIQUE_BLOCK_MAX_OWNER_JACCARD);
}

function normalizeStructuredCoverage(decision) {
  const path = safePath(decision.canonical_url);
  const pair = /\/([a-z-]{2,30})-to-([a-z-]{2,30})(?:\/|$)/i.exec(path);
  const context = `${decision.semantic_feature_key || ""} ${decision.feature_cluster || ""} ${decision.variant_family || ""} ${path}`.toLowerCase();
  if (pair && /translat|language/.test(context)) return { coverage_type: "language_pair", source_language: pair[1].toLowerCase(), target_language: pair[2].toLowerCase() };
  if (pair && /flight|bus|train|travel|ticket/.test(context)) return { coverage_type: "route_pair", origin: pair[1].replace(/-/g, " ").toLowerCase(), destination: pair[2].replace(/-/g, " ").toLowerCase() };
  if (pair) return { coverage_type: "pair_variant", left_value: pair[1].toLowerCase(), right_value: pair[2].toLowerCase() };
  if (String(decision.variant_family || "").includes("state_provider")) {
    const state = path.split("/").filter(Boolean).at(-1);
    return state ? { coverage_type: "state_provider", state: state.replace(/-/g, " ").toLowerCase() } : null;
  }
  if (String(decision.variant_family || "").includes("language")) {
    const language = path.split("/").filter(Boolean).at(-1);
    return language ? { coverage_type: "language", language: language.toLowerCase() } : null;
  }
  if (String(decision.variant_family || "").includes("sdk_language")) {
    const sdk = path.split("/").filter(Boolean).at(-1);
    return sdk ? { coverage_type: "sdk_language", sdk_language: sdk.toLowerCase() } : null;
  }
  return decision.structured_coverage || null;
}

function meaningfulTokens(value) { return new Set((String(value || "").toLowerCase().match(/[a-z0-9]{3,}/g) || []).filter((token) => !STOP_TOKENS.has(token))); }
function jaccard(left, right) { if (!left.size || !right.size) return 0; let shared = 0; for (const token of left) if (right.has(token)) shared += 1; return shared / new Set([...left, ...right]).size; }
const STOP_TOKENS = new Set(["the", "and", "for", "with", "this", "that", "from", "your", "you", "our", "are", "can", "will", "using", "use", "into", "their", "they", "have", "has", "not", "was", "were", "been", "being", "also", "more", "than", "when", "where", "which", "what"]);
function safePath(value) { try { return new URL(value).pathname.toLowerCase(); } catch { return "/"; } }
function clusterKey(decision) { return [decision.entity_id, decision.primary_root, decision.semantic_feature_key || decision.feature_cluster, decision.evidence_lane].join("|"); }
function countBy(values, key) { const output = {}; for (const item of values || []) output[item[key]] = (output[item[key]] || 0) + 1; return Object.fromEntries(Object.entries(output).sort(([a], [b]) => a.localeCompare(b))); }
