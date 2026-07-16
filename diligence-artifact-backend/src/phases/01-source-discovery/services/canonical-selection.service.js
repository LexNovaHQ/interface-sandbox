import crypto from "node:crypto";

export const PHASE1_CANONICAL_SELECTION_SCHEMA_VERSION = "PHASE1_CANONICAL_SELECTION_v1";

const EXTRACTABLE_DISPOSITIONS = new Set([
  "SELECTED_CANONICAL",
  "SELECTED_PARTIAL_CONTRIBUTOR",
  "LEGAL_INSTRUMENT"
]);

/**
 * RB-09 deterministically selects canonical sources inside the locked
 * entity + root + feature + evidence-lane boundary. Exact duplicates collapse
 * to one owner. Template variants retain structured coverage or unique blocks
 * without authorising another full-page extraction. RB-18 makes a material
 * fingerprint a prerequisite for every extractable disposition.
 */
export function buildCanonicalSelection({
  canonicalInventory,
  fingerprintInventory,
  rootFeatureLaneClustering,
  legalClassification,
  analysisCache = new Map()
} = {}) {
  const canonicalById = new Map((canonicalInventory?.canonical_candidates || []).map((item) => [item.candidate_id, item]));
  const fingerprintById = new Map((fingerprintInventory?.fingerprints || []).map((item) => [item.candidate_id, item]));
  const legalByIdentity = new Map((legalClassification?.classifications || []).map((item) => [item.canonical_identity, item]));
  const classifications = rootFeatureLaneClustering?.source_classifications || [];
  const decisions = [];
  const grouped = new Map();

  for (const classification of classifications) {
    const candidate = canonicalById.get(classification.candidate_id);
    if (!candidate) continue;
    const fingerprint = fingerprintById.get(classification.candidate_id) || memberFingerprint(candidate, fingerprintById);
    const legal = legalByIdentity.get(classification.canonical_identity);
    const record = { candidate, fingerprint, classification, legal, analysis: fingerprint ? analysisCache.get(fingerprint.candidate_id) : null };

    if (!fingerprint || fingerprint.fetch_status === "FETCH_FAILED") {
      decisions.push(selectionDecision(record, {
        source_disposition: "FETCH_FAILED",
        extraction_scope: "METADATA_ONLY",
        extraction_authorized: false,
        canonical_owner_candidate_id: null,
        selected_block_hashes: [],
        selection_reason: fingerprint?.limitation || "FINGERPRINT_FETCH_FAILED"
      }));
      continue;
    }

    if (fingerprint.fetch_status === "SKIPPED_ENTITY_BOUNDARY") {
      decisions.push(selectionDecision(record, {
        source_disposition: "REFERENCE_ONLY",
        extraction_scope: "METADATA_ONLY",
        extraction_authorized: false,
        canonical_owner_candidate_id: null,
        selected_block_hashes: [],
        selection_reason: fingerprint.limitation || "ENTITY_BOUNDARY_REFERENCE_ONLY"
      }));
      continue;
    }

    if (!isMaterialFingerprint(fingerprint)) {
      decisions.push(selectionDecision(record, {
        source_disposition: "REJECTED_NOT_EVIDENCE",
        extraction_scope: "METADATA_ONLY",
        extraction_authorized: false,
        canonical_owner_candidate_id: null,
        selected_block_hashes: [],
        selection_reason: fingerprint.limitation || "NO_MATERIAL_CONTENT_NOT_EXTRACTION_ELIGIBLE"
      }));
      continue;
    }

    if (legal?.confirmed_legal_instrument) {
      decisions.push(selectionDecision(record, {
        source_disposition: "LEGAL_INSTRUMENT",
        extraction_scope: "FULL_DOCUMENT",
        extraction_authorized: true,
        canonical_owner_candidate_id: candidate.candidate_id,
        selected_block_hashes: blockHashes(fingerprint),
        selection_reason: "CONFIRMED_DISTINCT_LEGAL_INSTRUMENT_WITH_MATERIAL_BODY"
      }));
      continue;
    }

    const key = clusterKey(classification);
    const members = grouped.get(key) || [];
    members.push(record);
    grouped.set(key, members);
  }

  for (const [key, members] of grouped.entries()) {
    const ranked = [...members].sort((a, b) => scoreRecord(b) - scoreRecord(a) || stableUrlRank(a.candidate.canonical_url) - stableUrlRank(b.candidate.canonical_url) || a.candidate.canonical_url.localeCompare(b.candidate.canonical_url));
    const winner = ranked[0];
    const winnerHashes = new Set(blockHashes(winner.fingerprint));
    decisions.push(selectionDecision(winner, {
      source_disposition: "SELECTED_CANONICAL",
      extraction_scope: "FULL_MAIN_CONTENT",
      extraction_authorized: true,
      canonical_owner_candidate_id: winner.candidate.candidate_id,
      selected_block_hashes: [...winnerHashes],
      selection_reason: "HIGHEST_AUTHORITY_COMPLETENESS_STABILITY_SCORE",
      cluster_key: key,
      canonical_score: scoreRecord(winner)
    }));

    for (const member of ranked.slice(1)) {
      const hashes = blockHashes(member.fingerprint);
      const uniqueHashes = hashes.filter((hash) => !winnerHashes.has(hash));
      const exactDuplicate = Boolean(member.fingerprint?.exact_content_hash && member.fingerprint.exact_content_hash === winner.fingerprint?.exact_content_hash);
      const similarity = shingleSimilarity(member.fingerprint, winner.fingerprint);
      const variant = member.classification.variant_family && member.classification.variant_family !== "none";

      if (exactDuplicate) {
        decisions.push(selectionDecision(member, {
          source_disposition: "ALIAS_EXACT_DUPLICATE",
          extraction_scope: "METADATA_ONLY",
          extraction_authorized: false,
          canonical_owner_candidate_id: winner.candidate.candidate_id,
          selected_block_hashes: [],
          selection_reason: "EXACT_NORMALISED_CONTENT_HASH_MATCH",
          cluster_key: key,
          similarity
        }));
        continue;
      }

      if (variant) {
        const scope = uniqueHashes.length ? "SELECTED_UNIQUE_SECTIONS" : "STRUCTURED_COVERAGE_ONLY";
        decisions.push(selectionDecision(member, {
          source_disposition: "SELECTED_PARTIAL_CONTRIBUTOR",
          extraction_scope: scope,
          extraction_authorized: true,
          canonical_owner_candidate_id: winner.candidate.candidate_id,
          selected_block_hashes: uniqueHashes,
          selection_reason: uniqueHashes.length ? "TEMPLATE_BODY_SUPPRESSED_UNIQUE_BLOCKS_RETAINED" : "TEMPLATE_BODY_SUPPRESSED_STRUCTURED_COVERAGE_RETAINED",
          cluster_key: key,
          similarity
        }));
        continue;
      }

      if (similarity >= 0.85 && uniqueHashes.length <= 1) {
        decisions.push(selectionDecision(member, {
          source_disposition: "SUPPRESSED_NEAR_DUPLICATE",
          extraction_scope: "METADATA_ONLY",
          extraction_authorized: false,
          canonical_owner_candidate_id: winner.candidate.candidate_id,
          selected_block_hashes: [],
          selection_reason: "HIGH_NEAR_DUPLICATE_SIMILARITY_NO_MATERIAL_DELTA",
          cluster_key: key,
          similarity
        }));
        continue;
      }

      decisions.push(selectionDecision(member, {
        source_disposition: "SELECTED_PARTIAL_CONTRIBUTOR",
        extraction_scope: "SELECTED_UNIQUE_SECTIONS",
        extraction_authorized: true,
        canonical_owner_candidate_id: winner.candidate.candidate_id,
        selected_block_hashes: uniqueHashes.length ? uniqueHashes : hashes,
        selection_reason: "MATERIALLY_DISTINCT_BLOCKS_RETAINED_WITHIN_FEATURE_CLUSTER",
        cluster_key: key,
        similarity
      }));
    }
  }

  decisions.sort((a, b) => a.entity_id.localeCompare(b.entity_id) || a.primary_root.localeCompare(b.primary_root) || a.canonical_url.localeCompare(b.canonical_url));
  const dispositionCounts = Object.fromEntries([...new Set(decisions.map((item) => item.source_disposition))].sort().map((disposition) => [disposition, decisions.filter((item) => item.source_disposition === disposition).length]));

  return {
    schema_version: PHASE1_CANONICAL_SELECTION_SCHEMA_VERSION,
    status: "COMPLETE",
    model_usage: "NONE",
    selection_key: "ENTITY_ID_PLUS_PRIMARY_ROOT_PLUS_FEATURE_CLUSTER_PLUS_EVIDENCE_LANE",
    exact_duplicate_rule: "ONE_CANONICAL_OWNER_ALIASES_RETAINED",
    variant_rule: "GENERIC_CANONICAL_PLUS_STRUCTURED_COVERAGE_AND_UNIQUE_DELTAS",
    legal_rule: "EVERY_CONFIRMED_DISTINCT_LEGAL_INSTRUMENT_WITH_MATERIAL_BODY_SELECTED_FULL_DOCUMENT",
    material_content_rule: "NO_EXTRACTABLE_DISPOSITION_WITHOUT_MATERIAL_FINGERPRINT",
    final_extraction_authority: true,
    counts: {
      candidates_decided: decisions.length,
      extraction_authorized: decisions.filter((item) => item.extraction_authorized).length,
      rejected_no_material_content: decisions.filter((item) => item.source_disposition === "REJECTED_NOT_EVIDENCE").length,
      exact_duplicates_suppressed: decisions.filter((item) => item.source_disposition === "ALIAS_EXACT_DUPLICATE").length,
      near_duplicates_suppressed: decisions.filter((item) => item.source_disposition === "SUPPRESSED_NEAR_DUPLICATE").length,
      partial_contributors: decisions.filter((item) => item.source_disposition === "SELECTED_PARTIAL_CONTRIBUTOR").length,
      legal_instruments: decisions.filter((item) => item.source_disposition === "LEGAL_INSTRUMENT").length
    },
    disposition_counts: dispositionCounts,
    decisions
  };
}

