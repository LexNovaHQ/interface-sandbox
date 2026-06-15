import { assertLosslessPrimaryEvidence, assertWindowIsVerbatim, createVerbatimSourceWindow, sourceById } from "../stage5.runtime.js";
import { STAGE5_FEATURE_PATTERNS } from "../stage5.dictionary.js";
import { buildStage5CPromptInput } from "./5c.prompt.js";
import {
  STAGE5C_ALLOWED_DATA_CATEGORIES,
  STAGE5C_DATA_SIGNAL_TERMS,
  STAGE5C_DIRECTIONS,
  STAGE5C_EXPLICITNESS,
  STAGE5C_FAILURE_REASONS,
  STAGE5C_OUTPUT_VERSION,
  STAGE5C_SIGNAL_VALUES,
  STAGE5C_TOUCHPOINT_TYPES,
  STAGE5C_WINDOW_POLICY
} from "./5c.dictionary.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function lower(value) {
  return String(value || "").toLowerCase();
}

function unique(values = []) {
  return [...new Set(asArray(values).map(asText).filter(Boolean))];
}

function sanitizeEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function allInheritedEvidenceWindows(stage5a = {}, stage5b = {}) {
  return [
    ...asArray(stage5a.feature_evidence_windows),
    ...asArray(stage5b.inherited_feature_evidence_windows),
    ...asArray(stage5b.supplemental_evidence_windows)
  ];
}

function inheritedWindowMap(stage5a = {}, stage5b = {}) {
  const windows = allInheritedEvidenceWindows(stage5a, stage5b);
  return new Map(windows.map((window) => [window.window_id, window]));
}

function tagByFunction(stage5b = {}) {
  return new Map(asArray(stage5b.feature_tags).map((tag) => [tag.function_id, tag]));
}

function packetByFunction(stage5b = {}) {
  return new Map(asArray(stage5b.feature_packets_for_5c).map((packet) => [packet.function_id, packet]));
}

function patternForFeature(fn = {}, tag = {}, packet = {}, windows = []) {
  const haystack = lower([
    fn.function_id,
    fn.candidate_key,
    fn.function_name,
    fn.core_product_name,
    fn.commercial_function,
    fn.input_signal,
    fn.system_action,
    fn.output_or_result,
    tag.rationale,
    packet.matched_pattern_key,
    ...windows.map((window) => window.verbatim_feature_text || window.verbatim_tagging_text || window.verbatim_text)
  ].join(" "));

  return STAGE5_FEATURE_PATTERNS.find((pattern) => {
    if (haystack.includes(lower(pattern.key))) return true;
    return asArray(pattern.terms).some((term) => haystack.includes(lower(term))) || haystack.includes(lower(pattern.name));
  }) || STAGE5_FEATURE_PATTERNS[0];
}

function dataCategory(pattern = {}, fn = {}) {
  const inputData = asArray(pattern.input_data).map(lower);
  if (inputData.includes("audio")) return "audio";
  if (inputData.includes("document")) return "document";
  if (inputData.includes("text")) return "text";
  if (lower(fn.function_name).includes("conversation") || lower(fn.system_action).includes("conversation")) return "conversation";
  return "api_payload";
}

function touchpointType(pattern = {}) {
  if (pattern.key === "voice_agent") return "agentic_interaction";
  if (pattern.key === "translation") return "content_transformation";
  if (pattern.key === "text_to_speech") return "output_generation";
  return "input_processing";
}

function deliveryChannels(pattern = {}, tag = {}) {
  const surfaces = new Set(asArray(tag.surface_tokens));
  const channels = [];
  if (surfaces.has("developer_api") || asText(pattern.function_type) === "api_capability") channels.push("api");
  if (surfaces.has("web_app") || surfaces.has("text_input") || surfaces.has("document_input")) channels.push("web");
  if (surfaces.has("voice_interface") || pattern.key === "voice_agent") channels.push("app");
  return unique(channels.length ? channels : ["web"]);
}

function autonomyLevel(pattern = {}, tag = {}) {
  const surfaces = new Set(asArray(tag.surface_tokens));
  if (pattern.key === "voice_agent" || surfaces.has("workflow_action") || surfaces.has("external_interaction")) return "execute";
  if (asText(pattern.function_type) === "api_capability") return "none";
  return "unknown";
}

