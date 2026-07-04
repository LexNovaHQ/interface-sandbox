import { loadQualifiedReviewMatrix } from "./qualified-review-matrix-loader.js";

const MATRIX = loadQualifiedReviewMatrix();
const PRIVATE_IDS = new Set(["QR-026", "QR-027", "QR-028", "QR-029", "QR-047"]);

export const QUALIFIED_REVIEW_QUESTION_MAP_VERSION = MATRIX.matrix.version;

export const QUALIFIED_REVIEW_SECTIONS = Object.freeze(
  MATRIX.sections.map((section) => ({
    section_id: section.section_id,
    title: section.section_title,
    count: section.question_count
  }))
);

const QUESTION_DEFINITIONS = Object.freeze(
  MATRIX.questions.map(normalizeCanonicalQuestionDefinition)
);

export function buildQualifiedReviewQuestionHandoff({ run = {}, artifacts = {} } = {}) {
  const artifactBag = safeObject(artifacts);
  const questions = QUESTION_DEFINITIONS.map((question) => materializeQuestion({ question, artifacts: artifactBag }));
  const sectionPages = QUALIFIED_REVIEW_SECTIONS.map((section) => {
    const sectionQuestions = questions.filter((question) => question.section_id === section.section_id);
    const prefilled = sectionQuestions.filter((question) => question.prefill_status === "DILIGENCE_PREFILL_CONFIRM").length;
    return {
      section_id: section.section_id,
      section_title: section.title,
      question_ids: sectionQuestions.map((question) => question.question_id),
      question_count: sectionQuestions.length,
      answered_count: prefilled,
      remaining_count: sectionQuestions.length,
      editable: true
    };
  });

  return {
    handoff_type: "qualified_review_question_handoff",
    handoff_version: QUALIFIED_REVIEW_QUESTION_MAP_VERSION,
    run_id: safeText(run.run_id, "UNKNOWN_RUN"),
    ui_mode: "SECTION_BY_SECTION_WIZARD",
    question_count: questions.length,
    sections: QUALIFIED_REVIEW_SECTIONS.map(({ section_id, title }) => ({ section_id, title })),
    progress_rail: sectionPages.map((page, index) => ({
      step: index + 1,
      section_id: page.section_id,
      label: page.section_title,
      question_count: page.question_count,
      status: "NEEDS_CONFIRMATION"
    })),
    section_pages: sectionPages,
    questions,
    warnings: questions.flatMap((question) => question.warnings)
  };
}

function normalizeCanonicalQuestionDefinition(question) {
  const answerMappings = [question.selector, question.secondary_selector].filter(Boolean);
  const evidenceMappings = answerMappings;
  const prefillStrength = question.current_prefill_strength || (PRIVATE_IDS.has(question.question_id) ? "NONE" : "FULL");
  const isFieldMapped = prefillStrength === "FULL" || prefillStrength === "PARTIAL";
  const sourceArtifacts = deriveSourceArtifacts([...answerMappings, ...evidenceMappings]);

  return Object.freeze({
    ...question,
    prefill_strength: prefillStrength,
    answer_prefill_mapping: answerMappings,
    evidence_source_mapping: evidenceMappings,
    answer_options: normalizeAnswerOptions(question),
    evidence_mode: isFieldMapped ? "profile_field" : "reviewer_input",
    field_type: prefillStrength === "FULL" ? "diligence_field_prefilled" : prefillStrength === "PARTIAL" ? "diligence_field_partial" : "reviewer_input_required",
    source_artifacts: sourceArtifacts.length ? sourceArtifacts : ["reviewer_input"],
    source_field_hints: answerMappings,
    evidence_field_hints: evidenceMappings,
    required_for_assembly: true,
    required_for_draft_preparation: true,
    assembly_blocker: true,
    review_status: "Needs confirmation",
    market_norm_helper: null,
    qualified_review_push_policy: {
      push_to_qualified_review_on_click: true,
      public_prefill_is_not_final: true,
      demo_prefill_is_not_evidence: false,
      preserve_original_evidence: true,
      confirmed_answer_overrides_prefill_for_draft_preparation: true
    }
  });
}

function normalizeAnswerOptions(question) {
  return Object.freeze(asArray(question.answer_options));
}

