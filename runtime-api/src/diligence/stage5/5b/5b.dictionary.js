export const STAGE5B_OUTPUT_VERSION = "stage5b_archetype_surface_tagging_v3";

export const STAGE5B_WINDOW_POLICY = Object.freeze({
  inherited_window_required_use: "5b_feature_evidence_handoff",
  supplemental_window_type: "TAGGING_CONTEXT_WINDOW",
  default_context_radius_chars: 700,
  min_context_window_chars: 500,
  max_context_window_chars: 2200,
  supplemental_used_for: ["archetype_surface_tagging", "5c_feature_record_handoff"]
});

export const STAGE5B_FAILURE_REASONS = Object.freeze({
  MISSING_STAGE5A_OUTPUT: "missing_stage5a_output",
  MISSING_ADMITTED_FUNCTIONS: "missing_5a_admitted_functions",
  MISSING_5A_WINDOW_REFS: "missing_5a_source_window_refs",
  INVALID_5A_WINDOW_REF: "invalid_5a_source_window_ref",
  NON_VERBATIM_WINDOW: "non_verbatim_source_window",
  METADATA_AS_EVIDENCE: "metadata_or_index_used_as_evidence",
  NO_CONTROLLED_TAGS: "no_controlled_archetype_or_surface_tags"
});

export const STAGE5B_ALLOWED_ARCHETYPE_CODES = Object.freeze([
  "CONTENT_TRANSFORMATION",
  "CONTENT_GENERATION",
  "DOCUMENT_INTELLIGENCE",
  "AGENTIC_INTERFACE"
]);

export const STAGE5B_ALLOWED_SURFACE_TOKENS = Object.freeze([
  "developer_api",
  "audio_input",
  "audio_output",
  "text_input",
  "text_output",
  "document_input",
  "api_payload_output",
  "voice_interface",
  "external_interaction",
  "workflow_action"
]);

export const STAGE5B_ARCHETYPE_LABELS = Object.freeze({
  CONTENT_TRANSFORMATION: "Content transformation",
  CONTENT_GENERATION: "Content generation",
  DOCUMENT_INTELLIGENCE: "Document intelligence",
  AGENTIC_INTERFACE: "Agentic interface"
});

export const STAGE5B_TAGGING_PATTERNS = Object.freeze([
  {
    key: "speech_to_text",
    function_name_terms: ["speech-to-text", "speech to text", "transcription", "transcribe", "speech recognition"],
    archetype_codes: ["CONTENT_TRANSFORMATION"],
    surface_tokens: ["audio_input", "text_output", "developer_api"],
    int_ext_classification: "external",
    rationale_template: "Speech/audio input is transformed into text output through a developer-facing product/API surface."
  },
  {
    key: "text_to_speech",
    function_name_terms: ["text-to-speech", "text to speech", "tts", "speech synthesis", "voice generation"],
    archetype_codes: ["CONTENT_GENERATION"],
    surface_tokens: ["text_input", "audio_output", "developer_api"],
    int_ext_classification: "external",
    rationale_template: "Text input is used to generate speech/audio output through a developer-facing product/API surface."
  },
  {
    key: "document_digitisation",
    function_name_terms: ["document digitisation", "document digitization", "document extraction", "document parsing", "ocr"],
    archetype_codes: ["DOCUMENT_INTELLIGENCE"],
    surface_tokens: ["document_input", "api_payload_output", "developer_api"],
    int_ext_classification: "external",
    rationale_template: "Document input is parsed or extracted into structured data through an API/product capability."
  },
  {
    key: "translation",
    function_name_terms: ["translation", "translate", "machine translation"],
    archetype_codes: ["CONTENT_TRANSFORMATION"],
    surface_tokens: ["text_input", "text_output", "developer_api"],
    int_ext_classification: "external",
    rationale_template: "Text/content is transformed from one language form into another."
  },
  {
    key: "voice_agent",
    function_name_terms: ["voice agent", "conversational agent", "voice assistant", "call automation", "agent response"],
    archetype_codes: ["AGENTIC_INTERFACE"],
    surface_tokens: ["voice_interface", "external_interaction", "workflow_action"],
    int_ext_classification: "external",
    rationale_template: "The feature exposes an interactive agentic/voice interface capable of external interaction or workflow action."
  }
]);

export const STAGE5B_FIELD_DERIVATION_RULES = Object.freeze({
  feature_tags: "One tag row per 5A admitted function. 5B cannot create/drop functions.",
  archetype_codes: "Controlled codes selected from STAGE5B_ALLOWED_ARCHETYPE_CODES using 5A feature windows plus 5B TAGGING_CONTEXT_WINDOW windows.",
  surface_tokens: "Controlled tokens selected from STAGE5B_ALLOWED_SURFACE_TOKENS using cited feature behavior, data surface, and delivery context.",
  int_ext_classification: "Derived from controlled surface_tokens; external_interaction/workflow_action usually external, otherwise both unless source-window evidence narrows it.",
  inherited_feature_window_refs: "Must point to 5A FEATURE_CAPABILITY_WINDOW refs. These are primary evidence inherited from 5A.",
  supplemental_tag_window_refs: "Must point to 5B TAGGING_CONTEXT_WINDOW refs created from full source custody.",
  feature_packets_for_5c: "Handoff packet to 5C carrying function identity and all 5A/5B evidence-window refs."
});

export const STAGE5B_REINVESTIGATION_RULES = Object.freeze({
  missing_5a_output: "Ask 5A to reinvestigate product-function discovery first.",
  missing_5a_window_refs: "Ask 5A to regenerate verbatim feature windows before tagging.",
  no_controlled_tags: "Ask 5B to expand tag-context windows from full clean_text_lossless before falling back.",
  invalid_controlled_value: "Reject non-controlled values and request 5B retagging from dictionary-controlled vocabulary.",
  metadata_or_index_detected: "Reject the tag row and request reinvestigation from source windows."
});

export const STAGE5B_DICTIONARY = Object.freeze({
  substage: "5B",
  output_version: STAGE5B_OUTPUT_VERSION,
  purpose: "Tag every 5A admitted function with controlled archetype and surface vocabulary using 5A verbatim feature windows plus optional 5B supplemental verbatim windows.",
  evidence_rule: {
    primary_evidence: "5A admitted function + 5A verbatim feature evidence windows + full product-family clean_text_lossless source custody",
    metadata_sidecar: "reference_only",
    navigation_index_sidecar: "navigation_only",
    forbidden: [
      "metadata_as_primary_evidence",
      "index_as_primary_evidence",
      "tagging_without_source_window_refs",
      "tagging_from_source_url_or_title_only",
      "non_controlled_archetype_codes",
      "non_controlled_surface_tokens"
    ]
  },
  allowed_archetype_codes: STAGE5B_ALLOWED_ARCHETYPE_CODES,
  archetype_labels: STAGE5B_ARCHETYPE_LABELS,
  allowed_surface_tokens: STAGE5B_ALLOWED_SURFACE_TOKENS,
  tagging_patterns: STAGE5B_TAGGING_PATTERNS,
  window_policy: STAGE5B_WINDOW_POLICY,
  failure_reasons: STAGE5B_FAILURE_REASONS,
  field_derivation_rules: STAGE5B_FIELD_DERIVATION_RULES,
  reinvestigation_rules: STAGE5B_REINVESTIGATION_RULES
});
