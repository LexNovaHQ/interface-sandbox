export const SERVICE_NAME = "interface-diligence-artifacts";

export const PHASES = Object.freeze([
  "M6",
  "LOSSLESS_SOURCE_EXTRACTION",
  "M9",
  "M7_M8",
  "M10",
  "M11",
  "M12",
  "COMPILER",
  "RENDERER",
  "COMPLETE"
]);

export const LOCK_STATUSES = Object.freeze([
  "CREATED",
  "RUNNING",
  "LOCKED",
  "LOCKED_WITH_LIMITATIONS",
  "REPAIR_REQUIRED",
  "CONTROLLED_FAILURE",
  "COMPLETE"
]);

export const ARTIFACT_NAMES = Object.freeze([
  "url_manifest",
  "lossless_source_corpus",
  "source_discovery_handoff",
  "legal_cartography_index",
  "target_profile",
  "target_profile_forensics",
  "target_feature_profile",
  "target_feature_profile_forensics",
  "data_provenance_profile",
  "exposure_registry_profile",
  "challenge_gate",
  "final_output_handoff",
  "renderer_payload"
]);

export const AGENTS = Object.freeze([
  "agent_1_m6",
  "deterministic_source_extractor",
  "agent_2a_m9",
  "agent_2_m7_m8",
  "agent_3_m10",
  "agent_4_m11",
  "agent_5_m12",
  "compiler",
  "portfolio_renderer",
  "operator"
]);

export const WRITE_PERMISSIONS = Object.freeze({
  agent_1_m6: ["url_manifest", "source_discovery_handoff"],
  deterministic_source_extractor: ["lossless_source_corpus"],
  agent_2a_m9: ["legal_cartography_index"],
  agent_2_m7_m8: ["target_profile", "target_profile_forensics", "target_feature_profile", "target_feature_profile_forensics"],
  agent_3_m10: ["data_provenance_profile"],
  agent_4_m11: ["exposure_registry_profile"],
  agent_5_m12: ["challenge_gate"],
  compiler: ["final_output_handoff"],
  portfolio_renderer: ["renderer_payload"],
  operator: ARTIFACT_NAMES
});

export const READ_PERMISSIONS = Object.freeze({
  agent_1_m6: [],
  deterministic_source_extractor: ["url_manifest"],
  agent_2a_m9: ["lossless_source_corpus", "source_discovery_handoff"],
  agent_2_m7_m8: ["url_manifest", "lossless_source_corpus", "source_discovery_handoff", "legal_cartography_index"],
  agent_3_m10: ["url_manifest", "lossless_source_corpus", "source_discovery_handoff", "legal_cartography_index", "target_profile", "target_profile_forensics", "target_feature_profile", "target_feature_profile_forensics"],
  agent_4_m11: ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_profile_forensics", "target_feature_profile", "target_feature_profile_forensics", "data_provenance_profile"],
  agent_5_m12: ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_profile_forensics", "target_feature_profile", "target_feature_profile_forensics", "data_provenance_profile", "exposure_registry_profile"],
  compiler: ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_profile_forensics", "target_feature_profile", "target_feature_profile_forensics", "data_provenance_profile", "exposure_registry_profile", "challenge_gate"],
  portfolio_renderer: ["final_output_handoff", "renderer_payload"],
  operator: ARTIFACT_NAMES
});

export function assertKnownArtifactName(artifactName) {
  if (!ARTIFACT_NAMES.includes(artifactName)) {
    throw new Error(`INVALID_ARTIFACT_NAME:${artifactName || "missing"}`);
  }
}

export function assertKnownPhase(phase) {
  if (!PHASES.includes(phase)) {
    throw new Error(`INVALID_PHASE:${phase || "missing"}`);
  }
}

export function assertKnownAgent(agentId) {
  if (!AGENTS.includes(agentId)) {
    throw new Error(`INVALID_AGENT:${agentId || "missing"}`);
  }
}
