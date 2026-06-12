import { buildTargetFeatureProfileInput } from "./adapters/targetFeatureProfileInputAdapter.js";

const PRODUCT_STAGE_KEY = "target_feature_profile";
const PRODUCT_FAMILY = "product_profile";
const COMPANY_FAMILY = "company_profile";

export const STAGE5_COMPATIBILITY_TERMS = Object.freeze({
  text_to_speech: ["text to speech", "text-to-speech", "tts", "speech synthesis", "voice generation", "generate speech", "spoken audio"],
  speech_to_text: ["speech to text", "speech-to-text", "stt", "asr", "transcription", "transcribe", "speech recognition"],
  translation: ["translation", "translate", "machine translation"],
  dubbing: ["dubbing", "dub", "video translation", "audio dubbing"],
  document_digitisation: ["document digitisation", "document digitization", "ocr", "document extraction", "document parsing"],
  voice_agent: ["voice agent", "conversational agent", "agent", "assistant", "call automation"],
  language_model: ["llm", "language model", "generative text", "chat", "text generation"],
  embeddings: ["embedding", "embeddings", "vector", "semantic search"],
  integration_connector: ["integration", "connector", "workflow", "platform integration"],
  model_catalog: ["model catalog", "models", "foundation model", "model library"],
  api_platform: ["api", "endpoint", "sdk", "developer api", "developer"]
});

const CLUSTER_PATTERNS = [
  ["text_to_speech", /text[- ]?to[- ]?speech|\btts\b|speech synthesis|voice generation|generate speech|spoken audio/],
  ["speech_to_text", /speech[- ]?to[- ]?text|\bstt\b|\basr\b|transcription|transcribe|speech recognition/],
  ["translation", /translation|translate|machine translation/],
  ["dubbing", /dubbing|dubbed|\bdub\b|video translation|audio dubbing/],
  ["document_digitisation", /document digitisation|document digitization|\bocr\b|document extraction|document parsing|document ai|document understanding/],
  ["voice_agent", /voice agent|conversational agent|call automation|assistant|agentic voice/],
  ["language_model", /\bllm\b|language model|generative text|text generation|chat completion/],
  ["embeddings", /embeddings?|vector|semantic search/],
  ["integration_connector", /integrations?|connectors?|workflow|platform integration/],
  ["model_catalog", /model catalog|models|foundation model|model library/],
  ["api_platform", /\bapi\b|endpoint|sdk|developer api|developer|reference/]
];

const PRODUCT_SIGNAL = /\b(product|feature|model|api|developer|docs?|sdk|platform|solution|integration|endpoint|speech|voice|transcription|translation|dubbing|ocr|document|agent|embedding|fine[- ]?tun|workflow|connector)\b/i;
const CONCRETE_FUNCTION_SIGNAL = /\b(api|endpoint|sdk|docs?|reference|transcription|transcribe|speech[- ]?to[- ]?text|text[- ]?to[- ]?speech|translation|translate|dubbing|ocr|document extraction|embedding|voice agent|language model|connector|integration|workflow|generate|convert|parse|extract|synthesis)\b/i;

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function textOf(record = {}) {
  return [
    record.url,
    record.final_url,
    record.structure?.title,
    record.title,
    record.source_family,
    String(record.text?.clean_text_lossless || "").slice(0, 16000)
  ].filter(Boolean).join("\n");
}

function sourceId(record = {}) {
  return String(record.evidence_source_id || record.source_id || "").trim();
}

function sourceUrl(record = {}) {
  return record.final_url || record.url || record.source_url || "";
}

function titleOf(record = {}) {
  return record.structure?.title || record.title || "";
}

function lowerText(record = {}) {
  return textOf(record).toLowerCase();
}

function urlPath(record = {}) {
  try { return new URL(sourceUrl(record)).pathname.toLowerCase(); } catch { return String(sourceUrl(record)).toLowerCase(); }
}

