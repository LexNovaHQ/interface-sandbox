export const SERVICE_NAME = "interface-diligence-artifacts";

const AGENT_IDS = Object.freeze({
  a1a: "agent_" + "1a_url_manifest",
  a1b: "agent_" + "1b_extract",
  a2a: "agent_" + "2a_bucket_routing",
  a2b: "agent_" + "2b_m9",
  a3: "agent_" + "3_target_feature",
  a4: "agent_" + "4_data_privacy",
  a5: "agent_" + "5_exposure_registry",
  a7: "agent_" + "7_m12"
});

const ART = Object.freeze({
  urlManifest: "url_manifest",
  oldCorpus: "lossless_source_corpus",
  sourceHandoff: "source_discovery_handoff",
  legalIndex: "legal_cartography_index",
  targetMain: "target_" + "profile",
  targetForensics: "target_" + "profile_forensics",
  featureMain: "target_" + "feature_profile",
  featureForensics: "target_" + "feature_profile_forensics",
  dataMain: "data_" + "provenance_profile",
  dataForensics: "data_" + "provenance_profile_forensics",
  exposureRoutePlan: "exposure_registry_route_plan",
  exposureBatchPattern: "exposure_registry_batch__{GROUP}__{NNN}",
  exposureBatchValidationPattern: "exposure_registry_batch_validation__{GROUP}__{NNN}",
  exposureWorkpad: "exposure_registry_workpad_98",
  exposureControlled: "exposure_registry_controlled_profile",
  exposureTriggered: "exposure_registry_triggered_profile",
  exposureForensics: "exposure_registry_profile_forensics",
  exposureLegacy: "exposure_" + "registry_profile",
  challenge: "challenge_gate",
  final: "final_output_handoff",
  renderer: "renderer_payload"
});

export const M11_BATCH_ARTIFACT_PATTERN = /^exposure_registry_batch__[A-Z0-9]+__\d{3}$/;
export const M11_BATCH_VALIDATION_ARTIFACT_PATTERN = /^exposure_registry_batch_validation__[A-Z0-9]+__\d{3}$/;

