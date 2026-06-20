import crypto from "node:crypto";

const SOURCE_FAMILIES = ["company_profile", "product_profile", "legal_profile", "governance_profile"];
const STAGE_KEYS = ["target_feature_profile", "legal_stack_review", "governance_review", "registry_matching", "final_report_compiler"];

function sha256(value) { return crypto.createHash("sha256").update(String(value || ""), "utf8").digest("hex"); }
function nowIso() { return new Date().toISOString(); }
function cleanString(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function normalizeUrl(value) { try { const url = new URL(value); url.hash = ""; if ((url.pathname || "") !== "/") url.pathname = url.pathname.replace(/\/+$/, "") || "/"; return url.toString(); } catch { return null; } }
function clone(value) { return JSON.parse(JSON.stringify(value || {})); }
function textOf(record) { return record?.text?.clean_text_lossless || ""; }
function titleOf(record) { return record?.structure?.title || record?.title || ""; }
function familyOf(record) { return SOURCE_FAMILIES.includes(record?.source_family) ? record.source_family : "unknown"; }
function idOf(record, index) { return record?.evidence_source_id || `SRC_${String(index + 1).padStart(3, "0")}`; }
function defaultTags(record) {
  switch (familyOf(record)) {
    case "company_profile": return ["target_feature_profile", "final_report_compiler"];
    case "product_profile": return ["target_feature_profile", "registry_matching", "final_report_compiler"];
    case "legal_profile": return ["legal_stack_review", "registry_matching", "final_report_compiler"];
    case "governance_profile": return ["legal_stack_review", "governance_review", "registry_matching", "final_report_compiler"];
    default: return ["final_report_compiler"];
  }
}
function productTopics(record) {
  const h = cleanString(`${record?.url || ""} ${record?.final_url || ""} ${titleOf(record)} ${textOf(record).slice(0, 4000)}`);
  const topics = [];
  const add = (topic, regex) => { if (regex.test(h)) topics.push(topic); };
  add("speech_to_text", /speech to text|speech recognition|transcription|transcribe/);
  add("text_to_speech", /text to speech|voice generation|speech synthesis/);
  add("translation", /translation|translate|translat/);
  add("dubbing", /dubbing|dubbed|video translation/);
  add("conversational_agents", /conversational agent|voice agent|samvaad/);
  add("document_digitisation", /document digitisation|document digitization|akshar|ocr|document ai/);
  add("enterprise_agents", /arya|enterprise ai agent|enterprise agents/);
  add("model_catalog", /models|model catalog|language model|llm/);
  add("integrations", /integrations?|connectors?/);
  add("api_platform", /api|developer|sdk|endpoint/);
  return [...new Set(topics)];
}
function specificity(record) {
  const url = String(record?.final_url || record?.url || "").toLowerCase();
  const title = String(record?.title || "").toLowerCase();
  let score = 0;
  if (record?.source_family === "product_profile") score += 20;
  if (/\/apis?\//.test(url) || /\bapi\b/.test(title)) score += 30;
  if (/\/products?\//.test(url)) score += 25;
  if (/\/models?/.test(url)) score += 18;
  if (/\/integrations?/.test(url)) score += 15;
  if (url.endsWith("/") || /homepage|home/.test(title)) score -= 10;
  score += Math.min(record?.word_count || 0, 2500) / 250;
  return score;
}
function citationManifestFor(record = {}) {
  const chunks = Array.isArray(record.chunk_index) ? record.chunk_index : [];
  return chunks.map((chunk, index) => ({
    evidence_ref_id: chunk.evidence_ref_id || `${record.evidence_source_id}#${chunk.chunk_id || `C${String(index + 1).padStart(3, "0")}`}`,
    evidence_source_id: record.evidence_source_id,
    chunk_id: chunk.chunk_id || `C${String(index + 1).padStart(3, "0")}`,
    source_url: chunk.source_url || record.final_url || record.url || null,
    start_char: chunk.start_char ?? null,
    end_char: chunk.end_char ?? null,
    text_sha256: chunk.text_sha256 || null
  }));
}
function registryRecord(record, index) {
  const cleanText = textOf(record);
  const sourceFamily = familyOf(record);
  return {
    evidence_source_id: idOf(record, index),
    source_family: sourceFamily,
    url: normalizeUrl(record?.url) || record?.url || null,
    final_url: normalizeUrl(record?.final_url) || record?.final_url || null,
    title: titleOf(record),
    word_count: record?.text?.word_count || 0,
    clean_text_sha256: record?.text?.clean_text_sha256 || sha256(cleanText),
    has_clean_text_lossless: cleanText.length > 0,
    coverage_status: record?.quality?.coverage_status || "unknown",
    downstream_tags: defaultTags(record),
    product_topics: ["product_profile", "company_profile"].includes(sourceFamily) ? productTopics(record) : [],
    citation_manifest: citationManifestFor(record)
  };
}
function dedupeGroups(registry) {
  const byTopic = new Map();
  for (const source of registry) for (const topic of source.product_topics || []) {
    if (!byTopic.has(topic)) byTopic.set(topic, []);
    byTopic.get(topic).push(source);
  }
  const groups = [];
  let index = 1;
  for (const [topic, sources] of byTopic.entries()) {
    if (sources.length < 2) continue;
    const sorted = [...sources].sort((a, b) => specificity(b) - specificity(a));
    groups.push({
      dedupe_group_id: `DG_PRODUCT_${String(index++).padStart(3, "0")}`,
      dedupe_type: "repeated_product_capability",
      canonical_subject: topic,
      primary_source_id: sorted[0].evidence_source_id,
      supporting_source_ids: sorted.slice(1).map((source) => source.evidence_source_id),
      downstream_tags: ["target_feature_profile", "registry_matching", "final_report_compiler"],
      policy: { source_archive_preserved: true, repeated_evidence_mapped_not_removed: true, no_source_text_rewritten: true, no_summary_used_as_evidence: true }
    });
  }
  return groups;
}
function routes(registry, groups) {
  const groupBySource = new Map();
  for (const group of groups) { groupBySource.set(group.primary_source_id, group); for (const sourceId of group.supporting_source_ids || []) groupBySource.set(sourceId, group); }
  return registry.map((source, index) => {
    const group = groupBySource.get(source.evidence_source_id) || null;
    return {
      evidence_route_id: `ROUTE_${String(index + 1).padStart(3, "0")}`,
      evidence_source_id: source.evidence_source_id,
      source_family: source.source_family,
      title: source.title,
      url: source.url,
      final_url: source.final_url,
      downstream_tags: source.downstream_tags,
      product_topics: source.product_topics,
      citation_manifest: source.citation_manifest,
      dedupe_group_id: group?.dedupe_group_id || null,
      dedupe_role: group ? (group.primary_source_id === source.evidence_source_id ? "primary" : "supporting") : "unique",
      routing_basis: "deterministic_family_and_topic_signals"
    };
  });
}
function packets(sourceRecords, routed, groups) {
  const out = {};
  for (const stageKey of STAGE_KEYS) {
    const wanted = new Set(routed.filter((route) => route.downstream_tags.includes(stageKey)).map((route) => route.evidence_source_id));
    const packetSources = sourceRecords.filter((record) => wanted.has(record.evidence_source_id)).map(clone);
    const packetRoutes = routed.filter((route) => route.downstream_tags.includes(stageKey));
    out[stageKey] = {
      packet_id: `PKT_${stageKey.toUpperCase()}`,
      downstream_stage: stageKey,
      source_count: packetSources.length,
      source_ids: packetSources.map((record) => record.evidence_source_id),
      source_records: packetSources,
      source_citation_manifest: packetSources.flatMap((record) => citationManifestFor(record)),
      routed_evidence: packetRoutes,
      dedupe_groups: groups.filter((group) => group.downstream_tags.includes(stageKey)),
      packet_policy: { full_text_lossless_preserved: true, source_records_not_summarized: true, source_records_not_compressed: true, source_records_not_truncated_by_stage_3: true, repeated_evidence_mapped_not_removed: true, evidence_refs_are_citations_not_model_quotes: true, deterministic_quote_resolution_required: true }
    };
  }
  return out;
}
export function buildEvidenceJunction({ sourceBundle = {}, runId = null, generatedAt = nowIso() } = {}) {
  const sourceRecords = Array.isArray(sourceBundle?.raw_footprint?.source_records) ? sourceBundle.raw_footprint.source_records.map(clone) : [];
  const registry = sourceRecords.map(registryRecord);
  const groups = dedupeGroups(registry);
  const routed = routes(registry, groups);
  return {
    run_id: runId || `evidence_junction_${Date.now()}`,
    generated_at: generatedAt,
    stage_id: "evidence_junction",
    evidence_junction_version: "evidence_junction_v1",
    source_bundle_version: sourceBundle?.source_bundle_version || null,
    source_bundle_sha256: sourceBundle?.scrape_meta?.hashes?.raw_footprint_sha256 || null,
    target_input: sourceBundle?.target_input || {},
    source_registry: registry,
    source_citation_manifest: registry.flatMap((record) => record.citation_manifest || []),
    routed_evidence: routed,
    dedupe_groups: groups,
    downstream_packets: packets(sourceRecords, routed, groups),
    processing_manifest: { deterministic_only: true, gemini_called: false, source_archive_preserved: true, source_text_mutated: false, source_text_summarized: false, source_text_compressed: false, source_text_truncated: false, repeated_product_evidence_deduped_by_route_not_source_removal: true, evidence_refs_are_citations_not_model_quotes: true, downstream_stage_keys: STAGE_KEYS }
  };
}
