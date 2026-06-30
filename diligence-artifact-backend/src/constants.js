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
  uploadedSourceDocumentIndex: "uploaded_source_document_index",
  uploadedSourceDocumentCorpus: "uploaded_source_document_corpus",
  legalDeterministicMap: "legal_cartography_deterministic_map",
  legalSemanticProfile: "legal_cartography_semantic_profile",
  legalReinvestigationWorkpad: "legal_cartography_reinvestigation_workpad",
  legalIndex: "legal_cartography_index",
  targetMain: "target_" + "profile",
  targetForensics: "target_" + "profile_forensics",
  featureMain: "target_" + "feature_profile",
  featureForensics: "target_" + "feature_profile_forensics",
  dataMain: "data_" + "provenance_profile",
  dataForensics: "data_" + "provenance_profile_forensics",
  extendedDap: "extended_dap_india_readiness_profile",
  integratedDap: "integrated_dap_report",
  exposureRoutePlan: "exposure_registry_route_plan",
  exposureBatchPattern: "exposure_registry_batch__{GROUP}__{NNN}",
  exposureBatchValidationPattern: "exposure_registry_batch_validation__{GROUP}__{NNN}",
  exposureWorkpad: "exposure_registry_workpad_98",
  exposureControlled: "exposure_registry_controlled_profile",
  exposureTriggered: "exposure_registry_triggered_profile",
  exposureForensics: "exposure_registry_profile_forensics",
  exposureLegacy: "exposure_" + "registry_profile",
  challenge: "challenge_gate",
  profilesCombined: "profiles_combined",
  forensicsCombined: "forensics_combined",
  final: "final_output_handoff",
  normalizedReportManifest: "normalized_report_manifest",
  vaultSectionHandoff: "vault_section_handoff",
  qualifiedReviewHandoff: "qualified_review_handoff",
  renderer: "renderer_payload"
});

export const M11_BATCH_ARTIFACT_PATTERN = /^exposure_registry_batch__[A-Z0-9]+__\d{3}$/;
export const M11_BATCH_VALIDATION_ARTIFACT_PATTERN = /^exposure_registry_batch_validation__[A-Z0-9]+__\d{3}$/;

export const NORMALIZED_SECTION_ARTIFACT_NAMES = Object.freeze([
  "normalized_section__matter_overview",
  "normalized_section__executive_summary",
  "normalized_section__target_profile",
  "normalized_section__product_activity_ip_profile",
  "normalized_section__data_provenance_controls",
  "normalized_section__legal_document_control_review",
  "normalized_section__exposure_findings",
  "normalized_section__implications_review_path",
  "normalized_section__evidence_gaps_clarification_points",
  "normalized_section__methodology_limitations_review_notes",
  "normalized_section__forensic_ledger_appendix"
]);

export const NORMALIZED_COMPILER_ARTIFACT_NAMES = Object.freeze([
  ART.normalizedReportManifest,
  ART.vaultSectionHandoff,
  ART.qualifiedReviewHandoff,
  ART.final,
  ...NORMALIZED_SECTION_ARTIFACT_NAMES
]);

export const COMPILER_ARTIFACT_NAMES = NORMALIZED_COMPILER_ARTIFACT_NAMES;

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
  "AGENT_4B_EXTENDED_DAP_INDIA_READINESS",
  "AGENT_4C_INTEGRATED_DAP_REPORT",
  "M11",
  "M12",
  "NORMALIZED_COMPILER",
  "RENDERER",
  "COMPLETE"
]);

export const LOCK_STATUSES = Object.freeze(["CREATED", "RUNNING", "LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE", "COMPLETE"]);

