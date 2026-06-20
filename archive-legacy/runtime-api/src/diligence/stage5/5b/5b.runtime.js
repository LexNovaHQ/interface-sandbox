import { assertLosslessPrimaryEvidence, assertWindowIsVerbatim, createVerbatimSourceWindow, sourceById } from "../stage5.runtime.js";
import { buildStage5BPromptInput } from "./5b.prompt.js";
import {
  STAGE5B_ALLOWED_ARCHETYPE_CODES,
  STAGE5B_ALLOWED_SURFACE_TOKENS,
  STAGE5B_FAILURE_REASONS,
  STAGE5B_OUTPUT_VERSION,
  STAGE5B_TAGGING_PATTERNS,
  STAGE5B_WINDOW_POLICY
} from "./5b.dictionary.js";

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

function intersectsAllowed(values = [], allowed = []) {
  const allowedSet = new Set(allowed);
  return asArray(values).filter((value) => allowedSet.has(value));
}

function inheritedWindowMap(stage5a = {}) {
  return new Map(asArray(stage5a.feature_evidence_windows).map((window) => [window.window_id, window]));
}

function findPatternForFunction(fn = {}, inheritedWindows = []) {
  const haystack = lower([
    fn.function_id,
    fn.candidate_key,
    fn.function_name,
    fn.core_product_name,
    fn.commercial_function,
    fn.input_signal,
    fn.system_action,
    fn.output_or_result,
    ...asArray(inheritedWindows).map((window) => window.verbatim_feature_text || window.verbatim_text)
  ].join(" "));

  return STAGE5B_TAGGING_PATTERNS.find((pattern) => {
    if (haystack.includes(lower(pattern.key))) return true;
    return asArray(pattern.function_name_terms).some((term) => haystack.includes(lower(term)));
  }) || null;
}

function classifyPattern(pattern = {}) {
  const archetypeCodes = intersectsAllowed(pattern.archetype_codes, STAGE5B_ALLOWED_ARCHETYPE_CODES);
  const surfaceTokens = intersectsAllowed(pattern.surface_tokens, STAGE5B_ALLOWED_SURFACE_TOKENS);
  return {
    archetype_codes: archetypeCodes,
    archetype_labels: archetypeCodes.map((code) => code.split("_").map((part) => part.charAt(0) + part.slice(1).toLowerCase()).join(" ")),
    surface_tokens: surfaceTokens,
    int_ext_classification: asText(pattern.int_ext_classification) || (surfaceTokens.includes("external_interaction") ? "external" : "both")
  };
}

function expandedRangeForWindow(source = {}, window = {}) {
  const radius = STAGE5B_WINDOW_POLICY.default_context_radius_chars;
  const minWindow = STAGE5B_WINDOW_POLICY.min_context_window_chars;
  const maxWindow = STAGE5B_WINDOW_POLICY.max_context_window_chars;
  const sourceLength = source.clean_text_lossless.length;
  const parentStart = Number(window.char_start || 0);
  const parentEnd = Number(window.char_end || parentStart + minWindow);
  const center = Math.floor((parentStart + parentEnd) / 2);
  const desiredSize = Math.min(maxWindow, Math.max(minWindow, parentEnd - parentStart + radius));
  const charStart = Math.max(0, center - Math.floor(desiredSize / 2));
  const charEnd = Math.min(sourceLength, Math.max(charStart + minWindow, charStart + desiredSize));
  return { char_start: charStart, char_end: charEnd };
}

function makeTagWindow({ source, inheritedWindow, pattern, windowIndex }) {
  const tagWindow = createVerbatimSourceWindow(source, expandedRangeForWindow(source, inheritedWindow), {
    created_by_substage: "5B",
    window_index: windowIndex,
    used_for: STAGE5B_WINDOW_POLICY.supplemental_used_for,
    selection_reason: `${pattern.key} archetype/surface tagging context expanded from 5A window ${inheritedWindow.window_id}`
  });
  tagWindow.window_type = STAGE5B_WINDOW_POLICY.supplemental_window_type;
  tagWindow.parent_window_id = inheritedWindow.window_id;
  tagWindow.pattern_key = pattern.key;
  tagWindow.verbatim_tagging_text = tagWindow.verbatim_text;
  return tagWindow;
}

