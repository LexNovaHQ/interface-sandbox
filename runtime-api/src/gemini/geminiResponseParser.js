export function extractGeminiText(payload = {}) {
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  const parts = candidates
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => part?.text)
    .filter((text) => typeof text === "string" && text.trim());

  return parts.join("\n").trim();
}

function stripJsonFence(text) {
  return String(text || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function firstJsonStart(text) {
  const objectStart = text.indexOf("{");
  const arrayStart = text.indexOf("[");
  const starts = [objectStart, arrayStart].filter((index) => index >= 0);
  return starts.length ? Math.min(...starts) : -1;
}

function extractFirstBalancedJson(text) {
  const cleaned = stripJsonFence(text);
  const start = firstJsonStart(cleaned);
  if (start < 0) return cleaned;

  const opening = cleaned[start];
  const expectedClose = opening === "{" ? "}" : "]";
  const stack = [expectedClose];
  let inString = false;
  let escaped = false;

  for (let index = start + 1; index < cleaned.length; index += 1) {
    const ch = cleaned[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") {
      stack.push("}");
      continue;
    }
    if (ch === "[") {
      stack.push("]");
      continue;
    }
    if (ch === "}" || ch === "]") {
      const expected = stack.pop();
      if (ch !== expected) return cleaned.slice(start).trim();
      if (stack.length === 0) return cleaned.slice(start, index + 1).trim();
    }
  }

  return cleaned.slice(start).trim();
}

function sliceLikelyJson(text) {
  const cleaned = stripJsonFence(text);
  const firstBalanced = extractFirstBalancedJson(cleaned);
  if (firstBalanced && firstBalanced !== cleaned) return firstBalanced;

  const start = firstJsonStart(cleaned);
  if (start < 0) return cleaned;
  const objectEnd = cleaned.lastIndexOf("}");
  const arrayEnd = cleaned.lastIndexOf("]");
  const end = Math.max(objectEnd, arrayEnd);
  if (end <= start) return cleaned;
  return cleaned.slice(start, end + 1).trim();
}

export function parseJsonFromGeminiText(text) {
  const raw_text = String(text || "").trim();
  const candidates = [];
  const cleaned = stripJsonFence(raw_text);
  const firstBalanced = extractFirstBalancedJson(cleaned);
  const broadSlice = sliceLikelyJson(cleaned);
  for (const candidate of [cleaned, firstBalanced, broadSlice]) {
    if (candidate && !candidates.includes(candidate)) candidates.push(candidate);
  }

  let lastError = null;
  for (const likely_json of candidates) {
    try {
      return {
        ok: true,
        json: JSON.parse(likely_json),
        raw_text,
        repaired: likely_json !== raw_text
      };
    } catch (error) {
      lastError = error;
    }
  }

  return {
    ok: false,
    json: null,
    raw_text,
    likely_json: candidates[candidates.length - 1] || raw_text,
    error: lastError?.message || "Unable to parse JSON"
  };
}

export function parseGeminiJsonPayload(payload = {}) {
  const text = extractGeminiText(payload);
  const parsed = parseJsonFromGeminiText(text);
  return {
    ...parsed,
    usage_metadata: payload.usageMetadata || null,
    finish_reason: payload.candidates?.[0]?.finishReason || null,
    grounding_metadata: payload.candidates?.[0]?.groundingMetadata || null
  };
}
