const ART = Object.freeze({
  uploadedSourceDocumentIndex: "uploaded_source_document_index",
  uploadedSourceDocumentCorpus: "uploaded_source_document_corpus",
  sourceHandoff: "source_discovery_handoff",
  legalDeterministicMap: "legal_cartography_deterministic_map",
  legalSemanticProfile: "legal_cartography_semantic_profile",
  legalReinvestigationWorkpad: "legal_cartography_reinvestigation_workpad",
  legalIndex: "legal_cartography_index",
  legalSignalDerivationProfile: "legal_signal_derivation_profile",
  targetLegalSignalOverlay: "m7_deterministic_legal_signal_overlay",
  dataSelectedLegalSupport: "m10_selected_legal_support_packet",
  targetProfile: "target_profile",
  targetForensics: "target_profile_forensics",
  activityInventory: "feature_candidate_inventory",
  activityProfile: "target_feature_profile",
  activityForensics: "target_feature_profile_forensics",
  dataProfile: "data_provenance_profile",
  dataForensics: "data_provenance_profile_forensics",
  extendedDataReadiness: "extended_dap_india_readiness_profile",
  integratedDataReport: "integrated_dap_report",
  exposureRoutePlan: "exposure_registry_route_plan",
  exposureBatchPattern: "exposure_registry_batch__{GROUP}__{NNN}",
  exposureBatchValidationPattern: "exposure_registry_batch_validation__{GROUP}__{NNN}",
  exposureWorkpad: "exposure_registry_workpad_98",
  exposureControlled: "exposure_registry_controlled_profile",
  exposureTriggered: "exposure_registry_triggered_profile",
  exposureForensics: "exposure_registry_profile_forensics",
  challengeGate: "challenge_gate",
  normalizedReportManifest: "normalized_report_manifest",
  reviewReadySectionHandoff: "review_ready_section_handoff",
  finalOutputHandoff: "final_output_handoff",
  rendererPayload: "renderer_payload",
  qualifiedReviewHandoff: "qualified_review_handoff",
  qualifiedReviewRendererPayload: "qualified_review_renderer_payload",
  qualifiedReviewValidationManifest: "qualified_review_validation_manifest",
  qualifiedReviewSubmission: "qualified_review_submission",
  qrEntityCommercial: "qr_artifact__entity_commercial",
  qrTechnologyInfrastructure: "qr_artifact__technology_infrastructure",
  qrAiCapabilityProductBehavior: "qr_artifact__ai_capability_product_behavior",
  qrDapPrivacyIndiaCyber: "qr_artifact__dap_privacy_india_cyber",
  diligenceQaCompletionReceipt: "diligence_qa_completion_receipt",
  archivedUrlManifest: "url_manifest",
  archivedLosslessSourceCorpus: "lossless_source_corpus",
  archivedExposureProfile: "exposure_registry_profile",
  archivedProfilesCombined: "profiles_combined",
  archivedForensicsCombined: "forensics_combined"
});

export const AGENT_IDS = Object.freeze({
  sourceUrlManifest: "agent_1a_url_manifest",
  sourceExtractor: "agent_1b_extract",
  sourceDiscovery: "agent_2a_bucket_routing",
  legalCartography: "agent_2b_m9",
  targetActivity: "agent_3_target_feature",
  dataProvenance: "agent_4_data_privacy",
  exposureRegistry: "agent_5_exposure_registry",
  operatorChallenge: "agent_7_m12",
  documentSourceIngestor: "document_source_ingestor",
  extendedDataReadiness: "agent_4b_extended_dap",
  integratedDataReport: "agent_4c_integrated_dap_compiler",
  compiler: "compiler",
  qualifiedReview: "qualified_review_system",
  diligenceQaGate: "diligence_qa_gate",
  assemblyEngine: "assembly_engine",
  renderer: "portfolio_renderer",
  operator: "operator"
});

