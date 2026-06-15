import { assertLosslessPrimaryEvidence, assertWindowIsVerbatim } from "../stage5.runtime.js";
import { STAGE5_FEATURE_PATTERNS } from "../stage5.dictionary.js";
import { buildStage5BPromptInput } from "./5b.prompt.js";

function patternForFunction(row = {}) {
  const haystack = `${row.function_id} ${row.function_name} ${row.system_action}`.toLowerCase();
  return STAGE5_FEATURE_PATTERNS.find((pattern) => haystack.includes(pattern.key) || pattern.terms.some((term) => haystack.includes(term.toLowerCase()))) || STAGE5_FEATURE_PATTERNS[0];
}

export async function runStage5B({ canonicalInput, stage5a, registryPorts = {}, modelPorts = {}, runContext = {} } = {}) {
  assertLosslessPrimaryEvidence(canonicalInput);
  const inheritedWindows = stage5a?.feature_evidence_windows || [];
  const windowIds = new Set(inheritedWindows.map((window) => window.window_id));
  const featureTags = [];
  const failures = [];

  for (const fn of stage5a?.admitted_functions || []) {
    if (!fn.source_window_refs?.length) {
      failures.push({ function_id: fn.function_id, reason: "missing_5a_source_windows" });
      continue;
    }
    const pattern = patternForFunction(fn);
    featureTags.push({
      function_id: fn.function_id,
      archetype_codes: pattern.archetype_codes,
      archetype_labels: pattern.archetype_labels,
      surface_tokens: pattern.surface_tokens,
      int_ext_classification: pattern.surface_tokens.includes("external_interaction") ? "external" : "both",
      rationale: "Tags assigned from 5A admitted function behavior and cited verbatim windows.",
      confidence: "high",
      source_window_refs: fn.source_window_refs
    });
  }

  for (const tag of featureTags) {
    if (!tag.source_window_refs.length || tag.source_window_refs.some((ref) => !windowIds.has(ref))) {
      const error = new Error("5B tag has invalid source_window_refs.");
      error.code = "STAGE5B_SOURCE_WINDOW_REF_VIOLATION";
      throw error;
    }
  }
  for (const window of inheritedWindows) {
    const source = canonicalInput.primary_evidence.sources.find((row) => row.source_id === window.source_id);
    assertWindowIsVerbatim(source, window);
  }
  return {
    ok: true,
    stage5b_output_version: "stage5b_archetype_surface_tagging_v2",
    target_profile_ref: canonicalInput.target_profile_ref,
    feature_tags: featureTags,
    tagging_failures: failures,
    supplemental_evidence_windows: [],
    prompt_input: buildStage5BPromptInput({ canonicalInput, stage5a, evidenceWindows: inheritedWindows }),
    validation: { ok: failures.length === 0, tagged_feature_count: featureTags.length, registry_port_used: Boolean(registryPorts?.stage5b) },
    forensic_log: { substage: "5B", model_port_used: Boolean(modelPorts?.stage5b), run_id: runContext?.runId || null }
  };
}
