export const SERVICE_NAME = "interface-diligence-artifacts";

export const PHASES = Object.freeze([
  "M6_M9",
  "M7_M8",
  "M10",
  "M11",
  "M12_M13",
  "M14"
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
  "source_discovery_handoff",
  "legal_cartography_index",
  "target_profile",
  "target_feature_profile",
  "data_provenance_profile",
  "exposure_registry_profile",
  "challenge_gate",
  "final_output_handoff",
  "terminal_validation",
  "renderer_payload"
]);

export const AGENTS = Object.freeze([
  "agent_1_source_legal",
  "agent_2_target_feature",
  "agent_3_data_privacy",
  "agent_4_exposure_registry",
  "agent_5_challenge_assembly",
  "agent_6_terminal_validator",
  "operator",
  "portfolio_renderer"
]);

export const WRITE_PERMISSIONS = Object.freeze({
  agent_1_source_legal: ["source_discovery_handoff", "legal_cartography_index"],
  agent_2_target_feature: ["target_profile", "target_feature_profile"],
  agent_3_data_privacy: ["data_provenance_profile"],
  agent_4_exposure_registry: ["exposure_registry_profile"],
  agent_5_challenge_assembly: ["challenge_gate", "final_output_handoff"],
  agent_6_terminal_validator: ["terminal_validation", "renderer_payload"],
  operator: ARTIFACT_NAMES
});

export const READ_PERMISSIONS = Object.freeze({
  agent_1_source_legal: [],
  agent_2_target_feature: ["source_discovery_handoff", "legal_cartography_index"],
  agent_3_data_privacy: ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_feature_profile"],
  agent_4_exposure_registry: ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_feature_profile", "data_provenance_profile"],
  agent_5_challenge_assembly: ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_feature_profile", "data_provenance_profile", "exposure_registry_profile"],
  agent_6_terminal_validator: ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_feature_profile", "data_provenance_profile", "exposure_registry_profile", "challenge_gate", "final_output_handoff"],
  operator: ARTIFACT_NAMES,
  portfolio_renderer: ["renderer_payload"]
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
