import crypto from "node:crypto";
import { callProviderJson, providerConfigStatus } from "../../../runtime/services/provider.service.js";

export const PHASE1_SEMANTIC_FEATURE_ADJUDICATION_SCHEMA_VERSION = "PHASE1_SEMANTIC_FEATURE_ADJUDICATION_v1";
const RELATIONSHIPS = new Set(["SAME_FEATURE_CANONICAL_CANDIDATE", "SAME_FEATURE_TEMPLATE_VARIANT", "SAME_FEATURE_UNIQUE_DELTA", "RELATED_BUT_DISTINCT_FEATURE", "DISTINCT_FEATURE", "UNCERTAIN"]);
const LEGAL_LANE = "legal_instrument";

export async function buildSemanticFeatureAdjudication({ canonicalInventory, fingerprintInventory, rootFeatureLaneClustering, legalClassification, analysisCache = new Map(), enableModel = true, callProvider = callProviderJson } = {}) {
  const candidates = new Map((canonicalInventory?.canonical_candidates || []).map((row) => [row.candidate_id, row]));
  const fingerprints = new Map((fingerprintInventory?.fingerprints || []).map((row) => [row.candidate_id, row]));
  const legal = new Map((legalClassification?.classifications || []).map((row) => [row.canonical_identity, row]));
  const rows = [];
  const excludedLegal = [];

  for (const classification of rootFeatureLaneClustering?.source_classifications || []) {
    const candidate = candidates.get(classification.candidate_id);
    const fingerprint = fingerprints.get(classification.candidate_id);
    if (!candidate) continue;
    if (classification.evidence_lane === LEGAL_LANE || legal.get(classification.canonical_identity)?.confirmed_legal_instrument) {
      excludedLegal.push(classification.candidate_id);
      continue;
    }
    rows.push(compactRow({ candidate, fingerprint, classification, analysis: analysisCache.get(classification.candidate_id) }));
  }

  const providerReady = modelReady(enableModel, callProvider);
  const proposals = new Map();
  const modelCalls = [];
  const limitations = [];

  if (providerReady) {
    for (const group of groupBy(rows, boundaryKey).values()) {
      if (group.length < 2) continue;
      for (const batch of chunks(group, 36)) {
        try {
          const result = await callProvider({ prompt: promptFor(batch), phase: "PHASE1_RB18B_SEMANTIC_FEATURE_ADJUDICATION", temperature: 0, maxOutputTokens: 8192, repairOnJsonParse: true });
          const accepted = indexProposals(result?.json, batch, proposals);
          modelCalls.push({ boundary_key: boundaryKey(batch[0]), candidate_count: batch.length, accepted_decisions: accepted, model: result?.metadata?.model || null });
        } catch (error) {
          limitations.push({ code: "SEMANTIC_MODEL_CALL_FAILED_PRESERVED_DISTINCT", boundary_key: boundaryKey(batch[0]), message: error?.message || String(error) });
        }
      }
    }
  } else if (enableModel) {
    limitations.push({ code: "SEMANTIC_MODEL_UNAVAILABLE_DETERMINISTIC_FALLBACK" });
  }

  const rowsById = new Map(rows.map((row) => [row.candidate_id, row]));
  const decisions = rows.map((row) => decide(row, proposals.get(row.candidate_id), rowsById));
  const projected = project(rootFeatureLaneClustering, decisions);

  return {
    schema_version: PHASE1_SEMANTIC_FEATURE_ADJUDICATION_SCHEMA_VERSION,
    status: limitations.length ? "COMPLETE_WITH_MODEL_LIMITATIONS" : "COMPLETE",
    model_usage: modelCalls.length ? "BOUNDED_AMBIGUOUS_CLUSTER_ADJUDICATION" : "NONE",
    authority_rule: "SEMANTIC_RECOMMENDATION_PLUS_DETERMINISTIC_CORROBORATION",
    legal_boundary_rule: "LEGAL_INSTRUMENTS_EXCLUDED_FROM_SEMANTIC_GROUPING",
    grouping_boundary: "ENTITY_ID_PLUS_PRIMARY_ROOT_PLUS_EVIDENCE_LANE",
    extraction_authority: false,
    counts: {
      non_legal_candidates: decisions.length,
      legal_candidates_excluded: excludedLegal.length,
      model_calls: modelCalls.length,
      semantic_groupings_enforced: decisions.filter((row) => row.semantic_grouping_enforced).length,
      uncertain_preserved_distinct: decisions.filter((row) => row.relationship === "UNCERTAIN").length,
      final_feature_clusters: new Set(decisions.map((row) => `${boundaryKey(row)}|${row.semantic_feature_key}`)).size
    },
    excluded_legal_candidate_ids: excludedLegal.sort(),
    model_calls: modelCalls,
    limitations,
    decisions,
    adjudicated_root_feature_lane_clustering: projected
  };
}