export function assertCanonicalSelection(selection) {
  if (selection?.schema_version !== PHASE1_CANONICAL_SELECTION_SCHEMA_VERSION) throw new Error("PHASE1_CANONICAL_SELECTION_SCHEMA_INVALID");
  if (selection.model_usage !== "NONE" || selection.final_extraction_authority !== true || selection.material_content_rule !== "NO_EXTRACTABLE_DISPOSITION_WITHOUT_MATERIAL_FINGERPRINT") throw new Error("PHASE1_CANONICAL_SELECTION_AUTHORITY_INVALID");
  const seen = new Set();
  const decisionsById = new Map((selection.decisions || []).map((item) => [item.candidate_id, item]));
  for (const decision of selection.decisions || []) {
    if (!decision.selection_id || !decision.candidate_id || !decision.canonical_identity || !decision.entity_id || !decision.primary_root || !decision.feature_cluster || !decision.evidence_lane || !decision.source_disposition || !decision.extraction_scope) throw new Error("PHASE1_CANONICAL_SELECTION_DECISION_INCOMPLETE");
    if (seen.has(decision.canonical_identity)) throw new Error(`PHASE1_CANONICAL_SELECTION_DUPLICATE_DECISION:${decision.canonical_identity}`);
    seen.add(decision.canonical_identity);
    if (decision.extraction_authorized !== EXTRACTABLE_DISPOSITIONS.has(decision.source_disposition)) throw new Error(`PHASE1_CANONICAL_SELECTION_AUTHORITY_DISPOSITION_MISMATCH:${decision.candidate_id}`);
    if (decision.extraction_authorized && (decision.fingerprint_fetch_status !== "FETCHED" || decision.fingerprint_extraction_eligible !== true || decision.content_materiality?.status !== "MATERIAL_CONTENT" || !decision.exact_content_hash || !decision.selected_block_hashes?.length)) throw new Error(`PHASE1_CANONICAL_SELECTION_AUTHORISED_WITHOUT_MATERIAL_EVIDENCE:${decision.candidate_id}`);
    if (decision.source_disposition === "REJECTED_NOT_EVIDENCE" && decision.extraction_authorized !== false) throw new Error(`PHASE1_CANONICAL_SELECTION_REJECTED_SOURCE_AUTHORISED:${decision.candidate_id}`);
    if (decision.source_disposition === "ALIAS_EXACT_DUPLICATE" && !decision.canonical_owner_candidate_id) throw new Error(`PHASE1_CANONICAL_SELECTION_DUPLICATE_OWNER_MISSING:${decision.candidate_id}`);
    if (decision.source_disposition === "LEGAL_INSTRUMENT" && decision.extraction_scope !== "FULL_DOCUMENT") throw new Error(`PHASE1_CANONICAL_SELECTION_LEGAL_SCOPE_INVALID:${decision.candidate_id}`);
  }
  for (const decision of selection.decisions || []) {
    if (decision.canonical_owner_candidate_id && !decisionsById.has(decision.canonical_owner_candidate_id)) throw new Error(`PHASE1_CANONICAL_SELECTION_OWNER_UNKNOWN:${decision.candidate_id}`);
  }
  return { ok: true, decisions: seen.size };
}