export const ROOT_FAMILY_CODES = Object.freeze(["T0_ROOT", "T1_IDENTITY", "T2_LEGAL_IDENTITY", "T3_OPERATOR_ENTITY", "T4_SUPPORTING_IDENTITY", "P1_PRODUCT", "P2_PLATFORM_FEATURE_SOLUTION", "P3_AI_CAPABILITY_TECHNICAL", "P4_USE_CASE_INDUSTRY", "P5_ENTERPRISE_PRICING", "D1_SECURITY_TRUST", "D2_SUBPROCESSOR_PRIVACY_CENTER", "D3_DATA_GOVERNANCE_CONTROLS", "D4_DOCS_API_DATA_FLOW", "D5_AI_SAFETY_TRANSPARENCY", "L1_CORE_TERMS_PRIVACY", "L2_B2B_CONTRACTING", "L3_AI_USAGE_GOVERNANCE", "L4_PRIVACY_ADJACENT_NOTICES", "L5_LEGAL_HUB_HOSTED", "L6_ENTITY_NOTICE"]);
const ROOT_FAMILY_PATTERN_SOURCE = ROOT_FAMILY_CODES.map(escapeRegExp).join("|");
export const LOSSLESS_FAMILY_ARTIFACT_PATTERN = new RegExp(`^lossless_family__(${ROOT_FAMILY_PATTERN_SOURCE})(?:__part_\\d{3})?$`);
export const LOSSLESS_FAMILY_PART_ARTIFACT_PATTERN = new RegExp(`^lossless_family__(${ROOT_FAMILY_PATTERN_SOURCE})__part_\\d{3}$`);
export const LOSSLESS_ROOT_FAMILY_ARTIFACT_NAMES = Object.freeze(ROOT_FAMILY_CODES.map((code) => `lossless_family__${code}`));
export const LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES = Object.freeze(["lossless_family__L1_CORE_TERMS_PRIVACY", "lossless_family__L2_B2B_CONTRACTING", "lossless_family__L3_AI_USAGE_GOVERNANCE", "lossless_family__L4_PRIVACY_ADJACENT_NOTICES", "lossless_family__L5_LEGAL_HUB_HOSTED", "lossless_family__L6_ENTITY_NOTICE"]);
export const TARGET_PROFILE_FAMILY_ARTIFACT_NAMES = Object.freeze(["lossless_family__T0_ROOT", "lossless_family__T1_IDENTITY", "lossless_family__T2_LEGAL_IDENTITY", "lossless_family__T3_OPERATOR_ENTITY", "lossless_family__T4_SUPPORTING_IDENTITY"]);
export const PRODUCT_ACTIVITY_FAMILY_ARTIFACT_NAMES = Object.freeze(["lossless_family__P1_PRODUCT", "lossless_family__P2_PLATFORM_FEATURE_SOLUTION", "lossless_family__P3_AI_CAPABILITY_TECHNICAL", "lossless_family__P4_USE_CASE_INDUSTRY", "lossless_family__P5_ENTERPRISE_PRICING"]);
export const DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES = Object.freeze(["lossless_family__D1_SECURITY_TRUST", "lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER", "lossless_family__D3_DATA_GOVERNANCE_CONTROLS", "lossless_family__D4_DOCS_API_DATA_FLOW", "lossless_family__D5_AI_SAFETY_TRANSPARENCY"]);

export const M11_BATCH_ARTIFACT_PATTERN = /^exposure_registry_batch__[A-Z0-9]+__\d{3}$/;
export const M11_BATCH_VALIDATION_ARTIFACT_PATTERN = /^exposure_registry_batch_validation__[A-Z0-9]+__\d{3}$/;
export const AGENT_1A_ARTIFACT_NAMES = Object.freeze(["deduped_url_manifest"]);
export const AGENT_1B_REQUIRED_ARTIFACT_NAMES = Object.freeze(["source_family_index"]);
export const AGENT_1B_OPTIONAL_FAMILY_ARTIFACT_NAMES = LOSSLESS_ROOT_FAMILY_ARTIFACT_NAMES;
export const AGENT_1B_WRITE_PERMISSION_ARTIFACT_NAMES = Object.freeze([...AGENT_1B_REQUIRED_ARTIFACT_NAMES, ...AGENT_1B_OPTIONAL_FAMILY_ARTIFACT_NAMES]);
export const AGENT_1B_ARTIFACT_NAMES = AGENT_1B_REQUIRED_ARTIFACT_NAMES;
export const AGENT_1_ARTIFACT_NAMES = Object.freeze([...AGENT_1A_ARTIFACT_NAMES, ...AGENT_1B_REQUIRED_ARTIFACT_NAMES]);
export const LEGAL_SIGNAL_DERIVATION_ARTIFACT_NAMES = Object.freeze([ART.legalSignalDerivationProfile]);
export const M7_DETERMINISTIC_LEGAL_SIGNAL_ARTIFACT_NAMES = Object.freeze([]);
export const M10_SELECTED_LEGAL_SUPPORT_ARTIFACT_NAMES = Object.freeze([]);
export const FEATURE_CANDIDATE_INVENTORY_ARTIFACT_NAMES = Object.freeze([ART.activityInventory]);
export const EXTENDED_DAP_ARTIFACT_NAMES = Object.freeze([ART.extendedDataReadiness]);
export const INTEGRATED_DAP_ARTIFACT_NAMES = Object.freeze([ART.integratedDataReport]);
export const M11_STATIC_ARTIFACT_NAMES = Object.freeze([ART.exposureRoutePlan, ART.exposureWorkpad, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics]);
export const M11_DYNAMIC_ARTIFACT_PATTERNS = Object.freeze([ART.exposureBatchPattern, ART.exposureBatchValidationPattern]);
export const UPLOADED_SOURCE_DOCUMENT_ARTIFACT_NAMES = Object.freeze([ART.uploadedSourceDocumentIndex, ART.uploadedSourceDocumentCorpus]);