function externalActionSignal(pattern = {}, tag = {}) {
  const surfaces = new Set(asArray(tag.surface_tokens));
  if (pattern.key === "voice_agent" || surfaces.has("external_interaction") || surfaces.has("workflow_action")) return "true";
  return "unknown";
}

function signalFromWindows(windows = [], signalKey) {
  const terms = asArray(STAGE5C_DATA_SIGNAL_TERMS[signalKey]).map(lower);
  const haystack = lower(windows.map((window) => window.verbatim_text).join("\n"));
  if (terms.some((term) => term && haystack.includes(term))) return STAGE5C_SIGNAL_VALUES.EVIDENCED;
  return STAGE5C_SIGNAL_VALUES.NOT_EVIDENCED;
}

function buildFeatureId(functionId = "") {
  const cleaned = String(functionId || "FEATURE").replace(/^S5A_FUNC_/, "").replace(/[^A-Z0-9_]/gi, "_").toUpperCase();
  return `S5C_FEAT_${cleaned}`;
}

function expandedRangeForWindow(source = {}, window = {}) {
  const radius = STAGE5C_WINDOW_POLICY.default_context_radius_chars;
  const minWindow = STAGE5C_WINDOW_POLICY.min_context_window_chars;
  const maxWindow = STAGE5C_WINDOW_POLICY.max_context_window_chars;
  const sourceLength = source.clean_text_lossless.length;
  const parentStart = Number(window.char_start || 0);
  const parentEnd = Number(window.char_end || parentStart + minWindow);
  const center = Math.floor((parentStart + parentEnd) / 2);
  const desiredSize = Math.min(maxWindow, Math.max(minWindow, parentEnd - parentStart + radius));
  const charStart = Math.max(0, center - Math.floor(desiredSize / 2));
  const charEnd = Math.min(sourceLength, Math.max(charStart + minWindow, charStart + desiredSize));
  return { char_start: charStart, char_end: charEnd };
}

function makeDataWindow({ source, parentWindow, pattern, featureId, functionId, windowIndex }) {
  const dataWindow = createVerbatimSourceWindow(source, expandedRangeForWindow(source, parentWindow), {
    created_by_substage: "5C",
    window_index: windowIndex,
    used_for: STAGE5C_WINDOW_POLICY.supplemental_used_for,
    selection_reason: `${pattern.key} data-mechanics context expanded from parent window ${parentWindow.window_id}`
  });
  dataWindow.window_type = STAGE5C_WINDOW_POLICY.supplemental_window_type;
  dataWindow.parent_window_id = parentWindow.window_id;
  dataWindow.pattern_key = pattern.key;
  dataWindow.feature_id = featureId;
  dataWindow.function_id = functionId;
  dataWindow.verbatim_data_mechanics_text = dataWindow.verbatim_text;
  return dataWindow;
}

function collectWindowsForRefs(refs = [], windowsById = new Map()) {
  return unique(refs).map((ref) => windowsById.get(ref)).filter(Boolean);
}

function validateWindowRefs({ refs = [], windowsById = new Map(), code, details = {} }) {
  const normalized = unique(refs);
  if (!normalized.length || normalized.some((ref) => !windowsById.has(ref))) {
    throw Object.assign(new Error("5C feature record has invalid or missing source_window_refs."), {
      code,
      details: { ...details, refs: normalized }
    });
  }
  return normalized;
}

function buildUnknowns({ featureId, signals, evidenceRefs }) {
  const unknowns = [];
  for (const [field, value] of Object.entries(signals)) {
    if (value === STAGE5C_SIGNAL_VALUES.NOT_EVIDENCED) {
      unknowns.push({
        feature_id: featureId,
        field_path: field,
        status: STAGE5C_SIGNAL_VALUES.NOT_EVIDENCED,
        question: `Confirm whether ${field.replace(/_/g, " ")} applies to this feature.`,
        source_window_refs: evidenceRefs
      });
    }
  }
  return unknowns;
}

function buildFeatureInput({ fn, tag, packet, inheritedWindows, supplementalWindows }) {
  return {
    function_id: fn.function_id,
    core_product_name: fn.core_product_name,
    function_name: fn.function_name,
    feature_window_refs: unique(fn.source_window_refs),
    tag_window_refs: unique(tag.source_window_refs),
    packet_window_refs: unique(packet.source_window_refs),
    supplemental_data_window_refs: supplementalWindows.map((window) => window.window_id),
    inherited_window_excerpt_count: inheritedWindows.length,
    supplemental_window_excerpt_count: supplementalWindows.length
  };
}

