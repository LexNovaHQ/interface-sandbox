export const VAULT_GROUPS = Object.freeze(["baseline", "architecture", "archetypes", "compliance"]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSuggestion(value) {
  return isPlainObject(value) && (
    Object.prototype.hasOwnProperty.call(value, "value") ||
    Object.prototype.hasOwnProperty.call(value, "basis") ||
    Object.prototype.hasOwnProperty.call(value, "confidence") ||
    Object.prototype.hasOwnProperty.call(value, "source_finding_ids")
  );
}

function readSuggestionValue(suggestion) {
  if (isSuggestion(suggestion)) return suggestion.value;
  return suggestion;
}

function toInputString(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

function parseValue(raw, originalValue) {
  if (raw === "") return "";
  if (typeof originalValue === "boolean") return String(raw).toLowerCase() === "true";
  if (typeof originalValue === "number") {
    const next = Number(raw);
    return Number.isFinite(next) ? next : raw;
  }
  if (Array.isArray(originalValue) || isPlainObject(originalValue)) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  if (String(raw).toLowerCase() === "true") return true;
  if (String(raw).toLowerCase() === "false") return false;
  return raw;
}

function setDeepValue(target, dottedPath, value) {
  const parts = String(dottedPath || "").split(".").filter(Boolean);
  if (!parts.length) return;
  let cursor = target;
  parts.slice(0, -1).forEach((part) => {
    if (!isPlainObject(cursor[part])) cursor[part] = {};
    cursor = cursor[part];
  });
  cursor[parts[parts.length - 1]] = value;
}

function walkSuggestions(group, node, prefix = "") {
  if (!isPlainObject(node)) return [];
  return Object.entries(node).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : `${group}.${key}`;
    if (isSuggestion(value)) {
      return [{
        group,
        path,
        field_path: path,
        field: path.replace(`${group}.`, ""),
        value: readSuggestionValue(value),
        input_value: toInputString(readSuggestionValue(value)),
        basis: value.basis || "Derived from Stage 10 handoff.",
        confidence: value.confidence || "medium",
        source_finding_ids: Array.isArray(value.source_finding_ids) ? value.source_finding_ids : []
      }];
    }
    if (isPlainObject(value)) return walkSuggestions(group, value, path);
    return [{
      group,
      path,
      field_path: path,
      field: path.replace(`${group}.`, ""),
      value,
      input_value: toInputString(value),
      basis: "Derived from Stage 10 handoff.",
      confidence: "medium",
      source_finding_ids: []
    }];
  });
}

export function flattenVaultSuggestions(vaultPrefill = {}) {
  return VAULT_GROUPS.flatMap((group) => walkSuggestions(group, vaultPrefill[group] || {}, ""));
}

export function buildCanonicalVaultPayload({
  vaultPrefill = {},
  fieldValues = {},
  confirmationAnswers = {},
  matterMeta = {}
} = {}) {
  const payload = {
    baseline: {},
    architecture: {},
    archetypes: {},
    compliance: {},
    assembly_review: {
      status: "vault_confirmed",
      confirmed_at: new Date().toISOString(),
      source: "stage10_node5b_handoff_plus_reviewer_confirmation",
      matter_id: matterMeta.matter_id || null,
      run_id: matterMeta.run_id || null,
      review_target: matterMeta.review_target || null
    }
  };

  flattenVaultSuggestions(vaultPrefill).forEach((suggestion) => {
    const raw = Object.prototype.hasOwnProperty.call(fieldValues, suggestion.field_path)
      ? fieldValues[suggestion.field_path]
      : suggestion.input_value;
    setDeepValue(payload, suggestion.field_path, parseValue(raw, suggestion.value));
  });

  Object.entries(confirmationAnswers || {}).forEach(([fieldPath, answer]) => {
    if (!fieldPath || answer === undefined || answer === null || answer === "") return;
    if (!VAULT_GROUPS.some((group) => fieldPath === group || fieldPath.startsWith(`${group}.`))) return;
    setDeepValue(payload, fieldPath, parseValue(answer, null));
  });

  return payload;
}
