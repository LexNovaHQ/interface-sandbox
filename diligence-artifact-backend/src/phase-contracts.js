import { AGENT_1_ARTIFACT_NAMES, BUCKET_ARTIFACT_NAMES } from "./constants.js";

export const PHASE_CONTRACTS = Object.freeze({
  AGENT_1_SCOUT_EXTRACT: {
    type: "deterministic",
    actor_id: "agent_1_scout_extract",
    reads: [],
    writes: AGENT_1_ARTIFACT_NAMES,
    next: "M6_BUCKET_INDEX"
  },

  M6_BUCKET_INDEX: {
    type: "model",
    agent_id: "agent_2_m6_bucket_index",
    prompt_file: "agent_2_m6_bucket_index.md",
    reads: AGENT_1_ARTIFACT_NAMES,
    writes: ["source_discovery_handoff", ...BUCKET_ARTIFACT_NAMES],
    next: "M9"
  },

  M9: {
    type: "model",
    agent_id: "agent_3_m9",
    prompt_file: "agent_3_m9.md",
    reads: [
      "source_discovery_handoff",
      "bucket_legal_governance_profile_urls",
      "lossless_family__L1_CORE_TERMS_PRIVACY",
      "lossless_family__L2_B2B_CONTRACTING",
      "lossless_family__L3_AI_USAGE_GOVERNANCE",
      "lossless_family__L4_PRIVACY_ADJACENT_NOTICES",
      "lossless_family__L5_LEGAL_HUB_HOSTED",
      "lossless_family__L6_ENTITY_NOTICE"
    ],
    writes: ["legal_cartography_index"],
    next: "M7_M8"
  },

  M7_M8: {
    type: "model",
    agent_id: "agent_4_m7_m8",
    prompt_file: "agent_4_m7_m8.md",
    reads: [
      "source_discovery_handoff",
      "bucket_target_profile_urls",
      "bucket_product_activity_profile_urls",
      "legal_cartography_index",
      "lossless_family__T0_ROOT",
      "lossless_family__T1_IDENTITY",
      "lossless_family__T2_LEGAL_IDENTITY",
      "lossless_family__T3_OPERATOR_ENTITY",
      "lossless_family__T4_SUPPORTING_IDENTITY",
      "lossless_family__P1_PRODUCT",
      "lossless_family__P2_PLATFORM_FEATURE_SOLUTION",
      "lossless_family__P3_AI_CAPABILITY_TECHNICAL",
      "lossless_family__P4_USE_CASE_INDUSTRY",
      "lossless_family__P5_ENTERPRISE_PRICING"
    ],
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
      "bucket_data_asset_provenance_profile_urls",
      "bucket_legal_governance_profile_urls",
      "legal_cartography_index",
      "target_profile",
      "target_feature_profile",
      "lossless_family__D1_SECURITY_TRUST",
      "lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER",
      "lossless_family__D3_DATA_GOVERNANCE_CONTROLS",
      "lossless_family__D4_DOCS_API_DATA_FLOW",
      "lossless_family__D5_AI_SAFETY_TRANSPARENCY",
      "lossless_family__L1_CORE_TERMS_PRIVACY",
      "lossless_family__L2_B2B_CONTRACTING",
      "lossless_family__L3_AI_USAGE_GOVERNANCE",
      "lossless_family__L4_PRIVACY_ADJACENT_NOTICES",
      "lossless_family__L5_LEGAL_HUB_HOSTED",
      "lossless_family__L6_ENTITY_NOTICE"
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
      ...BUCKET_ARTIFACT_NAMES,
      "legal_cartography_index",
      "target_profile",
      "target_profile_forensics",
      "target_feature_profile",
      "target_feature_profile_forensics",
      "data_provenance_profile"
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
      ...BUCKET_ARTIFACT_NAMES,
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
      ...BUCKET_ARTIFACT_NAMES,
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
