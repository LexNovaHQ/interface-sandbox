import { normalizeHttpUrl } from "./sourceMode.js";

const JINA_READER_BASE = "https://r.jina.ai/";
const DEFAULT_TIMEOUT_MS = 45000;
const DEFAULT_MAX_CHARACTERS = 120000;

function createAbortSignal(timeoutMs) {
  if (typeof AbortController === "undefined") return { signal: undefined, cancel: () => {} };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

function createSourceHash(text) {
  let hash = 0;
  const value = String(text || "");

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return `simple-${Math.abs(hash).toString(16)}`;
}

export function createJinaReaderUrl(sourceUrl) {
  const normalizedUrl = normalizeHttpUrl(sourceUrl);
  return `${JINA_READER_BASE}${normalizedUrl}`;
}

export async function fetchWithJinaReader(sourceUrl, options = {}) {
  const normalizedUrl = normalizeHttpUrl(sourceUrl);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxCharacters = options.maxCharacters ?? DEFAULT_MAX_CHARACTERS;
  const abort = createAbortSignal(timeoutMs);
  const startedAt = new Date().toISOString();

  try {
    const response = await (options.fetchImpl || fetch)(createJinaReaderUrl(normalizedUrl), {
      method: "GET",
      headers: {
        accept: "text/plain",
        ...(options.headers || {})
      },
      signal: abort.signal
    });

    const text = await response.text();
    const clipped = text.length > maxCharacters;
    const raw_text = clipped ? text.slice(0, maxCharacters) : text;

    return {
      ok: response.ok,
      source_url: normalizedUrl,
      reader_url: createJinaReaderUrl(normalizedUrl),
      status: response.ok ? "FETCHED" : "FETCH_FAILED",
      http_status: response.status,
      fetched_at: new Date().toISOString(),
      started_at: startedAt,
      raw_text,
      raw_characters: raw_text.length,
      clipped,
      source_hash: createSourceHash(raw_text),
      error: response.ok ? null : `Jina Reader request failed with status ${response.status}`
    };
  } catch (error) {
    const timedOut = error?.name === "AbortError";

    return {
      ok: false,
      source_url: normalizedUrl,
      reader_url: createJinaReaderUrl(normalizedUrl),
      status: timedOut ? "TIMEOUT" : "FETCH_FAILED",
      http_status: null,
      fetched_at: new Date().toISOString(),
      started_at: startedAt,
      raw_text: "",
      raw_characters: 0,
      clipped: false,
      source_hash: "",
      error: timedOut ? `Jina Reader timed out after ${timeoutMs}ms` : "Jina Reader request failed"
    };
  } finally {
    abort.cancel();
  }
}
