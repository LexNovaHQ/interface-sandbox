import {
  AGENT_1A_ARTIFACT_NAMES,
  AGENT_1B_ARTIFACT_NAMES,
  AGENT_1_ARTIFACT_NAMES,
  DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES,
  LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES,
  PRODUCT_ACTIVITY_FAMILY_ARTIFACT_NAMES,
  TARGET_PROFILE_FAMILY_ARTIFACT_NAMES
} from "./constants.js";

const AGENT_2B_M9_PACKAGE_ROOT = "agent-packages/agent_2b_m9";

const AGENT_2B_M9_FILES = Object.freeze([
  `${AGENT_2B_M9_PACKAGE_ROOT}/AGENT2B_M9_RUNTIME_BINDING_PACKET.yaml`,
  `${AGENT_2B_M9_PACKAGE_ROOT}/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md`,
  `${AGENT_2B_M9_PACKAGE_ROOT}/04_M9_LEGAL_CARTOGRAPHY_RUNTIME_SYNC_PATCHED.md`,
  `${AGENT_2B_M9_PACKAGE_ROOT}/00_VALIDATOR_RULES_INTEGRATED.md`,
  `${AGENT_2B_M9_PACKAGE_ROOT}/00_TERMINAL_RECEIPT_RULES_INTEGRATED.md`
]);

const AGENT_3_REFERENCE_FILES = Object.freeze([
  "REGISTRY_KEY_v3_0.md",
  "FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml",
  "FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml",
  "CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml"
]);

const AGENT_3_PACKAGE_ROOT = "agent-packages/agent_3_target_feature";

const AGENT_3_RUNTIME_FILES = Object.freeze([
  `${AGENT_3_PACKAGE_ROOT}/AGENT3_RUNTIME_BINDING_PACKET.yaml`,
  `${AGENT_3_PACKAGE_ROOT}/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md`
]);

const AGENT_3_VALIDATION_FILES = Object.freeze([
  `${AGENT_3_PACKAGE_ROOT}/00_VALIDATOR_RULES_INTEGRATED.md`,
  `${AGENT_3_PACKAGE_ROOT}/00_TERMINAL_RECEIPT_RULES_INTEGRATED.md`,
  `${AGENT_3_PACKAGE_ROOT}/AGENT3_BACKEND_OUTPUT_CONTRACT.md`
]);

export const PHASE_CONTRACTS = Object.freeze({
  AGENT_1A_URL_MANIFEST: {
    type: "deterministic",
    actor_id: "agent_1a_url_manifest",
    reads: [],
    writes: AGENT_1A_ARTIFACT_NAMES,
    next: "AGENT_1B_EXTRACT"
  },

  AGENT_1B_EXTRACT: {
    type: "deterministic",
    actor_id: "agent_1b_extract",
    reads: ["deduped_url_manifest"],
    writes: AGENT_1B_ARTIFACT_NAMES,
    next: "M6_BUCKET_INDEX"
  },

  M6_BUCKET_INDEX: {
    type: "deterministic",
    actor_id: "agent_2a_bucket_routing",
    reads: AGENT_1_ARTIFACT_NAMES,
    writes: ["source_discovery_handoff"],
    next: "M9"
  },

  M9: {
    type: "model",
    agent_id: "agent_2b_m9",
    prompt_files: AGENT_2B_M9_FILES,
    reads: [
      "source_discovery_handoff",
      ...LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES
    ],
    writes: ["legal_cartography_index"],
    next: "M7_TARGET_PROFILE"
  },

  M7_TARGET_PROFILE: {
    type: "model",
    agent_id: "agent_3_target_feature",
    prompt_files: [
      ...AGENT_3_RUNTIME_FILES,
      `${AGENT_3_PACKAGE_ROOT}/02_M7_TARGET_PROFILE_RUNTIME_SYNC_PATCHED.md`,
      ...AGENT_3_VALIDATION_FILES
    ],
    reads: [
      "source_discovery_handoff",
      "legal_cartography_index",
      ...TARGET_PROFILE_FAMILY_ARTIFACT_NAMES
    ],
    references: AGENT_3_REFERENCE_FILES,
    writes: [
      "target_profile",
      "target_profile_forensics"
    ],
    next: "M8_TARGET_FEATURE_PROFILE"
  },

  M8_TARGET_FEATURE_PROFILE: {
    type: "model",
    agent_id: "agent_3_target_feature",
    prompt_files: [
      ...AGENT_3_RUNTIME_FILES,
      `${AGENT_3_PACKAGE_ROOT}/03_M8_FEATURE_PROFILE_RUNTIME_SYNC_PATCHED.md`,
      ...AGENT_3_VALIDATION_FILES
    ],
    reads: [
      "source_discovery_handoff",
      "target_profile",
      "target_profile_forensics",
      ...PRODUCT_ACTIVITY_FAMILY_ARTIFACT_NAMES
    ],
    references: AGENT_3_REFERENCE_FILES,
    writes: [
      "target_feature_profile",
      "target_feature_profile_forensics"
    ],
    next: "M10"
  },

  M7_M8: {
    type: "sequence_alias",
    agent_id: "agent_3_target_feature",
    reads: [],
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
    agent_id: "agent_5_m10",
    prompt_file: "agent_5_m10.md",
    reads: [
      "source_discovery_handoff",
      "legal_cartography_index",
      "target_profile",
      "target_feature_profile",
      ...DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES,
      "lossless_family__L1_CORE_TERMS_PRIVACY",
      "lossless_family__L2_B2B_CONTRACTING",
      "lossless_family__L4_PRIVACY_ADJACENT_NOTICES"
    ],
    writes: ["data_provenance_profile"],
    next: "M11"
  },

  M11: {
    type: "model",
    agent_id: "agent_6_m11",
    prompt_file: "agent_6_m11.md",
    reads: [
      "source_discovery_handoff",
      "legal_cartography_index",
      "target_profile",
      "target_feature_profile",
      "data_provenance_profile",
      ...LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES
    ],
    writes: ["exposure_registry_profile"],
    next: "M12"
  },

  M12: {
    type: "model",
    agent_id: "agent_7_m12",
    prompt_file: "agent_7_m12.md",
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