function failure(functionId, reason, details = {}) {
  return {
    function_id: functionId || null,
    reason,
    details
  };
}

function validateInheritedWindow({ source, window, functionId }) {
  if (!window) {
    throw Object.assign(new Error("5B function references a missing 5A evidence window."), {
      code: "STAGE5B_SOURCE_WINDOW_REF_VIOLATION",
      details: { function_id: functionId }
    });
  }
  assertWindowIsVerbatim(source, window);
  if (!asText(window.verbatim_text) || window.verbatim_text === window.source_url || window.verbatim_text === window.source_title) {
    throw Object.assign(new Error("5B cannot use metadata-only inherited window evidence."), {
      code: "STAGE5B_METADATA_AS_EVIDENCE_BLOCKED",
      details: { function_id: functionId, window_id: window.window_id }
    });
  }
  return true;
}

function buildFeaturePacket({ fn, pattern, inheritedWindows, supplementalWindows }) {
  return {
    function_id: fn.function_id,
    core_product_id: fn.core_product_id,
    core_product_name: fn.core_product_name,
    function_name: fn.function_name,
    matched_pattern_key: pattern.key,
    inherited_feature_window_refs: inheritedWindows.map((window) => window.window_id),
    supplemental_tag_window_refs: supplementalWindows.map((window) => window.window_id),
    source_window_refs: unique([
      ...inheritedWindows.map((window) => window.window_id),
      ...supplementalWindows.map((window) => window.window_id)
    ])
  };
}

function buildTagRow({ fn, pattern, inheritedWindows, supplementalWindows }) {
  const classification = classifyPattern(pattern);
  return {
    function_id: fn.function_id,
    core_product_id: fn.core_product_id,
    core_product_name: fn.core_product_name,
    function_name: fn.function_name,
    archetype_codes: classification.archetype_codes,
    archetype_labels: classification.archetype_labels,
    surface_tokens: classification.surface_tokens,
    int_ext_classification: classification.int_ext_classification,
    rationale: asText(pattern.rationale_template) || "Controlled archetype/surface tags assigned from cited verbatim feature evidence windows.",
    confidence: "high",
    inherited_feature_window_refs: inheritedWindows.map((window) => window.window_id),
    supplemental_tag_window_refs: supplementalWindows.map((window) => window.window_id),
    source_window_refs: unique([
      ...inheritedWindows.map((window) => window.window_id),
      ...supplementalWindows.map((window) => window.window_id)
    ]),
    metadata_used_as_primary_source: false,
    index_used_as_primary_source: false
  };
}

async function maybeRunModel(modelPort, promptInput) {
  if (!modelPort) return null;
  if (typeof modelPort === "function") return modelPort(promptInput);
  if (typeof modelPort.run === "function") return modelPort.run(promptInput);
  if (typeof modelPort.generateObject === "function") return modelPort.generateObject(promptInput);
  return null;
}

function normalizeModelTag(row = {}, deterministicByFunctionId = new Map()) {
  const base = deterministicByFunctionId.get(row.function_id);
  if (!base) return null;
  const archetypeCodes = intersectsAllowed(row.archetype_codes?.length ? row.archetype_codes : base.archetype_codes, STAGE5B_ALLOWED_ARCHETYPE_CODES);
  const surfaceTokens = intersectsAllowed(row.surface_tokens?.length ? row.surface_tokens : base.surface_tokens, STAGE5B_ALLOWED_SURFACE_TOKENS);
  return {
    ...base,
    ...row,
    archetype_codes: archetypeCodes,
    surface_tokens: surfaceTokens,
    inherited_feature_window_refs: unique(row.inherited_feature_window_refs?.length ? row.inherited_feature_window_refs : base.inherited_feature_window_refs),
    supplemental_tag_window_refs: unique(row.supplemental_tag_window_refs?.length ? row.supplemental_tag_window_refs : base.supplemental_tag_window_refs),
    source_window_refs: unique(row.source_window_refs?.length ? row.source_window_refs : base.source_window_refs),
    metadata_used_as_primary_source: false,
    index_used_as_primary_source: false
  };
}