export const ROOT_FAMILY_CODES = Object.freeze([
  "T0_ROOT", "T1_IDENTITY", "T2_LEGAL_IDENTITY", "T3_OPERATOR_ENTITY", "T4_SUPPORTING_IDENTITY",
  "P1_PRODUCT", "P2_PLATFORM_FEATURE_SOLUTION", "P3_AI_CAPABILITY_TECHNICAL", "P4_USE_CASE_INDUSTRY", "P5_ENTERPRISE_PRICING",
  "D1_SECURITY_TRUST", "D2_SUBPROCESSOR_PRIVACY_CENTER", "D3_DATA_GOVERNANCE_CONTROLS", "D4_DOCS_API_DATA_FLOW", "D5_AI_SAFETY_TRANSPARENCY",
  "L1_CORE_TERMS_PRIVACY", "L2_B2B_CONTRACTING", "L3_AI_USAGE_GOVERNANCE", "L4_PRIVACY_ADJACENT_NOTICES", "L5_LEGAL_HUB_HOSTED", "L6_ENTITY_NOTICE"
]);

const ROOT_FAMILY_PATTERN_SOURCE = ROOT_FAMILY_CODES.map(escapeRegExp).join("|");
export const LOSSLESS_FAMILY_ARTIFACT_PATTERN = new RegExp(`^lossless_family__(${ROOT_FAMILY_PATTERN_SOURCE})(?:__part_\\d{3})?$`);
export const LOSSLESS_FAMILY_PART_ARTIFACT_PATTERN = new RegExp(`^lossless_family__(${ROOT_FAMILY_PATTERN_SOURCE})__part_\\d{3}$`);

export const LOSSLESS_ROOT_FAMILY_ARTIFACT_NAMES = Object.freeze(ROOT_FAMILY_CODES.map((code) => `lossless_family__${code}`));
export const LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES = Object.freeze(["lossless_family__L1_CORE_TERMS_PRIVACY", "lossless_family__L2_B2B_CONTRACTING", "lossless_family__L3_AI_USAGE_GOVERNANCE", "lossless_family__L4_PRIVACY_ADJACENT_NOTICES", "lossless_family__L5_LEGAL_HUB_HOSTED", "lossless_family__L6_ENTITY_NOTICE"]);
export const TARGET_PROFILE_FAMILY_ARTIFACT_NAMES = Object.freeze(["lossless_family__T0_ROOT", "lossless_family__T1_IDENTITY", "lossless_family__T2_LEGAL_IDENTITY", "lossless_family__T3_OPERATOR_ENTITY", "lossless_family__T4_SUPPORTING_IDENTITY"]);
export const PRODUCT_ACTIVITY_FAMILY_ARTIFACT_NAMES = Object.freeze(["lossless_family__P1_PRODUCT", "lossless_family__P2_PLATFORM_FEATURE_SOLUTION", "lossless_family__P3_AI_CAPABILITY_TECHNICAL", "lossless_family__P4_USE_CASE_INDUSTRY", "lossless_family__P5_ENTERPRISE_PRICING"]);
export const DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES = Object.freeze(["lossless_family__D1_SECURITY_TRUST", "lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER", "lossless_family__D3_DATA_GOVERNANCE_CONTROLS", "lossless_family__D4_DOCS_API_DATA_FLOW", "lossless_family__D5_AI_SAFETY_TRANSPARENCY"]);

export const UPLOADED_SOURCE_DOCUMENT_ARTIFACT_NAMES = Object.freeze([ART.uploadedSourceDocumentIndex, ART.uploadedSourceDocumentCorpus]);
export const AGENT_1A_ARTIFACT_NAMES = Object.freeze(["deduped_url_manifest"]);
export const AGENT_1B_REQUIRED_ARTIFACT_NAMES = Object.freeze(["source_family_index"]);
export const AGENT_1B_OPTIONAL_FAMILY_ARTIFACT_NAMES = LOSSLESS_ROOT_FAMILY_ARTIFACT_NAMES;
export const AGENT_1B_WRITE_PERMISSION_ARTIFACT_NAMES = Object.freeze([...AGENT_1B_REQUIRED_ARTIFACT_NAMES, ...AGENT_1B_OPTIONAL_FAMILY_ARTIFACT_NAMES]);
export const AGENT_1B_ARTIFACT_NAMES = AGENT_1B_REQUIRED_ARTIFACT_NAMES;
export const AGENT_1_ARTIFACT_NAMES = Object.freeze([...AGENT_1A_ARTIFACT_NAMES, ...AGENT_1B_REQUIRED_ARTIFACT_NAMES]);

function escapeRegExp(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
