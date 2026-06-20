import { assertLosslessPrimaryEvidence, assertWindowIsVerbatim, createVerbatimSourceWindow } from "../stage5.runtime.js";
import { STAGE5_FEATURE_PATTERNS } from "../stage5.dictionary.js";
import { buildStage5APromptInput } from "./5a.prompt.js";
import { STAGE5A_FUNCTION_STATUSES, STAGE5A_OUTPUT_VERSION, STAGE5A_WINDOW_POLICY } from "./5a.dictionary.js";

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

function sourceText(source = {}) {
  return typeof source.clean_text_lossless === "string" ? source.clean_text_lossless : "";
}

function findPatternMatches(text, pattern) {
  const haystack = lower(text);
  const matches = [];
  for (const term of asArray(pattern.terms)) {
    const needle = lower(term);
    if (!needle) continue;
    const index = haystack.indexOf(needle);
    if (index >= 0) matches.push({ term, index });
  }
  return matches.sort((a, b) => a.index - b.index).slice(0, STAGE5A_WINDOW_POLICY.max_windows_per_source_pattern);
}

function expandWindowRange(text, index, term = "") {
  const radius = STAGE5A_WINDOW_POLICY.default_radius_chars;
  const minWindow = STAGE5A_WINDOW_POLICY.min_window_chars;
  const maxWindow = STAGE5A_WINDOW_POLICY.max_window_chars;
  const centerStart = Math.max(0, index - radius);
  const centerEnd = Math.min(text.length, index + Math.max(radius, term.length + minWindow));
  const requestedSize = Math.min(maxWindow, Math.max(minWindow, centerEnd - centerStart));
  const midpoint = Math.max(0, index + Math.floor(term.length / 2));
  const charStart = Math.max(0, midpoint - Math.floor(requestedSize / 2));
  const charEnd = Math.min(text.length, Math.max(charStart + minWindow, charStart + requestedSize));
  return { char_start: charStart, char_end: charEnd };
}

function candidateKey(source, pattern) {
  return `${source.source_id}::${pattern.key}`;
}

function buildFunctionId(index, pattern) {
  return `S5A_FUNC_${String(index).padStart(3, "0")}_${String(pattern.key || "FUNCTION").toUpperCase()}`;
}

function buildCoreProductId(pattern) {
  return `CORE_${String(pattern.key || "PRODUCT").toUpperCase()}`;
}

function mechanicsFromPattern(pattern = {}) {
  return {
    actor_or_user: pattern.function_type === "api_capability" ? "developer or customer user" : "end user or configured operator",
    input_signal: unique(pattern.input_data).join(", ") || "not expressly categorized",
    system_action: asText(pattern.system_action) || "performs the described product capability",
    output_or_result: asText(pattern.output_or_result) || "product output or result"
  };
}

function createCandidate({ source, pattern, match, window, functionIndex }) {
  const mechanics = mechanicsFromPattern(pattern);
  const functionId = buildFunctionId(functionIndex, pattern);
  return {
    function_id: functionId,
    status: STAGE5A_FUNCTION_STATUSES.ADMITTED,
    candidate_key: candidateKey(source, pattern),
    core_product_id: buildCoreProductId(pattern),
    core_product_name: asText(pattern.name),
    product_family_label: "Product / Feature Source Family",
    function_name: asText(pattern.name),
    function_type: asText(pattern.function_type) || "product_capability",
    primary_or_secondary: "primary",
    commercial_function: asText(pattern.name),
    actor_or_user: mechanics.actor_or_user,
    input_signal: mechanics.input_signal,
    system_action: mechanics.system_action,
    output_or_result: mechanics.output_or_result,
    matched_term: match.term,
    why_admitted: `Matched ${match.term} inside a verbatim product-family source window.`,
    why_not_product_only: "The cited source window describes an actionable capability or API behavior, not merely a brand or marketing label.",
    admission_confidence: "high",
    source_window_refs: [window.window_id],
    evidence_summary_for_humans_only: "See cited verbatim feature evidence window; this summary is not evidence."
  };
}

function validateStage5AOutput({ canonicalInput, admittedFunctions, evidenceWindows }) {
  assertLosslessPrimaryEvidence(canonicalInput);
  const sources = new Map(canonicalInput.primary_evidence.sources.map((source) => [source.source_id, source]));
  const windowIds = new Set(evidenceWindows.map((window) => window.window_id));
  if (!admittedFunctions.length) {
    const error = new Error("5A found no product/API capability functions in lossless product-family source.");
    error.code = "STAGE5A_NO_ADMITTED_FUNCTIONS";
    throw error;
  }
  for (const window of evidenceWindows) {
    const source = sources.get(window.source_id);
    assertWindowIsVerbatim(source, window);
    if (!window.verbatim_text || window.verbatim_text === window.source_url || window.verbatim_text === window.source_title) {
      const error = new Error("5A window cannot be metadata-only evidence.");
      error.code = "STAGE5A_METADATA_AS_EVIDENCE_BLOCKED";
      error.details = { window_id: window.window_id };
      throw error;
    }
  }
  for (const row of admittedFunctions) {
    const refs = asArray(row.source_window_refs);
    if (!row.function_id || row.status !== STAGE5A_FUNCTION_STATUSES.ADMITTED || !refs.length || refs.some((ref) => !windowIds.has(ref))) {
      const error = new Error("5A admitted function lacks valid verbatim source_window_refs.");
      error.code = "STAGE5A_SOURCE_WINDOW_REF_VIOLATION";
      error.details = { function_id: row.function_id || null, refs };
      throw error;
    }
  }
  return true;
}

