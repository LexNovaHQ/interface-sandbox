import { fetchWithJinaReader } from "./jinaClient.js";
import { normalizeSourceInput } from "./sourceMode.js";

function createRunId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `diligence-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
    error: null
  };
}

function createUrlRecord({ runId, index, result }) {
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
    error: result.error
  };
}

function createZoneMap(records) {
  return records.map((record) => ({
    source_id: record.source_id,
    source_url: record.source_url,
    source_type: record.source_type,
    zone: record.source_type === "manual_text" ? "manual_text" : "unclassified_webpage",
    status: record.status,
    raw_characters: record.raw_characters
  }));
}

function createLimitations(records, urlInputs) {
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

  return limitations;
}

export async function collectDiligenceSources(input = {}, options = {}) {
  const runId = input.run_id || options.runId || createRunId();
  const normalized = normalizeSourceInput(input);
  const urlResults = [];

  for (let index = 0; index < normalized.url_inputs.length; index += 1) {
    const sourceUrl = normalized.url_inputs[index];
    const result = await fetchWithJinaReader(sourceUrl, {
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      maxCharacters: options.maxCharacters,
      headers: options.headers
    });

    urlResults.push(createUrlRecord({ runId, index, result }));
  }

  const manualRecords = normalized.pasted_text
    ? [createManualTextRecord({ runId, pastedText: normalized.pasted_text })]
    : [];

  const records = [...urlResults, ...manualRecords];
  const pagesAttempted = normalized.url_inputs.length;
  const pagesRead = urlResults.filter((record) => record.status === "FETCHED").length;
  const limitations = createLimitations(records, normalized.url_inputs);

  return {
    run_id: runId,
    source_mode: normalized.source_mode,
    target_input: normalized.target_input,
    raw_footprint: {
      records,
      urls: normalized.url_inputs,
      pasted_text_present: Boolean(normalized.pasted_text),
      collected_at: new Date().toISOString()
    },
    scrape_meta: {
      pages_attempted: pagesAttempted,
      pages_read: pagesRead,
      urls: normalized.url_inputs,
      zone_map: createZoneMap(records),
      limitations,
      collector: "diligence_source_collector_v1",
      transport: "jina_reader"
    }
  };
}
