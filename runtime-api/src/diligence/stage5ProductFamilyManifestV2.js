import { buildDeterministicFieldPrefill } from "./stage5DeterministicFieldPrefill.js";

const MAX_DEFAULT_PRODUCT_FAMILIES = 8;
const PRODUCT_SIGNAL_BUCKETS = new Set(["PRODUCT_AREA", "ATOMIC_FEATURE_CANDIDATE", "DELIVERY_CHANNEL_SIGNAL", "ARCHITECTURE_SIGNAL", "COMMERCIAL_OUTCOME_SIGNAL", "DATA_SIGNAL"]);
const EXCLUDED_STAGE5_SOURCE_FAMILIES = new Set(["legal_profile", "governance_profile"]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asString(value, fallback = "") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).trim() || fallback;
}

function normalizeKey(value = "") {
  return asString(value)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[?#].*$/, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "misc";
}

function cleanLabel(value = "") {
  return asString(value)
    .replace(/^https?:\/\//i, "")
    .replace(/[?#].*$/, "")
    .replace(/[\/_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function sourceId(source = {}) {
  return asString(source.evidence_source_id || source.source_id);
}

function sourceUrl(source = {}) {
  return asString(source.final_url || source.source_url || source.url);
}

function titleOf(source = {}) {
  return asString(source.title || source.structure?.title || source.source_title);
}

function sourceText(source = {}) {
  return asString(source.clean_text_lossless || source.text?.clean_text_lossless);
}

function evidenceRefsForSource(source = {}) {
  const manifest = asArray(source.source_citation_manifest || source.citation_manifest || source.chunk_index);
  const refs = manifest.map((entry, index) => entry?.evidence_ref_id || (sourceId(source) ? `${sourceId(source)}#${entry?.chunk_id || `C${String(index + 1).padStart(3, "0")}`}` : null)).filter(Boolean);
  if (refs.length) return refs.slice(0, 6);
  return sourceId(source) ? [`${sourceId(source)}#C001`] : [];
}

function compactSource(source = {}) {
  const text = sourceText(source);
  return {
    source_id: sourceId(source),
    source_url: sourceUrl(source),
    source_family: source.source_family || "unknown",
    source_role: source.source_role || source.stage5_source_role || null,
    title: titleOf(source),
    word_count: Number(source.word_count || source.estimated_source_tokens || 0),
    clean_text_length: text.length,
    clean_text_sha256: source.clean_text_sha256 || source.text_sha256 || null,
    evidence_refs: evidenceRefsForSource(source)
  };
}

function sourceRecordForEvidenceBuffer(record = {}) {
  return {
    ...compactSource(record),
    clean_text_lossless: sourceText(record),
    source_citation_manifest: asArray(record.source_citation_manifest || record.citation_manifest || record.chunk_index),
    evidence_policy: {
      admitted_source: true,
      full_text_lossless: true,
      summarized: false,
      compressed: false,
      snippet_selected: false,
      stage5_product_family_scoped: true
    }
  };
}

function candidateSourceId(candidate = {}) {
  return asString(candidate.source_id || candidate.evidence_source_id);
}

function candidateLabel(candidate = {}) {
  return cleanLabel(candidate.product_area_hint || candidate.candidate_name || candidate.raw_label || candidate.candidate_label || candidate.normalized_label || candidate.source_url || candidate.source_id || "Product family");
}

function knownFamilyFromText(value = "") {
  const text = asString(value).toLowerCase();
  const known = [
    ["samvaad", "Samvaad"],
    ["arya", "Arya"],
    ["akshar", "Akshar"],
    ["studio", "Studio"],
    ["edge", "Edge"],
    ["document", "Document Digitisation"],
    ["speech to text", "Speech-to-Text"],
    ["speech-to-text", "Speech-to-Text"],
    ["text to speech", "Text-to-Speech"],
    ["text-to-speech", "Text-to-Speech"],
    ["translation", "Translation"],
    ["dubbing", "Dubbing"],
    ["models", "Models / API Platform"],
    ["api", "API Platform"],
    ["integration", "Integrations"]
  ];
  for (const [needle, label] of known) if (text.includes(needle)) return label;
  return "";
}

function familyLabelForCandidate(candidate = {}, source = {}) {
  const candidateText = [candidate.product_area_hint, candidate.candidate_name, candidate.normalized_label, candidate.source_url, sourceUrl(source), titleOf(source)].filter(Boolean).join(" ");
  const known = knownFamilyFromText(candidateText);
  if (known) return known;
  if (candidate.candidate_bucket === "PRODUCT_AREA") return candidateLabel(candidate);
  return cleanLabel(candidate.product_area_hint || titleOf(source) || sourceUrl(source) || candidate.candidate_name || candidate.candidate_key || "Platform / Misc");
}

function familyTypeFor(candidates = []) {
  if (candidates.some((candidate) => candidate.candidate_bucket === "PRODUCT_AREA")) return "PRODUCT_AREA";
  if (candidates.some((candidate) => candidate.candidate_bucket === "ATOMIC_FEATURE_CANDIDATE")) return "FEATURE_CLUSTER";
  if (candidates.some((candidate) => candidate.candidate_bucket === "ARCHITECTURE_SIGNAL" || candidate.candidate_bucket === "DELIVERY_CHANNEL_SIGNAL")) return "PLATFORM_OR_DELIVERY_CONTEXT";
  return "MISC_PRODUCT_CONTEXT";
}

function sourceMaps(stage5Input = {}) {
  const evidenceBuffer = asArray(stage5Input?.source_bundle?.evidence_buffer)
    .filter((source) => !EXCLUDED_STAGE5_SOURCE_FAMILIES.has(source.source_family));
  const artifactInventory = asArray(stage5Input?.source_bundle?.artifact_inventory)
    .filter((source) => !EXCLUDED_STAGE5_SOURCE_FAMILIES.has(source.source_family));
  const byId = new Map();
  for (const source of [...artifactInventory, ...evidenceBuffer]) {
    const id = sourceId(source);
    if (!id) continue;
    const existing = byId.get(id) || {};
    byId.set(id, { ...existing, ...source });
  }
  return { byId, evidenceBuffer };
}

function rankFamily(family = {}) {
  const atomic = family.candidates.filter((candidate) => candidate.candidate_bucket === "ATOMIC_FEATURE_CANDIDATE").length;
  const product = family.candidates.filter((candidate) => candidate.candidate_bucket === "PRODUCT_AREA").length;
  const signal = family.candidates.length;
  const chars = family.lossless_char_count || 0;
  return atomic * 100 + product * 30 + signal * 5 + Math.min(chars, 100000) / 10000;
}

function buildFamilyRecord(index, key, candidates, sourceById) {
  const sourceIds = [...new Set(candidates.map(candidateSourceId).filter(Boolean))];
  const sources = sourceIds.map((id) => sourceById.get(id)).filter(Boolean).map(sourceRecordForEvidenceBuffer);
  const name = familyLabelForCandidate(candidates[0] || {}, sources[0] || {});
  const losslessCharCount = sources.reduce((sum, source) => sum + asString(source.clean_text_lossless).length, 0);
  return {
    product_family_id: `PF${String(index + 1).padStart(3, "0")}`,
    product_family_key: key,
    product_family_name: name,
    family_type: familyTypeFor(candidates),
    investigation_unit_policy: "Product family is the model investigation unit; final feature_inventory rows must be atomic features inside the family.",
    source_ids: sourceIds,
    source_urls: [...new Set(sources.map((source) => source.source_url).filter(Boolean))],
    source_count: sources.length,
    lossless_char_count: losslessCharCount,
    lossless_source_policy: {
      source_text_is_lossless: true,
      summarized: false,
      compressed: false,
      snippet_selected: false,
      legal_governance_sources_excluded: true
    },
    source_manifest: sources.map(compactSource),
    candidates,
    candidate_summary: {
      total: candidates.length,
      product_area: candidates.filter((candidate) => candidate.candidate_bucket === "PRODUCT_AREA").length,
      atomic_feature_candidate: candidates.filter((candidate) => candidate.candidate_bucket === "ATOMIC_FEATURE_CANDIDATE").length,
      delivery_channel_signal: candidates.filter((candidate) => candidate.candidate_bucket === "DELIVERY_CHANNEL_SIGNAL").length,
      architecture_signal: candidates.filter((candidate) => candidate.candidate_bucket === "ARCHITECTURE_SIGNAL").length,
      data_signal: candidates.filter((candidate) => candidate.candidate_bucket === "DATA_SIGNAL").length,
      commercial_outcome_signal: candidates.filter((candidate) => candidate.candidate_bucket === "COMMERCIAL_OUTCOME_SIGNAL").length
    },
    deterministic_prefill: buildDeterministicFieldPrefill({ familyName: name, sources, candidates })
  };
}

function mergeOverflowFamilies(kept = [], overflow = [], sourceById) {
  if (!overflow.length) return kept;
  const candidates = overflow.flatMap((family) => family.candidates || []);
  const merged = buildFamilyRecord(kept.length, "platform_and_misc_overflow", candidates, sourceById);
  merged.product_family_name = "Platform and Misc Product Signals";
  merged.family_type = "PLATFORM_OR_MISC_OVERFLOW";
  merged.overflow_policy = "Low-priority product-family candidates merged to keep Stage 5 family model-call cap.";
  return [...kept, merged];
}

export function buildStage5ProductFamilyManifestV2(stage5Input = {}, options = {}) {
  const maxFamilies = Number(options.max_product_family_packets || options.maxProductFamilyPackets || MAX_DEFAULT_PRODUCT_FAMILIES) || MAX_DEFAULT_PRODUCT_FAMILIES;
  const candidateManifest = stage5Input?.target_feature_candidate_manifest_v2 || {};
  const allCandidates = asArray(candidateManifest.all_candidates)
    .filter((candidate) => PRODUCT_SIGNAL_BUCKETS.has(candidate.candidate_bucket));
  const { byId } = sourceMaps(stage5Input);
  const grouped = new Map();

  for (const candidate of allCandidates) {
    const source = byId.get(candidateSourceId(candidate)) || {};
    const label = familyLabelForCandidate(candidate, source);
    const key = normalizeKey(label || candidate.candidate_key || candidate.source_url || candidate.source_id);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(candidate);
  }

  let families = [...grouped.entries()]
    .map(([key, candidates], index) => buildFamilyRecord(index, key, candidates, byId))
    .filter((family) => family.source_count > 0)
    .sort((a, b) => rankFamily(b) - rankFamily(a));

  const uncappedFamilyCount = families.length;
  if (families.length > maxFamilies) {
    const keepCount = Math.max(1, maxFamilies - 1);
    families = mergeOverflowFamilies(families.slice(0, keepCount), families.slice(keepCount), byId);
  }

  families = families.map((family, index) => ({ ...family, product_family_id: `PF${String(index + 1).padStart(3, "0")}` }));

  return {
    product_family_manifest_version: "stage5_product_family_manifest_v2",
    manifest_policy: "deterministic_lossless_product_family_investigation_manifest_not_final_feature_inventory",
    investigation_policy: "Model must investigate one product family at a time using that family's lossless product-family sources; no random snippets.",
    deterministic_field_policy: "Runtime supplies deterministic prefill candidates for source/citation/channel/data/architecture/archetype/surface fields; model confirms decomposition and controlled classification.",
    max_product_family_packets: maxFamilies,
    uncapped_product_family_count: uncappedFamilyCount,
    product_family_count: families.length,
    product_families: families,
    manifest_warnings: uncappedFamilyCount > maxFamilies ? [`Product-family count capped from ${uncappedFamilyCount} to ${families.length}; overflow merged.`] : []
  };
}
