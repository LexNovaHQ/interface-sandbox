import { buildTargetFeatureProfileInput } from "./adapters/targetFeatureProfileInputAdapter.js";

const PRODUCT_STAGE_KEY = "target_feature_profile";
const PRODUCT_FAMILY = "product_profile";
const COMPANY_FAMILY = "company_profile";
const PRODUCT_SIGNAL = /\b(product|feature|model|api|developer|docs?|sdk|platform|solution|integration|endpoint|speech|voice|transcription|translation|dubbing|ocr|document|agent|embedding|fine[- ]?tun)/i;

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
    String(record.text?.clean_text_lossless || "").slice(0, 12000)
  ].filter(Boolean).join("\n");
}

function sourceId(record = {}) {
  return String(record.evidence_source_id || record.source_id || "").trim();
}

function sourceUrl(record = {}) {
  return record.final_url || record.url || record.source_url || "";
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

function productTopics(record = {}, route = {}) {
  const topics = Array.isArray(route.product_topics) && route.product_topics.length
    ? route.product_topics
    : (Array.isArray(record.product_topics) ? record.product_topics : []);
  if (topics.length) return [...new Set(topics)];
  const text = textOf(record).toLowerCase();
  const out = [];
  const add = (topic, regex) => { if (regex.test(text)) out.push(topic); };
  add("speech_to_text", /speech[- ]?to[- ]?text|speech recognition|transcription|transcribe|asr/);
  add("text_to_speech", /text[- ]?to[- ]?speech|voice generation|speech synthesis|tts/);
  add("translation", /translation|translate|machine translation/);
  add("dubbing", /dubbing|dubbed|video translation/);
  add("document_digitisation", /document digitisation|document digitization|ocr|document ai|document parsing/);
  add("api_platform", /\bapi\b|developer|sdk|endpoint|integration/);
  add("model_catalog", /model catalog|language model|llm|foundation model|embedding/);
  add("agentic_surface", /voice agent|conversational agent|agentic|assistant/);
  return [...new Set(out)];
}

function productSignalScore(record = {}, route = {}) {
  const text = textOf(record);
  const topics = productTopics(record, route);
  let score = topics.length * 5;
  if (record.source_family === PRODUCT_FAMILY) score += 20;
  if (PRODUCT_SIGNAL.test(text)) score += 5;
  if (/\/(product|products|feature|features|api|docs|developers?|sdk|models?|solutions?|integrations?)(\/|$)/i.test(sourceUrl(record))) score += 8;
  return score;
}

function shouldRouteToStage5(record = {}, route = {}) {
  if (record.source_family === PRODUCT_FAMILY) return true;
  if (record.source_family === COMPANY_FAMILY) return productSignalScore(record, route) >= 10;
  return false;
}

function sourceSpecificity(record = {}, route = {}) {
  const url = String(sourceUrl(record)).toLowerCase();
  let score = productSignalScore(record, route);
  if (/\/api|\/docs|\/developers?|\/sdk|\/reference/.test(url)) score += 10;
  if (/\/products?|\/features?|\/models?|\/solutions?/.test(url)) score += 8;
  score += Math.min(Number(record.text?.word_count || record.word_count || 0), 5000) / 500;
  return score;
}

function collectPacketRecords(sourceBundle = {}, evidenceJunction = {}) {
  const packet = evidenceJunction.downstream_packets?.[PRODUCT_STAGE_KEY] || {};
  if (Array.isArray(packet.source_records) && packet.source_records.length) return packet.source_records;
  if (Array.isArray(sourceBundle.raw_footprint?.source_records)) return sourceBundle.raw_footprint.source_records;
  return [];
}

function groupByProductTopic(records, routes) {
  const groups = new Map();
  for (const record of records) {
    const id = sourceId(record);
    const route = routes.get(id) || {};
    const topics = productTopics(record, route);
    const key = topics.length ? topics.sort().join("|") : `url:${sourceUrl(record) || id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ record, route });
  }
  return groups;
}

function selectProductFamilySources(sourceBundle = {}, evidenceJunction = {}) {
  const routes = routeBySourceId(evidenceJunction);
  const packetRecords = collectPacketRecords(sourceBundle, evidenceJunction);
  const eligible = packetRecords
    .map((record) => ({ record: clone(record), route: routes.get(sourceId(record)) || {} }))
    .filter(({ record, route }) => shouldRouteToStage5(record, route));
  const selected = [];
  const duplicates = [];
  const seen = new Set();
  let clusterIndex = 1;

  for (const [topicKey, entries] of groupByProductTopic(eligible.map((entry) => entry.record), routes)) {
    const ranked = entries.sort((a, b) => {
      const roleA = a.route?.dedupe_role === "primary" ? 1 : 0;
      const roleB = b.route?.dedupe_role === "primary" ? 1 : 0;
      if (roleA !== roleB) return roleB - roleA;
      return sourceSpecificity(b.record, b.route) - sourceSpecificity(a.record, a.route);
    });
    const primary = ranked[0];
    if (!primary) continue;
    const primaryId = sourceId(primary.record);
    const clusterId = primary.route?.dedupe_group_id || `STAGE5_PRODUCT_TOPIC_${String(clusterIndex++).padStart(3, "0")}`;
    const primaryRecord = { ...primary.record, dedupe_group_id: clusterId, dedupe_role: "primary", product_topic_key: topicKey };
    if (!seen.has(primaryId)) {
      seen.add(primaryId);
      selected.push(primaryRecord);
    }
    for (const entry of ranked.slice(1)) {
      const id = sourceId(entry.record);
      duplicates.push({
        ...entry.record,
        dedupe_group_id: clusterId,
        dedupe_role: "supporting",
        duplicate_of: primaryId,
        product_topic_key: topicKey,
        duplicate_policy: "supporting_metadata_not_primary_stage5_walk"
      });
      if (id) seen.add(id);
    }
  }

  return { selected, duplicates, eligible_count: eligible.length, packet_source_count: packetRecords.length };
}

function buildStage5EvidenceJunction(evidenceJunction = {}, selected = [], duplicates = []) {
  const copy = clone(evidenceJunction);
  const packet = copy.downstream_packets?.[PRODUCT_STAGE_KEY] || {};
  const duplicateRoutes = duplicates.map((record) => ({
    evidence_source_id: sourceId(record),
    source_family: record.source_family || "unknown",
    title: record.structure?.title || record.title || "",
    url: record.url || null,
    final_url: record.final_url || null,
    downstream_tags: [PRODUCT_STAGE_KEY],
    product_topics: [record.product_topic_key].filter(Boolean),
    dedupe_group_id: record.dedupe_group_id || null,
    dedupe_role: "supporting",
    duplicate_of: record.duplicate_of || null,
    routing_basis: "stage5_product_family_primary_packet_builder"
  }));
  copy.downstream_packets = {
    ...(copy.downstream_packets || {}),
    [PRODUCT_STAGE_KEY]: {
      ...packet,
      packet_id: packet.packet_id || "PKT_TARGET_FEATURE_PROFILE",
      downstream_stage: PRODUCT_STAGE_KEY,
      source_count: selected.length,
      source_ids: selected.map(sourceId).filter(Boolean),
      source_records: selected,
      product_family_primary_sources: selected.map(sourceId).filter(Boolean),
      product_family_duplicate_sources: duplicates.map(sourceId).filter(Boolean),
      duplicate_supporting_records: duplicates,
      routed_evidence: [
        ...(Array.isArray(packet.routed_evidence) ? packet.routed_evidence : []).filter((route) => selected.some((record) => sourceId(record) === route.evidence_source_id)),
        ...duplicateRoutes
      ],
      packet_policy: {
        ...(packet.packet_policy || {}),
        stage5_product_family_primary_packet: true,
        duplicate_product_sources_preserved_as_supporting_metadata: true,
        no_source_caps: true,
        no_candidate_caps: true
      }
    }
  };
  return copy;
}

function auditLedgerSeed({ stage5Input = {}, selected = [], duplicates = [], sourceReview = {}, generatedAt }) {
  const candidates = Array.isArray(stage5Input.target_feature_candidate_index?.candidates) ? stage5Input.target_feature_candidate_index.candidates : [];
  return {
    ledger_version: "stage5_target_feature_audit_ledger_v1",
    ledger_scope: "runtime_internal_not_canonical_schema",
    generated_at: generatedAt,
    source_review: sourceReview,
    expected_primary_sources: selected.map((record) => ({
      source_id: sourceId(record),
      source_url: sourceUrl(record),
      source_family: record.source_family || "unknown",
      duplicate_cluster_id: record.dedupe_group_id || null
    })),
    duplicate_supporting_sources: duplicates.map((record) => ({
      source_id: sourceId(record),
      source_url: sourceUrl(record),
      source_family: record.source_family || "unknown",
      duplicate_cluster_id: record.dedupe_group_id || null,
      duplicate_of: record.duplicate_of || null,
      disposition: "duplicate_of"
    })),
    candidate_walk_ledger: candidates.map((candidate) => ({
      candidate_id: candidate.candidate_id,
      source_id: candidate.source_id,
      source_url: candidate.source_url,
      raw_label: candidate.raw_label || candidate.candidate_label || null,
      normalized_label: candidate.normalized_label || null,
      disposition: "pending_model_accounting",
      mapped_feature_id: null,
      reason: "Seed row emitted before model feature mapping; guardrail resolves final disposition from canonical output."
    }))
  };
}

export function buildStage5TargetFeaturePackage({ sourceBundle = {}, evidenceJunction = {}, companyProfile = null, runId = null, generatedAt = new Date().toISOString(), budget = {} } = {}) {
  const selection = selectProductFamilySources(sourceBundle, evidenceJunction);
  const stage5EvidenceJunction = buildStage5EvidenceJunction(evidenceJunction, selection.selected, selection.duplicates);
  const adapterResult = buildTargetFeatureProfileInput({ sourceBundle, evidenceJunction: stage5EvidenceJunction, companyProfile, runId, generatedAt, budget });
  if (!adapterResult.ok) return adapterResult;
  const stage5Input = adapterResult.target_feature_profile_input;
  const sourceReview = {
    ...(stage5Input.source_bundle?.source_review || {}),
    stage5_package_builder_version: "stage5_product_family_package_builder_v1",
    stage_source_policy: "stage5_product_family_primary_packet_no_stage4_source_cache",
    packet_source_count_before_stage5_filter: selection.packet_source_count,
    product_family_eligible_source_count: selection.eligible_count,
    product_family_primary_source_count: selection.selected.length,
    product_family_duplicate_source_count: selection.duplicates.length,
    duplicate_sources_preserved_as_metadata: true,
    no_source_caps: true,
    no_candidate_caps: true
  };
  stage5Input.source_bundle.source_review = sourceReview;
  stage5Input.product_family_primary_sources = selection.selected.map((record) => ({ source_id: sourceId(record), source_url: sourceUrl(record), source_family: record.source_family || "unknown", duplicate_cluster_id: record.dedupe_group_id || null }));
  stage5Input.product_family_duplicate_sources = selection.duplicates.map((record) => ({ source_id: sourceId(record), source_url: sourceUrl(record), source_family: record.source_family || "unknown", duplicate_cluster_id: record.dedupe_group_id || null, duplicate_of: record.duplicate_of || null }));
  stage5Input.stage5_audit_ledger = auditLedgerSeed({ stage5Input, selected: selection.selected, duplicates: selection.duplicates, sourceReview, generatedAt });
  return {
    ok: true,
    status: 200,
    target_feature_profile_input: stage5Input,
    target_feature_candidate_index: stage5Input.target_feature_candidate_index,
    stage5_audit_ledger: stage5Input.stage5_audit_ledger,
    target_feature_audit_ledger: stage5Input.stage5_audit_ledger,
    source_review: sourceReview,
    product_family_primary_sources: stage5Input.product_family_primary_sources,
    product_family_duplicate_sources: stage5Input.product_family_duplicate_sources,
    evidence_junction: stage5EvidenceJunction
  };
}
