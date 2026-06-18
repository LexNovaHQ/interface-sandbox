function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function validateMechanicalPhaseOutput(input = {}) {
  const errors = [];
  const required = Array.isArray(input.requiredTopLevelKeys) ? input.requiredTopLevelKeys : [];

  if (!input.phaseId) errors.push("PHASE_ID_MISSING");
  if (!String(input.rawText || "").trim()) errors.push("MODEL_OUTPUT_EMPTY");
  if (!input.parsedOk) errors.push(input.parseError || "MODEL_OUTPUT_NOT_PARSEABLE");
  if (input.parsedOk && !isPlainObject(input.parsed)) errors.push("MODEL_OUTPUT_ROOT_NOT_OBJECT");

  if (input.parsedOk && isPlainObject(input.parsed)) {
    for (const key of required) {
      if (!Object.prototype.hasOwnProperty.call(input.parsed, key)) {
        errors.push("REQUIRED_TOP_LEVEL_KEY_MISSING:" + key);
      }
    }
  }

  return {
    ok: errors.length === 0,
    phase_id: input.phaseId || null,
    errors,
    required_top_level_keys: required,
    present_top_level_keys: input.parsedOk && isPlainObject(input.parsed) ? Object.keys(input.parsed) : [],
    mechanical_only: true
  };
}

export function validatePromptStackReadiness(input = {}) {
  const errors = [];
  const missing = Array.isArray(input.missingFiles) ? input.missingFiles : [];
  if (!input.phaseStackReady) errors.push("PROMPT_STACK_NOT_READY");
  for (const file of missing) errors.push("PROMPT_FILE_MISSING:" + file);
  return { ok: errors.length === 0, errors, mechanical_only: true };
}
