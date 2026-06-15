export const STAGE5_CANONICAL_VERSION = "stage5_lossless_windowed_runtime_v1";

export const STAGE5_CANONICAL_SUBSTAGES = Object.freeze([
  {
    id: "5A",
    name: "Product Function Discovery",
    purpose: "Discover admitted product/API functions from product-family lossless source and create verbatim feature evidence windows.",
    primary_input: "product_family.clean_text_lossless",
    output_key: "stage5a"
  },
  {
    id: "5B",
    name: "Archetype / Surface Tagging",
    purpose: "Tag 5A admitted functions using inherited 5A verbatim windows, supplemental 5B verbatim windows, and controlled registry vocabulary.",
    primary_input: "5A admitted functions + 5A verbatim windows + source custody",
    output_key: "stage5b"
  },
  {
    id: "5C",
    name: "Complete Feature Record Builder",
    purpose: "Merge old 5C feature inventory and old 5D data touchpoints into complete feature-wise records.",
    primary_input: "5A + 5B outputs + source custody",
    output_key: "stage5c"
  },
  {
    id: "5D",
    name: "Final target_feature_profile Integrator",
    purpose: "Integrate 5A, 5B, and 5C outputs into the downstream target_feature_profile handoff.",
    primary_input: "substage outputs + custody manifest",
    output_key: "stage5d"
  }
]);

export const STAGE5_LEGACY_PARKED_COMPONENTS = Object.freeze([
  "stage5aPipelineConnector.js",
  "stage5bPipelineConnector.js",
  "stage5cPipelineConnector.js",
  "stage5dPipelineConnector.js",
  "stage5ePipelineConnector.js",
  "5a/stage5aProductFamilyInputAdapter.js",
  "5a/stage5aLosslessSourceIndexBuilder.js",
  "5a/stage5aDeterministicCandidatePoolBuilder.js",
  "5a/stage5aInstructionBuilder.js",
  "5a/stage5aPromptBuilder.js",
  "5a/stage5aProductFunctionMapper.js",
  "5a/stage5aOutputNormalizer.js",
  "5a/stage5aValidator.js",
  "5a/stage5aFeaturePackageBuilder.js",
  "5a/stage5aForensicBuilder.js",
  "5a/stage5aIndex.js",
  "5b/stage5bRegistryTaxonomyBuilder.js",
  "5b/stage5bFeatureInvestigationPacketBuilder.js",
  "5b/stage5bDeterministicSignalBuilder.js",
  "5b/stage5bInstructionBuilder.js",
  "5b/stage5bPromptBuilder.js",
  "5b/stage5bArchetypeSurfaceTagger.js",
  "5b/stage5bOutputNormalizer.js",
  "5b/stage5bValidator.js",
  "5b/stage5bTagPackageBuilder.js",
  "5b/stage5bForensicBuilder.js",
  "5b/stage5bIndex.js",
  "5c/stage5cInputJoiner.js",
  "5d/stage5dFeatureContextBuilder.js",
  "5e/stage5eSchemaMappers.js"
]);

export const STAGE5_BLOCKING_ERROR_CODES = Object.freeze([
  "LOSSLESS_PRIMARY_EVIDENCE_VIOLATION",
  "SOURCE_WINDOW_NOT_VERBATIM",
  "SOURCE_WINDOW_REF_VIOLATION",
  "METADATA_AS_PRIMARY_EVIDENCE_BLOCKED",
  "INDEX_AS_PRIMARY_EVIDENCE_BLOCKED",
  "PLACEHOLDER_EVIDENCE_BLOCKED",
  "STAGE5A_NO_ADMITTED_FUNCTIONS",
  "STAGE5A_SOURCE_WINDOW_REF_VIOLATION",
  "STAGE5B_SOURCE_WINDOW_REF_VIOLATION",
  "STAGE5B_INHERITED_WINDOW_REQUIRED",
  "STAGE5B_SUPPLEMENTAL_WINDOW_REQUIRED",
  "STAGE5B_CONTROLLED_VALUE_VIOLATION",
  "STAGE5B_METADATA_OR_INDEX_AS_EVIDENCE_BLOCKED",
  "STAGE5B_FUNCTION_COVERAGE_FAILURE",
  "STAGE5_FINAL_PROFILE_SCHEMA_VIOLATION"
]);

export const STAGE5_FEATURE_PATTERNS = Object.freeze([
  {
    key: "speech_to_text",
    name: "Speech-to-text API",
    terms: ["speech-to-text", "speech to text", "transcription", "transcribe", "speech recognition"],
    function_type: "api_capability",
    input_data: ["audio"],
    system_action: "converts speech audio into text",
    output_or_result: "text transcript",
    archetype_codes: ["CONTENT_TRANSFORMATION"],
    archetype_labels: ["Content transformation"],
    surface_tokens: ["audio_input", "text_output", "developer_api"]
  },
  {
    key: "text_to_speech",
    name: "Text-to-speech API",
    terms: ["text-to-speech", "text to speech", "tts", "speech synthesis", "voice generation"],
    function_type: "api_capability",
    input_data: ["text"],
    system_action: "converts text into speech audio",
    output_or_result: "generated audio",
    archetype_codes: ["CONTENT_GENERATION"],
    archetype_labels: ["Content generation"],
    surface_tokens: ["text_input", "audio_output", "developer_api"]
  },
  {
    key: "document_digitisation",
    name: "Document digitisation API",
    terms: ["document digitisation", "document digitization", "document extraction", "document parsing", "ocr"],
    function_type: "api_capability",
    input_data: ["document"],
    system_action: "extracts structured information from documents",
    output_or_result: "digitised document data",
    archetype_codes: ["DOCUMENT_INTELLIGENCE"],
    archetype_labels: ["Document intelligence"],
    surface_tokens: ["document_input", "api_payload_output", "developer_api"]
  },
  {
    key: "translation",
    name: "Translation API",
    terms: ["translation", "translate", "machine translation"],
    function_type: "api_capability",
    input_data: ["text"],
    system_action: "translates content between languages",
    output_or_result: "translated text",
    archetype_codes: ["CONTENT_TRANSFORMATION"],
    archetype_labels: ["Content transformation"],
    surface_tokens: ["text_input", "text_output", "developer_api"]
  },
  {
    key: "voice_agent",
    name: "Voice agent interaction",
    terms: ["voice agent", "conversational agent", "voice assistant", "call automation"],
    function_type: "agentic_interaction",
    input_data: ["audio", "text"],
    system_action: "handles interactive voice conversations",
    output_or_result: "agent response or action",
    archetype_codes: ["AGENTIC_INTERFACE"],
    archetype_labels: ["Agentic interface"],
    surface_tokens: ["voice_interface", "external_interaction", "workflow_action"]
  }
]);

export const PLACEHOLDER_PATTERNS = Object.freeze([
  /^S5E_SOURCE_REF_NOT_AVAILABLE$/i,
  /^SOURCE_REF_NOT_AVAILABLE$/i,
  /^EVIDENCE_REF_NOT_AVAILABLE$/i,
  /^PLACEHOLDER/i,
  /^TODO/i,
  /^https:\/\/source-not-available\.local\/?$/i,
  /^https:\/\/example\.com\/?$/i
]);

export function findFeaturePattern(text = "") {
  const lower = String(text || "").toLowerCase();
  return STAGE5_FEATURE_PATTERNS.find((pattern) => pattern.terms.some((term) => lower.includes(term)));
}