function buildFeatureRecord({ fn, tag, packet, pattern, inheritedWindows, supplementalWindows }) {
  const featureId = buildFeatureId(fn.function_id);
  const inheritedRefs = inheritedWindows.map((window) => window.window_id);
  const supplementalRefs = supplementalWindows.map((window) => window.window_id);
  const allRefs = unique([...inheritedRefs, ...supplementalRefs]);
  const dataCategoryValue = sanitizeEnum(dataCategory(pattern, fn), STAGE5C_ALLOWED_DATA_CATEGORIES, "api_payload");
  const touchpointTypeValue = sanitizeEnum(touchpointType(pattern), STAGE5C_TOUCHPOINT_TYPES, "input_processing");
  const direction = pattern.key === "voice_agent" ? "bidirectional" : "inbound";
  const signals = {
    storage_or_retention_signal: signalFromWindows(supplementalWindows, "storage_or_retention_signal"),
    training_or_finetuning_signal: signalFromWindows(supplementalWindows, "training_or_finetuning_signal"),
    sharing_signal: signalFromWindows(supplementalWindows, "sharing_signal"),
    logging_or_telemetry_signal: signalFromWindows(supplementalWindows, "logging_or_telemetry_signal")
  };
  const touchpoint = {
    touchpoint_id: `${featureId}_TP_001`,
    touchpoint_type: touchpointTypeValue,
    data_category: dataCategoryValue,
    data_subject: "user",
    data_origin: "user_provided",
    direction: sanitizeEnum(direction, STAGE5C_DIRECTIONS, "inbound"),
    processing_context: asText(fn.system_action) || asText(pattern.system_action),
    explicitness: sanitizeEnum("evidenced", STAGE5C_EXPLICITNESS, "evidenced"),
    source_window_refs: allRefs
  };
  const provenance = {
    provenance_id: `${featureId}_DP_001`,
    data_origin: "user_provided",
    data_subject: "user",
    data_category: dataCategoryValue,
    processing_context: asText(fn.system_action) || asText(pattern.system_action),
    ...signals,
    source_window_refs: allRefs
  };
  const record = {
    feature_id: featureId,
    function_id: fn.function_id,
    core_product_id: fn.core_product_id,
    core_product_name: fn.core_product_name,
    feature_name: asText(fn.function_name) || asText(pattern.name),
    feature_role: fn.primary_or_secondary === "secondary" ? "SECONDARY" : "CORE",
    commercial_function: asText(fn.commercial_function) || asText(pattern.name),
    actor_or_user: asText(fn.actor_or_user) || "user",
    input_data: unique(pattern.input_data?.length ? pattern.input_data : [dataCategoryValue]),
    system_action: asText(fn.system_action) || asText(pattern.system_action),
    output_or_result: asText(fn.output_or_result) || asText(pattern.output_or_result),
    delivery_channels: deliveryChannels(pattern, tag),
    autonomy_level: autonomyLevel(pattern, tag),
    human_review_signal: "not_visible",
    external_action_signal: externalActionSignal(pattern, tag),
    archetype_codes: asArray(tag.archetype_codes),
    archetype_labels: asArray(tag.archetype_labels),
    surface_tokens: asArray(tag.surface_tokens),
    int_ext_classification: asText(tag.int_ext_classification) || "both",
    data_touchpoints: [touchpoint],
    data_provenance: [provenance],
    ...signals,
    inherited_feature_window_refs: inheritedRefs,
    supplemental_tag_window_refs: asArray(tag.supplemental_tag_window_refs),
    supplemental_data_window_refs: supplementalRefs,
    evidence_window_refs: allRefs,
    unknowns: buildUnknowns({ featureId, signals, evidenceRefs: allRefs }),
    limitations: [],
    metadata_used_as_primary_source: false,
    index_used_as_primary_source: false
  };
  return { record, touchpoint, provenance };
}

