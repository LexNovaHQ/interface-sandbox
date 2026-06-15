import { buildStage5CanonicalInput } from "./stage5/stage5.runtime.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTerm(value = "") {
  return asText(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export const STAGE5_COMPATIBILITY_TERMS = Object.freeze({
  speech_to_text: ["speech to text", "speech-to-text", "transcription", "transcribe", "audio to text"],
  text_to_speech: ["text to speech", "text-to-speech", "tts", "voice generation", "speech synthesis"],
  translation: ["translation", "translate", "language translation"],
  dubbing: ["dubbing", "dub", "voice dubbing"],
  document_digitisation: ["ocr", "document digitisation", "document digitization", "extract text", "scan"],
  voice_agent: ["voice agent", "agent", "assistant", "conversation"],
  language_model: ["language model", "llm", "chat", "completion", "generate text"],
  embeddings: ["embedding", "vector", "semantic search"],
  integration_connector: ["connector", "integration", "api", "webhook"],
  model_catalog: ["model catalog", "models", "model library"],
  api_platform: ["api platform", "developer api", "sdk", "endpoint"]
});

export function canonicalCandidateCluster(candidate = {}) {
  const explicit = asText(candidate.candidate_cluster || candidate.function_cluster || candidate.cluster);
  if (explicit) return explicit;
  const text = normalizeTerm([
    candidate.normalized_label,
    candidate.raw_label,
    candidate.feature_label,
    candidate.function_summary,
    candidate.index_reason
  ].join(" "));
  for (const [cluster, terms] of Object.entries(STAGE5_COMPATIBILITY_TERMS)) {
    if (terms.some((term) => text.includes(normalizeTerm(term)))) return cluster;
  }
  return text ? text.split(" ").slice(0, 4).join("_") : "unknown";
}

export function evaluateCandidateFeatureCompatibility(candidate = {}, feature = {}) {
  const cluster = canonicalCandidateCluster(candidate);
  const featureText = normalizeTerm([
    feature.feature_name,
    feature.function_name,
    feature.commercial_function,
    feature.feature_description,
    feature.system_action,
    feature.output_or_result,
    feature.business_label_or_product_area
  ].join(" "));
  const terms = STAGE5_COMPATIBILITY_TERMS[cluster] || [cluster.replace(/_/g, " ")];
  const matched_terms = terms.filter((term) => featureText.includes(normalizeTerm(term)));
  return {
    candidate_cluster: cluster,
    compatible: matched_terms.length > 0,
    compatibility_status: matched_terms.length > 0 ? "compatible" : "incompatible",
    matched_terms,
    basis: matched_terms.length > 0
      ? `Feature text contains candidate cluster term(s): ${matched_terms.join(", ")}`
      : `Feature text does not contain candidate cluster term(s) for ${cluster}`
  };
}

function sourceMeta(source = {}) {
  return {
    source_id: source.source_id,
    source_url: source.source_url,
    source_title: source.source_title,
    source_family: source.source_family,
    clean_text_length: String(source.clean_text_lossless || "").length,
    source_sha256: source.source_sha256
  };
}

function candidateIndexFromSources(sources = []) {
  const candidates = asArray(sources).map((source, index) => ({
    candidate_id: `NAV_SOURCE_${String(index + 1).padStart(3, "0")}`,
    normalized_label: asText(source.source_title || source.source_url || `source ${index + 1}`),
    raw_label: asText(source.source_title || source.source_url || `source ${index + 1}`),
    source_id: source.source_id,
    source_url: source.source_url,
    candidate_type: "navigation_only_source_hint",
    candidate_cluster: canonicalCandidateCluster({ normalized_label: `${source.source_title || ""} ${source.clean_text_lossless || ""}`.slice(0, 500) }),
    evidence_locator: null,
    duplicate_cluster_id: null,
    duplicate_of: null,
    index_reason: "Canonical compatibility shim: navigation-only hint; not evidence and not final judgment."
  }));
  return {
    index_version: "stage5_canonical_compat_navigation_index_v1",
    indexing_policy: "navigation_only_not_primary_evidence_not_final_judgment",
    candidate_count: candidates.length,
    candidates
  };
}

export function buildStage5TargetFeaturePackage({
  sourceBundle = {},
  evidenceJunction = {},
  companyProfile = {},
  runId = null,
  budget = {}
} = {}) {
  const stage5Input = {
    source_bundle: sourceBundle,
    evidence_junction: evidenceJunction,
    target_profile_ref: {
      target_profile_version: companyProfile?.target_profile_version || "target_profile_v2",
      brand_name: companyProfile?.identity?.brand_name || companyProfile?.brand_name || "Unknown target",
      legal_name: companyProfile?.identity?.legal_name || companyProfile?.legal_name || "",
      domain: companyProfile?.identity?.domain || companyProfile?.identity?.website || companyProfile?.domain || ""
    }
  };
  const canonicalInput = buildStage5CanonicalInput({
    companyProfile,
    stage5Input,
    adapterResult: { source_bundle: sourceBundle, evidence_junction: evidenceJunction }
  });
  const sources = asArray(canonicalInput?.primary_evidence?.sources);
  const sourceMetaRows = sources.map(sourceMeta);
  const ok = sources.length > 0;
  return {
    ok,
    stage5_package_builder_version: "stage5_target_feature_package_builder_canonical_compat_v1",
    retired_legacy_builder_replaced: true,
    canonical_stage5_runtime_required: true,
    error: ok ? null : "No full clean_text_lossless product/source records available for canonical Stage 5 runtime.",
    run_id: runId,
    budget,
    target_feature_profile_input: canonicalInput,
    primary_evidence: canonicalInput.primary_evidence,
    reference: canonicalInput.reference,
    target_profile_ref: canonicalInput.target_profile_ref,
    product_family_primary_sources: sourceMetaRows,
    product_family_discovery_sources: sourceMetaRows,
    product_family_secondary_sources: [],
    product_family_supporting_sources: [],
    product_family_duplicate_sources: asArray(canonicalInput?.reference?.source_duplicate_report),
    product_family_non_feature_context_sources: [],
    target_feature_candidate_index: candidateIndexFromSources(sources),
    stage5_candidate_clusters: [],
    stage5_feature_discovery: {
      discovery_version: "stage5_canonical_runtime_handles_feature_discovery_v1",
      discovered_features: [],
      visible_but_unmapped: [],
      limitations: ["Feature discovery now occurs inside canonical Stage 5A using verbatim source windows."]
    }
  };
}