function validateStage5BOutput({ canonicalInput, stage5a, featureTags, supplementalWindows, failures }) {
  assertLosslessPrimaryEvidence(canonicalInput);
  const sources = sourceById(canonicalInput);
  const inherited = inheritedWindowMap(stage5a);
  const supplemental = new Map(asArray(supplementalWindows).map((window) => [window.window_id, window]));
  const allWindows = new Map([...inherited, ...supplemental]);

  if (!asArray(stage5a?.admitted_functions).length) {
    throw Object.assign(new Error("5B requires 5A admitted functions."), { code: "STAGE5B_MISSING_STAGE5A_OUTPUT" });
  }
  if (failures.length) {
    throw Object.assign(new Error("5B has blocking tagging failures."), { code: "STAGE5B_BLOCKING_TAGGING_FAILURES", details: { failures } });
  }
  if (featureTags.length !== asArray(stage5a.admitted_functions).length) {
    throw Object.assign(new Error("5B must tag every 5A admitted function."), {
      code: "STAGE5B_FUNCTION_COVERAGE_FAILURE",
      details: { expected: stage5a.admitted_functions.length, actual: featureTags.length }
    });
  }

  for (const window of allWindows.values()) {
    const source = sources.get(window.source_id);
    assertWindowIsVerbatim(source, window);
  }

  const allowedArchetypes = new Set(STAGE5B_ALLOWED_ARCHETYPE_CODES);
  const allowedSurfaces = new Set(STAGE5B_ALLOWED_SURFACE_TOKENS);
  for (const tag of featureTags) {
    const refs = unique(tag.source_window_refs);
    if (!refs.length || refs.some((ref) => !allWindows.has(ref))) {
      throw Object.assign(new Error("5B tag has invalid source_window_refs."), {
        code: "STAGE5B_SOURCE_WINDOW_REF_VIOLATION",
        details: { function_id: tag.function_id, refs }
      });
    }
    if (!tag.inherited_feature_window_refs?.length || tag.inherited_feature_window_refs.some((ref) => !inherited.has(ref))) {
      throw Object.assign(new Error("5B tag must cite inherited 5A feature evidence windows."), {
        code: "STAGE5B_INHERITED_WINDOW_REQUIRED",
        details: { function_id: tag.function_id }
      });
    }
    if (!tag.supplemental_tag_window_refs?.length || tag.supplemental_tag_window_refs.some((ref) => !supplemental.has(ref))) {
      throw Object.assign(new Error("5B tag must cite supplemental 5B tag-context windows."), {
        code: "STAGE5B_SUPPLEMENTAL_WINDOW_REQUIRED",
        details: { function_id: tag.function_id }
      });
    }
    if (!tag.archetype_codes?.length || tag.archetype_codes.some((code) => !allowedArchetypes.has(code))) {
      throw Object.assign(new Error("5B tag uses missing or non-controlled archetype code."), {
        code: "STAGE5B_CONTROLLED_VALUE_VIOLATION",
        details: { function_id: tag.function_id, archetype_codes: tag.archetype_codes }
      });
    }
    if (!tag.surface_tokens?.length || tag.surface_tokens.some((token) => !allowedSurfaces.has(token))) {
      throw Object.assign(new Error("5B tag uses missing or non-controlled surface token."), {
        code: "STAGE5B_CONTROLLED_VALUE_VIOLATION",
        details: { function_id: tag.function_id, surface_tokens: tag.surface_tokens }
      });
    }
    if (tag.metadata_used_as_primary_source || tag.index_used_as_primary_source) {
      throw Object.assign(new Error("5B tag cannot use metadata/index as primary evidence."), {
        code: "STAGE5B_METADATA_OR_INDEX_AS_EVIDENCE_BLOCKED",
        details: { function_id: tag.function_id }
      });
    }
  }
  return true;
}