function validateStage5COutput({ canonicalInput, stage5a, stage5b, records, supplementalWindows, featureUnknowns }) {
  assertLosslessPrimaryEvidence(canonicalInput);
  const sourceMap = sourceById(canonicalInput);
  const inherited = inheritedWindowMap(stage5a, stage5b);
  const supplemental = new Map(asArray(supplementalWindows).map((window) => [window.window_id, window]));
  const allWindows = new Map([...inherited, ...supplemental]);

  if (!asArray(stage5a?.admitted_functions).length) {
    throw Object.assign(new Error("5C requires 5A admitted functions."), { code: "STAGE5C_MISSING_STAGE5A_OUTPUT" });
  }
  if (records.length !== asArray(stage5a.admitted_functions).length) {
    throw Object.assign(new Error("5C must build one complete feature record per 5A function."), {
      code: "STAGE5C_FEATURE_COVERAGE_FAILURE",
      details: { expected: stage5a.admitted_functions.length, actual: records.length }
    });
  }
  for (const window of allWindows.values()) assertWindowIsVerbatim(sourceMap.get(window.source_id), window);

  for (const record of records) {
    validateWindowRefs({ refs: record.evidence_window_refs, windowsById: allWindows, code: "STAGE5C_SOURCE_WINDOW_REF_VIOLATION", details: { feature_id: record.feature_id } });
    validateWindowRefs({ refs: record.inherited_feature_window_refs, windowsById: inherited, code: "STAGE5C_MISSING_5A_WINDOW", details: { feature_id: record.feature_id } });
    validateWindowRefs({ refs: record.supplemental_tag_window_refs, windowsById: inherited, code: "STAGE5C_MISSING_5B_WINDOW", details: { feature_id: record.feature_id } });
    validateWindowRefs({ refs: record.supplemental_data_window_refs, windowsById: supplemental, code: "STAGE5C_MISSING_5C_SUPPLEMENTAL_WINDOW", details: { feature_id: record.feature_id } });
    if (!record.data_touchpoints.length || !record.data_provenance.length) {
      throw Object.assign(new Error("5C complete feature record must include data touchpoints and data provenance."), {
        code: "STAGE5C_EMPTY_FEATURE_RECORD",
        details: { feature_id: record.feature_id }
      });
    }
    if (record.metadata_used_as_primary_source || record.index_used_as_primary_source) {
      throw Object.assign(new Error("5C cannot use metadata/index as primary evidence."), {
        code: "STAGE5C_METADATA_OR_INDEX_AS_EVIDENCE_BLOCKED",
        details: { feature_id: record.feature_id }
      });
    }
    for (const touchpoint of record.data_touchpoints) validateWindowRefs({ refs: touchpoint.source_window_refs, windowsById: allWindows, code: "STAGE5C_SOURCE_WINDOW_REF_VIOLATION", details: { feature_id: record.feature_id, touchpoint_id: touchpoint.touchpoint_id } });
    for (const provenance of record.data_provenance) validateWindowRefs({ refs: provenance.source_window_refs, windowsById: allWindows, code: "STAGE5C_SOURCE_WINDOW_REF_VIOLATION", details: { feature_id: record.feature_id, provenance_id: provenance.provenance_id } });
  }
  for (const unknown of featureUnknowns) validateWindowRefs({ refs: unknown.source_window_refs, windowsById: allWindows, code: "STAGE5C_SOURCE_WINDOW_REF_VIOLATION", details: { feature_id: unknown.feature_id, field_path: unknown.field_path } });
  return true;
}