function selectionDecision(record, values) {
  const { candidate, fingerprint, classification, legal } = record;
  const structuredCoverage = deriveStructuredCoverage(candidate.canonical_url, classification.variant_family);
  return {
    record_type: "CanonicalSelectionDecision",
    schema_version: PHASE1_CANONICAL_SELECTION_SCHEMA_VERSION,
    selection_id: stableId("SELECT", candidate.canonical_identity),
    candidate_id: candidate.candidate_id,
    canonical_identity: candidate.canonical_identity,
    entity_id: candidate.entity_id,
    entity_status: candidate.entity_status,
    canonical_url: candidate.canonical_url,
    fetch_url: candidate.fetch_url,
    alias_urls: candidate.aliases || [],
    legacy_manifest_ids: candidate.legacy_manifest_ids || [],
    primary_root: classification.primary_root,
    secondary_root_references: classification.secondary_root_references || [],
    feature_cluster: classification.feature_cluster,
    evidence_lane: classification.evidence_lane,
    variant_family: classification.variant_family || "none",
    ai_overlay: classification.ai_overlay || null,
    legal_doc_type: legal?.confirmed_legal_instrument ? legal.doc_type : "other",
    legal_artifact_name_hint: legal?.confirmed_legal_instrument ? legal.artifact_name_hint : "legal_doc_other",
    fingerprint_fetch_status: fingerprint?.fetch_status || "MISSING",
    fingerprint_extraction_eligible: fingerprint?.extraction_eligible === true,
    content_materiality: fingerprint?.content_materiality || null,
    exact_content_hash: fingerprint?.exact_content_hash || null,
    template_signature: fingerprint?.template_signature || null,
    structured_coverage: structuredCoverage,
    ...values
  };
}