export const NORMALIZED_SECTION_ARTIFACT_NAMES = Object.freeze(["normalized_section__matter_overview", "normalized_section__executive_summary", "normalized_section__target_profile", "normalized_section__product_activity_ip_profile", "normalized_section__data_provenance_controls", "normalized_section__legal_document_control_review", "normalized_section__exposure_summary_harm_mechanism_workpad_summary", "normalized_section__exposure_diagnosis_table", "normalized_section__exposure_control_discipline", "normalized_section__review_route_action_plan", "normalized_section__control_handoff_readiness", "normalized_section__exposure_clarification_queue", "normalized_section__global_confirmation_queue", "normalized_section__methodology_limitations_forensic_annexure"]);
export const NORMALIZED_COMPILER_ARTIFACT_NAMES = Object.freeze([ART.normalizedReportManifest, ART.reviewReadySectionHandoff, ART.finalOutputHandoff, ...NORMALIZED_SECTION_ARTIFACT_NAMES]);
export const COMPILER_ARTIFACT_NAMES = NORMALIZED_COMPILER_ARTIFACT_NAMES;
export const QUALIFIED_REVIEW_SECTION_ARTIFACT_NAMES = Object.freeze([ART.qrEntityCommercial, ART.qrTechnologyInfrastructure, ART.qrAiCapabilityProductBehavior, ART.qrDapPrivacyIndiaCyber]);
export const QUALIFIED_REVIEW_RUNTIME_ARTIFACT_NAMES = Object.freeze([...QUALIFIED_REVIEW_SECTION_ARTIFACT_NAMES, ART.qualifiedReviewRendererPayload, ART.qualifiedReviewValidationManifest]);
export const QUALIFIED_REVIEW_ARTIFACT_NAMES = Object.freeze([ART.qualifiedReviewHandoff, ...QUALIFIED_REVIEW_SECTION_ARTIFACT_NAMES, ART.qualifiedReviewRendererPayload, ART.qualifiedReviewValidationManifest, ART.qualifiedReviewSubmission]);
export const DILIGENCE_QA_ARTIFACT_NAMES = Object.freeze([ART.diligenceQaCompletionReceipt]);
export const ARCHIVED_LEGACY_ARTIFACT_NAMES = Object.freeze([ART.archivedUrlManifest, ART.archivedLosslessSourceCorpus, ART.archivedExposureProfile, ART.archivedProfilesCombined, ART.archivedForensicsCombined]);
export const LEGACY_ARTIFACT_NAMES = ARCHIVED_LEGACY_ARTIFACT_NAMES;
export const QUALIFIED_REVIEW_READ_ARTIFACT_NAMES = Object.freeze(["source_family_index", ART.sourceHandoff, ART.legalIndex, ART.legalSignalDerivationProfile, ART.targetProfile, ART.targetForensics, ART.activityInventory, ART.activityProfile, ART.activityForensics, ART.dataProfile, ART.dataForensics, ART.extendedDataReadiness, ART.integratedDataReport, ART.exposureRoutePlan, ART.exposureBatchPattern, ART.exposureBatchValidationPattern, ART.exposureWorkpad, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics, ART.challengeGate, ...NORMALIZED_COMPILER_ARTIFACT_NAMES, ...LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES, ...TARGET_PROFILE_FAMILY_ARTIFACT_NAMES, ...PRODUCT_ACTIVITY_FAMILY_ARTIFACT_NAMES, ...DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES, ...UPLOADED_SOURCE_DOCUMENT_ARTIFACT_NAMES, ...QUALIFIED_REVIEW_ARTIFACT_NAMES]);
export const ARTIFACT_NAMES = Object.freeze([...UPLOADED_SOURCE_DOCUMENT_ARTIFACT_NAMES, ...AGENT_1_ARTIFACT_NAMES, ART.sourceHandoff, ART.legalDeterministicMap, ART.legalSemanticProfile, ART.legalReinvestigationWorkpad, ART.legalIndex, ART.legalSignalDerivationProfile, ART.targetLegalSignalOverlay, ART.dataSelectedLegalSupport, ART.targetProfile, ART.targetForensics, ART.activityInventory, ART.activityProfile, ART.activityForensics, ART.dataProfile, ART.dataForensics, ...EXTENDED_DAP_ARTIFACT_NAMES, ...INTEGRATED_DAP_ARTIFACT_NAMES, ...M11_STATIC_ARTIFACT_NAMES, ART.challengeGate, ...NORMALIZED_COMPILER_ARTIFACT_NAMES, ...QUALIFIED_REVIEW_ARTIFACT_NAMES, ...DILIGENCE_QA_ARTIFACT_NAMES, ART.rendererPayload]);
export const AGENTS = Object.freeze([...Object.values(AGENT_IDS)]);

