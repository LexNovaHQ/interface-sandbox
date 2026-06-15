const ATOMIC_FEATURE_KEYS = new Set([
  "text_to_speech",
  "speech_to_text",
  "translation",
  "dubbing",
  "document_digitisation",
  "voice_agent",
  "language_model",
  "embeddings",
  "fine_tuning"
]);

const DELIVERY_KEYS = new Set(["api_platform"]);
const PRODUCT_AREA_KEYS = new Set(["source_product_surface"]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asString(value, fallback = "") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).trim() || fallback;
}

function lower(value) {
  return asString(value).toLowerCase();
}

function inferBucket(candidate = {}) {
  const key = lower(candidate.candidate_key || candidate.candidate_cluster);
  const type = lower(candidate.candidate_type);
  const text = [candidate.raw_label, candidate.candidate_label, candidate.normalized_label, candidate.source_surface, candidate.source_url].map(lower).join(" ");

  if (ATOMIC_FEATURE_KEYS.has(key)) return "ATOMIC_FEATURE_CANDIDATE";
  if (DELIVERY_KEYS.has(key) || type.includes("delivery")) return "DELIVERY_CHANNEL_SIGNAL";
  if (PRODUCT_AREA_KEYS.has(key) || type.includes("product_surface") || type.includes("source_surface")) return "PRODUCT_AREA";
  if (/subprocessor|provider|model provider|cloud|hosting|vector|database|integration|crm|stripe|github|payment|core banking/.test(text)) return "ARCHITECTURE_SIGNAL";
  if (/audio|voice|document|file|text|image|video|payment|pii|personal data|customer data|transcript/.test(text)) return "DATA_SIGNAL";
  if (/increase|reduce|automate|workflow|review|analysis|support|sales|loan|recruitment|compliance/.test(text)) return "COMMERCIAL_OUTCOME_SIGNAL";
  return "INSUFFICIENT_FEATURE_EVIDENCE";
}

function compactCandidate(candidate = {}, index = 0) {
  const bucket = inferBucket(candidate);
  return {
    manifest_candidate_id: candidate.candidate_id || `CAND_${String(index + 1).padStart(3, "0")}`,
    source_candidate_id: candidate.candidate_id || null,
    candidate_bucket: bucket,
    candidate_key: candidate.candidate_key || candidate.candidate_cluster || null,
    candidate_type: candidate.candidate_type || null,
    candidate_name: candidate.raw_label || candidate.candidate_label || candidate.normalized_label || "unnamed candidate",
    normalized_label: candidate.normalized_label || null,
    product_area_hint: bucket === "PRODUCT_AREA" ? (candidate.raw_label || candidate.candidate_label || candidate.source_surface || null) : (candidate.source_surface || null),
    source_id: candidate.source_id || null,
    source_url: candidate.source_url || null,
    source_family: candidate.source_family || "unknown",
    evidence_refs: asArray(candidate.evidence_refs).filter(Boolean),
    deterministic_reason: candidate.index_reason || candidate.reason_for_indexing || null,
    raw_signal: candidate.raw_signal || null,
    confidence: candidate.confidence || "unknown"
  };
}

function groupByBucket(candidates = []) {
  const groups = {
    product_area_candidates: [],
    atomic_feature_candidates: [],
    delivery_channel_candidates: [],
    data_signal_candidates: [],
    architecture_signal_candidates: [],
    commercial_outcome_candidates: [],
    legal_control_signal_candidates: [],
    duplicate_or_alias_candidates: [],
    insufficient_feature_evidence_candidates: []
  };

  for (const candidate of candidates) {
    switch (candidate.candidate_bucket) {
      case "PRODUCT_AREA": groups.product_area_candidates.push(candidate); break;
      case "ATOMIC_FEATURE_CANDIDATE": groups.atomic_feature_candidates.push(candidate); break;
      case "DELIVERY_CHANNEL_SIGNAL": groups.delivery_channel_candidates.push(candidate); break;
      case "DATA_SIGNAL": groups.data_signal_candidates.push(candidate); break;
      case "ARCHITECTURE_SIGNAL": groups.architecture_signal_candidates.push(candidate); break;
      case "COMMERCIAL_OUTCOME_SIGNAL": groups.commercial_outcome_candidates.push(candidate); break;
      case "LEGAL_CONTROL_SIGNAL": groups.legal_control_signal_candidates.push(candidate); break;
      case "DUPLICATE_OR_ALIAS": groups.duplicate_or_alias_candidates.push(candidate); break;
      default: groups.insufficient_feature_evidence_candidates.push(candidate); break;
    }
  }

  return groups;
}

export function buildStage5CandidateManifestV2(stage5Input = {}) {
  const sourceCandidates = asArray(stage5Input?.target_feature_candidate_index?.candidates);
  const candidates = sourceCandidates.map(compactCandidate);
  const groups = groupByBucket(candidates);
  const sourceIds = new Set(candidates.map((candidate) => candidate.source_id).filter(Boolean));

  return {
    candidate_manifest_version: "stage5_candidate_manifest_v2",
    manifest_policy: "deterministic_high_recall_typed_manifest_not_final_feature_inventory",
    final_feature_rule: "Only ATOMIC_FEATURE_CANDIDATE rows may become feature_inventory[] after model decomposition/classification. PRODUCT_AREA rows must be decomposed or treated as context.",
    no_zero_final_feature_rule: "Every final feature_inventory[] row must have at least one archetype and one surface; otherwise move to unresolved_feature_candidates or commercial_scan accounting.",
    candidate_summary: {
      source_candidate_count: sourceCandidates.length,
      manifest_candidate_count: candidates.length,
      candidate_source_count: sourceIds.size,
      product_area_count: groups.product_area_candidates.length,
      atomic_feature_candidate_count: groups.atomic_feature_candidates.length,
      delivery_channel_signal_count: groups.delivery_channel_candidates.length,
      data_signal_count: groups.data_signal_candidates.length,
      architecture_signal_count: groups.architecture_signal_candidates.length,
      commercial_outcome_signal_count: groups.commercial_outcome_candidates.length,
      insufficient_feature_evidence_count: groups.insufficient_feature_evidence_candidates.length
    },
    ...groups,
    all_candidates: candidates
  };
}