function memberFingerprint(candidate, fingerprints) {
  return [candidate.candidate_id, ...(candidate.member_candidate_ids || [])].map((id) => fingerprints.get(id)).find(isMaterialFingerprint)
    || [candidate.candidate_id, ...(candidate.member_candidate_ids || [])].map((id) => fingerprints.get(id)).find(Boolean)
    || null;
}

function isMaterialFingerprint(item) {
  return item?.fetch_status === "FETCHED" && item?.extraction_eligible === true && item?.content_materiality?.status === "MATERIAL_CONTENT" && Boolean(item?.exact_content_hash) && (item?.block_hashes || []).length > 0;
}

function clusterKey(classification) {
  return [classification.entity_id, classification.primary_root, classification.feature_cluster, classification.evidence_lane].join("|");
}

function scoreRecord(record) {
  const { candidate, fingerprint, classification } = record;
  let score = 0;
  if (candidate.entity_status === "PRIMARY_TARGET") score += 35;
  else if (candidate.entity_status === "SEPARATE_ENTITY_INCLUDED") score += 32;
  else if (candidate.entity_status === "CONTROLLED_OPERATING_SURFACE") score += 28;
  if (candidate.extraction_authorized_by_legacy_manifest) score += 12;
  const path = safePath(candidate.canonical_url);
  if (featureLandingPath(path, classification.feature_cluster)) score += 18;
  if (fingerprint?.title) score += 5;
  score += Math.min(18, Math.floor((fingerprint?.fingerprint_bytes_used || 0) / 5000));
  if (fingerprint?.document_date) score += 4;
  if (!(fingerprint?.warnings || []).length) score += 3;
  if (!safeSearch(candidate.canonical_url)) score += 3;
  if (classification.variant_family === "none" || /overview|canonical/.test(classification.variant_family || "")) score += 10;
  if (classification.evidence_lane === "technical_operation" && /docs?|developer|api|reference/.test(path)) score += 6;
  return score;
}

function featureLandingPath(path, feature) {
  const normalized = String(feature || "").replace(/_/g, "-");
  const clean = path.replace(/\/$/, "");
  return clean.endsWith(`/${normalized}`) || clean.endsWith(`/${String(feature || "")}`) || clean.split("/").filter(Boolean).length <= 2;
}

function shingleSimilarity(left, right) {
  const a = new Set(left?.near_duplicate_signature?.sampled_hashes || []);
  const b = new Set(right?.near_duplicate_signature?.sampled_hashes || []);
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  return Number((intersection / new Set([...a, ...b]).size).toFixed(4));
}

function blockHashes(fingerprint) {
  return (fingerprint?.block_hashes || []).map((item) => item.sha256).filter(Boolean);
}

function deriveStructuredCoverage(value, variantFamily) {
  const path = safePath(value);
  const pair = /\/([a-z-]{2,20})-to-([a-z-]{2,20})(?:\/|$)/i.exec(path);
  if (pair) return { coverage_type: "language_pair", source_language: pair[1].toLowerCase(), target_language: pair[2].toLowerCase() };
  if (variantFamily?.includes("language")) {
    const language = path.split("/").filter(Boolean).at(-1);
    return language ? { coverage_type: "language", language: language.toLowerCase() } : null;
  }
  if (variantFamily?.includes("state_provider")) {
    const state = path.split("/").filter(Boolean).at(-1);
    return state ? { coverage_type: "state_provider", state: state.replace(/-/g, " ") } : null;
  }
  return null;
}

function stableUrlRank(value) { return String(value || "").length + (safeSearch(value) ? 100 : 0); }
function safePath(value) { try { return new URL(value).pathname.toLowerCase(); } catch { return "/"; } }
function safeSearch(value) { try { return new URL(value).search; } catch { return ""; } }
function stableId(prefix, value) { return `${prefix}.${crypto.createHash("sha256").update(String(value || "")).digest("hex").slice(0, 16)}`; }
