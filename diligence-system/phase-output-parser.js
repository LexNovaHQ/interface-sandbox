const RAW_DIAGNOSTIC_CHARS = 1200;

export function normalizePhaseModelText(rawText) {
  return String(rawText || "").trim();
}

export function parseJsonFromModelText(rawText) {
  const normalized = normalizePhaseModelText(rawText);
  const base = {
    ok: false,
    parsed: null,
    parse_status: "MODEL_OUTPUT_PARSE_FAILED",
    errors: [],
    raw_output_head: normalized.slice(0, RAW_DIAGNOSTIC_CHARS),
    raw_output_tail: normalized.slice(-RAW_DIAGNOSTIC_CHARS)
  };

  if (!normalized) return makePhaseParseFailure(rawText, ["MODEL_OUTPUT_EMPTY"]);

  const direct = tryParseJsonObject(normalized);
  if (direct.ok) return { ...base, ok: true, parsed: direct.value, parse_status: "JSON_OBJECT_OK" };

  const fence = extractJsonFence(normalized);
  if (fence) {
    const fenced = tryParseJsonObject(fence);
    if (fenced.ok) return { ...base, ok: true, parsed: fenced.value, parse_status: "JSON_FENCE_OK" };
  }

  const balanced = extractFirstBalancedJsonObject(normalized);
  if (balanced) {
    const scanned = tryParseJsonObject(balanced);
    if (scanned.ok) return { ...base, ok: true, parsed: scanned.value, parse_status: "BALANCED_JSON_OBJECT_OK" };
  }

  return { ...base, errors: ["NO_VALID_JSON_OBJECT_FOUND"] };
}

export function makePhaseParseFailure(rawText, errors = []) {
  const normalized = normalizePhaseModelText(rawText);
  return {
    ok: false,
    parsed: null,
    parse_status: "MODEL_OUTPUT_PARSE_FAILED",
    errors: errors.length ? errors : ["NO_VALID_JSON_OBJECT_FOUND"],
    raw_output_head: normalized.slice(0, RAW_DIAGNOSTIC_CHARS),
    raw_output_tail: normalized.slice(-RAW_DIAGNOSTIC_CHARS)
  };
}

function tryParseJsonObject(text) {
  try {
    const value = JSON.parse(String(text || "").trim());
    return value && typeof value === "object" && !Array.isArray(value)
      ? { ok: true, value }
      : { ok: false };
  } catch {
    return { ok: false };
  }
}

function extractJsonFence(text) {
  const jsonFence = String(text || "").match(/```json\s*([\s\S]*?)```/i);
  if (jsonFence) return jsonFence[1].trim();
  const anyFence = String(text || "").match(/```\s*([\s\S]*?)```/);
  return anyFence?.[1]?.trim() || "";
}

function extractFirstBalancedJsonObject(text) {
  const value = String(text || "");
  for (let start = value.indexOf("{"); start >= 0; start = value.indexOf("{", start + 1)) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < value.length; i += 1) {
      const char = value[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === "\"") inString = false;
        continue;
      }
      if (char === "\"") {
        inString = true;
        continue;
      }
      if (char === "{") depth += 1;
      if (char === "}") depth -= 1;
      if (depth === 0) return value.slice(start, i + 1);
    }
  }
  return "";
}
