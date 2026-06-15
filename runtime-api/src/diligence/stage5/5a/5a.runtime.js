import { assertLosslessPrimaryEvidence, assertWindowIsVerbatim, createVerbatimSourceWindow } from "../stage5.runtime.js";
import { STAGE5_FEATURE_PATTERNS } from "../stage5.dictionary.js";
import { buildStage5APromptInput } from "./5a.prompt.js";

function lower(value) {
  return String(value || "").toLowerCase();
}

function findFirstTerm(text, terms) {
  const haystack = lower(text);
  for (const term of terms) {
    const index = haystack.indexOf(lower(term));
    if (index >= 0) return { term, index };
  }
  return null;
}

function windowRange(text, index, radius = 900) {
  return {
    char_start: Math.max(0, index - radius),
    char_end: Math.min(text.length, index + radius)
  };
}

export async function runStage5A({ canonicalInput, modelPorts = {}, runContext = {} } = {}) {
  assertLosslessPrimaryEvidence(canonicalInput);
  const windows = [];
  const admitted = [];
  const rejected = [];
  const coreProducts = [];
  let windowIndex = 1;
  let functionIndex = 1;

  for (const source of canonicalInput.primary_evidence.sources) {
    for (const pattern of STAGE5_FEATURE_PATTERNS) {
      const match = findFirstTerm(source.clean_text_lossless, pattern.terms);
      if (!match) continue;
      const window = createVerbatimSourceWindow(source, windowRange(source.clean_text_lossless, match.index), {
        created_by_substage: "5A",
        window_index: windowIndex++,
        used_for: ["product_function_admission"],
        selection_reason: `${pattern.key} capability text`
      });
      const functionId = `S5A_FUNC_${String(functionIndex++).padStart(3, "0")}_${pattern.key.toUpperCase()}`;
      windows.push(window);
      admitted.push({
        function_id: functionId,
        core_product_id: `CORE_${pattern.key.toUpperCase()}`,
        core_product_name: pattern.name,
        product_family_label: canonicalInput.primary_evidence.family_label,
        function_name: pattern.name,
        function_type: pattern.function_type,
        primary_or_secondary: "primary",
        commercial_function: pattern.name,
        actor_or_user: "developer or customer user",
        input_signal: pattern.input_data.join(", "),
        system_action: pattern.system_action,
        output_or_result: pattern.output_or_result,
        why_admitted: `Matched ${match.term} in verbatim source window.`,
        why_not_product_only: "The source describes an actionable product/API capability.",
        admission_confidence: "high",
        source_window_refs: [window.window_id]
      });
      coreProducts.push({ core_product_id: `CORE_${pattern.key.toUpperCase()}`, core_product_name: pattern.name, source_window_refs: [window.window_id] });
    }
  }

  const promptInput = buildStage5APromptInput({
    canonicalInput,
    sourceWindows: windows,
    candidateHints: admitted.map((row) => ({ function_id: row.function_id, function_name: row.function_name, source_window_refs: row.source_window_refs }))
  });
  if (!admitted.length) {
    const error = new Error("5A found no product/API capability functions in lossless product-family source.");
    error.code = "STAGE5A_NO_ADMITTED_FUNCTIONS";
    throw error;
  }
  const windowIds = new Set(windows.map((window) => window.window_id));
  for (const row of admitted) {
    if (!row.function_id || !row.source_window_refs.length || row.source_window_refs.some((ref) => !windowIds.has(ref))) {
      const error = new Error("5A admitted function lacks valid source_window_refs.");
      error.code = "STAGE5A_SOURCE_WINDOW_REF_VIOLATION";
      throw error;
    }
  }
  for (const window of windows) {
    const source = canonicalInput.primary_evidence.sources.find((row) => row.source_id === window.source_id);
    assertWindowIsVerbatim(source, window);
  }
  return {
    ok: true,
    stage5a_output_version: "stage5a_product_function_discovery_v2",
    target_profile_ref: canonicalInput.target_profile_ref,
    admitted_functions: admitted,
    core_products: [...new Map(coreProducts.map((row) => [row.core_product_id, row])).values()],
    rejected_or_uncertain_candidates: rejected,
    feature_evidence_windows: windows,
    prompt_input: promptInput,
    validation: { ok: true, admitted_function_count: admitted.length, source_window_count: windows.length },
    forensic_log: { substage: "5A", model_port_used: Boolean(modelPorts?.stage5a), run_id: runContext?.runId || null }
  };
}
