export const STAGE5_CANONICAL_VERSION = "stage5_lossless_windowed_runtime_v1";

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
