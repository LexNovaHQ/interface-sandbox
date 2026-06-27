import {
  AGENT_1A_ARTIFACT_NAMES,
  AGENT_1B_ARTIFACT_NAMES,
  AGENT_1_ARTIFACT_NAMES,
  DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES,
  LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES,
  M11_STATIC_ARTIFACT_NAMES,
  PRODUCT_ACTIVITY_FAMILY_ARTIFACT_NAMES,
  TARGET_PROFILE_FAMILY_ARTIFACT_NAMES
} from "./constants.js";

const packetFile = (prefix, suffix = ".yaml") => `${prefix}BINDING_` + `PACKET${suffix}`;
const SYSTEM_BLOCKING_DOCTRINE_FILE = "agent-packages/00_SYSTEM_BLOCKING_DOCTRINE.md";

const AGENT_2B_M9_PACKAGE_ROOT = "agent-packages/agent_2b_m9";

const AGENT_2B_M9_FILES = Object.freeze([
  SYSTEM_BLOCKING_DOCTRINE_FILE,
  `${AGENT_2B_M9_PACKAGE_ROOT}/` + packetFile("AGENT2B_M9_RUNTIME_"),
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

const AGENT_5_REFERENCE_FILES = Object.freeze([
  "AI_THREAT_REGISTRY.yaml",
  "REGISTRY_KEY_v3_0.md",
  "03_REGISTRY_EVALUATION_RULES.yaml",
  "FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml",
  "FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml"
]);

const AGENT_3_PACKAGE_ROOT = "agent-packages/agent_3_target_feature";

const AGENT_3_RUNTIME_FILES = Object.freeze([
  SYSTEM_BLOCKING_DOCTRINE_FILE,
  `${AGENT_3_PACKAGE_ROOT}/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md`,
  `${AGENT_3_PACKAGE_ROOT}/` + packetFile("AGENT3_RUNTIME_")
]);

const AGENT_3_VALIDATION_FILES = Object.freeze([
  `${AGENT_3_PACKAGE_ROOT}/00_VALIDATOR_RULES_INTEGRATED.md`,
  `${AGENT_3_PACKAGE_ROOT}/AGENT3_BACKEND_OUTPUT_CONTRACT.md`,
  `${AGENT_3_PACKAGE_ROOT}/00_TERMINAL_RECEIPT_RULES_INTEGRATED.md`
]);

const AGENT_4_M10_PACKAGE_ROOT = "agent-packages/agent_4_data_privacy";
const AGENT_4_M10_FILES = Object.freeze([
  SYSTEM_BLOCKING_DOCTRINE_FILE,
  `${AGENT_4_M10_PACKAGE_ROOT}/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md`,
  `${AGENT_4_M10_PACKAGE_ROOT}/` + packetFile("AGENT4_RUNTIME_", "_SYNCED_M10.yaml"),
  `${AGENT_4_M10_PACKAGE_ROOT}/M10_DATA_PROVENANCE.md`,
  `${AGENT_4_M10_PACKAGE_ROOT}/00_VALIDATOR_RULES_INTEGRATED_AGENT4_SYNCED.md`,
  `${AGENT_4_M10_PACKAGE_ROOT}/AGENT4_BACKEND_OUTPUT_CONTRACT_SYNCED_M10.md`,
  `${AGENT_4_M10_PACKAGE_ROOT}/BACKEND_CANONICAL_OUTPUT_ADAPTER.md`,
  `${AGENT_4_M10_PACKAGE_ROOT}/00_TERMINAL_RECEIPT_RULES_INTEGRATED_AGENT4_SYNCED.md`
]);

const AGENT_5_M11_PACKAGE_ROOT = "agent-packages/agent_5_exposure_registry";
const AGENT_5_M11_FILES = Object.freeze([
  SYSTEM_BLOCKING_DOCTRINE_FILE,
  `${AGENT_5_M11_PACKAGE_ROOT}/` + packetFile("AGENT5_RUNTIME_", "_SYNCED_M11.yaml"),
  `${AGENT_5_M11_PACKAGE_ROOT}/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED_AGENT5_SYNCED.md`,
  `${AGENT_5_M11_PACKAGE_ROOT}/M11_EXPOSURE_REGISTRY.md`,
  `${AGENT_5_M11_PACKAGE_ROOT}/00_VALIDATOR_RULES_INTEGRATED_AGENT5_SYNCED.md`,
  `${AGENT_5_M11_PACKAGE_ROOT}/AGENT5_BACKEND_OUTPUT_CONTRACT_SYNCED_M11.md`,
  `${AGENT_5_M11_PACKAGE_ROOT}/00_TERMINAL_RECEIPT_RULES_INTEGRATED_AGENT5_SYNCED.md`,
  `${AGENT_5_M11_PACKAGE_ROOT}/BACKEND_CANONICAL_OUTPUT_ADAPTER.md`
]);

const AGENT_5_M12_GLOBAL_FILES = Object.freeze([
  SYSTEM_BLOCKING_DOCTRINE_FILE,
  `${AGENT_5_M11_PACKAGE_ROOT}/` + packetFile("AGENT5_RUNTIME_", "_SYNCED_M11.yaml"),
  `${AGENT_5_M11_PACKAGE_ROOT}/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED_AGENT5_SYNCED.md`,
  `${AGENT_5_M11_PACKAGE_ROOT}/M12_GLOBAL_CHALLENGE.md`,
  `${AGENT_5_M11_PACKAGE_ROOT}/00_VALIDATOR_RULES_INTEGRATED_AGENT5_SYNCED.md`,
  `${AGENT_5_M11_PACKAGE_ROOT}/BACKEND_CANONICAL_OUTPUT_ADAPTER.md`,
  `${AGENT_5_M11_PACKAGE_ROOT}/00_TERMINAL_RECEIPT_RULES_INTEGRATED_AGENT5_SYNCED.md`
]);

export const PHASE_CONTRACTS = Object.freeze({
  AGENT_1A_URL_MANIFEST: { type: "deterministic", actor_id: "agent_1a_url_manifest", reads: [], writes: AGENT_1A_ARTIFACT_NAMES, next: "AGENT_1B_EXTRACT" },
  AGENT_1B_EXTRACT: { type: "deterministic", actor_id: "agent_1b_extract", reads: ["deduped_url_manifest"], writes: AGENT_1B_ARTIFACT_NAMES, next: "M6_BUCKET_INDEX" },
  M6_BUCKET_INDEX: { type: "deterministic", actor_id: "agent_2a_bucket_routing", reads: AGENT_1_ARTIFACT_NAMES, writes: ["source_discovery_handoff"], next: "M9" },
  M9: {
    type: "model",
    agent_id: "agent_2b_m9",
    prompt_files: AGENT_2B_M9_FILES,
    reads: ["source_discovery_handoff", ...LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES],
    writes: ["legal_cartography_index"],
    next: "M7_TARGET_PROFILE"
  },
  M7_TARGET_PROFILE: {
    type: "model",
    agent_id: "agent_3_target_feature",
    prompt_files: [...AGENT_3_RUNTIME_FILES, `${AGENT_3_PACKAGE_ROOT}/02_M7_TARGET_PROFILE_BACKEND_CURRENT.md`, ...AGENT_3_VALIDATION_FILES],
    reads: ["source_discovery_handoff", "legal_cartography_index", ...TARGET_PROFILE_FAMILY_ARTIFACT_NAMES],
    references: AGENT_3_REFERENCE_FILES,
    writes: ["target_profile"],
    next: "M7_TARGET_PROFILE_FORENSICS"
  },
  M7_TARGET_PROFILE_FORENSICS: {
    type: "model",
    agent_id: "agent_3_target_feature",
    prompt_files: [...AGENT_3_RUNTIME_FILES, `${AGENT_3_PACKAGE_ROOT}/02_M7_TARGET_PROFILE_BACKEND_CURRENT.md`, ...AGENT_3_VALIDATION_FILES],
    reads: ["source_discovery_handoff", "legal_cartography_index", "target_profile", ...TARGET_PROFILE_FAMILY_ARTIFACT_NAMES],
    references: AGENT_3_REFERENCE_FILES,
    writes: ["target_profile_forensics"],
    next: "M8_TARGET_FEATURE_PROFILE"
  },
  M8_TARGET_FEATURE_PROFILE: {
    type: "model",
    agent_id: "agent_3_target_feature",
    prompt_files: [...AGENT_3_RUNTIME_FILES, `${AGENT_3_PACKAGE_ROOT}/03_M8_FEATURE_PROFILE_BACKEND_CURRENT.md`, ...AGENT_3_VALIDATION_FILES],
    reads: ["source_discovery_handoff", "target_profile", "target_profile_forensics", ...PRODUCT_ACTIVITY_FAMILY_ARTIFACT_NAMES],
    references: AGENT_3_REFERENCE_FILES,
    writes: ["target_feature_profile"],
    next: "M8_TARGET_FEATURE_PROFILE_FORENSICS"
  },
  M8_TARGET_FEATURE_PROFILE_FORENSICS: {
    type: "model",
    agent_id: "agent_3_target_feature",
    prompt_files: [...AGENT_3_RUNTIME_FILES, `${AGENT_3_PACKAGE_ROOT}/03_M8_FEATURE_PROFILE_BACKEND_CURRENT.md`, ...AGENT_3_VALIDATION_FILES],
    reads: ["source_discovery_handoff", "target_profile", "target_profile_forensics", "target_feature_profile", ...PRODUCT_ACTIVITY_FAMILY_ARTIFACT_NAMES],
    references: AGENT_3_REFERENCE_FILES,
    writes: ["target_feature_profile_forensics"],
    next: "M10"
  },
  M10: {
    type: "model",
    agent_id: "agent_4_data_privacy",
    prompt_files: AGENT_4_M10_FILES,
    reads: ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_profile_forensics", "target_feature_profile", "target_feature_profile_forensics", ...DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES, "lossless_family__L1_CORE_TERMS_PRIVACY", "lossless_family__L2_B2B_CONTRACTING", "lossless_family__L4_PRIVACY_ADJACENT_NOTICES"],
    writes: ["data_provenance_profile"],
    next: "M10_FORENSICS"
  },
  M10_FORENSICS: {
    type: "model",
    agent_id: "agent_4_data_privacy",
    prompt_files: AGENT_4_M10_FILES,
    reads: ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_profile_forensics", "target_feature_profile", "target_feature_profile_forensics", "data_provenance_profile", ...DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES, "lossless_family__L1_CORE_TERMS_PRIVACY", "lossless_family__L2_B2B_CONTRACTING", "lossless_family__L4_PRIVACY_ADJACENT_NOTICES"],
    writes: ["data_provenance_profile_forensics"],
    next: "M11"
  },
  M11: {
    type: "orchestrated",
    actor_id: "agent_5_exposure_registry",
    agent_id: "agent_5_exposure_registry",
    prompt_files: AGENT_5_M11_FILES,
    reads: ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_profile_forensics", "target_feature_profile", "target_feature_profile_forensics", "data_provenance_profile", "data_provenance_profile_forensics", ...LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES],
    references: AGENT_5_REFERENCE_FILES,
    writes: M11_STATIC_ARTIFACT_NAMES,
    next: "M12"
  },
  M12: {
    type: "model",
    agent_id: "agent_5_exposure_registry",
    prompt_files: AGENT_5_M12_GLOBAL_FILES,
    reads: [
      "source_discovery_handoff",
      "legal_cartography_index",
      "target_profile",
      "target_profile_forensics",
      "target_feature_profile",
      "target_feature_profile_forensics",
      "data_provenance_profile",
      "data_provenance_profile_forensics",
      "exposure_registry_route_plan",
      "exposure_registry_workpad_98",
      "exposure_registry_controlled_profile",
      "exposure_registry_triggered_profile",
      "exposure_registry_profile_forensics"
    ],
    writes: ["challenge_gate"],
    next: "COMPILER"
  },
  COMPILER: {
    type: "deterministic",
    actor_id: "compiler",
    reads: ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_feature_profile", "data_provenance_profile", "exposure_registry_controlled_profile", "exposure_registry_triggered_profile", "exposure_registry_profile_forensics", "challenge_gate"],
    writes: ["final_output_handoff"],
    next: "RENDERER"
  },
  RENDERER: { type: "deterministic", actor_id: "portfolio_renderer", reads: ["final_output_handoff"], writes: ["renderer_payload"], next: "COMPLETE" }
});

export function getPhaseContract(phase) {
  const contract = PHASE_CONTRACTS[phase];
  if (!contract) throw new Error(`INVALID_PHASE_CONTRACT:${phase || "missing"}`);
  return contract;
}

export function getRequiredWritesForPhase(phase) {
  return getPhaseContract(phase).writes || [];
}