export function assertSemanticFeatureAdjudication(value) {
  if (value?.schema_version !== PHASE1_SEMANTIC_FEATURE_ADJUDICATION_SCHEMA_VERSION || value.extraction_authority !== false || value.authority_rule !== "SEMANTIC_RECOMMENDATION_PLUS_DETERMINISTIC_CORROBORATION") throw new Error("PHASE1_SEMANTIC_FEATURE_ADJUDICATION_SCHEMA_INVALID");
  const seen = new Set();
  for (const row of value.decisions || []) {
    if (!row.candidate_id || !row.semantic_feature_key || !RELATIONSHIPS.has(row.relationship) || row.evidence_lane === LEGAL_LANE) throw new Error("PHASE1_SEMANTIC_FEATURE_DECISION_INVALID");
    if (seen.has(row.candidate_id)) throw new Error(`PHASE1_SEMANTIC_DUPLICATE_DECISION:${row.candidate_id}`);
    seen.add(row.candidate_id);
    if (row.semantic_grouping_enforced && !(row.deterministic_corroborators || []).length) throw new Error(`PHASE1_SEMANTIC_GROUPING_WITHOUT_CORROBORATION:${row.candidate_id}`);
    if (row.relationship === "UNCERTAIN" && row.semantic_feature_key !== row.deterministic_feature_key) throw new Error(`PHASE1_SEMANTIC_UNCERTAIN_SILENT_MERGE:${row.candidate_id}`);
    if (row.final_extraction_authority !== false) throw new Error(`PHASE1_SEMANTIC_EARLY_EXTRACTION_AUTHORITY:${row.candidate_id}`);
  }
  const projectedCount = value.adjudicated_root_feature_lane_clustering?.source_classifications?.length || 0;
  if (projectedCount !== (value.counts?.non_legal_candidates || 0) + (value.counts?.legal_candidates_excluded || 0)) throw new Error("PHASE1_SEMANTIC_PROJECTED_CLUSTERING_ACCOUNTING_MISMATCH");
  return { ok: true, decisions: seen.size };
}

function compactRow({ candidate, fingerprint, classification, analysis }) {
  const routeFamily = routeFamilyFor(candidate.canonical_url, classification.variant_family);
  return {
    candidate_id: classification.candidate_id,
    canonical_identity: classification.canonical_identity,
    entity_id: classification.entity_id,
    primary_root: classification.primary_root,
    evidence_lane: classification.evidence_lane,
    original_feature_cluster: classification.feature_cluster,
    deterministic_feature_key: normalizeFeature(classification.feature_cluster || routeFamily || fingerprint?.title),
    canonical_url: candidate.canonical_url,
    route_family: routeFamily,
    variant_family: classification.variant_family || "none",
    template_signature: fingerprint?.template_signature || null,
    shingles: fingerprint?.near_duplicate_signature?.sampled_hashes || [],
    title_tokens: tokens(`${fingerprint?.title || ""} ${(fingerprint?.headings || []).slice(0, 8).join(" ")}`),
    title: fingerprint?.title || "",
    headings: (fingerprint?.headings || []).slice(0, 10),
    excerpt: String(analysis?.main_text || fingerprint?.analysis_excerpt || "").slice(0, 1000)
  };
}