function pageKind(record = {}) {
  const url = urlPath(record);
  const title = String(titleOf(record)).toLowerCase();
  const combined = `${url} ${title}`;
  if (/\/(api-pricing|pricing|plans)(\/|$)|\b(api pricing|pricing|plans?)\b/.test(combined)) return "pricing";
  if (/\/(contact|contact-us)(\/|$)|\bcontact\b/.test(combined)) return "contact";
  if (/\/(careers?|jobs?)(\/|$)|\b(careers?|jobs?)\b/.test(combined)) return "careers";
  if (/\/(blog|stories|case-studies|news|press|resources?)(\/|$)|\b(blog|stories|case studies|news|press)\b/.test(combined)) return "blog";
  if (/\/(about|company)(\/|$)|\b(about|company)\b/.test(combined)) return "company";
  if (/\/(products?|features?|solutions?)(\/|$)|\b(product|feature|solution)\b/.test(combined)) return "product";
  if (/\/(apis?|docs?|developers?|reference|sdk)(\/|$)|\b(api|docs?|developer|reference|sdk)\b/.test(combined)) return "api_docs_reference";
  if (/\/(models?|model-catalog)(\/|$)|\b(model|model catalog|llm)\b/.test(combined)) return "model_capability";
  if (/\/(integrations?|connectors?)(\/|$)|\b(integration|connector)\b/.test(combined)) return "integration";
  return "other";
}

function canonicalClustersForText(value = "") {
  const text = String(value || "").toLowerCase();
  const clusters = [];
  for (const [cluster, pattern] of CLUSTER_PATTERNS) if (pattern.test(text)) clusters.push(cluster);
  return [...new Set(clusters)];
}

function routeBySourceId(evidenceJunction = {}) {
  const routes = new Map();
  for (const route of Array.isArray(evidenceJunction.routed_evidence) ? evidenceJunction.routed_evidence : []) {
    if (route?.evidence_source_id) routes.set(route.evidence_source_id, route);
  }
  const packet = evidenceJunction.downstream_packets?.[PRODUCT_STAGE_KEY] || {};
  for (const route of Array.isArray(packet.routed_evidence) ? packet.routed_evidence : []) {
    if (route?.evidence_source_id) routes.set(route.evidence_source_id, route);
  }
  return routes;
}

function canonicalFunctionClusters(record = {}, route = {}) {
  const routeTopics = Array.isArray(route.product_topics) ? route.product_topics : [];
  const fromRoute = routeTopics.flatMap((topic) => canonicalClustersForText(topic));
  const fromRecord = canonicalClustersForText(textOf(record));
  return [...new Set([...fromRoute, ...fromRecord])];
}

export function canonicalCandidateCluster(candidate = {}) {
  const direct = String(candidate.candidate_cluster || candidate.candidate_key || "").trim().toLowerCase();
  if (STAGE5_COMPATIBILITY_TERMS[direct]) return direct;
  const text = [candidate.raw_label, candidate.candidate_label, candidate.normalized_label, candidate.raw_signal, candidate.index_reason, candidate.reason_for_indexing, candidate.candidate_type, candidate.source_url].filter(Boolean).join(" ");
  const clusters = canonicalClustersForText(text);
  if (clusters.length) return clusters[0];
  return direct || "unknown";
}

function productSignalScore(record = {}, route = {}) {
  const text = textOf(record);
  const clusters = canonicalFunctionClusters(record, route);
  let score = clusters.length * 8;
  if (record.source_family === PRODUCT_FAMILY) score += 18;
  if (PRODUCT_SIGNAL.test(text)) score += 4;
  if (CONCRETE_FUNCTION_SIGNAL.test(text)) score += 8;
  return score;
}

function sourceRole(record = {}, route = {}) {
  const kind = pageKind(record);
  const score = productSignalScore(record, route);
  const concrete = CONCRETE_FUNCTION_SIGNAL.test(textOf(record));
  if (!score || !canonicalFunctionClusters(record, route).length) return "excluded_from_stage5";
  if (["careers", "blog", "company", "contact"].includes(kind) && !concrete) return "non_feature_context";
  if (["pricing", "contact", "careers", "blog", "company"].includes(kind)) return concrete ? "supporting_context_source" : "non_feature_context";
  if (kind === "product" && concrete) return "primary_function_source";
  if (["api_docs_reference", "model_capability", "integration"].includes(kind) && concrete) return "secondary_technical_source";
  if (record.source_family === COMPANY_FAMILY && concrete && score >= 18) return "supporting_commercial_source";
  if (concrete) return "supporting_commercial_source";
  return "non_feature_context";
}