export const PHASES = Object.freeze([
  "AGENT_1A_URL_MANIFEST",
  "AGENT_1B_EXTRACT",
  "M6_BUCKET_INDEX",
  "M9",
  "M7_TARGET_PROFILE",
  "M7_TARGET_PROFILE_FORENSICS",
  "M8_TARGET_FEATURE_PROFILE",
  "M8_TARGET_FEATURE_PROFILE_FORENSICS",
  "M10",
  "M10_FORENSICS",
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

export const M11_STATIC_ARTIFACT_NAMES = Object.freeze([
  ART.exposureRoutePlan,
  ART.exposureWorkpad,
  ART.exposureControlled,
  ART.exposureTriggered,
  ART.exposureForensics
]);

export const M11_DYNAMIC_ARTIFACT_PATTERNS = Object.freeze([
  ART.exposureBatchPattern,
  ART.exposureBatchValidationPattern
]);

export const LEGACY_ARTIFACT_NAMES = Object.freeze([
  ART.urlManifest,
  ART.oldCorpus,
  ART.exposureLegacy
]);

export const ARTIFACT_NAMES = Object.freeze([
  ...LEGACY_ARTIFACT_NAMES,
  ...AGENT_1_ARTIFACT_NAMES,
  ART.sourceHandoff,
  ART.legalIndex,
  ART.targetMain,
  ART.targetForensics,
  ART.featureMain,
  ART.featureForensics,
  ART.dataMain,
  ART.dataForensics,
  ...M11_STATIC_ARTIFACT_NAMES,
  ART.challenge,
  ART.final,
  ART.renderer
]);

export const AGENTS = Object.freeze([
  AGENT_IDS.a1a,
  AGENT_IDS.a1b,
  AGENT_IDS.a2a,
  AGENT_IDS.a2b,
  AGENT_IDS.a3,
  AGENT_IDS.a4,
  AGENT_IDS.a5,
  AGENT_IDS.a7,
  "compiler",
  "portfolio_renderer",
  "operator"
]);

export const WRITE_PERMISSIONS = Object.freeze({
  [AGENT_IDS.a1a]: AGENT_1A_ARTIFACT_NAMES,
  [AGENT_IDS.a1b]: AGENT_1B_ARTIFACT_NAMES,
  [AGENT_IDS.a2a]: [ART.sourceHandoff],
  [AGENT_IDS.a2b]: [ART.legalIndex],
  [AGENT_IDS.a3]: [ART.targetMain, ART.targetForensics, ART.featureMain, ART.featureForensics],
  [AGENT_IDS.a4]: [ART.dataMain, ART.dataForensics],
  [AGENT_IDS.a5]: [ART.exposureRoutePlan, ART.exposureBatchPattern, ART.exposureBatchValidationPattern, ART.exposureWorkpad, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics, ART.challenge],
  [AGENT_IDS.a7]: [ART.exposureBatchValidationPattern, ART.challenge],
  compiler: [ART.final],
  portfolio_renderer: [ART.renderer],
  operator: [...ARTIFACT_NAMES, ...M11_DYNAMIC_ARTIFACT_PATTERNS]
});

export const PHASE_WRITE_PERMISSIONS = Object.freeze({
  AGENT_1A_URL_MANIFEST: AGENT_1A_ARTIFACT_NAMES,
  AGENT_1B_EXTRACT: AGENT_1B_ARTIFACT_NAMES,
  M6_BUCKET_INDEX: [ART.sourceHandoff],
  M9: [ART.legalIndex],
  M7_TARGET_PROFILE: [ART.targetMain],
  M7_TARGET_PROFILE_FORENSICS: [ART.targetForensics],
  M8_TARGET_FEATURE_PROFILE: [ART.featureMain],
  M8_TARGET_FEATURE_PROFILE_FORENSICS: [ART.featureForensics],
  M10: [ART.dataMain],
  M10_FORENSICS: [ART.dataForensics],
  M11: [ART.exposureRoutePlan, ART.exposureBatchPattern, ART.exposureBatchValidationPattern, ART.exposureWorkpad, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics],
  M12: [ART.exposureBatchValidationPattern, ART.challenge],
  COMPILER: [ART.final],
  RENDERER: [ART.renderer],
  COMPLETE: []
});

export const READ_PERMISSIONS = Object.freeze({
  [AGENT_IDS.a1a]: [],
  [AGENT_IDS.a1b]: ["deduped_url_manifest"],
  [AGENT_IDS.a2a]: AGENT_1_ARTIFACT_NAMES,
  [AGENT_IDS.a2b]: [ART.sourceHandoff, ...LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES],
  [AGENT_IDS.a3]: [ART.sourceHandoff, ART.legalIndex, ART.targetMain, ART.targetForensics, ART.featureMain, ...TARGET_PROFILE_FAMILY_ARTIFACT_NAMES, ...PRODUCT_ACTIVITY_FAMILY_ARTIFACT_NAMES],
  [AGENT_IDS.a4]: [ART.sourceHandoff, ART.legalIndex, ART.targetMain, ART.targetForensics, ART.featureMain, ART.featureForensics, ART.dataMain, ...DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES, "lossless_family__L1_CORE_TERMS_PRIVACY", "lossless_family__L2_B2B_CONTRACTING", "lossless_family__L4_PRIVACY_ADJACENT_NOTICES"],
  [AGENT_IDS.a5]: [ART.sourceHandoff, ART.legalIndex, ART.targetMain, ART.targetForensics, ART.featureMain, ART.featureForensics, ART.dataMain, ART.dataForensics, ...LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES, ART.exposureRoutePlan, ART.exposureBatchPattern, ART.exposureBatchValidationPattern, ART.exposureWorkpad, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics, ART.challenge],
  [AGENT_IDS.a7]: [ART.sourceHandoff, ART.legalIndex, ART.targetMain, ART.targetForensics, ART.featureMain, ART.featureForensics, ART.dataMain, ART.dataForensics, ART.exposureRoutePlan, ART.exposureBatchPattern, ART.exposureBatchValidationPattern, ART.exposureWorkpad, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics],
  compiler: [ART.sourceHandoff, ART.legalIndex, ART.targetMain, ART.featureMain, ART.dataMain, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics, ART.challenge],
  portfolio_renderer: [ART.final, ART.renderer],
  operator: [...ARTIFACT_NAMES, ...M11_DYNAMIC_ARTIFACT_PATTERNS]
});

export function isKnownArtifactName(artifactName) {
  const name = String(artifactName || "");
  return ARTIFACT_NAMES.includes(name) || M11_BATCH_ARTIFACT_PATTERN.test(name) || M11_BATCH_VALIDATION_ARTIFACT_PATTERN.test(name);
}

export function artifactMatchesPermission(artifactName, permission) {
  if (permission === artifactName) return true;
  if (permission === ART.exposureBatchPattern) return M11_BATCH_ARTIFACT_PATTERN.test(artifactName);
  if (permission === ART.exposureBatchValidationPattern) return M11_BATCH_VALIDATION_ARTIFACT_PATTERN.test(artifactName);
  return false;
}

export function assertKnownArtifactName(artifactName) {
  if (!isKnownArtifactName(artifactName)) throw new Error(`INVALID_ARTIFACT_NAME:${artifactName || "missing"}`);
}

export function assertKnownPhase(phase) {
  if (!PHASES.includes(phase)) throw new Error(`INVALID_PHASE:${phase || "missing"}`);
}

export function assertKnownAgent(agent) {
  if (!AGENTS.includes(agent)) throw new Error(`INVALID_AGENT:${agent}`);
}

export function assertPhaseCanWriteArtifact(phase, artifactName) {
  assertKnownPhase(phase);
  assertKnownArtifactName(artifactName);
  const allowed = PHASE_WRITE_PERMISSIONS[phase] || [];
  if (!allowed.some((permission) => artifactMatchesPermission(artifactName, permission))) {
    throw new Error(`PHASE_WRITE_FORBIDDEN:${phase}:${artifactName}`);
  }
}