function decide(row, proposal, rowsById) {
  const base = {
    record_type: "SemanticFeatureDecision",
    schema_version: PHASE1_SEMANTIC_FEATURE_ADJUDICATION_SCHEMA_VERSION,
    decision_id: stableId("SEM", row.canonical_identity),
    candidate_id: row.candidate_id,
    canonical_identity: row.canonical_identity,
    entity_id: row.entity_id,
    primary_root: row.primary_root,
    evidence_lane: row.evidence_lane,
    original_feature_cluster: row.original_feature_cluster,
    deterministic_feature_key: row.deterministic_feature_key,
    variant_family: row.variant_family,
    route_family: row.route_family,
    final_extraction_authority: false
  };
  if (!proposal) return { ...base, semantic_feature_key: row.deterministic_feature_key, relationship: row.variant_family !== "none" ? "SAME_FEATURE_TEMPLATE_VARIANT" : "SAME_FEATURE_CANONICAL_CANDIDATE", semantic_grouping_enforced: false, deterministic_corroborators: [], related_candidate_ids: [], decision_source: "DETERMINISTIC_ONLY" };

  const peers = (proposal.related_candidate_ids || []).map((id) => rowsById.get(id)).filter((peer) => peer && boundaryKey(peer) === boundaryKey(row));
  const corroborators = unique(peers.flatMap((peer) => pairSignals(row, peer)));
  const proposedKey = normalizeFeature(proposal.normalized_feature_key);
  const grouping = proposal.relationship.startsWith("SAME_FEATURE_") && proposedKey !== row.deterministic_feature_key;
  if (grouping && !corroborators.length) return { ...base, semantic_feature_key: row.deterministic_feature_key, relationship: "UNCERTAIN", semantic_grouping_enforced: false, deterministic_corroborators: [], related_candidate_ids: peers.map((peer) => peer.candidate_id), decision_source: "MODEL_REJECTED_NO_DETERMINISTIC_CORROBORATION" };
  return { ...base, semantic_feature_key: grouping ? proposedKey : row.deterministic_feature_key, relationship: proposal.relationship, semantic_grouping_enforced: grouping, deterministic_corroborators: corroborators, related_candidate_ids: peers.map((peer) => peer.candidate_id), confidence: confidence(proposal.confidence), rationale: String(proposal.rationale || "").slice(0, 600), decision_source: "BOUNDED_MODEL_PLUS_DETERMINISTIC_ENFORCEMENT" };
}

function project(original, decisions) {
  const byId = new Map(decisions.map((row) => [row.candidate_id, row]));
  const sourceClassifications = (original?.source_classifications || []).map((source) => {
    const semantic = byId.get(source.candidate_id);
    if (!semantic) return { ...source, semantic_adjudication: { excluded_reason: source.evidence_lane === LEGAL_LANE ? "LEGAL_INSTRUMENT_HARD_BOUNDARY" : "NO_DECISION" } };
    return { ...source, original_feature_cluster: source.feature_cluster, feature_cluster: semantic.semantic_feature_key, semantic_feature_key: semantic.semantic_feature_key, semantic_relationship: semantic.relationship, semantic_grouping_enforced: semantic.semantic_grouping_enforced, semantic_deterministic_corroborators: semantic.deterministic_corroborators, semantic_decision_id: semantic.decision_id };
  });
  return { ...original, status: "COMPLETE_WITH_SEMANTIC_ADJUDICATION", model_usage: "SEMANTIC_LEDGER_SEPARATE", clustering_key: "ENTITY_ID_PLUS_PRIMARY_ROOT_PLUS_SEMANTIC_FEATURE_KEY_PLUS_EVIDENCE_LANE", source_classifications: sourceClassifications, feature_clusters: rebuildClusters(sourceClassifications), semantic_adjudication_applied: true };
}

function rebuildClusters(sources) {
  const groups = new Map();
  for (const source of sources) {
    const key = `${source.entity_id}|${source.primary_root}|${source.feature_cluster}|${source.evidence_lane}`;
    const row = groups.get(key) || { record_type: "FeatureCluster", schema_version: source.schema_version, cluster_id: stableId("CLUSTER", key), entity_id: source.entity_id, primary_root: source.primary_root, feature_cluster: source.feature_cluster, evidence_lane: source.evidence_lane, member_candidate_ids: [], variant_families: [], secondary_root_references: [], ai_overlay_relationships: [] };
    row.member_candidate_ids.push(source.candidate_id);
    row.variant_families = unique([...row.variant_families, source.variant_family].filter((value) => value && value !== "none"));
    row.secondary_root_references = unique([...row.secondary_root_references, ...(source.secondary_root_references || [])]);
    if (source.ai_overlay) row.ai_overlay_relationships.push(source.ai_overlay);
    groups.set(key, row);
  }
  return [...groups.values()];
}

function indexProposals(payload, batch, target) {
  const ids = new Set(batch.map((row) => row.candidate_id));
  let accepted = 0;
  for (const row of payload?.decisions || []) {
    if (!ids.has(row?.candidate_id) || !RELATIONSHIPS.has(row?.relationship) || !normalizeFeature(row?.normalized_feature_key)) continue;
    target.set(row.candidate_id, { ...row, related_candidate_ids: unique(row.related_candidate_ids || []).filter((id) => ids.has(id) && id !== row.candidate_id) });
    accepted += 1;
  }
  return accepted;
}