function shouldRouteToStage5(record = {}, route = {}) {
  return !["excluded_from_stage5", "non_feature_context"].includes(sourceRole(record, route));
}

function sourceSpecificity(record = {}, route = {}) {
  const kind = pageKind(record);
  const priority = {
    product: 120,
    api_docs_reference: 82,
    model_capability: 76,
    integration: 72,
    pricing: 28,
    contact: 8,
    company: 14,
    blog: 12,
    careers: 2,
    other: 30
  }[kind] || 0;
  let score = priority + productSignalScore(record, route);
  score += Math.min(Number(record.text?.word_count || record.word_count || 0), 5000) / 500;
  const role = sourceRole(record, route);
  if (role === "primary_function_source") score += 20;
  if (role === "secondary_technical_source") score += 4;
  if (["supporting_commercial_source", "supporting_context_source"].includes(role)) score -= 10;
  if (["pricing", "contact", "careers", "blog", "company"].includes(kind)) score -= 18;
  return score;
}

function collectPacketRecords(sourceBundle = {}, evidenceJunction = {}) {
  const packet = evidenceJunction.downstream_packets?.[PRODUCT_STAGE_KEY] || {};
  if (Array.isArray(packet.source_records) && packet.source_records.length) return packet.source_records;
  if (Array.isArray(sourceBundle.raw_footprint?.source_records)) return sourceBundle.raw_footprint.source_records;
  return [];
}

function uniqueBySourceId(records = []) {
  const out = [];
  const seen = new Set();
  for (const record of records) {
    const id = sourceId(record);
    const key = id || sourceUrl(record);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(record);
  }
  return out;
}

function buildClusterCandidates(packetRecords, routes) {
  const out = new Map();
  for (const source of packetRecords) {
    const record = clone(source);
    const id = sourceId(record);
    const route = routes.get(id) || {};
    const role = sourceRole(record, route);
    const clusters = canonicalFunctionClusters(record, route);
    for (const cluster of clusters) {
      if (!out.has(cluster)) out.set(cluster, []);
      out.get(cluster).push({ record, route, role, cluster });
    }
  }
  return out;
}