function deriveSourceArtifacts(mappings) {
  const roots = asArray(mappings)
    .map((mapping) => String(mapping || "").split(".")[0])
    .filter(Boolean)
    .map((root) => root === "exposure_registry" ? "exposure_registry_triggered_profile" : root);
  return [...new Set(roots)].filter(Boolean);
}

function materializeQuestion({ question, artifacts }) {
  const isFieldMapped = question.prefill_strength === "FULL" || question.prefill_strength === "PARTIAL";
  const hits = asArray(question.answer_prefill_mapping).filter((path) => readFieldValues(artifacts, path).some(hasMeaningfulArtifact));
  const extracted = isFieldMapped ? sanitizeSuggestedAnswer(extractTypedSuggestedAnswer({ question, artifacts })) : "";
  const suggestedAnswer = validateSuggestedAnswer({ question, value: extracted });
  const warnings = [];

  if (question.prefill_strength === "FULL" && !suggestedAnswer) warnings.push(`${question.question_id}:FULL_FIELD_MAPPING_VALUE_NOT_EXTRACTED_REVIEW_REQUIRED`);
  if (question.prefill_strength === "PARTIAL") warnings.push(`${question.question_id}:PARTIAL_FIELD_MAPPING_REVIEW_AND_COMPLETION_REQUIRED`);
  if (question.prefill_strength === "NONE") warnings.push(`${question.question_id}:NO_DIRECT_DILIGENCE_FIELD_REVIEWER_INPUT_REQUIRED`);
  if (isFieldMapped && !hits.length) warnings.push(`${question.question_id}:ANSWER_FIELD_NOT_PRESENT_NONBLOCKING`);

  const prefillStatus = question.prefill_strength === "FULL" && suggestedAnswer
    ? "DILIGENCE_PREFILL_CONFIRM"
    : question.prefill_strength === "PARTIAL"
      ? "DILIGENCE_SIGNAL_REVIEW_COMPLETE"
      : "REVIEWER_INPUT_REQUIRED";

  return {
    ...question,
    source_artifacts_present: hits.length ? deriveSourceArtifacts(hits) : [],
    prefill_status: prefillStatus,
    answer_status: "EDITABLE_UNCONFIRMED",
    suggested_answer: suggestedAnswer,
    initial_answer_value: suggestedAnswer || null,
    reviewer_answer: "",
    confirmed: false,
    warnings
  };
}

function extractTypedSuggestedAnswer({ question, artifacts }) {
  const extractor = question.answer_extractor || "profile_text";
  if (extractor === "product_service_names") return extractProductServiceNames({ question, artifacts });
  if (extractor === "vendor_subprocessor_names") return extractVendorSubprocessorNames({ question, artifacts });
  if (extractor === "archetype_capability_summary") return extractArchetypeCapabilitySummary({ question, artifacts });
  if (extractor === "india_field_value_summary") return extractIndiaFieldSummary({ question, artifacts });
  if (extractor === "dropdown_from_profile_signal") return extractDropdownSignal({ question, artifacts });
  if (extractor === "select_from_profile_signal") return extractSelectSignal({ question, artifacts });
  if (extractor === "profile_summary") return extractProfileSummary({ question, artifacts });
  return extractProfileText({ question, artifacts });
}

function extractProfileText({ question, artifacts }) {
  const values = readMappedValues({ question, artifacts }).map(valueToText).filter(Boolean);
  return values[0] || "";
}

function extractProfileSummary({ question, artifacts }) {
  return dedupe(readMappedValues({ question, artifacts }).map(valueToText).filter(Boolean)).slice(0, 8).join("; ");
}

function extractProductServiceNames({ question, artifacts }) {
  const values = readMappedValues({ question, artifacts });
  const names = [];
  for (const value of flatten(values)) {
    if (typeof value === "string") names.push(value);
    else if (value && typeof value === "object") {
      for (const key of ["product_service_wrapper", "product_name", "service_name", "name", "title", "label"]) {
        if (value[key]) names.push(value[key]);
      }
    }
  }
  return dedupe(names.map(valueToText).filter(Boolean)).join(", ");
}

