export const SERVICE_NAME = "interface-diligence-artifacts";

export const PHASES = Object.freeze([
  "AGENT_1A_URL_MANIFEST",
  "AGENT_1B_EXTRACT",
  "M6_BUCKET_INDEX",
  "M9",
  "M7_TARGET_PROFILE",
  "M8_TARGET_FEATURE_PROFILE",
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

export const ROOT_FAMILY_CODES = Object.freeze([
  "T0_ROOT",
  "T1_IDENTITY",
  "T2_LEGAL_IDENTITY",
  "T3_OPERATOR_ENTITY",
  "T4_SUPPORTING_IDENTITY",
  "P1_PRODUCT",
  "P2_PLATFORM_FEATURE_SOLUTION",
  "P3_AI_CAPABILITY_TECHNICAL",
  "P4_USE_CASE_INDUSTRY",
  "P5_ENTERPRISE_PRICING",
  "D1_SECURITY_TRUST",
  "D2_SUBPROCESSOR_PRIVACY_CENTER",
  "D3_DATA_GOVERNANCE_CONTROLS",
  "D4_DOCS_API_DATA_FLOW",
  "D5_AI_SAFETY_TRANSPARENCY",
  "L1_CORE_TERMS_PRIVACY",
  "L2_B2B_CONTRACTING",
  "L3_AI_USAGE_GOVERNANCE",
  "L4_PRIVACY_ADJACENT_NOTICES",
  "L5_LEGAL_HUB_HOSTED",
  "L6_ENTITY_NOTICE"
]);

export const LOSSLESS_ROOT_FAMILY_ARTIFACT_NAMES = Object.freeze(
  ROOT_FAMILY_CODES.map((code) => `lossless_family__${code}`)
);

export const LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES = Object.freeze([
  "lossless_family__L1_CORE_TERMS_PRIVACY",
  "lossless_family__L2_B2B_CONTRACTING",
  "lossless_family__L3_AI_USAGE_GOVERNANCE",
  "lossless_family__L4_PRIVACY_ADJACENT_NOTICES",
  "lossless_family__L5_LEGAL_HUB_HOSTED",
  "lossless_family__L6_ENTITY_NOTICE"
]);

export const TARGET_PROFILE_FAMILY_ARTIFACT_NAMES = Object.freeze([
  "lossless_family__T0_ROOT",
  "lossless_family__T1_IDENTITY",
  "lossless_family__T2_LEGAL_IDENTITY",
  "lossless_family__T3_OPERATOR_ENTITY",
  "lossless_family__T4_SUPPORTING_IDENTITY"
]);

export const PRODUCT_ACTIVITY_FAMILY_ARTIFACT_NAMES = Object.freeze([
  "lossless_family__P1_PRODUCT",
  "lossless_family__P2_PLATFORM_FEATURE_SOLUTION",
  "lossless_family__P3_AI_CAPABILITY_TECHNICAL",
  "lossless_family__P4_USE_CASE_INDUSTRY",
  "lossless_family__P5_ENTERPRISE_PRICING"
]);

export const DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES = Object.freeze([
  "lossless_family__D1_SECURITY_TRUST",
  "lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER",
  "lossless_family__D3_DATA_GOVERNANCE_CONTROLS",
  "lossless_family__D4_DOCS_API_DATA_FLOW",
  "lossless_family__D5_AI_SAFETY_TRANSPARENCY"
]);

export const AGENT_1A_ARTIFACT_NAMES = Object.freeze(["deduped_url_manifest"]);

export const AGENT_1B_ARTIFACT_NAMES = Object.freeze([
  "source_family_index",
  ...LOSSLESS_ROOT_FAMILY_ARTIFACT_NAMES
]);

export const AGENT_1_ARTIFACT_NAMES = Object.freeze([
  ...AGENT_1A_ARTIFACT_NAMES,
  ...AGENT_1B_ARTIFACT_NAMES
]);

export const ARTIFACT_NAMES = Object.freeze([
  "url_manifest",
  "lossless_source_corpus",
  ...AGENT_1_ARTIFACT_NAMES,
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
  "agent_1a_url_manifest",
  "agent_1b_extract",
  "agent_2a_bucket_routing",
  "agent_2b_m9",
  "agent_3_target_feature",
  "agent_5_m10",
  "agent_6_m11",
  "agent_7_m12",
  "compiler",
  "portfolio_renderer",
  "operator"
]);

export const WRITE_PERMISSIONS = Object.freeze({
  agent_1a_url_manifest: AGENT_1A_ARTIFACT_NAMES,
  agent_1b_extract: AGENT_1B_ARTIFACT_NAMES,
  agent_2a_bucket_routing: ["source_discovery_handoff"],
  agent_2b_m9: ["legal_cartography_index"],
  agent_3_target_feature: ["target_profile", "target_profile_forensics", "target_feature_profile", "target_feature_profile_forensics"],
  agent_5_m10: ["data_provenance_profile"],
  agent_6_m11: ["exposure_registry_profile"],
  agent_7_m12: ["challenge_gate"],
  compiler: ["final_output_handoff"],
  portfolio_renderer: ["renderer_payload"],
  operator: ARTIFACT_NAMES
});

export const READ_PERMISSIONS = Object.freeze({
  agent_1a_url_manifest: [],
  agent_1b_extract: ["deduped_url_manifest"],
  agent_2a_bucket_routing: AGENT_1_ARTIFACT_NAMES,
  agent_2b_m9: ["source_discovery_handoff", ...LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES],
  agent_3_target_feature: ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_profile_forensics", ...TARGET_PROFILE_FAMILY_ARTIFACT_NAMES, ...PRODUCT_ACTIVITY_FAMILY_ARTIFACT_NAMES],
  agent_5_m10: ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_feature_profile", ...DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES, "lossless_family__L1_CORE_TERMS_PRIVACY", "lossless_family__L2_B2B_CONTRACTING", "lossless_family__L4_PRIVACY_ADJACENT_NOTICES"],
  agent_6_m11: ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_feature_profile", "data_provenance_profile", ...LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES],
  agent_7_m12: ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_feature_profile", "data_provenance_profile", "exposure_registry_profile"],
  compiler: ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_feature_profile", "data_provenance_profile", "exposure_registry_profile", "challenge_gate"],
  portfolio_renderer: ["final_output_handoff", "renderer_payload"],
  operator: ARTIFACT_NAMES
});

export function assertKnownArtifactName(artifactName) {
  if (!ARTIFACT_NAMES.includes(artifactName)) throw new Error(`INVALID_ARTIFACT_NAME:${artifactName || "missing"}`);
}

export function assertKnownPhase(phase) {
  if (!PHASES.includes(phase)) throw new Error(`INVALID_PHASE:${phase || "missing"}`);
}

export function assertKnownAgent(agent) {
  if (!AGENTS.includes(agent)) throw new Error(`INVALID_AGENT:${agent || "missing"}`);
}