function selectProductFamilySources(sourceBundle = {}, evidenceJunction = {}) {
  const routes = routeBySourceId(evidenceJunction);
  const packetRecords = collectPacketRecords(sourceBundle, evidenceJunction);
  const clusterCandidates = buildClusterCandidates(packetRecords, routes);
  const selected = [];
  const secondary = [];
  const supporting = [];
  const duplicates = [];
  const nonFeature = [];
  const excluded = [];
  const selectedIds = new Set();
  const sourceClusters = new Map();
  const clusterMap = new Map();
  let clusterIndex = 1;

  for (const record of packetRecords) {
    const route = routes.get(sourceId(record)) || {};
    const role = sourceRole(record, route);
    if (role === "non_feature_context") nonFeature.push({ ...clone(record), stage5_source_role: role });
    if (role === "excluded_from_stage5") excluded.push({ ...clone(record), stage5_source_role: role });
  }

  for (const [cluster, entries] of clusterCandidates.entries()) {
    const routed = entries.filter(({ record, route }) => shouldRouteToStage5(record, route));
    if (!routed.length) continue;
    const ranked = routed.sort((a, b) => sourceSpecificity(b.record, b.route) - sourceSpecificity(a.record, a.route));
    const productPrimary = ranked.find((entry) => entry.role === "primary_function_source" && pageKind(entry.record) === "product");
    const firstPrimary = productPrimary || ranked.find((entry) => entry.role === "primary_function_source");
    const firstSecondary = ranked.find((entry) => entry.role === "secondary_technical_source");
    const primary = firstPrimary || firstSecondary || null;
    const primaryId = primary ? sourceId(primary.record) : null;
    const clusterId = `STAGE5_FUNC_${String(clusterIndex++).padStart(3, "0")}_${cluster.toUpperCase()}`;
    const supportingIds = [];
    const duplicateIds = [];
    if (primary && primaryId && !selectedIds.has(primaryId)) {
      const primaryRecord = { ...primary.record, stage5_source_role: "primary_function_source", candidate_cluster: cluster, dedupe_group_id: clusterId, dedupe_role: "primary" };
      selectedIds.add(primaryId);
      selected.push(primaryRecord);
    }
    if (primaryId) {
      if (!sourceClusters.has(primaryId)) sourceClusters.set(primaryId, []);
      sourceClusters.get(primaryId).push(cluster);
    }
    for (const entry of ranked) {
      const id = sourceId(entry.record);
      if (!id || id === primaryId) continue;
      const role = entry.role === "secondary_technical_source"
        ? "secondary_technical_source"
        : (["supporting_commercial_source", "supporting_context_source"].includes(entry.role) ? entry.role : "duplicate_source");
      const row = {
        ...entry.record,
        stage5_source_role: role,
        candidate_cluster: cluster,
        dedupe_group_id: clusterId,
        dedupe_role: role === "duplicate_source" ? "duplicate" : "supporting",
        duplicate_of: primaryId,
        duplicate_policy: "supporting_metadata_not_primary_stage5_walk"
      };
      if (role === "secondary_technical_source") { secondary.push(row); supportingIds.push(id); }
      else if (["supporting_commercial_source", "supporting_context_source"].includes(role)) { supporting.push(row); supportingIds.push(id); }
      else { duplicates.push(row); duplicateIds.push(id); }
      if (!sourceClusters.has(id)) sourceClusters.set(id, []);
      sourceClusters.get(id).push(cluster);
    }
    clusterMap.set(cluster, {
      cluster_id: clusterId,
      canonical_function_cluster: cluster,
      primary_source_id: primaryId,
      supporting_source_ids: [...new Set(supportingIds)],
      duplicate_source_ids: [...new Set(duplicateIds)],
      candidate_ids: []
    });
  }

  return {
    selected,
    secondary: uniqueBySourceId(secondary),
    supporting: uniqueBySourceId(supporting),
    duplicates: uniqueBySourceId(duplicates),
    nonFeature: uniqueBySourceId(nonFeature),
    excluded: uniqueBySourceId(excluded),
    discovery: uniqueBySourceId([...selected, ...secondary, ...supporting, ...duplicates]),
    sourceClusters,
    clusterMap,
    eligible_count: uniqueBySourceId([...selected, ...secondary, ...supporting, ...duplicates]).length,
    packet_source_count: packetRecords.length
  };
}

