import { fetchWithJinaReader } from "./jinaClient.js";
import { normalizeHttpUrl, normalizeSourceInput } from "./sourceMode.js";
import { runSourceDiscoveryBridge } from "./sourceDiscoveryBridge.js";

const DEFAULT_SOURCE_FETCH_BATCH_SIZE = 5;

function createRunId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `diligence-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clampBatchSize(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) return DEFAULT_SOURCE_FETCH_BATCH_SIZE;
  return number;
}

function chunkArray(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function createManualTextRecord({ runId, pastedText }) {
  return {
    source_id: `${runId}:manual_text:0`,
    source_type: "manual_text",
    source_url: "manual_text",
    status: "TEXT_ONLY",
    fetched_at: new Date().toISOString(),
    raw_text: pastedText,
    raw_characters: pastedText.length,
    clipped: false,
    source_hash: `manual-${pastedText.length}-${pastedText.slice(0, 32).length}`,
    source_zone: "manual_text",
    artifact_type: "Pasted Public Material",
    artifact_class: "FOOTPRINT_WIDE",
    discovery_origin: "user_pasted_text",
    error: null
  };
}

function createUrlRecord({ runId, index, result, sourceInfo, batchMeta }) {
  return {
    source_id: `${runId}:url:${index}`,
    source_type: "webpage",
    source_url: result.source_url,
    reader_url: result.reader_url,
    status: result.status,
    http_status: result.http_status,
    fetched_at: result.fetched_at,
    raw_text: result.raw_text,
    raw_characters: result.raw_characters,
    clipped: result.clipped,
    source_hash: result.source_hash,
    source_zone: sourceInfo?.source_zone || "unclassified_webpage",
    artifact_type: sourceInfo?.artifact_type || "Unknown",
    artifact_class: sourceInfo?.artifact_class || "FOOTPRINT_WIDE",
    discovery_origin: sourceInfo?.discovery_origin || "user_supplied_url",
    discovery_admission_reason: sourceInfo?.admission_reason || null,
    discovery_confidence: sourceInfo?.confidence || null,
    discovery_query_used: sourceInfo?.search_query_used || null,
    discovery_path_taken: sourceInfo?.path_taken || null,
    source_batch: batchMeta || null,
    error: result.error
  };
}

function createZoneMap(records) {
  return records.map((record) => ({
    source_id: record.source_id,
    source_url: record.source_url,
    source_type: record.source_type,
    zone: record.source_zone || (record.source_type === "manual_text" ? "manual_text" : "unclassified_webpage"),
    artifact_type: record.artifact_type || "Unknown",
    artifact_class: record.artifact_class || "FOOTPRINT_WIDE",
    discovery_origin: record.discovery_origin || null,
    status: record.status,
    raw_characters: record.raw_characters,
    source_batch: record.source_batch || null
  }));
}

function createLimitations(records, urlInputs, sourceDiscovery) {
  const limitations = [];
  const failed = records.filter((record) => ["FETCH_FAILED", "TIMEOUT"].includes(record.status));
  const clipped = records.filter((record) => record.clipped);

  if (failed.length) {
    limitations.push(`${failed.length} URL(s) could not be fetched through Jina Reader.`);
  }

  if (clipped.length) {
    limitations.push(`${clipped.length} source(s) were clipped to the collector character budget.`);
  }

  if (!urlInputs.length) {
    limitations.push("No URL material was supplied; collection used pasted public text only.");
  }

  if (sourceDiscovery?.enabled && sourceDiscovery.status !== "COMPLETED") {
    limitations.push(`Source Discovery Scout did not complete: ${sourceDiscovery.error || sourceDiscovery.status}.`);
  }

  (sourceDiscovery?.discovery_limitations || []).forEach((item) => {
    if (item) limitations.push(`Source Discovery: ${item}`);
  });

  return limitations;
}

function createUserUrlSourceInfo(url, index, normalized) {
  const isPrimary = normalized.target_input.primary_url && normalizeHttpUrl(url) === normalizeHttpUrl(normalized.target_input.primary_url);
  return {
    url,
    source_zone: isPrimary ? "homepage" : "unknown",
    artifact_type: isPrimary ? "Homepage" : "Manual URL",
    artifact_class: isPrimary ? "COMPANY_SURFACE" : "FOOTPRINT_WIDE",
    discovery_origin: isPrimary ? "user_primary_url" : "user_manual_url",
    admission_reason: "USER_SUPPLIED_URL",
    confidence: "HIGH",
    original_index: index
  };
}

function buildFetchPlan({ normalized, sourceDiscovery }) {
  const plan = [];
  const seen = new Set();

  function add(sourceInfo) {
    const url = normalizeHttpUrl(sourceInfo.url);
    if (!url || seen.has(url)) return;
    seen.add(url);
    plan.push({ ...sourceInfo, url });
  }

  normalized.url_inputs.forEach((url, index) => {
    add(createUserUrlSourceInfo(url, index, normalized));
  });

  (sourceDiscovery?.admitted_sources || []).forEach((source) => add({
    ...source,
    discovery_origin: "source_discovery_scout"
  }));

  return plan;
}

function createBatchPlan(fetchPlan, batchSize) {
  const batches = chunkArray(fetchPlan, batchSize);
  return batches.map((items, batchIndex) => ({
    batch_id: `source-batch-${batchIndex + 1}-of-${batches.length}`,
    batch_index: batchIndex,
    batch_number: batchIndex + 1,
    batch_count: batches.length,
    batch_size: items.length,
    start_index: batchIndex * batchSize,
    end_index: batchIndex * batchSize + items.length - 1,
    urls: items.map((item) => item.url)
  }));
}

async function fetchSourceBatch({ runId, batchItems, batchMeta, globalStartIndex, fetchImpl, options }) {
  const settled = await Promise.allSettled(batchItems.map((sourceInfo) => fetchWithJinaReader(sourceInfo.url, {
    fetchImpl,
    timeoutMs: options.timeoutMs,
    maxCharacters: options.maxCharacters,
    headers: options.headers
  })));

  return settled.map((settledResult, localIndex) => {
    const sourceInfo = batchItems[localIndex];
    const globalIndex = globalStartIndex + localIndex;
    const result = settledResult.status === "fulfilled"
      ? settledResult.value
      : {
          source_url: sourceInfo.url,
          reader_url: null,
          status: "FETCH_FAILED",
          http_status: null,
          fetched_at: new Date().toISOString(),
          raw_text: "",
          raw_characters: 0,
          clipped: false,
          source_hash: null,
          error: settledResult.reason?.message || "Jina batch fetch failed"
        };

    return createUrlRecord({
      runId,
      index: globalIndex,
      result,
      sourceInfo,
      batchMeta: {
        batch_id: batchMeta.batch_id,
        batch_number: batchMeta.batch_number,
        batch_count: batchMeta.batch_count,
        batch_index: batchMeta.batch_index,
        local_index: localIndex
      }
    });
  });
}

async function fetchSourcesInBatches({ runId, fetchPlan, fetchImpl, options }) {
  const batchSize = clampBatchSize(options.sourceFetchBatchSize || options.batchSize);
  const batchPlan = createBatchPlan(fetchPlan, batchSize);
  const records = [];

  for (const batchMeta of batchPlan) {
    const batchItems = fetchPlan.slice(batchMeta.start_index, batchMeta.end_index + 1);
    const batchRecords = await fetchSourceBatch({
      runId,
      batchItems,
      batchMeta,
      globalStartIndex: batchMeta.start_index,
      fetchImpl,
      options
    });
    records.push(...batchRecords);
  }

  return {
    records,
    batch_plan: batchPlan,
    batch_size: batchSize,
    batch_count: batchPlan.length,
    batched: true
  };
}

export async function collectDiligenceSources(input = {}, options = {}) {
  const runId = input.run_id || options.runId || createRunId();
  const normalized = normalizeSourceInput(input);
  const fetchImpl = options.fetchImpl || fetch;
  const sourceDiscovery = await runSourceDiscoveryBridge({
    runId,
    normalized,
    input,
    fetchImpl,
    endpoint: options.sourceDiscoveryEndpoint,
    enabled: options.enableSourceDiscovery !== false,
    options: options.sourceDiscoveryOptions || {}
  });

  const fetchPlan = buildFetchPlan({
    normalized,
    sourceDiscovery
  });

  const batchedFetch = await fetchSourcesInBatches({
    runId,
    fetchPlan,
    fetchImpl,
    options
  });
  const urlResults = batchedFetch.records;

  const manualRecords = normalized.pasted_text
    ? [createManualTextRecord({ runId, pastedText: normalized.pasted_text })]
    : [];

  const records = [...urlResults, ...manualRecords];
  const pagesAttempted = fetchPlan.length;
  const pagesRead = urlResults.filter((record) => record.status === "FETCHED").length;
  const limitations = createLimitations(records, fetchPlan.map((item) => item.url), sourceDiscovery);

  return {
    run_id: runId,
    source_mode: normalized.source_mode,
    target_input: normalized.target_input,
    source_discovery: {
      enabled: sourceDiscovery.enabled,
      status: sourceDiscovery.status,
      ok: sourceDiscovery.ok,
      quality_status: sourceDiscovery.quality_status,
      scout_quality: sourceDiscovery.scout_quality,
      candidate_count: sourceDiscovery.candidate_count,
      admitted_url_count: sourceDiscovery.admitted_url_count,
      admitted_urls: sourceDiscovery.admitted_urls,
      rejected_candidates: sourceDiscovery.rejected_candidates,
      search_queries_used: sourceDiscovery.search_queries_used,
      missing_expected_paths: sourceDiscovery.missing_expected_paths,
      rejected_sources: sourceDiscovery.rejected_sources,
      error: sourceDiscovery.error || null
    },
    raw_footprint: {
      records,
      urls: fetchPlan.map((item) => item.url),
      source_candidates: sourceDiscovery.admitted_sources || [],
      pasted_text_present: Boolean(normalized.pasted_text),
      collected_at: new Date().toISOString()
    },
    scrape_meta: {
      pages_attempted: pagesAttempted,
      pages_read: pagesRead,
      urls: fetchPlan.map((item) => item.url),
      source_fetch: {
        batched: batchedFetch.batched,
        batch_size: batchedFetch.batch_size,
        batch_count: batchedFetch.batch_count,
        batch_plan: batchedFetch.batch_plan
      },
      source_discovery: {
        enabled: sourceDiscovery.enabled,
        status: sourceDiscovery.status,
        quality_status: sourceDiscovery.quality_status,
        candidate_count: sourceDiscovery.candidate_count,
        admitted_url_count: sourceDiscovery.admitted_url_count,
        search_queries_used_count: sourceDiscovery.search_queries_used?.length || 0
      },
      zone_map: createZoneMap(records),
      limitations,
      collector: "diligence_source_collector_v2",
      transport: "source_discovery_scout_plus_batched_jina_reader"
    }
  };
}