export async function runStage5B({ canonicalInput, stage5a, registryPorts = {}, modelPorts = {}, runContext = {} } = {}) {
  assertLosslessPrimaryEvidence(canonicalInput);

  const inheritedById = inheritedWindowMap(stage5a);
  const sourceMap = sourceById(canonicalInput);
  const featureTags = [];
  const featurePackets = [];
  const supplementalEvidenceWindows = [];
  const failures = [];
  let supplementalWindowIndex = 1;

  for (const fn of asArray(stage5a?.admitted_functions)) {
    const refs = unique(fn.source_window_refs);
    if (!refs.length) {
      failures.push(failure(fn.function_id, STAGE5B_FAILURE_REASONS.MISSING_5A_WINDOW_REFS));
      continue;
    }

    const inheritedWindows = [];
    for (const ref of refs) {
      const window = inheritedById.get(ref);
      if (!window) {
        failures.push(failure(fn.function_id, STAGE5B_FAILURE_REASONS.INVALID_5A_WINDOW_REF, { ref }));
        continue;
      }
      const source = sourceMap.get(window.source_id);
      validateInheritedWindow({ source, window, functionId: fn.function_id });
      inheritedWindows.push(window);
    }
    if (!inheritedWindows.length) continue;

    const pattern = findPatternForFunction(fn, inheritedWindows);
    if (!pattern) {
      failures.push(failure(fn.function_id, STAGE5B_FAILURE_REASONS.NO_CONTROLLED_TAGS, { function_name: fn.function_name }));
      continue;
    }

    const supplementalForFunction = [];
    for (const inheritedWindow of inheritedWindows) {
      const source = sourceMap.get(inheritedWindow.source_id);
      const tagWindow = makeTagWindow({ source, inheritedWindow, pattern, windowIndex: supplementalWindowIndex++ });
      supplementalEvidenceWindows.push(tagWindow);
      supplementalForFunction.push(tagWindow);
    }

    const tag = buildTagRow({ fn, pattern, inheritedWindows, supplementalWindows: supplementalForFunction });
    featureTags.push(tag);
    featurePackets.push(buildFeaturePacket({ fn, pattern, inheritedWindows, supplementalWindows: supplementalForFunction }));
  }

  const inheritedEvidenceWindows = asArray(stage5a?.feature_evidence_windows);
  const promptInput = buildStage5BPromptInput({ canonicalInput, stage5a, inheritedEvidenceWindows, supplementalEvidenceWindows, featurePackets });
  const modelResult = await maybeRunModel(modelPorts?.stage5b, promptInput);
  const deterministicByFunctionId = new Map(featureTags.map((row) => [row.function_id, row]));
  const modelTags = asArray(modelResult?.feature_tags)
    .map((row) => normalizeModelTag(row, deterministicByFunctionId))
    .filter(Boolean);
  const finalTags = modelTags.length === featureTags.length ? modelTags : featureTags;

  validateStage5BOutput({ canonicalInput, stage5a, featureTags: finalTags, supplementalWindows: supplementalEvidenceWindows, failures });

  return {
    ok: true,
    stage5b_output_version: STAGE5B_OUTPUT_VERSION,
    target_profile_ref: canonicalInput.target_profile_ref,
    feature_tags: finalTags,
    tagging_failures: failures,
    inherited_feature_evidence_windows: inheritedEvidenceWindows,
    supplemental_evidence_windows: supplementalEvidenceWindows,
    feature_packets_for_5c: featurePackets,
    prompt_input: promptInput,
    validation: {
      ok: true,
      tagged_feature_count: finalTags.length,
      expected_feature_count: asArray(stage5a?.admitted_functions).length,
      inherited_window_count: inheritedEvidenceWindows.length,
      supplemental_window_count: supplementalEvidenceWindows.length,
      every_tag_has_inherited_and_supplemental_windows: finalTags.every((row) => row.inherited_feature_window_refs.length && row.supplemental_tag_window_refs.length),
      registry_port_used: Boolean(registryPorts?.stage5b),
      metadata_used_as_primary_source: false,
      index_used_as_primary_source: false
    },
    forensic_log: {
      substage: "5B",
      run_id: runContext?.runId || runContext?.run_id || null,
      model_port_used: Boolean(modelPorts?.stage5b),
      lossless_source_preserved: true,
      consumed_5a_verbatim_feature_windows: true,
      emitted_5c_handoff_windows: true
    }
  };
}