function buildStage5EvidenceJunction(evidenceJunction = {}, selection) {
  const copy = clone(evidenceJunction);
  const packet = copy.downstream_packets?.[PRODUCT_STAGE_KEY] || {};
  const selected = selection.selected || [];
  const discoveryRecords = selection.discovery?.length ? selection.discovery : selected;
  const supportingRecords = [...(selection.secondary || []), ...(selection.supporting || []), ...(selection.duplicates || []), ...(selection.nonFeature || [])];
  const supportingRoutes = supportingRecords.map((record) => ({
    evidence_source_id: sourceId(record),
    source_family: record.source_family || "unknown",
    title: titleOf(record),
    url: record.url || null,
    final_url: record.final_url || null,
    downstream_tags: [PRODUCT_STAGE_KEY],
    product_topics: [record.candidate_cluster].filter(Boolean),
    dedupe_group_id: record.dedupe_group_id || null,
    dedupe_role: record.dedupe_role || record.stage5_source_role || null,
    duplicate_of: record.duplicate_of || null,
    stage5_source_role: record.stage5_source_role || null,
    routing_basis: "stage5_product_family_primary_packet_builder"
  }));
  copy.downstream_packets = {
    ...(copy.downstream_packets || {}),
    [PRODUCT_STAGE_KEY]: {
      ...packet,
      packet_id: packet.packet_id || "PKT_TARGET_FEATURE_PROFILE",
      downstream_stage: PRODUCT_STAGE_KEY,
      source_count: discoveryRecords.length,
      source_ids: discoveryRecords.map(sourceId).filter(Boolean),
      source_records: discoveryRecords,
      stage5_feature_discovery_source_ids: discoveryRecords.map(sourceId).filter(Boolean),
      product_family_primary_sources: selected.map(sourceId).filter(Boolean),
      product_family_secondary_sources: selection.secondary.map(sourceId).filter(Boolean),
      product_family_supporting_sources: selection.supporting.map(sourceId).filter(Boolean),
      product_family_duplicate_sources: selection.duplicates.map(sourceId).filter(Boolean),
      product_family_non_feature_sources: selection.nonFeature.map(sourceId).filter(Boolean),
      secondary_technical_records: selection.secondary,
      duplicate_supporting_records: [...selection.secondary, ...selection.supporting, ...selection.duplicates],
      non_feature_context_records: selection.nonFeature,
      stage5_candidate_clusters: [...selection.clusterMap.values()],
      routed_evidence: [
        ...(Array.isArray(packet.routed_evidence) ? packet.routed_evidence : []).filter((route) => selected.some((record) => sourceId(record) === route.evidence_source_id)),
        ...supportingRoutes
      ],
      packet_policy: {
        ...(packet.packet_policy || {}),
        stage5_product_family_primary_packet: true,
        stage5_feature_discovery_full_product_packet: true,
        duplicate_product_sources_preserved_as_supporting_metadata: true,
        source_roles_required: true,
        function_cluster_primary_selection: true,
        no_source_caps: true,
        no_candidate_caps: true
      }
    }
  };
  return copy;
}

function evidenceRefs(candidate = {}) {
  return Array.isArray(candidate.evidence_refs) ? candidate.evidence_refs : [];
}

function enrichCandidateIndex(stage5Input, selection) {
  const index = stage5Input.target_feature_candidate_index || {};
  const candidates = Array.isArray(index.candidates) ? index.candidates : [];
  const sourceCluster = (sourceIdValue) => selection.sourceClusters.get(sourceIdValue) || [];
  const roleBySourceId = new Map([
    ...selection.selected.map((record) => [sourceId(record), "primary_function_source"]),
    ...selection.secondary.map((record) => [sourceId(record), "secondary_technical_source"]),
    ...selection.supporting.map((record) => [sourceId(record), record.stage5_source_role || "supporting_commercial_source"]),
    ...selection.duplicates.map((record) => [sourceId(record), "duplicate_source"]),
    ...selection.nonFeature.map((record) => [sourceId(record), "non_feature_context"])
  ].filter(([id]) => id));
  const enriched = candidates.map((candidate) => {
    const cluster = canonicalCandidateCluster(candidate);
    const fallbackCluster = STAGE5_COMPATIBILITY_TERMS[cluster] ? cluster : (sourceCluster(candidate.source_id)[0] || cluster);
    const candidateCluster = STAGE5_COMPATIBILITY_TERMS[fallbackCluster] ? fallbackCluster : "api_platform";
    const sourceRoleValue = roleBySourceId.get(String(candidate.source_id || "").trim()) || "supporting_commercial_source";
    return {
      ...candidate,
      candidate_cluster: candidateCluster,
      source_role: candidate.source_role || sourceRoleValue,
      compatibility_status: candidate.compatibility_status || "unknown"
    };
  });
  for (const row of enriched) {
    const clusterRow = selection.clusterMap.get(row.candidate_cluster);
    if (clusterRow && row.candidate_id && !clusterRow.candidate_ids.includes(row.candidate_id)) clusterRow.candidate_ids.push(row.candidate_id);
  }
  stage5Input.target_feature_candidate_index = { ...index, candidate_count: enriched.length, candidates: enriched, candidate_clusters: [...selection.clusterMap.values()] };
  return stage5Input.target_feature_candidate_index;
}

