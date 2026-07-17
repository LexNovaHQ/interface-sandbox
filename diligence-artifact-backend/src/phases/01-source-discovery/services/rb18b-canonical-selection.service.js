import { buildCanonicalSelection as buildRb09CanonicalSelection } from "./canonical-selection.service.js";

export const PHASE1_RB18B_CANONICAL_SELECTION_SCHEMA_VERSION = "PHASE1_CANONICAL_SELECTION_RB18B_v4";

const EXTRACTABLE_DISPOSITIONS = new Set(["SELECTED_CANONICAL", "SELECTED_PARTIAL_CONTRIBUTOR", "LEGAL_INSTRUMENT"]);
const UNIQUE_BLOCK_MIN_CHARS = 120;
const UNIQUE_BLOCK_MIN_MEANINGFUL_TOKENS = 12;
const UNIQUE_BLOCK_MIN_NOVEL_TOKEN_RATIO = 0.22;
const UNIQUE_BLOCK_MAX_OWNER_JACCARD = 0.78;

export function buildRb18bCanonicalSelection({ canonicalInventory, fingerprintInventory, rootFeatureLaneClustering, legalClassification, semanticFeatureAdjudication, analysisCache = new Map() } = {}) {
  const base = buildRb09CanonicalSelection({ canonicalInventory, fingerprintInventory, rootFeatureLaneClustering, legalClassification, analysisCache });
  const fingerprints = new Map((fingerprintInventory?.fingerprints || []).map((item) => [item.candidate_id, item]));
  const semantic = new Map((semanticFeatureAdjudication?.decisions || []).map((item) => [item.candidate_id, item]));

  const enriched = (base.decisions || []).map((decision) => {
    const semanticDecision = semantic.get(decision.candidate_id) || null;
    const fingerprint = fingerprints.get(decision.candidate_id) || null;
    return {
      ...decision,
      template_signature: fingerprint?.template_signature || null,
      structured_coverage: normalizeStructuredCoverage(decision),
      semantic_feature_key: semanticDecision?.semantic_feature_key || decision.feature_cluster,
      semantic_relationship: semanticDecision?.relationship || null,
      semantic_decision_id: semanticDecision?.decision_id || null,
      semantic_decision_source: semanticDecision?.decision_source || null,
      semantic_grouping_enforced: semanticDecision?.semantic_grouping_enforced === true,
      semantic_deterministic_corroborators: semanticDecision?.deterministic_corroborators || [],
      deterministic_parent_template_refinement: null,
      evidence_value_disposition: "SUBSTANTIVE_EVIDENCE",
      coverage_retained_without_body_extraction: false,
      unique_evidence_gate: null
    };
  });

  const parentRefined = applyParentTemplateCompression(enriched);
  const decisions = parentRefined.map((decision) => {
    if (decision.source_disposition === "LEGAL_INSTRUMENT") return decision;
    if (decision.coverage_retained_without_body_extraction) return decision;

    const referenceReason = referenceOnlyReason(decision);
    if (decision.extraction_authorized && referenceReason) return suppressReferenceOnly(decision, referenceReason);
    if (decision.source_disposition === "SELECTED_CANONICAL" || !decision.extraction_authorized) return decision;
    if (decision.extraction_scope === "STRUCTURED_COVERAGE_ONLY") return decision.structured_coverage
      ? suppressCoverageOnly(decision, "STRUCTURED_COVERAGE_RETAINED_WITHOUT_BODY_EXTRACTION")
      : suppressNearDuplicate(decision, "COVERAGE_SCOPE_WITHOUT_STRUCTURED_COVERAGE_SUPPRESSED");
    if (decision.source_disposition !== "SELECTED_PARTIAL_CONTRIBUTOR" || decision.extraction_scope !== "SELECTED_UNIQUE_SECTIONS") return decision;

    const semanticUniqueDelta = decision.semantic_relationship === "SAME_FEATURE_UNIQUE_DELTA";
    if (!semanticUniqueDelta) return decision.structured_coverage
      ? suppressCoverageOnly(decision, "NON_UNIQUE_SEMANTIC_RELATIONSHIP_REDUCED_TO_STRUCTURED_COVERAGE")
      : suppressNearDuplicate(decision, "PARTIAL_CONTRIBUTOR_REJECTED_WITHOUT_SEMANTIC_UNIQUE_DELTA");

    const qualified = qualifyingUniqueBlocks({
      decision,
      fingerprint: fingerprints.get(decision.candidate_id),
      analysis: analysisCache.get(decision.candidate_id),
      ownerAnalysis: analysisCache.get(decision.canonical_owner_candidate_id)
    });

    if (!qualified.length) return decision.structured_coverage
      ? suppressCoverageOnly(decision, "SEMANTIC_UNIQUE_DELTA_FAILED_DETERMINISTIC_NOVELTY_GATE_COVERAGE_RETAINED_ONLY")
      : suppressNearDuplicate(decision, "SEMANTIC_UNIQUE_DELTA_FAILED_DETERMINISTIC_NOVELTY_GATE");

    return {
      ...decision,
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
    selection_key: "ENTITY_ID_PLUS_ADJUDICATED_PRIMARY_ROOT_PLUS_SEMANTIC_FEATURE_KEY_PLUS_EVIDENCE_LANE",
    variant_rule: "GENERIC_CANONICAL_PLUS_MANIFEST_ONLY_STRUCTURED_COVERAGE_PLUS_SEMANTICALLY_AND_DETERMINISTICALLY_QUALIFIED_UNIQUE_DELTAS",
    semantic_authority_rule: "SEMANTIC_RECOMMENDATION_NEVER_DIRECT_EXTRACTION_AUTHORITY",
    unique_evidence_rule: `SEMANTIC_UNIQUE_DELTA_AND_MIN_${UNIQUE_BLOCK_MIN_CHARS}_CHARS_${UNIQUE_BLOCK_MIN_MEANINGFUL_TOKENS}_TOKENS_${UNIQUE_BLOCK_MIN_NOVEL_TOKEN_RATIO}_NOVEL_RATIO_MAX_${UNIQUE_BLOCK_MAX_OWNER_JACCARD}_OWNER_JACCARD`,
    parent_template_rule: "ONLY_EXISTING_AUTHORIZED_CANONICALS_MAY_OWN_CORROBORATED_DIRECT_CHILD_TEMPLATE_FAMILIES",
    evidence_value_rule: "NAVIGATION_LISTING_AND_CORPORATE_PERIPHERAL_INDEXES_ARE_REFERENCE_ONLY",
    coverage_only_extraction_forbidden: true,
    partial_without_semantic_unique_delta_forbidden: true,
    suppressed_candidate_repromotion_forbidden: true,
    counts: {
      ...base.counts,
      extraction_authorized: decisions.filter((item) => item.extraction_authorized).length,
      selected_canonicals: decisions.filter((item) => item.source_disposition === "SELECTED_CANONICAL").length,
      near_duplicates_suppressed: decisions.filter((item) => item.source_disposition === "SUPPRESSED_NEAR_DUPLICATE").length,
      template_variants_suppressed: decisions.filter((item) => item.source_disposition === "SUPPRESSED_TEMPLATE_VARIANT").length,
      parent_template_variants_suppressed: decisions.filter((item) => item.deterministic_parent_template_refinement?.role === "TEMPLATE_VARIANT").length,
      parent_template_root_corrections: decisions.filter((item) => item.deterministic_parent_template_refinement?.root_corrected === true).length,
      reference_only_suppressed: decisions.filter((item) => item.source_disposition === "REFERENCE_ONLY" && item.evidence_value_disposition === "REFERENCE_ONLY").length,
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
  if (selection?.schema_version !== PHASE1_RB18B_CANONICAL_SELECTION_SCHEMA_VERSION || selection.final_extraction_authority !== true || selection.coverage_only_extraction_forbidden !== true || selection.partial_without_semantic_unique_delta_forbidden !== true || selection.suppressed_candidate_repromotion_forbidden !== true || selection.semantic_authority_rule !== "SEMANTIC_RECOMMENDATION_NEVER_DIRECT_EXTRACTION_AUTHORITY") throw new Error("PHASE1_RB18B_CANONICAL_SELECTION_SCHEMA_INVALID");
  const seen = new Set();
  const canonicalByCluster = new Map();
  const activeMaterialClusters = new Set();

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
    if (decision.evidence_value_disposition === "REFERENCE_ONLY" && (decision.extraction_authorized || decision.extraction_scope !== "METADATA_ONLY")) throw new Error(`PHASE1_RB18B_REFERENCE_ONLY_EXTRACTION_LEAK:${decision.candidate_id}`);
    if (decision.deterministic_parent_template_refinement?.role === "CANONICAL_BASE" && decision.selection_reason === "DETERMINISTIC_PARENT_ROUTE_CANONICAL" && decision.pre_parent_source_disposition && decision.pre_parent_source_disposition !== "SELECTED_CANONICAL") throw new Error(`PHASE1_RB18B_SUPPRESSED_CANDIDATE_REPROMOTED:${decision.candidate_id}`);

    if (decision.evidence_lane !== "legal_instrument" && decision.fingerprint_extraction_eligible === true) {
      const key = clusterKey(decision);
      if (["SELECTED_CANONICAL", "SELECTED_PARTIAL_CONTRIBUTOR", "SUPPRESSED_TEMPLATE_VARIANT", "SUPPRESSED_NEAR_DUPLICATE", "ALIAS_EXACT_DUPLICATE"].includes(decision.source_disposition)) activeMaterialClusters.add(key);
      if (decision.source_disposition === "SELECTED_CANONICAL") canonicalByCluster.set(key, (canonicalByCluster.get(key) || 0) + 1);
    }
  }

  for (const key of activeMaterialClusters) if ((canonicalByCluster.get(key) || 0) !== 1) throw new Error(`PHASE1_RB18B_CANONICAL_WINNER_CARDINALITY:${key}:${canonicalByCluster.get(key) || 0}`);
  if ((selection.counts?.extraction_authorized || 0) !== (selection.decisions || []).filter((item) => item.extraction_authorized).length) throw new Error("PHASE1_RB18B_EXTRACTION_COUNT_MISMATCH");
  return { ok: true, decisions: seen.size, canonical_clusters: canonicalByCluster.size };
}

function applyParentTemplateCompression(decisions) {
  const output = decisions.map((row) => ({ ...row }));
  const byEntity = groupBy(output.filter(isMaterialNonLegalCandidate), (row) => row.entity_id);

  for (const entityRows of byEntity.values()) {
    const byPath = new Map(entityRows.map((row) => [normalizePath(safePath(row.canonical_url)), row]));
    const childrenByParent = groupBy(entityRows.filter((row) => pathSegments(row.canonical_url).length >= 2), (row) => parentPath(row.canonical_url));
    for (const [parent, children] of childrenByParent.entries()) {
      const base = byPath.get(normalizePath(parent));
      const family = uniqueRows([...(base ? [base] : []), ...children]);
      if (!qualifiesAsTemplateFamily({ parent, base, children, family })) continue;
      if (family.some((row) => row.semantic_decision_source === "BOUNDED_MODEL_DISTINCT_FEATURE_PRESERVATION" || row.semantic_relationship === "SAME_FEATURE_UNIQUE_DELTA")) continue;

      const winner = chooseParentTemplateWinner(base, family);
      if (!winner) continue;
      const key = parentTemplateFeatureKey(winner, family, parent);
      for (const row of family) {
        const index = output.findIndex((item) => item.candidate_id === row.candidate_id);
        if (index < 0) continue;
        const sourceDecision = output[index];
        const rootCorrected = sourceDecision.primary_root !== winner.primary_root || sourceDecision.evidence_lane !== winner.evidence_lane;
        const common = {
          ...sourceDecision,
          primary_root: winner.primary_root,
          common_root: winner.primary_root,
          evidence_lane: winner.evidence_lane,
          semantic_feature_key: key,
          feature_cluster: key,
          semantic_grouping_enforced: true,
          semantic_deterministic_corroborators: unique([...(sourceDecision.semantic_deterministic_corroborators || []), "SHARED_PARENT_ROUTE_FAMILY", ...(rootCorrected ? ["ROUTE_BASE_ROOT_CORRECTION"] : [])]),
          deterministic_parent_template_refinement: {
            route_base: parent,
            canonical_candidate_id: winner.candidate_id,
            role: row.candidate_id === winner.candidate_id ? "CANONICAL_BASE" : "TEMPLATE_VARIANT",
            root_corrected: rootCorrected,
            source_root: sourceDecision.primary_root,
            adjudicated_root: winner.primary_root
          }
        };
        if (row.candidate_id === winner.candidate_id) {
          output[index] = {
            ...common,
            pre_parent_source_disposition: sourceDecision.source_disposition,
            source_disposition: "SELECTED_CANONICAL",
            extraction_scope: winner.extraction_scope === "FULL_DOCUMENT" ? "FULL_DOCUMENT" : "FULL_MAIN_CONTENT",
            extraction_authorized: true,
            canonical_owner_candidate_id: winner.candidate_id,
            canonical_owner_identity: winner.canonical_identity,
            semantic_relationship: "SAME_FEATURE_CANONICAL_CANDIDATE",
            selection_reason: "DETERMINISTIC_PARENT_ROUTE_CANONICAL"
          };
        } else {
          output[index] = suppressCoverageOnly({
            ...common,
            semantic_relationship: "SAME_FEATURE_TEMPLATE_VARIANT",
            structured_coverage: normalizeStructuredCoverage({ ...common, force_parent_route_coverage: true, parent_route_base: parent })
          }, "DIRECT_CHILD_TEMPLATE_VARIANT_REDUCED_TO_STRUCTURED_COVERAGE");
        }
      }
    }
  }
  return output;
}

function qualifiesAsTemplateFamily({ parent, base, children, family }) {
  if (children.length < 2 || family.length < 3) return false;
  const parentToken = pathSegments(parent).at(-1) || "";
  const featureValues = children.map((row) => stripUncertain(row.semantic_feature_key || row.feature_cluster)).filter(Boolean);
  const dominant = majorityCount(featureValues);
  const featureCoherence = featureValues.length ? dominant / featureValues.length : 0;
  const templateCoherence = sharedTemplateMajority(children);
  const coverageShapeCoherence = coverageShapedSlugMajority(children);
  const parentKey = normalizeFeatureKey(parentToken);
  const parentMatchesFeature = featureValues.some((value) => {
    const featureKey = normalizeFeatureKey(value);
    return featureKey.includes(parentKey) || parentKey.includes(featureKey);
  });
  const baseIsAuthorizedCanonical = base?.extraction_authorized === true && base?.source_disposition === "SELECTED_CANONICAL";

  if (GENERIC_CONTAINER_SEGMENTS.has(parentToken) && !templateCoherence && !coverageShapeCoherence) return false;
  if (templateCoherence || coverageShapeCoherence) return true;
  return baseIsAuthorizedCanonical && children.length >= 4 && featureCoherence >= 0.85 && parentMatchesFeature;
}

function chooseParentTemplateWinner(base, family) {
  if (base?.extraction_authorized === true && base?.source_disposition === "SELECTED_CANONICAL") return base;
  return [...family]
    .filter((row) => row.extraction_authorized === true && row.source_disposition === "SELECTED_CANONICAL")
    .sort((a, b) => Number(b.selection_score || 0) - Number(a.selection_score || 0) || safePath(a.canonical_url).length - safePath(b.canonical_url).length || a.canonical_url.localeCompare(b.canonical_url))[0] || null;
}

function parentTemplateFeatureKey(winner, family, parent) {
  const winnerKey = normalizeFeatureKey(stripUncertain(winner.semantic_feature_key || winner.feature_cluster));
  const majorityKey = normalizeFeatureKey(stripUncertain(majorityValue(family.map((row) => row.semantic_feature_key || row.feature_cluster))));
  const preferred = !GENERIC_FEATURE_KEYS.has(winnerKey) ? winnerKey : !GENERIC_FEATURE_KEYS.has(majorityKey) ? majorityKey : "";
  if (preferred) return preferred;
  const parentSegments = pathSegments(parent).slice(-2).map(normalizeFeatureKey).filter(Boolean);
  const pathKey = normalizeFeatureKey(parentSegments.join("_"));
  return pathKey && !GENERIC_FEATURE_KEYS.has(pathKey) ? pathKey : `${pathKey || "route_family"}_${stableSuffix(parent)}`;
}

function referenceOnlyReason(decision) {
  const path = normalizePath(safePath(decision.canonical_url));
  const host = safeHost(decision.canonical_url);
  const root = decision.primary_root;
  if (decision.evidence_lane === "legal_instrument" || ["contact_notice", "grievance_complaints"].includes(root)) return null;
  if (/\/(?:sitemap|bus-sitemap|trains-sitemap)$/.test(path)) return "NAVIGATION_SITEMAP_REFERENCE_ONLY";
  if (/\/(?:awards|press-kit|careers|jobs|media-articles|press-releases|videos|faqs)$/.test(path)) return "CORPORATE_OR_NAVIGATION_INDEX_REFERENCE_ONLY";
  if (/\/(?:blog|news|media)$/.test(path)) return "CONTENT_INDEX_REFERENCE_ONLY";
  if (/\/(?:annual-reports|financial-results|stock-exchange-submissions|agm)$/.test(path)) return "DISCLOSURE_INDEX_REFERENCE_ONLY_ACTUAL_DOCUMENTS_REQUIRED";
  if (root === "product_service" && /\/(?:csr|directors-and-committees)$/.test(path)) return "CORPORATE_PERIPHERAL_PAGE_NOT_PRODUCT_EVIDENCE";
  if (root === "product_service" && /^ir\./.test(host) && path === "/") return "INVESTOR_RELATIONS_ROOT_REFERENCE_ONLY";
  if (root === "company_identity" && /\/(?:awards|press-kit|careers|jobs)$/.test(path)) return "SECONDARY_CORPORATE_IDENTITY_REFERENCE_ONLY";
  return null;
}

function suppressCoverageOnly(decision, reason) {
  return { ...decision, source_disposition: "SUPPRESSED_TEMPLATE_VARIANT", extraction_scope: "STRUCTURED_COVERAGE_ONLY", extraction_authorized: false, selected_block_hashes: [], coverage_retained_without_body_extraction: true, evidence_value_disposition: "STRUCTURED_COVERAGE_ONLY", unique_evidence_gate: { status: "NO_BODY_EXTRACTION_COVERAGE_ONLY" }, selection_reason: reason };
}

function suppressNearDuplicate(decision, reason) {
  return { ...decision, source_disposition: "SUPPRESSED_NEAR_DUPLICATE", extraction_scope: "METADATA_ONLY", extraction_authorized: false, selected_block_hashes: [], coverage_retained_without_body_extraction: false, evidence_value_disposition: "SUPPRESSED_DUPLICATE", unique_evidence_gate: { status: "NO_QUALIFYING_UNIQUE_EVIDENCE" }, selection_reason: reason };
}

function suppressReferenceOnly(decision, reason) {
  return { ...decision, source_disposition: "REFERENCE_ONLY", extraction_scope: "METADATA_ONLY", extraction_authorized: false, selected_block_hashes: [], coverage_retained_without_body_extraction: false, evidence_value_disposition: "REFERENCE_ONLY", unique_evidence_gate: { status: "REFERENCE_ONLY_NO_BODY_EXTRACTION" }, selection_reason: reason };
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
    return { sha256: item.sha256, block_index: item.block_index, character_count: item.character_count || text.length, meaningful_token_count: tokens.size, novel_token_count: novelTokens.length, novel_token_ratio: Number(novelTokenRatio.toFixed(4)), owner_jaccard: Number(ownerJaccard.toFixed(4)) };
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
    const state = pathSegments(path).at(-1);
    return state ? { coverage_type: "state_provider", state: state.replace(/-/g, " ").toLowerCase() } : null;
  }
  if (String(decision.variant_family || "").includes("language")) {
    const language = pathSegments(path).at(-1);
    return language ? { coverage_type: "language", language: language.toLowerCase() } : null;
  }
  if (String(decision.variant_family || "").includes("sdk_language")) {
    const sdk = pathSegments(path).at(-1);
    return sdk ? { coverage_type: "sdk_language", sdk_language: sdk.toLowerCase() } : null;
  }
  if (decision.force_parent_route_coverage || decision.semantic_relationship === "SAME_FEATURE_TEMPLATE_VARIANT") {
    const parameter = pathSegments(path).at(-1);
    const base = decision.parent_route_base || parentPath(path);
    return parameter ? { coverage_type: "route_parameter", route_base: base, parameter: parameter.replace(/-/g, " ").toLowerCase() } : null;
  }
  return decision.structured_coverage || null;
}

function isMaterialNonLegalCandidate(row) { return row.evidence_lane !== "legal_instrument" && row.fingerprint_extraction_eligible === true && row.content_materiality?.status === "MATERIAL_CONTENT"; }
function sharedTemplateMajority(rows) { const counts = new Map(); for (const row of rows) if (row.template_signature) counts.set(row.template_signature, (counts.get(row.template_signature) || 0) + 1); return Math.max(0, ...counts.values()) >= Math.ceil(rows.length * 0.6); }
function coverageShapedSlugMajority(rows) { const shaped = rows.filter((row) => COVERAGE_SHAPED_SLUG.test(pathSegments(row.canonical_url).at(-1) || "")).length; return rows.length > 0 && shaped >= Math.ceil(rows.length * 0.7); }
function majorityCount(values) { const counts = new Map(); for (const value of values) counts.set(value, (counts.get(value) || 0) + 1); return Math.max(0, ...counts.values()); }
function majorityValue(values) { const counts = new Map(); for (const value of values.filter(Boolean)) counts.set(value, (counts.get(value) || 0) + 1); return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || ""; }
function uniqueRows(rows) { const seen = new Set(); return rows.filter((row) => row && !seen.has(row.candidate_id) && seen.add(row.candidate_id)); }
function groupBy(values, keyFn) { const map = new Map(); for (const value of values) { const key = keyFn(value); map.set(key, [...(map.get(key) || []), value]); } return map; }
function pathSegments(value) { const path = value.startsWith?.("/") ? value : safePath(value); return String(path || "/").split("/").filter(Boolean); }
function parentPath(value) { const segments = pathSegments(value); return segments.length > 1 ? `/${segments.slice(0, -1).join("/")}` : "/"; }
function stripUncertain(value) { return String(value || "").replace(/__uncertain_[a-f0-9]+$/, ""); }
function normalizeFeatureKey(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").replace(/_+/g, "_") || "unclassified_feature"; }
function meaningfulTokens(value) { return new Set((String(value || "").toLowerCase().match(/[a-z0-9]{3,}/g) || []).filter((token) => !STOP_TOKENS.has(token))); }
function jaccard(left, right) { if (!left.size || !right.size) return 0; let shared = 0; for (const token of left) if (right.has(token)) shared += 1; return shared / new Set([...left, ...right]).size; }
function stableSuffix(value) { let hash = 2166136261; for (const char of String(value || "")) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 8); }
const COVERAGE_SHAPED_SLUG = /^(?:[a-z-]{2,30}-to-[a-z-]{2,30}|\d+|[a-z]{2}(?:-[a-z]{2})?|english|hindi|tamil|telugu|marathi|bengali|gujarati|kannada|malayalam|punjabi|odia|urdu|assamese|javascript|typescript|python|java|golang|ruby|php|dotnet|node)$/i;
const GENERIC_CONTAINER_SEGMENTS = new Set(["company", "companies", "docs", "documentation", "api", "apis", "blog", "news", "media", "support", "help", "legal", "policies", "resources", "products", "services"]);
const GENERIC_FEATURE_KEYS = new Set(["", "unclassified_feature", "pair_variant", "regulated_product_slug", "product_subdomain_root", "blog_or_resource", "product_service", "platform_feature_solution", "technical_docs_api", "commercial_product", "technical_operation"]);
const STOP_TOKENS = new Set(["the", "and", "for", "with", "this", "that", "from", "your", "you", "our", "are", "can", "will", "using", "use", "into", "their", "they", "have", "has", "not", "was", "were", "been", "being", "also", "more", "than", "when", "where", "which", "what"]);
function safePath(value) { try { return new URL(value).pathname.toLowerCase(); } catch { return String(value || "/").toLowerCase(); } }
function safeHost(value) { try { return new URL(value).hostname.toLowerCase(); } catch { return ""; } }
function normalizePath(value) { return String(value || "/").toLowerCase().replace(/\/+$/, "") || "/"; }
function clusterKey(decision) { return [decision.entity_id, decision.primary_root, decision.semantic_feature_key || decision.feature_cluster, decision.evidence_lane].join("|"); }
function countBy(values, key) { const output = {}; for (const item of values || []) output[item[key]] = (output[item[key]] || 0) + 1; return Object.fromEntries(Object.entries(output).sort(([a], [b]) => a.localeCompare(b))); }
function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