export async function runStage5C({ canonicalInput, stage5a, stage5b, modelPorts = {}, runContext = {} } = {}) {
  assertLosslessPrimaryEvidence(canonicalInput);

  const sourceMap = sourceById(canonicalInput);
  const inheritedById = inheritedWindowMap(stage5a, stage5b);
  const tagsByFunction = tagByFunction(stage5b);
  const packetsByFunction = packetByFunction(stage5b);
  const records = [];
  const featureInputs = [];
  const featureUnknowns = [];
  const dataProvenanceSeeds = [];
  const regulatedSurfaceSeeds = [];
  const vaultQuestionSeeds = [];
  const supplementalEvidenceWindows = [];
  let supplementalWindowIndex = 1;

  for (const fn of asArray(stage5a?.admitted_functions)) {
    const tag = tagsByFunction.get(fn.function_id);
    const packet = packetsByFunction.get(fn.function_id) || {};
    if (!tag) {
      throw Object.assign(new Error(`5C missing 5B tag row for ${fn.function_id}`), {
        code: "STAGE5C_MISSING_5B_TAG",
        details: { function_id: fn.function_id }
      });
    }

    const inheritedRefs = unique([
      ...asArray(fn.source_window_refs),
      ...asArray(tag.source_window_refs),
      ...asArray(packet.source_window_refs)
    ]);
    const inheritedWindows = collectWindowsForRefs(inheritedRefs, inheritedById);
    if (!inheritedWindows.length) {
      throw Object.assign(new Error("5C cannot build feature record without inherited 5A/5B windows."), {
        code: "STAGE5C_INVALID_SOURCE_WINDOW_REF",
        details: { function_id: fn.function_id, inheritedRefs }
      });
    }

    const pattern = patternForFeature(fn, tag, packet, inheritedWindows);
    const featureId = buildFeatureId(fn.function_id);
    const supplementalForFeature = [];
    const parentsForDataWindows = inheritedWindows.filter((window) => asArray(tag.supplemental_tag_window_refs).includes(window.window_id));
    const fallbackParents = parentsForDataWindows.length ? parentsForDataWindows : inheritedWindows.slice(0, 1);
    for (const parentWindow of fallbackParents) {
      const source = sourceMap.get(parentWindow.source_id);
      assertWindowIsVerbatim(source, parentWindow);
      const dataWindow = makeDataWindow({ source, parentWindow, pattern, featureId, functionId: fn.function_id, windowIndex: supplementalWindowIndex++ });
      supplementalEvidenceWindows.push(dataWindow);
      supplementalForFeature.push(dataWindow);
    }

    const { record, touchpoint, provenance } = buildFeatureRecord({ fn, tag, packet, pattern, inheritedWindows, supplementalWindows: supplementalForFeature });
    records.push(record);
    featureInputs.push(buildFeatureInput({ fn, tag, packet, inheritedWindows, supplementalWindows: supplementalForFeature }));
    featureUnknowns.push(...record.unknowns);
    dataProvenanceSeeds.push({ feature_id: record.feature_id, ...provenance });
    regulatedSurfaceSeeds.push({
      feature_id: record.feature_id,
      function_id: record.function_id,
      surface_tokens: record.surface_tokens,
      int_ext_classification: record.int_ext_classification,
      source_window_refs: record.evidence_window_refs
    });
    vaultQuestionSeeds.push(...record.unknowns.map((unknown) => ({
      feature_id: record.feature_id,
      field_path: unknown.field_path,
      question: unknown.question,
      source_window_refs: unknown.source_window_refs
    })));
  }

  validateStage5COutput({ canonicalInput, stage5a, stage5b, records, supplementalWindows: supplementalEvidenceWindows, featureUnknowns });

  const inheritedEvidenceWindows = allInheritedEvidenceWindows(stage5a, stage5b);
  const promptInput = buildStage5CPromptInput({ canonicalInput, stage5a, stage5b, inheritedEvidenceWindows, supplementalEvidenceWindows, featureInputs });

  return {
    ok: true,
    stage5c_output_version: STAGE5C_OUTPUT_VERSION,
    target_profile_ref: canonicalInput.target_profile_ref,
    complete_feature_records: records,
    feature_unknowns: featureUnknowns,
    data_provenance_seeds: dataProvenanceSeeds,
    regulated_surface_seeds: regulatedSurfaceSeeds,
    vault_question_seeds: vaultQuestionSeeds,
    supplemental_evidence_windows: supplementalEvidenceWindows,
    prompt_input: promptInput,
    validation: {
      ok: true,
      complete_feature_record_count: records.length,
      expected_feature_count: asArray(stage5a?.admitted_functions).length,
      supplemental_data_window_count: supplementalEvidenceWindows.length,
      every_record_has_data_touchpoints: records.every((record) => record.data_touchpoints.length > 0),
      every_record_has_data_provenance: records.every((record) => record.data_provenance.length > 0),
      every_record_has_inherited_and_supplemental_windows: records.every((record) => record.inherited_feature_window_refs.length && record.supplemental_tag_window_refs.length && record.supplemental_data_window_refs.length),
      merged_old_5c_and_old_5d: true,
      metadata_used_as_primary_source: false,
      index_used_as_primary_source: false,
      model_port_used: Boolean(modelPorts?.stage5c)
    },
    forensic_log: {
      substage: "5C",
      run_id: runContext?.runId || runContext?.run_id || null,
      model_port_used: Boolean(modelPorts?.stage5c),
      lossless_source_preserved: true,
      consumed_5a_windows: true,
      consumed_5b_windows: true,
      emitted_5d_handoff_windows: true,
      old_5c_feature_inventory_merged: true,
      old_5d_data_touchpoints_merged: true
    }
  };
}