function auditLedgerSeed({ stage5Input = {}, selection, sourceReview = {}, generatedAt }) {
  const candidates = Array.isArray(stage5Input.target_feature_candidate_index?.candidates) ? stage5Input.target_feature_candidate_index.candidates : [];
  return {
    ledger_version: "stage5_target_feature_audit_ledger_v1",
    ledger_scope: "runtime_internal_not_canonical_schema",
    generated_at: generatedAt,
    source_review: sourceReview,
    candidate_clusters: [...selection.clusterMap.values()],
    expected_primary_sources: selection.selected.map((record) => ({
      source_id: sourceId(record),
      source_url: sourceUrl(record),
      source_family: record.source_family || "unknown",
      source_role: "primary_function_source",
      candidate_cluster: record.candidate_cluster || null,
      duplicate_cluster_id: record.dedupe_group_id || null
    })),
    supporting_sources: selection.supporting.map((record) => ({
      source_id: sourceId(record),
      source_url: sourceUrl(record),
      source_family: record.source_family || "unknown",
      source_role: "supporting_commercial_source",
      candidate_cluster: record.candidate_cluster || null,
      duplicate_cluster_id: record.dedupe_group_id || null,
      disposition: "supporting_only"
    })),
    secondary_technical_sources: selection.secondary.map((record) => ({
      source_id: sourceId(record),
      source_url: sourceUrl(record),
      source_family: record.source_family || "unknown",
      source_role: "secondary_technical_source",
      candidate_cluster: record.candidate_cluster || null,
      duplicate_cluster_id: record.dedupe_group_id || null,
      disposition: "supporting_only"
    })),
    duplicate_supporting_sources: selection.duplicates.map((record) => ({
      source_id: sourceId(record),
      source_url: sourceUrl(record),
      source_family: record.source_family || "unknown",
      source_role: "duplicate_source",
      candidate_cluster: record.candidate_cluster || null,
      duplicate_cluster_id: record.dedupe_group_id || null,
      duplicate_of: record.duplicate_of || null,
      disposition: "duplicate_of"
    })),
    non_feature_context_sources: selection.nonFeature.map((record) => ({
      source_id: sourceId(record),
      source_url: sourceUrl(record),
      source_family: record.source_family || "unknown",
      source_role: "non_feature_context",
      disposition: "non_feature_context"
    })),
    candidate_walk_ledger: candidates.map((candidate) => ({
      candidate_id: candidate.candidate_id,
      candidate_cluster: candidate.candidate_cluster || canonicalCandidateCluster(candidate),
      source_id: candidate.source_id,
      source_url: candidate.source_url,
      raw_label: candidate.raw_label || candidate.candidate_label || null,
      normalized_label: candidate.normalized_label || null,
      disposition: "missed",
      mapped_feature_id: null,
      compatibility_status: "unknown",
      reason: "Seed row emitted before model feature mapping; guardrail must resolve candidate-specific disposition.",
      evidence_refs: evidenceRefs(candidate)
    }))
  };
}

function sourceMeta(record = {}) {
  return {
    source_id: sourceId(record),
    source_url: sourceUrl(record),
    source_family: record.source_family || "unknown",
    source_role: record.stage5_source_role || null,
    candidate_cluster: record.candidate_cluster || null,
    duplicate_cluster_id: record.dedupe_group_id || null,
    duplicate_of: record.duplicate_of || null,
    page_kind: pageKind(record)
  };
}

export function stage5FeatureText(feature = {}) {
  return [
    feature.feature_id,
    feature.feature_name,
    feature.commercial_function,
    feature.business_label_or_product_area,
    feature.feature_description,
    feature.system_action,
    feature.output_or_result,
    ...(Array.isArray(feature.archetype_provenance) ? feature.archetype_provenance.flatMap((row) => [row?.matched_feature_behavior, row?.registry_key_detection_logic]) : []),
    ...(Array.isArray(feature.surface_provenance) ? feature.surface_provenance.flatMap((row) => [row?.matched_data_or_context, row?.registry_key_surface_meaning]) : [])
  ].filter(Boolean).join(" ").toLowerCase();
}