export const WRITE_PERMISSIONS = Object.freeze({
  [AGENT_IDS.sourceUrlManifest]: AGENT_1A_ARTIFACT_NAMES,
  [AGENT_IDS.sourceExtractor]: AGENT_1B_WRITE_PERMISSION_ARTIFACT_NAMES,
  [AGENT_IDS.sourceDiscovery]: [ART.sourceHandoff],
  [AGENT_IDS.legalCartography]: [ART.legalDeterministicMap, ART.legalSemanticProfile, ART.legalReinvestigationWorkpad, ART.legalIndex, ART.legalSignalDerivationProfile],
  [AGENT_IDS.targetActivity]: [ART.targetProfile, ART.targetForensics, ART.activityInventory, ART.activityProfile, ART.activityForensics],
  [AGENT_IDS.dataProvenance]: [ART.dataProfile, ART.dataForensics],
  [AGENT_IDS.exposureRegistry]: [ART.exposureRoutePlan, ART.exposureBatchPattern, ART.exposureBatchValidationPattern, ART.exposureWorkpad, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics, ART.challengeGate],
  [AGENT_IDS.operatorChallenge]: [ART.exposureBatchValidationPattern, ART.challengeGate],
  [AGENT_IDS.documentSourceIngestor]: UPLOADED_SOURCE_DOCUMENT_ARTIFACT_NAMES,
  [AGENT_IDS.extendedDataReadiness]: EXTENDED_DAP_ARTIFACT_NAMES,
  [AGENT_IDS.integratedDataReport]: INTEGRATED_DAP_ARTIFACT_NAMES,
  [AGENT_IDS.compiler]: COMPILER_ARTIFACT_NAMES,
  [AGENT_IDS.qualifiedReview]: QUALIFIED_REVIEW_ARTIFACT_NAMES,
  [AGENT_IDS.diligenceQaGate]: DILIGENCE_QA_ARTIFACT_NAMES,
  [AGENT_IDS.assemblyEngine]: [],
  [AGENT_IDS.renderer]: [ART.rendererPayload],
  [AGENT_IDS.operator]: [...ARTIFACT_NAMES, ...M11_DYNAMIC_ARTIFACT_PATTERNS, ...ARCHIVED_LEGACY_ARTIFACT_NAMES]
});