function promptFor(batch) {
  const payload = batch.map((row) => ({ candidate_id: row.candidate_id, url_path: safePath(row.canonical_url), deterministic_feature_key: row.deterministic_feature_key, route_family: row.route_family, variant_family: row.variant_family, template_signature: row.template_signature, title: row.title, headings: row.headings, excerpt: row.excerpt }));
  return ["You are a bounded feature-relationship adjudicator. Return strict JSON only.", '{"decisions":[{"candidate_id":"...","normalized_feature_key":"snake_case","relationship":"SAME_FEATURE_CANONICAL_CANDIDATE|SAME_FEATURE_TEMPLATE_VARIANT|SAME_FEATURE_UNIQUE_DELTA|RELATED_BUT_DISTINCT_FEATURE|DISTINCT_FEATURE|UNCERTAIN","related_candidate_ids":["..."],"confidence":0.0,"rationale":"brief"}]}', "Never decide extraction authority. Never cross entity, root, or evidence-lane boundaries. Treat language, locale, state, provider, region, and SDK-language routes as variants only when the underlying capability is the same. Preserve distinct products. Every SAME_FEATURE decision must name a related candidate. Use UNCERTAIN when evidence is insufficient.", `Boundary: ${boundaryKey(batch[0])}`, `Candidates: ${JSON.stringify(payload)}`].join("\n\n");
}

function pairSignals(a, b) { const out = []; if (a.route_family === b.route_family) out.push("SHARED_ROUTE_FAMILY"); if (a.template_signature && a.template_signature === b.template_signature) out.push("SHARED_TEMPLATE_SIGNATURE"); if (a.variant_family !== "none" && a.variant_family === b.variant_family) out.push("SHARED_VARIANT_FAMILY"); if (jaccard(a.title_tokens, b.title_tokens) >= 0.5) out.push("TITLE_CONCEPT_OVERLAP"); if (jaccard(a.shingles, b.shingles) >= 0.72) out.push("HIGH_CONTENT_OVERLAP"); return out; }
function routeFamilyFor(value, variantFamily) { const parts = safePath(value).split("/").filter(Boolean); return `/${parts.map((part, index) => /^[a-z-]{2,20}-to-[a-z-]{2,20}$/i.test(part) ? "{language-pair}" : String(variantFamily).includes("state_provider") && index === parts.length - 1 ? "{state-provider}" : String(variantFamily).includes("sdk_language") && index === parts.length - 1 ? "{sdk-language}" : /^\d+$/.test(part) ? "{id}" : part.toLowerCase()).join("/")}`; }
function normalizeFeature(value) { return String(value || "").toLowerCase().replace(/\b(api|apis|docs?|documentation|developer|overview|product|products|service|services|solution|solutions|platform|feature|features)\b/g, " ").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").replace(/_+/g, "_") || "unclassified_feature"; }
function modelReady(enabled, provider) { if (!enabled || typeof provider !== "function") return false; if (provider !== callProviderJson) return true; try { return providerConfigStatus().gemini_api_keys_present === true; } catch { return false; } }
function boundaryKey(row) { return `${row?.entity_id}|${row?.primary_root}|${row?.evidence_lane}`; }
function groupBy(values, keyFn) { const map = new Map(); for (const value of values) { const key = keyFn(value); map.set(key, [...(map.get(key) || []), value]); } return map; }
function chunks(values, size) { const out = []; for (let i = 0; i < values.length; i += size) out.push(values.slice(i, i + size)); return out; }
function tokens(value) { return [...new Set(String(value || "").toLowerCase().match(/[a-z0-9]{3,}/g) || [])]; }
function jaccard(a, b) { const left = new Set(a || []); const right = new Set(b || []); if (!left.size || !right.size) return 0; let shared = 0; for (const value of left) if (right.has(value)) shared += 1; return shared / new Set([...left, ...right]).size; }
function confidence(value) { const n = Number(value); return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0; }
function safePath(value) { try { return new URL(value).pathname || "/"; } catch { return "/"; } }
function stableId(prefix, value) { return `${prefix}.${crypto.createHash("sha256").update(String(value || "")).digest("hex").slice(0, 16)}`; }
function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