export function evaluateCandidateFeatureCompatibility(candidate = {}, feature = {}) {
  const cluster = canonicalCandidateCluster(candidate);
  const terms = STAGE5_COMPATIBILITY_TERMS[cluster] || [];
  if (!terms.length || cluster === "unknown") return { compatible: true, compatibility_status: "unknown", candidate_cluster: cluster, matched_terms: [] };
  const text = stage5FeatureText(feature);
  const matchedTerms = terms.filter((term) => text.includes(term.toLowerCase()));
  return { compatible: matchedTerms.length > 0, compatibility_status: matchedTerms.length ? "compatible" : "incompatible", candidate_cluster: cluster, matched_terms: matchedTerms };
}

export function buildStage5TargetFeaturePackage({ sourceBundle = {}, evidenceJunction = {}, companyProfile = null, runId = null, generatedAt = new Date().toISOString(), budget = {} } = {}) {
  const selection = selectProductFamilySources(sourceBundle, evidenceJunction);
  const stage5EvidenceJunction = buildStage5EvidenceJunction(evidenceJunction, selection);
  const adapterResult = buildTargetFeatureProfileInput({ sourceBundle, evidenceJunction: stage5EvidenceJunction, companyProfile, runId, generatedAt, budget });
  if (!adapterResult.ok) return adapterResult;
  const stage5Input = adapterResult.target_feature_profile_input;
  enrichCandidateIndex(stage5Input, selection);
  const sourceReview = {
    ...(stage5Input.source_bundle?.source_review || {}),
    stage5_package_builder_version: "stage5_product_family_package_builder_v2",
    stage_source_policy: "stage5_product_family_primary_packet_no_stage4_source_cache",
    packet_source_count_before_stage5_filter: selection.packet_source_count,
    product_family_eligible_source_count: selection.eligible_count,
    product_family_primary_source_count: selection.selected.length,
    product_family_secondary_source_count: selection.secondary.length,
    product_family_supporting_source_count: selection.supporting.length,
    product_family_duplicate_source_count: selection.duplicates.length,
    product_family_discovery_source_count: selection.discovery.length,
    product_family_non_feature_context_count: selection.nonFeature.length,
    source_role_classification: ["primary_function_source", "secondary_technical_source", "supporting_commercial_source", "supporting_context_source", "duplicate_source", "non_feature_context", "excluded_from_stage5"],
    duplicate_sources_preserved_as_metadata: true,
    broad_feature_discovery_evidence_preserved: true,
    function_cluster_primary_selection: true,
    no_source_caps: true,
    no_candidate_caps: true
  };
  stage5Input.source_bundle.source_review = sourceReview;
  stage5Input.product_family_primary_sources = selection.selected.map(sourceMeta);
  stage5Input.product_family_secondary_sources = selection.secondary.map(sourceMeta);
  stage5Input.product_family_supporting_sources = selection.supporting.map(sourceMeta);
  stage5Input.product_family_duplicate_sources = selection.duplicates.map(sourceMeta);
  stage5Input.product_family_discovery_sources = selection.discovery.map(sourceMeta);
  stage5Input.product_family_non_feature_context_sources = selection.nonFeature.map(sourceMeta);
  stage5Input.stage5_candidate_clusters = [...selection.clusterMap.values()];
  stage5Input.stage5_audit_ledger = auditLedgerSeed({ stage5Input, selection, sourceReview, generatedAt });
  return {
    ok: true,
    status: 200,
    target_feature_profile_input: stage5Input,
    target_feature_candidate_index: stage5Input.target_feature_candidate_index,
    stage5_audit_ledger: stage5Input.stage5_audit_ledger,
    target_feature_audit_ledger: stage5Input.stage5_audit_ledger,
    source_review: sourceReview,
    product_family_primary_sources: stage5Input.product_family_primary_sources,
    product_family_secondary_sources: stage5Input.product_family_secondary_sources,
    product_family_supporting_sources: stage5Input.product_family_supporting_sources,
    product_family_duplicate_sources: stage5Input.product_family_duplicate_sources,
    product_family_discovery_sources: stage5Input.product_family_discovery_sources,
    product_family_non_feature_context_sources: stage5Input.product_family_non_feature_context_sources,
    stage5_candidate_clusters: stage5Input.stage5_candidate_clusters,
    evidence_junction: stage5EvidenceJunction
  };
}