function extractVendorSubprocessorNames({ question, artifacts }) {
  const values = readMappedValues({ question, artifacts });
  const names = [];
  for (const value of flatten(values)) {
    if (typeof value === "string") names.push(value);
    else if (value && typeof value === "object") {
      for (const key of ["vendor", "processor", "subprocessor", "name", "entity", "provider"]) {
        if (value[key]) names.push(value[key]);
      }
    }
  }
  return dedupe(names.map(valueToText).filter(Boolean)).join(", ");
}

function extractArchetypeCapabilitySummary({ question, artifacts }) {
  const code = archetypeCodeForQuestion(question.question_id);
  const activities = asArray(artifacts.target_feature_profile?.activities);
  const matchedActivities = code ? activities.filter((activity) => asArray(activity.archetype_codes).map(String).includes(code)) : activities;
  const triggered = filterRegistryRows(artifacts.exposure_registry_triggered_profile?.triggered_rows, code);
  const controlled = filterRegistryRows(artifacts.exposure_registry_controlled_profile?.controlled_rows, code);
  const parts = [];

  if (code && matchedActivities.length) {
    const activityNames = matchedActivities.map((activity) => activity.activity_feature_name || activity.product_service_wrapper || activity.name).filter(Boolean);
    parts.push(`${code}: ${dedupe(activityNames).join(", ")}`);
  }
  if (triggered.length) parts.push(`Triggered exposure rows: ${dedupe(triggered.map(rowLabel).filter(Boolean)).join(", ")}`);
  if (controlled.length) parts.push(`Controlled exposure rows: ${dedupe(controlled.map(rowLabel).filter(Boolean)).join(", ")}`);

  if (!parts.length && question.prefill_strength === "PARTIAL") {
    const values = readMappedValues({ question, artifacts }).map(valueToText).filter(Boolean);
    if (values.length) parts.push(dedupe(values).slice(0, 6).join("; "));
  }

  return parts.join("; ");
}

function extractIndiaFieldSummary({ question, artifacts }) {
  const values = readMappedValues({ question, artifacts }).map(valueToText).filter(Boolean);
  return dedupe(values).slice(0, 6).join("; ");
}

function extractDropdownSignal({ question, artifacts }) {
  const options = asArray(question.answer_options);
  const text = readMappedValues({ question, artifacts }).map(valueToText).filter(Boolean).join(" ").toLowerCase();
  if (!text) return "";

  for (const option of options) {
    if (text === String(option).toLowerCase()) return option;
  }
  if (options.includes("Yes") || options.includes("No") || options.includes("Unclear")) {
    if (/\b(no|none|not found|not available|absent|missing|not public|no public)\b/i.test(text)) return options.includes("No") ? "No" : "";
    if (/\b(yes|available|present|public|detected|identified|confirmed|provided)\b/i.test(text)) return options.includes("Yes") ? "Yes" : "";
    return options.includes("Unclear") ? "Unclear" : "";
  }
  return options.find((option) => text.includes(String(option).toLowerCase())) || "";
}

function extractSelectSignal({ question, artifacts }) {
  const options = asArray(question.answer_options);
  const text = readMappedValues({ question, artifacts }).map(valueToText).filter(Boolean).join(" ").toLowerCase();
  if (!text) return "";
  const hits = options.filter((option) => text.includes(String(option).toLowerCase()));
  return hits.length ? hits.join(", ") : "";
}

function readMappedValues({ question, artifacts }) {
  return asArray(question.answer_prefill_mapping).flatMap((path) => readFieldValues(artifacts, path)).filter(hasMeaningfulArtifact);
}

function readFieldValues(object, path) {
  if (!path || /^NO_DIRECT_DILIGENCE_FIELD/i.test(String(path))) return [];
  const parts = splitPath(String(path));
  let values = [object];
  for (const part of parts) {
    values = values.flatMap((value) => stepValue(value, part)).filter((value) => value !== undefined && value !== null);
    if (!values.length) return [];
  }
  return values;
}

function splitPath(path) {
  const parts = [];
  let current = "";
  let depth = 0;
  for (const char of path) {
    if (char === "." && depth === 0) {
      if (current) parts.push(current);
      current = "";
      continue;
    }
    if (char === "[") depth += 1;
    if (char === "]") depth = Math.max(0, depth - 1);
    current += char;
  }
  if (current) parts.push(current);
  return parts;
}

