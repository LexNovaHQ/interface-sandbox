import crypto from "node:crypto";

export const MAGNA_CARTA_SOURCE_FAMILIES = ["company_profile", "product_profile", "legal_profile", "governance_profile"];
const ADMITTED_SOURCE_FAMILIES = new Set(MAGNA_CARTA_SOURCE_FAMILIES);
const CHUNK_SIZE = 1400;
const CHUNK_OVERLAP = 180;

function nowIso() { return new Date().toISOString(); }
function stableJson(value) { return JSON.stringify(value || {}, Object.keys(value || {}).sort()); }
function sha256(value) { return crypto.createHash("sha256").update(String(value || ""), "utf8").digest("hex"); }
function normalizeUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    if ((url.pathname || "") !== "/") url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch { return null; }
}
function hostnameOf(value) {
  try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; }
}
function normalizeTargetInput(input = {}) {
  const primaryUrl = input.primary_url || input.url || input.normalized_origin || null;
  return {
    primary_url: primaryUrl,
    company_name: input.company_name || null,
    normalized_origin: input.normalized_origin || null,
    registrable_domain: input.registrable_domain || null,
    declared_product_name: input.declared_product_name || input.product_name || null,
    submitted_at: input.submitted_at || null
  };
}
function unwrapDiscovery(input = {}) { if (input?.discovery) return input.discovery; if (input?.source_discovery) return input.source_discovery; return input || {}; }
function unwrapCapture(input = {}) { if (input?.capture) return input.capture; if (input?.source_capture) return input.source_capture; return input || {}; }
function familyFromBucket(bucketName = "") { return String(bucketName || "").replace(/_sources$/, ""); }
function hardDataProvenanceGovernanceSignal(haystack = "") {
  return /(^|[\/\s_-])(data-provenance|data provenance|privacy-policy|privacy|dpa|data-processing|data processing|data-protection|data protection|data-retention|data retention|retention|sub[-_ ]?processors?|cookie-policy|cookie policy|data-security|data security|data-residency|data residency|gdpr|dpdp|ccpa|cpra|personal-data|personal data|processor|controller)([\/\s_-]|$)/i.test(haystack)
    || /privacy policy|data processing addendum|sub[- ]?processor|data provenance|data retention|data residency|personal data|processor|controller/i.test(haystack);
}
function hardLegalSignal(haystack = "") {
  return /(^|[\/\s_-])(terms-of-service|terms|legal|acceptable-use|acceptable use|aup|eula|sla|service-level|service level)([\/\s_-]|$)/i.test(haystack)
    || /terms of service|service level agreement|end user license|acceptable use policy/i.test(haystack);
}
function hardGovernanceSignal(haystack = "") {
  return /(^|[\/\s_-])(trust-center|trust|security|compliance|status|responsible-ai|responsible ai|ai-policy|governance|safety|model-safety|data-security|certifications|enterprise-security|soc-?2|iso)([\/\s_-]|$)/i.test(haystack)
    || /trust center|security posture|responsible ai|model safety|data security|certifications|system status|incident posture/i.test(haystack);
}
function hardProductSignal(haystack = "") {
  return /(^|[\/\s_-])(models?|products?|features?|platform|solutions?|use-cases?|capabilities|apis?|api|docs?|documentation|developer|developers|reference|sdk|quickstart|guides|integrations|playground|agents?|studio|voice|speech|translation|dubbing|ocr|vision)([\/\s_-]|$)/i.test(haystack)
    || /model catalog|developer api|text to speech|speech to text|document digitisation|document digitization|product page|api product|integration page|feature/i.test(haystack);
}
function hardCompanySignal(haystack = "") {
  return /(^|[\/\s_-])(about-us|about|company|team|mission|careers|customers|customer-stories|case-studies|stories|homepage|home)([\/\s_-]|$)/i.test(haystack)
    || /company identity|mission|team|market posture|customer story|case study|series a|funding/i.test(haystack);
}
export function normalizeSourceFamily(value, record = {}) {
  const raw = String(value || "").toLowerCase().trim();
  const url = String(record.url || record.final_url || "").toLowerCase();
  const label = String(record.label || record.title || record.source_label || record.reason || record.link_text || "").toLowerCase();
  const haystack = `${raw} ${url} ${label}`;
  if (["governance_profile", "data_provenance", "data_provenance_profile", "privacy_profile", "data_profile"].includes(raw) || hardDataProvenanceGovernanceSignal(haystack)) return "governance_profile";
  if (raw === "legal_profile" || raw === "legal_governance" || hardLegalSignal(haystack)) return "legal_profile";
  if (hardGovernanceSignal(haystack)) return "governance_profile";
  if (raw === "product_profile" || raw === "docs_developer" || hardProductSignal(haystack)) return "product_profile";
  if (raw === "company_profile" || raw === "commercial" || raw === "update" || raw === "updates" || hardCompanySignal(haystack)) return "company_profile";
  return raw || "unknown";
}
function sourceRecordFromDiscovery(record = {}, bucketName = "candidate_sources") {
  const url = normalizeUrl(record?.url || record?.final_url);
  if (!url) return null;
  return {
    ...record,
    url,
    final_url: normalizeUrl(record.final_url) || null,
    source_family: normalizeSourceFamily(record.source_family || familyFromBucket(bucketName), record),
    source_bucket: bucketName,
    status: record.status || null,
    content_type: record.content_type || "",
    inferred: record.inferred === true,
    provenance: Array.isArray(record.provenance) ? record.provenance : []
  };
}
function flattenDiscoverySources(discovery = {}) {
  const bucketNames = ["company_profile_sources", "product_profile_sources", "legal_profile_sources", "governance_profile_sources", "data_provenance_sources"];
  const byUrl = new Map();
  for (const bucketName of bucketNames) for (const record of Array.isArray(discovery[bucketName]) ? discovery[bucketName] : []) {
    const source = sourceRecordFromDiscovery(record, bucketName);
    if (!source || byUrl.has(source.url)) continue;
    byUrl.set(source.url, source);
  }
  for (const record of Array.isArray(discovery.candidate_sources) ? discovery.candidate_sources : []) {
    const source = sourceRecordFromDiscovery(record, "candidate_sources");
    if (!source || byUrl.has(source.url)) continue;
    byUrl.set(source.url, source);
  }
  return [...byUrl.values()];
}
function isFirstPartySource(url, targetInput = {}) {
  const sourceHost = hostnameOf(url);
  if (!sourceHost) return false;
  const targetHost = hostnameOf(targetInput.primary_url || targetInput.normalized_origin || "");
  const registrableDomain = String(targetInput.registrable_domain || targetHost || "").toLowerCase().replace(/^www\./, "");
  if (targetHost && (sourceHost === targetHost || sourceHost.endsWith(`.${targetHost}`))) return true;
  if (registrableDomain && (sourceHost === registrableDomain || sourceHost.endsWith(`.${registrableDomain}`))) return true;
  return false;
}
function getCleanText(captureRecord = {}) { return captureRecord.clean_text_lossless || captureRecord.text?.clean_text_lossless || captureRecord.text?.clean_text || ""; }
function getCleanTextHash(captureRecord = {}, cleanText = "") { return captureRecord.text?.clean_text_sha256 || captureRecord.clean_text_sha256 || sha256(cleanText); }
function shouldAdmitSource({ captureRecord, discoveryRecord, targetInput }) {
  const finalUrl = normalizeUrl(captureRecord?.fetch?.final_url || captureRecord?.final_url || captureRecord?.url) || captureRecord?.url || null;
  const originalUrl = normalizeUrl(captureRecord?.url) || finalUrl;
  const sourceFamily = normalizeSourceFamily(captureRecord.source_family || discoveryRecord?.source_family || null, { url: finalUrl || originalUrl, title: captureRecord.structure?.title || "", reason: discoveryRecord?.reason || "", link_text: discoveryRecord?.link_text || "" });
  if (captureRecord.fetch?.ok !== true) return { admitted: false, source_family: sourceFamily, reason: "fetch_failed" };
  if (!isFirstPartySource(finalUrl || originalUrl, targetInput)) return { admitted: false, source_family: sourceFamily, reason: "not_first_party" };
  if (!ADMITTED_SOURCE_FAMILIES.has(sourceFamily)) return { admitted: false, source_family: sourceFamily, reason: "not_allowed_magna_carta_family" };
  return { admitted: true, source_family: sourceFamily, reason: "admitted_first_party_magna_carta_source" };
}
function deterministicChunkIndex({ chunks = [], text = "", evidenceSourceId, sourceUrl }) {
  const existing = Array.isArray(chunks) ? chunks : [];
  if (existing.length) return existing.map((chunk, index) => ({
    evidence_ref_id: chunk.evidence_ref_id || `${evidenceSourceId}#${chunk.chunk_id || `C${String(index + 1).padStart(3, "0")}`}`,
    chunk_id: chunk.chunk_id || `C${String(index + 1).padStart(3, "0")}`,
    source_url: chunk.source_url || sourceUrl,
    start_char: chunk.start_char ?? null,
    end_char: chunk.end_char ?? null,
    text_sha256: chunk.text_sha256 || sha256(chunk.text || "")
  }));
  const out = [];
  if (!text) return out;
  let start = 0;
  let index = 1;
  while (start < text.length) {
    const end = Math.min(text.length, start + CHUNK_SIZE);
    const chunkText = text.slice(start, end);
    const chunkId = `C${String(index).padStart(3, "0")}`;
    out.push({ evidence_ref_id: `${evidenceSourceId}#${chunkId}`, chunk_id: chunkId, source_url: sourceUrl, start_char: start, end_char: end, text_sha256: sha256(chunkText) });
    if (end >= text.length) break;
    start = Math.max(end - CHUNK_OVERLAP, start + 1);
    index += 1;
  }
  return out;
}
function buildAdmittedSourceRecord({ captureRecord = {}, discoveryRecord = null, index = 0, sourceFamily }) {
  const finalUrl = normalizeUrl(captureRecord?.fetch?.final_url || captureRecord?.final_url || captureRecord?.url) || captureRecord?.url || null;
  const originalUrl = normalizeUrl(captureRecord?.url) || finalUrl;
  const evidenceSourceId = `SRC_${String(index + 1).padStart(3, "0")}`;
  const cleanText = getCleanText(captureRecord);
  const cleanTextSha = getCleanTextHash(captureRecord, cleanText);
  const sourceUrl = finalUrl || originalUrl;
  const chunkIndex = deterministicChunkIndex({ chunks: captureRecord.chunks, text: cleanText, evidenceSourceId, sourceUrl });
  return {
    evidence_source_id: evidenceSourceId,
    url: originalUrl,
    final_url: finalUrl,
    source_family: sourceFamily,
    source_bucket: discoveryRecord?.source_bucket || null,
    admission: { status: "admitted", reason: "admitted_first_party_magna_carta_source", duplicate: false, full_text_sent_downstream: true, summaries_used_as_evidence: false },
    discovery: discoveryRecord || null,
    provenance: Array.isArray(discoveryRecord?.provenance) ? discoveryRecord.provenance : [],
    fetch: captureRecord.fetch || { ok: false },
    raw: { raw_html_length: captureRecord.raw?.raw_html_length || 0, raw_html_sha256: captureRecord.raw?.raw_html_sha256 || sha256("") },
    text: { extraction_mode: captureRecord.text?.extraction_mode || "lossless_visible_text", clean_text_length: captureRecord.text?.clean_text_length || cleanText.length || 0, clean_text_sha256: cleanTextSha, word_count: captureRecord.text?.word_count || String(cleanText || "").split(/\s+/).filter(Boolean).length, truncated_in_storage: captureRecord.text?.truncated_in_storage === true, truncated_in_response: captureRecord.text?.truncated_in_response === true, clean_text_lossless: cleanText },
    structure: captureRecord.structure || { title: "", meta_description: "", headings: [], section_index: [], links: [] },
    chunk_index: chunkIndex,
    evidence_citation_manifest: chunkIndex.map((chunk) => ({ evidence_ref_id: chunk.evidence_ref_id, evidence_source_id: evidenceSourceId, chunk_id: chunk.chunk_id, source_url: chunk.source_url, start_char: chunk.start_char, end_char: chunk.end_char, text_sha256: chunk.text_sha256 })),
    quality: captureRecord.quality || { empty_page: !cleanText, likely_js_rendered: false, word_count: String(cleanText || "").split(/\s+/).filter(Boolean).length, coverage_status: cleanText ? "full_visible_text_captured" : "unknown" }
  };
}
function groupEvidenceByFamily(sourceEvidence = []) {
  const grouped = Object.fromEntries(MAGNA_CARTA_SOURCE_FAMILIES.map((family) => [family, []]));
  for (const record of sourceEvidence) {
    const family = record.source_family || "unknown";
    if (!grouped[family]) grouped[family] = [];
    grouped[family].push({ evidence_source_id: record.evidence_source_id, url: record.url, final_url: record.final_url, fetch_ok: record.fetch?.ok === true, word_count: record.text?.word_count || 0, title: record.structure?.title || "", coverage_status: record.quality?.coverage_status || "unknown" });
  }
  return grouped;
}
function buildCoverageSummary(discovery = {}, capture = {}, sourceEvidence = [], filteredSources = [], duplicateSources = []) {
  return { discovery_counts: discovery.counts || {}, capture_counts: capture.counts || {}, coverage: discovery.coverage || {}, coverage_gaps: Array.isArray(discovery.coverage_gaps) ? discovery.coverage_gaps : [], source_counts: { admitted: sourceEvidence.length, filtered: filteredSources.length, duplicates_removed: duplicateSources.length, fetch_ok: sourceEvidence.filter((record) => record.fetch?.ok === true).length, total_words: sourceEvidence.reduce((sum, record) => sum + (record.text?.word_count || 0), 0) }, by_family: groupEvidenceByFamily(sourceEvidence) };
}
function buildRawFootprintHash(sourceEvidence = [], filteredSources = [], duplicateSources = []) {
  return sha256(stableJson({ admitted: sourceEvidence.map((record) => ({ url: record.url, family: record.source_family, hash: record.text?.clean_text_sha256 })), filtered: filteredSources.map((record) => ({ url: record.url, family: record.source_family, reason: record.reason })), duplicates: duplicateSources.map((record) => ({ url: record.url, hash: record.text_sha256 })) }));
}\nexport function buildEvidenceRefinerInput({ targetInput = {}, discoveryResponse = {}, captureResponse = {}, runId = null, sourceMode = "runtime_discovery_capture", generatedAt = nowIso() } = {}) {
  const discovery = unwrapDiscovery(discoveryResponse);
  const capture = unwrapCapture(captureResponse);
  const target_input = normalizeTargetInput(targetInput);
  const discoveredSources = flattenDiscoverySources(discovery);
  const discoveryByUrl = new Map(discoveredSources.flatMap((record) => [[record.url, record], [normalizeUrl(record.final_url), record]].filter(([key]) => key)));
  const captureRecords = Array.isArray(capture.source_records) ? capture.source_records : [];
  const admitted = [];
  const filtered_sources = [];
  const duplicate_sources = [];
  const seenUrls = new Set();
  const seenTextHashes = new Set();
  for (const captureRecord of captureRecords) {
    const url = normalizeUrl(captureRecord?.url);
    const finalUrl = normalizeUrl(captureRecord?.fetch?.final_url || captureRecord?.final_url);
    const discoveryRecord = discoveryByUrl.get(url) || discoveryByUrl.get(finalUrl) || null;
    const admission = shouldAdmitSource({ captureRecord, discoveryRecord, targetInput: target_input });
    const cleanText = getCleanText(captureRecord);
    const textHash = getCleanTextHash(captureRecord, cleanText);
    const urlKey = finalUrl || url || captureRecord?.url || "";
    if (!admission.admitted) { filtered_sources.push({ url: urlKey, source_family: admission.source_family, reason: admission.reason, fetch: captureRecord.fetch || null }); continue; }
    if (seenUrls.has(urlKey) || (textHash && seenTextHashes.has(textHash))) { duplicate_sources.push({ url: urlKey, source_family: admission.source_family, reason: "duplicate_url_or_text_hash", text_sha256: textHash }); continue; }
    seenUrls.add(urlKey);
    if (textHash) seenTextHashes.add(textHash);
    admitted.push(buildAdmittedSourceRecord({ captureRecord, discoveryRecord, index: admitted.length, sourceFamily: admission.source_family }));
  }
  const rawFootprintSha = buildRawFootprintHash(admitted, filtered_sources, duplicate_sources);
  return {
    run_id: runId || `evidence_refiner_${Date.now()}`,
    generated_at: generatedAt,
    source_mode: sourceMode,
    source_bundle_version: "source_bundle_v2_magna_carta",
    target_input,
    source_discovery: { source_discovery_version: discovery.source_discovery_version || discovery.discovery_policy?.source_discovery_version || "source_discovery_magna_carta_v1", flattened_sources: discoveredSources, allowed_families: MAGNA_CARTA_SOURCE_FAMILIES, counts: discovery.counts || {}, coverage_gaps: Array.isArray(discovery.coverage_gaps) ? discovery.coverage_gaps : [], provenance_audit: discovery.diagnostics?.provenance_audit || discovery.provenance_audit || [] },
    raw_footprint: { source_records: admitted, filtered_sources, duplicate_sources, downstream_policy: { full_admitted_documents_sent_once: true, full_text_lossless_required: true, summaries_used_as_evidence: false, no_summary_no_compression_no_truncation: true, evidence_refs_are_citations_not_model_quotes: true, deterministic_quote_resolution_required: true, processing_responsibility: "downstream_stages" } },
    scrape_meta: { coverage_summary: buildCoverageSummary(discovery, capture, admitted, filtered_sources, duplicate_sources), hashes: { raw_footprint_sha256: rawFootprintSha } }
  };
}
