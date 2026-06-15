export const STAGE5_PROMPT_EVIDENCE_RULE = Object.freeze({
  primary_evidence_field: "clean_text_lossless",
  metadata_status: "reference_only",
  index_status: "navigation_only",
  source_window_status: "verbatim_exact_substring_only",
  forbidden: [
    "metadata_as_evidence",
    "index_as_evidence",
    "summary_windows",
    "hydrated_source_text",
    "normalized_source_text",
    "renamed_clean_text",
    "placeholder_evidence_refs",
    "placeholder_source_urls"
  ]
});

export function buildStage5PromptEnvelope({ canonicalInput, stage5a, stage5b, stage5c } = {}) {
  return {
    stage: "5",
    task: "canonical_lossless_windowed_runtime",
    target_profile_ref: canonicalInput?.target_profile_ref || {},
    upstream_profile_reference: canonicalInput?.upstream_profile || {},
    evidence_rule: STAGE5_PROMPT_EVIDENCE_RULE,
    model_instruction: [
      "Use only verbatim source windows copied from clean_text_lossless.",
      "Treat metadata and navigation indexes as reference-only sidecars.",
      "Do not infer evidence from URL, title, metadata, or index rows.",
      "Every material decision must cite source_window_refs.",
      "If the source window does not contain enough evidence, return NOT_EVIDENCED rather than guessing."
    ],
    source_custody_summary: {
      source_count: canonicalInput?.primary_evidence?.sources?.length || 0,
      sources: (canonicalInput?.primary_evidence?.sources || []).map((source) => ({
        source_id: source.source_id,
        source_url: source.source_url,
        source_title: source.source_title,
        clean_text_length: source.clean_text_lossless?.length || 0,
        source_sha256: source.source_sha256
      }))
    },
    substage_outputs: { stage5a, stage5b, stage5c }
  };
}
