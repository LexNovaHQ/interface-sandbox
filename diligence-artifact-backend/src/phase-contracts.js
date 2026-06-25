export const PHASE_CONTRACTS = Object.freeze({
  URL_MANIFEST: {
    type: "model",
    agent_id: "agent_1_m6_m9",
    prompt_file: "agent_1_m6_m9.md",
    reads: [],
    writes: ["url_manifest"],
    next: "LOSSLESS_SOURCE_EXTRACTION"
  },

  LOSSLESS_SOURCE_EXTRACTION: {
    type: "deterministic",
    actor_id: "deterministic_source_extractor",
    reads: ["url_manifest"],
    writes: ["lossless_source_corpus"],
    next: "M6_M9"
  },

  M6_M9: {
    type: "model",
    agent_id: "agent_1_m6_m9",
    prompt_file: "agent_1_m6_m9.md",
    reads: ["url_manifest", "lossless_source_corpus"],
    writes: ["source_discovery_handoff", "legal_cartography_index"],
    next: "M7_M8"
  },

  M7_M8: {
    type: "model",
    agent_id: "agent_2_m7_m8",
    prompt_file: "agent_2_m7_m8.md",
    reads: ["url_manifest", "lossless_source_corpus", "source_discovery_handoff", "legal_cartography_index"],
    writes: [
      "target_profile",
      "target_profile_forensics",
      "target_feature_profile",
      "target_feature_profile_forensics"
    ],
    next: "M10"
  },

  M10: {
    type: "model",
    agent_id: "agent_3_m10",
    prompt_file: "agent_3_m10.md",
    reads: [
      "url_manifest",
      "lossless_source_corpus",
      "source_discovery_handoff",
      "legal_cartography_index",
      "target_profile",
      "target_feature_profile"
    ],
    writes: ["data_provenance_profile"],
    next: "M11"
  },

  M11: {
    type: "model",
    agent_id: "agent_4_m11",
    prompt_file: "agent_4_m11.md",
    reads: [
      "source_discovery_handoff",
      "legal_cartography_index",
      "target_profile",
      "target_feature_profile",
      "data_provenance_profile"
    ],
    writes: ["exposure_registry_profile"],
    next: "M12"
  },

  M12: {
    type: "model",
    agent_id: "agent_5_m12",
    prompt_file: "agent_5_m12.md",
    reads: [
      "source_discovery_handoff",
      "legal_cartography_index",
      "target_profile",
      "target_feature_profile",
      "data_provenance_profile",
      "exposure_registry_profile"
    ],
    writes: ["challenge_gate"],
    next: "COMPILER"
  },

  COMPILER: {
    type: "deterministic",
    actor_id: "compiler",
    reads: [
      "source_discovery_handoff",
      "legal_cartography_index",
      "target_profile",
      "target_feature_profile",
      "data_provenance_profile",
      "exposure_registry_profile",
      "challenge_gate"
    ],
    writes: ["final_output_handoff"],
    next: "RENDERER"
  },

  RENDERER: {
    type: "deterministic",
    actor_id: "portfolio_renderer",
    reads: ["final_output_handoff"],
    writes: ["renderer_payload"],
    next: "COMPLETE"
  }
});

export function getPhaseContract(phase) {
  const contract = PHASE_CONTRACTS[phase];
  if (!contract) {
    throw new Error(`INVALID_PHASE_CONTRACT:${phase || "missing"}`);
  }
  return contract;
}

export function getRequiredWritesForPhase(phase) {
  return getPhaseContract(phase).writes || [];
}
