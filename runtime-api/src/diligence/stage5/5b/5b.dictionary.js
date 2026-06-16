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

// LOCKED REGISTRY v3.0 archetype vocabulary. Do not add internal/product-feature labels here.
export const STAGE5B_ALLOWED_ARCHETYPE_CODES = Object.freeze([
  "UNI",
  "DOE",
  "JDG",
  "CMP",
  "CRT",
  "RDR",
  "ORC",
  "TRN",
  "SHD",
  "OPT",
  "MOV"
]);

// LOCKED REGISTRY v3.0 surface vocabulary. These are context surfaces, not UI/data-mechanics tokens.
export const STAGE5B_ALLOWED_SURFACE_TOKENS = Object.freeze([
  "Consumer-Public",
  "Enterprise-Private",
  "PII",
  "Employment",
  "Sensitive/Biometric",
  "Financial",
  "Content&IP",
  "Safety&Physical",
  "Infrastructure",
  "Minors"
]);

export const STAGE5B_ARCHETYPE_LABELS = Object.freeze({
  UNI: "Universal",
  DOE: "The Doer",
  JDG: "The Judge",
  CMP: "The Companion",
  CRT: "The Creator",
  RDR: "The Reader",
  ORC: "The Orchestrator",
  TRN: "The Translator",
  SHD: "The Shield",
  OPT: "The Optimizer",
  MOV: "The Mover"
});

export const STAGE5B_TAGGING_PATTERNS = Object.freeze([
  {
    key: "speech_to_text",
    function_name_terms: ["speech-to-text", "speech to text", "transcription", "transcribe", "speech recognition"],
    archetype_codes: ["TRN"],
    surface_tokens: ["PII", "Sensitive/Biometric", "Enterprise-Private", "Content&IP"],
    int_ext_classification: "external",
    rationale_template: "Speech/audio input is processed as a product input; registry archetype TRN applies to biometric/audio signal processing."
  },
  {
    key: "text_to_speech",
    function_name_terms: ["text-to-speech", "text to speech", "tts", "speech synthesis", "voice generation"],
    archetype_codes: ["CRT"],
    surface_tokens: ["Content&IP", "Enterprise-Private"],
    int_ext_classification: "external",
    rationale_template: "Text input is used to generate synthetic speech/audio output; registry archetype CRT applies to generated content output."
  },
  {
    key: "document_digitisation",
    function_name_terms: ["document digitisation", "document digitization", "document extraction", "document parsing", "ocr"],
    archetype_codes: ["RDR"],
    surface_tokens: ["PII", "Content&IP", "Enterprise-Private"],
    int_ext_classification: "external",
    rationale_template: "Document input is ingested and parsed; registry archetype RDR applies to products ingesting third-party or user-supplied data to function."
  },
  {
    key: "translation",
    function_name_terms: ["translation", "translate", "machine translation"],
    archetype_codes: ["CRT"],
    surface_tokens: ["PII", "Content&IP", "Enterprise-Private"],
    int_ext_classification: "external",
    rationale_template: "Text/content is used to generate translated output; registry archetype CRT applies to generated content output."
  },
  {
    key: "voice_agent",
    function_name_terms: ["voice agent", "conversational agent", "voice assistant", "call automation", "agent response"],
    archetype_codes: ["DOE", "TRN"],
    surface_tokens: ["PII", "Sensitive/Biometric", "Consumer-Public", "Enterprise-Private"],
    int_ext_classification: "external",
    rationale_template: "Voice agents process audio signals and may take workflow actions; registry archetypes TRN and DOE apply when those behaviours are evidenced."
  }
]);

export const STAGE5B_FIELD_DERIVATION_RULES = Object.freeze({
  feature_tags: "One tag row per 5A admitted function. 5B cannot create/drop functions.",
  archetype_codes: "Controlled codes selected only from the locked Registry v3.0 archetype vocabulary: UNI, DOE, JDG, CMP, CRT, RDR, ORC, TRN, SHD, OPT, MOV.",
  surface_tokens: "Controlled tokens selected only from locked Registry v3.0 Surface vocabulary: Consumer-Public, Enterprise-Private, PII, Employment, Sensitive/Biometric, Financial, Content&IP, Safety&Physical, Infrastructure, Minors.",
  int_ext_classification: "Derived from product delivery context and cited feature behaviour; never used as a substitute for Registry Archetype or Surface.",
  inherited_feature_window_refs: "Must point to 5A FEATURE_CAPABILITY_WINDOW refs. These are primary evidence inherited from 5A.",
  supplemental_tag_window_refs: "Must point to 5B TAGGING_CONTEXT_WINDOW refs created from full source custody.",
  feature_packets_for_5c: "Handoff packet to 5C carrying function identity and all 5A/5B evidence-window refs."
});

export const STAGE5B_REINVESTIGATION_RULES = Object.freeze({
  missing_5a_output: "Ask 5A to reinvestigate product-function discovery first.",
  missing_5a_window_refs: "Ask 5A to regenerate verbatim feature windows before tagging.",
  no_controlled_tags: "Ask 5B to expand tag-context windows from full clean_text_lossless before falling back.",
  invalid_controlled_value: "Reject non-Registry archetype/surface values and request 5B retagging from Registry-controlled vocabulary.",
  metadata_or_index_detected: "Reject the tag row and request reinvestigation from source windows."
});

export const STAGE5B_DICTIONARY = Object.freeze({
  substage: "5B",
  output_version: STAGE5B_OUTPUT_VERSION,
  purpose: "Tag every 5A admitted function with locked Registry v3.0 archetype and surface vocabulary using 5A verbatim feature windows plus optional 5B supplemental verbatim windows.",
  evidence_rule: {
    primary_evidence: "5A admitted function + 5A verbatim feature evidence windows + full product-family clean_text_lossless source custody",
    metadata_sidecar: "reference_only",
    navigation_index_sidecar: "navigation_only",
    forbidden: [
      "metadata_as_primary_evidence",
      "index_as_primary_evidence",
      "tagging_without_source_window_refs",
      "tagging_from_source_url_or_title_only",
      "non_registry_archetype_codes",
      "non_registry_surface_tokens"
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