function normalizeModelCandidate(row = {}, deterministicByFunctionId = new Map()) {
  const base = deterministicByFunctionId.get(row.function_id) || null;
  if (!base) return null;
  const refs = unique(row.source_window_refs?.length ? row.source_window_refs : base.source_window_refs);
  return {
    ...base,
    ...row,
    status: STAGE5A_FUNCTION_STATUSES.ADMITTED,
    source_window_refs: refs,
    why_admitted: asText(row.why_admitted) || base.why_admitted,
    admission_confidence: asText(row.admission_confidence) || base.admission_confidence
  };
}

async function maybeRunModel(modelPort, promptInput) {
  if (!modelPort) return null;
  if (typeof modelPort === "function") return modelPort(promptInput);
  if (typeof modelPort.run === "function") return modelPort.run(promptInput);
  if (typeof modelPort.generateObject === "function") return modelPort.generateObject(promptInput);
  return null;
}

function buildCoreProducts(admittedFunctions = []) {
  const byId = new Map();
  for (const row of admittedFunctions) {
    const current = byId.get(row.core_product_id) || {
      core_product_id: row.core_product_id,
      core_product_name: row.core_product_name,
      function_ids: [],
      source_window_refs: []
    };
    current.function_ids = unique([...current.function_ids, row.function_id]);
    current.source_window_refs = unique([...current.source_window_refs, ...row.source_window_refs]);
    byId.set(row.core_product_id, current);
  }
  return [...byId.values()];
}

export async function runStage5A({ canonicalInput, modelPorts = {}, runContext = {} } = {}) {
  assertLosslessPrimaryEvidence(canonicalInput);

  const sourceWindows = [];
  const deterministicCandidates = [];
  const rejectedOrUncertain = [];
  const seenCandidateKeys = new Set();
  let windowIndex = 1;
  let functionIndex = 1;

  for (const source of canonicalInput.primary_evidence.sources) {
    const text = sourceText(source);
    for (const pattern of STAGE5_FEATURE_PATTERNS) {
      const matches = findPatternMatches(text, pattern);
      for (const match of matches) {
        const key = candidateKey(source, pattern);
        if (seenCandidateKeys.has(key)) continue;
        seenCandidateKeys.add(key);
        const window = createVerbatimSourceWindow(source, expandWindowRange(text, match.index, match.term), {
          created_by_substage: "5A",
          window_index: windowIndex++,
          used_for: ["product_function_admission", "5b_feature_evidence_handoff"],
          selection_reason: `${pattern.key} capability text matched term: ${match.term}`
        });
        window.window_type = "FEATURE_CAPABILITY_WINDOW";
        window.pattern_key = pattern.key;
        window.verbatim_feature_text = window.verbatim_text;
        sourceWindows.push(window);
        deterministicCandidates.push(createCandidate({ source, pattern, match, window, functionIndex: functionIndex++ }));
      }
    }
  }

  const candidateHints = deterministicCandidates.map((row) => ({
    function_id: row.function_id,
    candidate_key: row.candidate_key,
    function_name: row.function_name,
    core_product_name: row.core_product_name,
    matched_term: row.matched_term,
    source_window_refs: row.source_window_refs
  }));

  const promptInput = buildStage5APromptInput({ canonicalInput, sourceWindows, candidateHints });
  const modelResult = await maybeRunModel(modelPorts?.stage5a, promptInput);
  const deterministicByFunctionId = new Map(deterministicCandidates.map((row) => [row.function_id, row]));
  const modelAdmitted = asArray(modelResult?.admitted_functions)
    .map((row) => normalizeModelCandidate(row, deterministicByFunctionId))
    .filter(Boolean);

  const admittedFunctions = modelAdmitted.length ? modelAdmitted : deterministicCandidates;
  validateStage5AOutput({ canonicalInput, admittedFunctions, evidenceWindows: sourceWindows });

  return {
    ok: true,
    stage5a_output_version: STAGE5A_OUTPUT_VERSION,
    target_profile_ref: canonicalInput.target_profile_ref,
    admitted_functions: admittedFunctions,
    core_products: buildCoreProducts(admittedFunctions),
    rejected_or_uncertain_candidates: rejectedOrUncertain,
    feature_evidence_windows: sourceWindows,
    prompt_input: promptInput,
    validation: {
      ok: true,
      admitted_function_count: admittedFunctions.length,
      source_window_count: sourceWindows.length,
      every_function_has_verbatim_window_refs: admittedFunctions.every((row) => asArray(row.source_window_refs).length > 0),
      metadata_used_as_primary_source: false,
      index_used_as_primary_source: false
    },
    forensic_log: {
      substage: "5A",
      run_id: runContext?.runId || null,
      model_port_used: Boolean(modelPorts?.stage5a),
      source_count: canonicalInput.primary_evidence.sources.length,
      candidate_hint_count: candidateHints.length,
      lossless_source_preserved: true,
      handoff_to_5b_contains_verbatim_feature_windows: true
    }
  };
}