export const READ_PERMISSIONS = Object.freeze({
  [AGENT_IDS.sourceUrlManifest]: [],
  [AGENT_IDS.sourceExtractor]: ["deduped_url_manifest"],
  [AGENT_IDS.sourceDiscovery]: [...AGENT_1_ARTIFACT_NAMES, ...AGENT_1B_OPTIONAL_FAMILY_ARTIFACT_NAMES],
  [AGENT_IDS.legalCartography]: ["source_family_index", ART.sourceHandoff, ...LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES],
  [AGENT_IDS.targetActivity]: ["source_family_index", ART.sourceHandoff, ART.legalSignalDerivationProfile, ART.targetProfile, ART.targetForensics, ART.activityInventory, ART.activityProfile, ...TARGET_PROFILE_FAMILY_ARTIFACT_NAMES, ...PRODUCT_ACTIVITY_FAMILY_ARTIFACT_NAMES],
  [AGENT_IDS.dataProvenance]: ["source_family_index", ART.sourceHandoff, ART.legalIndex, ART.legalSignalDerivationProfile, ART.activityProfile, ART.dataProfile, ...DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES],
  [AGENT_IDS.exposureRegistry]: ["source_family_index", ART.sourceHandoff, ART.legalIndex, ART.legalSignalDerivationProfile, ART.targetProfile, ART.targetForensics, ART.activityInventory, ART.activityProfile, ART.activityForensics, ART.dataProfile, ART.dataForensics, ...LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES, ART.exposureRoutePlan, ART.exposureBatchPattern, ART.exposureBatchValidationPattern, ART.exposureWorkpad, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics, ART.challengeGate],
  [AGENT_IDS.operatorChallenge]: ["source_family_index", ART.sourceHandoff, ART.legalIndex, ART.legalSignalDerivationProfile, ART.targetProfile, ART.targetForensics, ART.activityInventory, ART.activityProfile, ART.activityForensics, ART.dataProfile, ART.dataForensics, ART.exposureRoutePlan, ART.exposureBatchPattern, ART.exposureBatchValidationPattern, ART.exposureWorkpad, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics],
  [AGENT_IDS.documentSourceIngestor]: [],
  [AGENT_IDS.extendedDataReadiness]: [ART.sourceHandoff, ART.legalIndex, ART.legalSignalDerivationProfile, ART.targetProfile, ART.targetForensics, ART.activityInventory, ART.activityProfile, ART.activityForensics, ART.dataProfile, ART.dataForensics, ...DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES, ...LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES],
  [AGENT_IDS.integratedDataReport]: [ART.dataProfile, ART.dataForensics, ART.extendedDataReadiness],
  [AGENT_IDS.compiler]: [ART.sourceHandoff, ART.legalIndex, ART.legalSignalDerivationProfile, ART.targetProfile, ART.targetForensics, ART.activityInventory, ART.activityProfile, ART.activityForensics, ART.dataProfile, ART.dataForensics, ART.extendedDataReadiness, ART.integratedDataReport, ART.exposureRoutePlan, ART.exposureBatchPattern, ART.exposureBatchValidationPattern, ART.exposureWorkpad, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics, ART.challengeGate, ART.finalOutputHandoff],
  [AGENT_IDS.qualifiedReview]: QUALIFIED_REVIEW_READ_ARTIFACT_NAMES,
  [AGENT_IDS.diligenceQaGate]: [ART.rendererPayload, ART.qualifiedReviewRendererPayload, ART.qualifiedReviewValidationManifest],
  [AGENT_IDS.assemblyEngine]: [ART.qualifiedReviewSubmission],
  [AGENT_IDS.renderer]: [ART.finalOutputHandoff, ART.normalizedReportManifest, ART.reviewReadySectionHandoff, ART.qualifiedReviewHandoff, ART.qualifiedReviewSubmission, ...NORMALIZED_SECTION_ARTIFACT_NAMES, ART.rendererPayload],
  [AGENT_IDS.operator]: [...ARTIFACT_NAMES, ...AGENT_1B_OPTIONAL_FAMILY_ARTIFACT_NAMES, ...M11_DYNAMIC_ARTIFACT_PATTERNS, ...ARCHIVED_LEGACY_ARTIFACT_NAMES]
});

export const INTERNAL_JOB_WRITE_PERMISSIONS = Object.freeze({ AGENT_1A_URL_MANIFEST: AGENT_1A_ARTIFACT_NAMES, AGENT_1B_EXTRACT: AGENT_1B_WRITE_PERMISSION_ARTIFACT_NAMES, M6_BUCKET_INDEX: [ART.sourceHandoff], M9: [ART.legalDeterministicMap, ART.legalSemanticProfile, ART.legalReinvestigationWorkpad, ART.legalIndex, ART.legalSignalDerivationProfile], M7_TARGET_PROFILE: [ART.targetProfile], M7_TARGET_PROFILE_FORENSICS: [ART.targetForensics], M8_FEATURE_CANDIDATE_INVENTORY: [ART.activityInventory], M8_TARGET_FEATURE_PROFILE: [ART.activityProfile], M8_TARGET_FEATURE_PROFILE_FORENSICS: [ART.activityForensics], M10: [ART.dataProfile], M10_FORENSICS: [ART.dataForensics], AGENT_4B_EXTENDED_DAP_INDIA_READINESS: EXTENDED_DAP_ARTIFACT_NAMES, AGENT_4C_INTEGRATED_DAP_REPORT: INTEGRATED_DAP_ARTIFACT_NAMES, M11: [ART.exposureRoutePlan, ART.exposureBatchPattern, ART.exposureBatchValidationPattern, ART.exposureWorkpad, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics], M12: [ART.exposureBatchValidationPattern, ART.challengeGate], NORMALIZED_COMPILER: COMPILER_ARTIFACT_NAMES, NORMALIZED_REPORT_RENDERER: [ART.rendererPayload], RENDERER: [ART.rendererPayload], QUALIFIED_REVIEW: QUALIFIED_REVIEW_RUNTIME_ARTIFACT_NAMES, DILIGENCE_QA_COMPLETE: DILIGENCE_QA_ARTIFACT_NAMES, QUALIFIED_REVIEW_SUBMISSION: [ART.qualifiedReviewSubmission], ASSEMBLY_ENGINE: [], COMPLETE: [] });