function stepValue(value, segment) {
  if (value === undefined || value === null) return [];
  if (Object.prototype.hasOwnProperty.call(Object(value), segment)) return [value[segment]];

  const match = String(segment).match(/^([^\[]+)(?:\[(.*)\])?$/);
  if (!match) return [];
  const prop = match[1];
  const selector = match[2];
  const next = value?.[prop];
  if (selector === undefined) return next === undefined ? [] : [next];
  if (next === undefined || next === null) return [];

  if (selector === "*") return asArray(next);
  if (/^\d+$/.test(selector)) return [asArray(next)[Number(selector)]].filter((item) => item !== undefined);

  if (selector.includes("=")) {
    const [rawKey, ...rest] = selector.split("=");
    const key = rawKey.trim();
    const expected = rest.join("=").trim();
    return asArray(next).filter((item) => {
      const candidate = item?.[key] ?? item?.[key.toLowerCase()] ?? item?.[key.toUpperCase()];
      if (Array.isArray(candidate)) return candidate.map(String).includes(expected);
      return String(candidate || "") === expected || String(candidate || "").includes(expected);
    });
  }

  if (next && typeof next === "object" && !Array.isArray(next)) {
    if (Object.prototype.hasOwnProperty.call(next, selector)) return [next[selector]];
    const foundKey = Object.keys(next).find((key) => key === selector || key.includes(selector) || selector.includes(key));
    return foundKey ? [next[foundKey]] : [];
  }

  return asArray(next).filter((item) => valueToText(item).includes(selector));
}

function filterRegistryRows(rows, code) {
  if (!code) return asArray(rows);
  return asArray(rows).filter((row) => {
    const text = JSON.stringify(row || {});
    return text.includes(code) || text.includes(`Archetype=${code}`);
  });
}

function archetypeCodeForQuestion(questionId) {
  return {
    "QR-024": "DOE",
    "QR-025": "ORC",
    "QR-030": "CRT",
    "QR-031": "RDR",
    "QR-032": "CMP",
    "QR-033": "TRN",
    "QR-034": "JDG",
    "QR-035": "OPT",
    "QR-036": "SHD",
    "QR-037": "MOV",
    "QR-038": "GEN"
  }[questionId] || "";
}

function rowLabel(row) {
  return row?.Threat_ID || row?.threat_id || row?.id || row?.row_id || row?.title || row?.name || "";
}

function validateSuggestedAnswer({ question, value }) {
  const clean = sanitizeSuggestedAnswer(value);
  if (!clean) return "";

  if (question.answer_type === "dropdown") {
    return asArray(question.answer_options).includes(clean) ? clean : "";
  }
  if (question.answer_type === "select") {
    const options = asArray(question.answer_options);
    const values = clean.split(",").map((item) => item.trim()).filter(Boolean);
    const valid = values.filter((item) => options.includes(item));
    return valid.join(", ");
  }
  return clean;
}

function sanitizeSuggestedAnswer(value) {
  const text = safeText(value, "");
  if (!text) return "";
  if (/^Review source artifacts:/i.test(text)) return "";
  if (/^\s*[\[{]/.test(text)) return "";
  if (/"(?:activity_id|archetype_codes|source_artifacts|lossless_text)"\s*:/.test(text)) return "";
  return text;
}

function valueToText(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return safeText(value, "");
  if (Array.isArray(value)) return value.map(valueToText).filter(Boolean).join(", ");
  if (typeof value === "object") {
    for (const key of ["value_summary", "summary", "answer", "value", "status", "signal", "label", "name", "title", "description", "text"]) {
      if (value[key]) return valueToText(value[key]);
    }
    const compact = Object.entries(value)
      .filter(([key, val]) => !["raw_text", "clean_text", "lossless_text", "source_text"].includes(key) && typeof val !== "object")
      .slice(0, 5)
      .map(([key, val]) => `${key}: ${safeText(val, "")}`)
      .join("; ");
    return compact;
  }
  return "";
}

function flatten(values) {
  return values.flatMap((value) => Array.isArray(value) ? flatten(value) : [value]);
}

function dedupe(values) {
  return [...new Set(values.map((value) => safeText(value, "")).filter(Boolean))];
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function safeText(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  return String(value).trim() || fallback;
}

function hasMeaningfulArtifact(value) {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return Boolean(String(value).trim());
}
