export const SERVICE_NAME = "interface-diligence-artifacts";

export const PHASES = Object.freeze([
  "AGENT_1_SCOUT_EXTRACT",
  "M6_BUCKET_INDEX",
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

export const BUCKET_ARTIFACT_NAMES = Object.freeze([
  "bucket_target_profile_urls",
  "bucket_product_activity_profile_urls",
  "bucket_data_asset_provenance_profile_urls",
  "bucket_legal_governance_profile_urls"
]);

export const AGENT_1_ARTIFACT_NAMES = Object.freeze([
  "source_family_index",
  ...LOSSLESS_ROOT_FAMILY_ARTIFACT_NAMES
]);

export const ARTIFACT_NAMES = Object.freeze([
  "url_manifest",
  "lossless_source_corpus",
  "source_family_index",
  ...LOSSLESS_ROOT_FAMILY_ARTIFACT_NAMES,
  "source_discovery_handoff",
  ...BUCKET_ARTIFACT_NAMES,
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
  "agent_1_scout_extract",
  "agent_2_m6_bucket_index",
  "agent_3_m9",
  "agent_4_m7_m8",
  "agent_5_m10",
  "agent_6_m11",
  "agent_7_m12",
  "compiler",
  "portfolio_renderer",
  "operator"
]);

export const WRITE_PERMISSIONS = Object.freeze({
  agent_1_scout_extract: AGENT_1_ARTIFACT_NAMES,
  agent_2_m6_bucket_index: ["source_discovery_handoff", ...BUCKET_ARTIFACT_NAMES],
  agent_3_m9: ["legal_cartography_index"],
  agent_4_m7_m8: ["target_profile", "target_profile_forensics", "target_feature_profile", "target_feature_profile_forensics"],
  agent_5_m10: ["data_provenance_profile"],
  agent_6_m11: ["exposure_registry_profile"],
  agent_7_m12: ["challenge_gate"],
  compiler: ["final_output_handoff"],
  portfolio_renderer: ["renderer_payload"],
  operator: ARTIFACT_NAMES
});

export const READ_PERMISSIONS = Object.freeze({
  agent_1_scout_extract: [],
  agent_2_m6_bucket_index: AGENT_1_ARTIFACT_NAMES,
  agent_3_m9: ["source_discovery_handoff", "bucket_legal_governance_profile_urls", "lossless_family__L1_CORE_TERMS_PRIVACY", "lossless_family__L2_B2B_CONTRACTING", "lossless_family__L3_AI_USAGE_GOVERNANCE", "lossless_family__L4_PRIVACY_ADJACENT_NOTICES", "lossless_family__L5_LEGAL_HUB_HOSTED", "lossless_family__L6_ENTITY_NOTICE"],
  agent_4_m7_m8: ["source_discovery_handoff", "bucket_target_profile_urls", "bucket_product_activity_profile_urls", "legal_cartography_index", "lossless_family__T0_ROOT", "lossless_family__T1_IDENTITY", "lossless_family__T2_LEGAL_IDENTITY", "lossless_family__T3_OPERATOR_ENTITY", "lossless_family__T4_SUPPORTING_IDENTITY", "lossless_family__P1_PRODUCT", "lossless_family__P2_PLATFORM_FEATURE_SOLUTION", "lossless_family__P3_AI_CAPABILITY_TECHNICAL", "lossless_family__P4_USE_CASE_INDUSTRY", "lossless_family__P5_ENTERPRISE_PRICING"],
  agent_5_m10: ["source_discovery_handoff", "bucket_data_asset_provenance_profile_urls", "bucket_legal_governance_profile_urls", "legal_cartography_index", "target_profile", "target_feature_profile", "lossless_family__D1_SECURITY_TRUST", "lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER", "lossless_family__D3_DATA_GOVERNANCE_CONTROLS", "lossless_family__D4_DOCS_API_DATA_FLOW", "lossless_family__D5_AI_SAFETY_TRANSPARENCY", "lossless_family__L1_CORE_TERMS_PRIVACY", "lossless_family__L2_B2B_CONTRACTING", "lossless_family__L3_AI_USAGE_GOVERNANCE", "lossless_family__L4_PRIVACY_ADJACENT_NOTICES", "lossless_family__L5_LEGAL_HUB_HOSTED", "lossless_family__L6_ENTITY_NOTICE"],
  agent_6_m11: ["source_discovery_handoff", ...BUCKET_ARTIFACT_NAMES, "legal_cartography_index", "target_profile", "target_profile_forensics", "target_feature_profile", "target_feature_profile_forensics", "data_provenance_profile"],
  agent_7_m12: ["source_discovery_handoff", ...BUCKET_ARTIFACT_NAMES, "legal_cartography_index", "target_profile", "target_feature_profile", "data_provenance_profile", "exposure_registry_profile"],
  compiler: ["source_discovery_handoff", ...BUCKET_ARTIFACT_NAMES, "legal_cartography_index", "target_profile", "target_feature_profile", "data_provenance_profile", "exposure_registry_profile", "challenge_gate"],
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