export function isKnownArtifactName(artifactName) { const name = String(artifactName || ""); return ARTIFACT_NAMES.includes(name) || ARCHIVED_LEGACY_ARTIFACT_NAMES.includes(name) || LOSSLESS_FAMILY_ARTIFACT_PATTERN.test(name) || M11_BATCH_ARTIFACT_PATTERN.test(name) || M11_BATCH_VALIDATION_ARTIFACT_PATTERN.test(name); }
export function artifactMatchesPermission(artifactName, permission) { if (permission === artifactName) return true; if (permission === ART.exposureBatchPattern) return M11_BATCH_ARTIFACT_PATTERN.test(artifactName); if (permission === ART.exposureBatchValidationPattern) return M11_BATCH_VALIDATION_ARTIFACT_PATTERN.test(artifactName); if (String(permission || "").startsWith("lossless_family__")) return artifactName === permission || artifactName.startsWith(`${permission}__part_`); return false; }
export function assertKnownArtifactName(artifactName) { if (!isKnownArtifactName(artifactName)) throw new Error(`INVALID_ARTIFACT_NAME:${artifactName || "missing"}`); }
export function assertKnownAgent(agentId) { if (!AGENTS.includes(agentId)) throw new Error(`INVALID_AGENT:${agentId || "missing"}`); }
export function assertCanReadArtifact(agentId, artifactName) { assertKnownAgent(agentId); assertKnownArtifactName(artifactName); const allowed = READ_PERMISSIONS[agentId] || []; if (!allowed.some((permission) => artifactMatchesPermission(artifactName, permission))) throw new Error(`READ_FORBIDDEN:${agentId}:${artifactName}`); }
export function assertCanWriteArtifact(agentId, artifactName) { assertKnownAgent(agentId); assertKnownArtifactName(artifactName); const allowed = WRITE_PERMISSIONS[agentId] || []; if (!allowed.some((permission) => artifactMatchesPermission(artifactName, permission))) throw new Error(`WRITE_FORBIDDEN:${agentId}:${artifactName}`); }
export function assertInternalJobCanWriteArtifact(internalJobId, artifactName) { assertKnownArtifactName(artifactName); const allowed = INTERNAL_JOB_WRITE_PERMISSIONS[internalJobId] || []; if (!allowed.some((permission) => artifactMatchesPermission(artifactName, permission))) throw new Error(`INTERNAL_JOB_WRITE_FORBIDDEN:${internalJobId}:${artifactName}`); }
export function publicPermissionMatrix() { return { read: READ_PERMISSIONS, write: WRITE_PERMISSIONS, internal_job_write: INTERNAL_JOB_WRITE_PERMISSIONS }; }
export const ARTIFACT_PERMISSION_CONTRACT_STATUS = Object.freeze({ central_runtime_contract: "artifact-permissions.contract", old_constants_dependency_removed_from_runtime: true, old_permissions_dependency_removed_from_runtime: true, compatibility_internal_job_ids_retained: true, legal_signal_derivation_profile_m9_owned: true, option_a_direct_legal_signal_consumers: true });
function escapeRegExp(value) { const replacements = { "\\": "\\\\", "^": "\\^", "$": "\\$", "*": "\\*", "+": "\\+", "?": "\\?", ".": "\\.", "(": "\\(", ")": "\\)", "|": "\\|", "{": "\\{", "}": "\\}", "[": "\\[", "]": "\\]" }; return String(value).split("").map((ch) => replacements[ch] || ch).join(""); }
