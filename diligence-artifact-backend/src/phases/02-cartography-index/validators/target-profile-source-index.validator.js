import {
  P2A_TARGET_PROFILE_ARTIFACTS,
  P2A_TARGET_PROFILE_FINAL_INDEX_KEYS,
  P2A_TARGET_PROFILE_FORBIDDEN_OUTPUTS,
  P2A_TARGET_PROFILE_FORBIDDEN_CONCLUSIONS,
  P2A_TARGET_PROFILE_RETIRED_ROOTS_FORBIDDEN
} from "../target-profile-source-index.contract.js";

const FINAL_ROOT = P2A_TARGET_PROFILE_ARTIFACTS.finalIndex;
const REQUIRED_ARRAY_KEYS = new Set(P2A_TARGET_PROFILE_FINAL_INDEX_KEYS.filter((key) => !["downstream_rules", "lock_status"].includes(key)));
const ALLOWED_LOCK_STATUS = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE"]);
const FORBIDDEN_COPY_KEYS = Object.freeze(["summary", "excerpt", "snippet", "lossless_text", "clean_text", "raw_text", "body", "content", "derived_value"]);

export function validateTargetProfileSourceIndex(rawOutput) {
  const errors = [];
  const warnings = [];
  const output = unwrap(rawOutput);
  const index = output?.[FINAL_ROOT];
  if (!index || typeof index !== "object" || Array.isArray(index)) return result([`Missing required root ${FINAL_ROOT}.`], warnings);

  for (const key of Object.keys(output)) if (key !== FINAL_ROOT) errors.push(`Unexpected top-level key: ${key}.`);
  const keys = Object.keys(index);
  const missing = P2A_TARGET_PROFILE_FINAL_INDEX_KEYS.filter((key) => !(key in index));
  const extra = keys.filter((key) => !P2A_TARGET_PROFILE_FINAL_INDEX_KEYS.includes(key));
  if (missing.length) errors.push(`Missing final index keys: ${missing.join(",")}.`);
  if (extra.length) errors.push(`Unexpected final index keys: ${extra.join(",")}.`);
  for (const key of REQUIRED_ARRAY_KEYS) if (!Array.isArray(index[key])) errors.push(`${key} must be an array.`);
  if (!index.downstream_rules || typeof index.downstream_rules !== "object" || Array.isArray(index.downstream_rules)) errors.push("downstream_rules must be an object.");
  if (!ALLOWED_LOCK_STATUS.has(index.lock_status)) errors.push("Invalid or missing lock_status.");

  const rules = index.downstream_rules || {};
  for (const [key, expected] of Object.entries({
    p2a_is_index_only: true,
    target_profile_source_index_only: true,
    target_profile_review_derives_values_later: true,
    material_target_field_locators_are_pointer_only: true,
    legal_target_signals_are_locators_only: true,
    full_legal_cartography_reserved_for_2e: true,
    phase1_v5_source_contract_required: true,
    regulatory_grievance_conclusions_forbidden: true,
    source_artifacts_remain_source_of_truth: true,
    full_text_copied: false,
    summaries_allowed: false,
    excerpts_allowed: false,
    target_profile_values_emitted: false
  })) if (rules[key] !== expected) errors.push(`downstream_rules.${key} must be ${expected}.`);

  for (const forbidden of P2A_TARGET_PROFILE_FORBIDDEN_OUTPUTS) if (containsKey(index, forbidden)) errors.push(`Forbidden downstream output key present: ${forbidden}.`);
  for (const forbidden of P2A_TARGET_PROFILE_FORBIDDEN_CONCLUSIONS) if (containsKey(index, forbidden) || containsStringValue(index, forbidden)) errors.push(`Forbidden conclusion marker present: ${forbidden}.`);
  for (const forbidden of P2A_TARGET_PROFILE_RETIRED_ROOTS_FORBIDDEN) if (containsStringValue(index, forbidden)) errors.push(`Retired root marker present: ${forbidden}.`);
  for (const forbidden of FORBIDDEN_COPY_KEYS) if (containsKey(index, forbidden)) errors.push(`Forbidden copied/source-text key present: ${forbidden}.`);

  for (const row of collectRows(index)) {
    if (typeof row.value === "string" && row.value.trim()) errors.push("Locator row must not contain a non-empty value.");
    if (row.derived_value_emitted === true) errors.push("Locator row emitted a derived value.");
  }

  if (!asArray(index.material_target_field_locator).some((row) => row.field_id === "TP.BIZ.009")) warnings.push("No TP.BIZ.009 locator row found in final index.");
  if (!asArray(index.material_target_field_locator).some((row) => row.field_id === "TP.BIZ.010")) warnings.push("No TP.BIZ.010 locator row found in final index.");

  return result(errors, warnings);
}

export function assertTargetProfileSourceIndex(rawOutput) {
  const validation = validateTargetProfileSourceIndex(rawOutput);
  if (!validation.ok) {
    const error = new Error(`TARGET_PROFILE_SOURCE_INDEX_VALIDATION_FAILED:${validation.errors.join("|")}`);
    error.validation = validation;
    throw error;
  }
  return validation;
}

function collectRows(value, out = []) {
  if (!value || typeof value !== "object") return out;
  if (Array.isArray(value)) { for (const item of value) collectRows(item, out); return out; }
  out.push(value);
  for (const item of Object.values(value)) collectRows(item, out);
  return out;
}

function containsKey(value, key) {
  if (!value || typeof value !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(value, key)) return true;
  if (Array.isArray(value)) return value.some((item) => containsKey(item, key));
  return Object.values(value).some((item) => containsKey(item, key));
}

function containsStringValue(value, marker) {
  if (typeof value === "string") return value.includes(marker);
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => containsStringValue(item, marker));
  return Object.values(value).some((item) => containsStringValue(item, marker));
}

function unwrap(value) { if (!value || typeof value !== "object") return value; if (value.artifact && typeof value.artifact === "object") return value.artifact; if (value.data && typeof value.data === "object") return value.data; if (value.payload && typeof value.payload === "object") return value.payload; return value; }
function asArray(value) { return Array.isArray(value) ? value : []; }
function result(errors, warnings) { return { ok: errors.length === 0, errors, warnings, status: errors.length ? "REPAIR_REQUIRED" : warnings.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED" }; }
