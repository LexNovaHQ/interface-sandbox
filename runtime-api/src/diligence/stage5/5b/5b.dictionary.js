export const STAGE5B_DICTIONARY = Object.freeze({
  substage: "5B",
  archetypes: {
    CONTENT_TRANSFORMATION: "Transforms user supplied content from one modality or language to another.",
    CONTENT_GENERATION: "Generates new output content from user supplied input.",
    DOCUMENT_INTELLIGENCE: "Extracts or structures information from document inputs.",
    AGENTIC_INTERFACE: "Provides interactive agent behavior through a product surface."
  },
  surfaces: ["developer_api", "audio_input", "text_input", "document_input", "api_payload_output", "voice_interface", "external_interaction", "workflow_action"]
});
