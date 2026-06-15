export function buildStage5PromptEnvelope({ canonicalInput, stage5a, stage5b, stage5c } = {}) {
  return {
    stage: "5",
    task: "canonical_lossless_windowed_runtime",
    target_profile_ref: canonicalInput?.target_profile_ref || {},
    upstream_profile_reference: canonicalInput?.upstream_profile || {},
    evidence_rule: "Use only verbatim source windows copied from clean_text_lossless. Metadata and indexes are reference only.",
    substage_outputs: { stage5a, stage5b, stage5c }
  };
}
