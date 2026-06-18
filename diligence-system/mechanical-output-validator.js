export function stripJsonFence(text) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  const fenced = raw.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : raw;
}

export function parseJsonObject(text) {
  const stripped = stripJsonFence(text);
  if (!stripped) {
    return {
      ok: false,
      parsed: null,
      error: "EMPTY_MODEL_OUTPUT",
      stripped
    };
  }

  try {
    const parsed = JSON.parse(stripped);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        ok: false,
        parsed,
        error: "MODEL_OUTPUT_NOT_JSON_OBJECT",
        stripped
      };
    }
    return { ok: true, parsed, error: null, stripped };
  } catch (err) {
    return {
      ok: false,
      parsed: null,
      error: `JSON_PARSE_FAILED:${err?.message || String(err)}`,
      stripped
    };
  }
}

export function validateMechanicalPhaseOutput({ phaseId, rawText, parsed, requiredTopLevelKeys = [] } = {}) {
  const errors = [];
  const warnings = [];
  const required = Array.isArray(requiredTopLevelKeys) ? requiredTopLevelKeys : [];

  if (!phaseId) errors.push("PHASE_ID_MISSING");
  if (!String(rawText || "").trim()) errors.push("MODEL_OUTPUT_EMPTY");

  const rootIsObject = Boolean(parsed) && typeof parsed === "object" && !Array.isArray(parsed);
  if (!rootIsObject) {
    errors.push("MODEL_OUTPUT_ROOT_NOT_OBJECT");
  } else {
    for (const key of required) {
      if (!Object.prototype.hasOwnProperty.call(parsed, key)) {
        errors.push(`REQUIRED_TOP_LEVEL_KEY_MISSING:${key}`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    phase_id: phaseId || null,
    errors,
    warnings,
    mechanical_only: true,
    summary: {
      required_top_level_keys: required,
      present_top_level_keys: rootIsObject ? Object.keys(parsed) : [],
      raw_chars: String(rawText || "").length
    }
  };
}

export function validatePromptStackReadiness({ missingFiles = [] } = {}) {
  const missing = Array.isArray(missingFiles) ? missingFiles : [];
  return {
    ok: missing.length === 0,
    errors: missing.map((file) => `PROMPT_FILE_MISSING:${file}`),
    mechanical_only: true
  };
}
