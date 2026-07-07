export const SERVICE_NAME = "interface-diligence-artifacts";

const AGENT_IDS = Object.freeze({ a1a: "agent_" + "1a_url_manifest", a1b: "agent_" + "1b_extract", a2a: "agent_" + "2a_bucket_routing", a2b: "agent_" + "2b_m9", a3: "agent_" + "3_target_feature", a4: "agent_" + "4_data_privacy", a5: "agent_" + "5_exposure_registry", a7: "agent_" + "7_m12" });

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
  legalSignalDerivationProfile: "legal_signal_derivation_profile",
  m7LegalSignalOverlay: "m7_deterministic_legal_signal_overlay",
  m10SelectedLegalSupport: "m10_selected_legal_support_packet",
  targetMain: "target_" + "profile",
  targetForensics: "target_" + "profile_forensics",
  featureCandidateInventory: "feature_candidate_inventory",
  featureMain: "target_" + "feature_profile",
  featureForensics: "target_" + "feature_profile_forensics",
  dataMain: "data_" + "provenance_profile",
  dataForensics: "data_" + "provenance_profile_forensics",
  extendedDap: "extended_dap_india_readiness_profile",
  integratedDap: "integrated_dap_report",
  dapRegistryManifest: "dap_registry_manifest",
  dapStrategicDerivationMatrix: "dap_strategic_derivation_matrix",
  dataPrivacyNavigationIndex: "data_privacy_navigation_index",
  dapSemanticBatchRouteManifest: "dap_semantic_batch_route_manifest",
  dapSemanticBatchValidationPattern: "dap_semantic_batch_validation__{BATCH_ID}",
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
  reviewReadySectionHandoff: "review_ready_section_handoff",
  qualifiedReviewHandoff: "qualified_review_handoff",
  qualifiedReviewRendererPayload: "qualified_review_renderer_payload",
  qrEntityCommercial: "qr_artifact__entity_commercial",
  qrTechnologyInfrastructure: "qr_artifact__technology_infrastructure",
  qrAiCapabilityProductBehavior: "qr_artifact__ai_capability_product_behavior",
  qrDapPrivacyIndiaCyber: "qr_artifact__dap_privacy_india_cyber",
  qualifiedReviewSubmission: "qualified_review_submission",
  renderer: "renderer_payload"
});

export const QUALIFIED_REVIEW_SYSTEM_AGENT = "qualified_review_system";
export const FEATURE_CANDIDATE_INVENTORY_ARTIFACT_NAMES = Object.freeze([ART.featureCandidateInventory]);
export const LEGAL_SIGNAL_DERIVATION_ARTIFACT_NAMES = Object.freeze([ART.legalSignalDerivationProfile]);
export const M7_DETERMINISTIC_LEGAL_SIGNAL_ARTIFACT_NAMES = Object.freeze([]);
export const M10_SELECTED_LEGAL_SUPPORT_ARTIFACT_NAMES = Object.freeze([]);
export const M11_BATCH_ARTIFACT_PATTERN = /^exposure_registry_batch__[A-Z0-9]+__\d{3}$/;
export const M11_BATCH_VALIDATION_ARTIFACT_PATTERN = /^exposure_registry_batch_validation__[A-Z0-9]+__\d{3}$/;
export const PHASE7_DAP_BATCH_ARTIFACT_PATTERN = /^dap_semantic_batch_(exec|lim|party|role|flow|obj|auth|ctrl|contact_cm|vend|loc|ret|sec|sens|dom|ready|req)_artifact$/;
export const PHASE7_DAP_BATCH_VALIDATION_ARTIFACT_PATTERN = /^dap_semantic_batch_validation__DAP-SEM-BATCH-\d{2}$/;

export const PHASE7_DAP_LAYER1_ARTIFACT_NAMES = Object.freeze([ART.dapRegistryManifest, ART.dapStrategicDerivationMatrix]);
export const PHASE7_DAP_LAYER2_ARTIFACT_NAMES = Object.freeze([ART.dataPrivacyNavigationIndex]);
export const PHASE7_DAP_LAYER3_ARTIFACT_NAMES = Object.freeze([ART.dapSemanticBatchRouteManifest]);
export const PHASE7_DAP_BATCH_ARTIFACT_NAMES = Object.freeze(["dap_semantic_batch_exec_artifact", "dap_semantic_batch_lim_artifact", "dap_semantic_batch_party_artifact", "dap_semantic_batch_role_artifact", "dap_semantic_batch_flow_artifact", "dap_semantic_batch_obj_artifact", "dap_semantic_batch_auth_artifact", "dap_semantic_batch_ctrl_artifact", "dap_semantic_batch_contact_cm_artifact", "dap_semantic_batch_vend_artifact", "dap_semantic_batch_loc_artifact", "dap_semantic_batch_ret_artifact", "dap_semantic_batch_sec_artifact", "dap_semantic_batch_sens_artifact", "dap_semantic_batch_dom_artifact", "dap_semantic_batch_ready_artifact", "dap_semantic_batch_req_artifact"]);
export const PHASE7_DAP_RUNTIME_ARTIFACT_NAMES = Object.freeze([...PHASE7_DAP_LAYER1_ARTIFACT_NAMES, ...PHASE7_DAP_LAYER2_ARTIFACT_NAMES, ...PHASE7_DAP_LAYER3_ARTIFACT_NAMES, ...PHASE7_DAP_BATCH_ARTIFACT_NAMES]);

export const NORMALIZED_SECTION_ARTIFACT_NAMES = Object.freeze(["normalized_section__matter_overview", "normalized_section__executive_summary", "normalized_section__target_profile", "normalized_section__product_activity_ip_profile", "normalized_section__data_provenance_controls", "normalized_section__legal_document_control_review", "normalized_section__exposure_summary_harm_mechanism_workpad_summary", "normalized_section__exposure_diagnosis_table", "normalized_section__exposure_control_discipline", "normalized_section__review_route_action_plan", "normalized_section__control_handoff_readiness", "normalized_section__exposure_clarification_queue", "normalized_section__global_confirmation_queue", "normalized_section__methodology_limitations_forensic_annexure"]);
export const NORMALIZED_COMPILER_ARTIFACT_NAMES = Object.freeze([ART.normalizedReportManifest, ART.reviewReadySectionHandoff, ART.final, ...NORMALIZED_SECTION_ARTIFACT_NAMES]);
export const QUALIFIED_REVIEW_SECTION_ARTIFACT_NAMES = Object.freeze([ART.qrEntityCommercial, ART.qrTechnologyInfrastructure, ART.qrAiCapabilityProductBehavior, ART.qrDapPrivacyIndiaCyber]);
export const QUALIFIED_REVIEW_ARTIFACT_NAMES = Object.freeze([ART.qualifiedReviewHandoff, ...QUALIFIED_REVIEW_SECTION_ARTIFACT_NAMES, ART.qualifiedReviewRendererPayload, ART.qualifiedReviewSubmission]);
export const PHASES = Object.freeze(["AGENT_1A_URL_MANIFEST", "AGENT_1B_EXTRACT", "M6_BUCKET_INDEX", "M9", "M7_TARGET_PROFILE", "M7_TARGET_PROFILE_FORENSICS", "M8_FEATURE_CANDIDATE_INVENTORY", "M8_TARGET_FEATURE_PROFILE", "M8_TARGET_FEATURE_PROFILE_FORENSICS", "M10", "M10_FORENSICS", "DATA_PROVENANCE_PROFILE_LAYER4", "AGENT_4B_EXTENDED_DAP_INDIA_READINESS", "AGENT_4C_INTEGRATED_DAP_REPORT", "M11", "M12", "NORMALIZED_COMPILER", "QUALIFIED_REVIEW_HANDOFF", "QUALIFIED_REVIEW_RENDERER", "QUALIFIED_REVIEW_SUBMISSION", "RENDERER", "COMPLETE"]);
export const LOCK_STATUSES = Object.freeze(["CREATED", "RUNNING", "LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE", "COMPLETE"]);
export const ROOT_FAMILY_CODES = Object.freeze(["T0_ROOT", "T1_IDENTITY", "T2_LEGAL_IDENTITY", "T3_OPERATOR_ENTITY", "T4_SUPPORTING_IDENTITY", "P1_PRODUCT", "P2_PLATFORM_FEATURE_SOLUTION", "P3_AI_CAPABILITY_TECHNICAL", "P4_USE_CASE_INDUSTRY", "P5_ENTERPRISE_PRICING", "D1_SECURITY_TRUST", "D2_SUBPROCESSOR_PRIVACY_CENTER", "D3_DATA_GOVERNANCE_CONTROLS", "D4_DOCS_API_DATA_FLOW", "D5_AI_SAFETY_TRANSPARENCY", "L1_CORE_TERMS_PRIVACY", "L2_B2B_CONTRACTING", "L3_AI_USAGE_GOVERNANCE", "L4_PRIVACY_ADJACENT_NOTICES", "L5_LEGAL_HUB_HOSTED", "L6_ENTITY_NOTICE"]);
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
export const EXTENDED_DAP_ARTIFACT_NAMES = Object.freeze([ART.extendedDap]);
export const INTEGRATED_DAP_ARTIFACT_NAMES = Object.freeze([ART.integratedDap]);
export const M11_STATIC_ARTIFACT_NAMES = Object.freeze([ART.exposureRoutePlan, ART.exposureWorkpad, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics]);
export const M11_DYNAMIC_ARTIFACT_PATTERNS = Object.freeze([ART.exposureBatchPattern, ART.exposureBatchValidationPattern]);
export const PHASE7_DAP_DYNAMIC_ARTIFACT_PATTERNS = Object.freeze([ART.dapSemanticBatchValidationPattern]);
export const NORMALIZED_COMPILER_PHASE = "NORMALIZED_COMPILER";
export const COMPILER_ARTIFACT_NAMES = NORMALIZED_COMPILER_ARTIFACT_NAMES;
export const QUALIFIED_REVIEW_READ_ARTIFACT_NAMES = Object.freeze(["source_family_index", ART.sourceHandoff, ART.legalIndex, ART.legalSignalDerivationProfile, ART.targetMain, ART.targetForensics, ART.featureCandidateInventory, ART.featureMain, ART.featureForensics, ART.dataMain, ART.dataForensics, ART.extendedDap, ART.integratedDap, ART.exposureRoutePlan, ART.exposureBatchPattern, ART.exposureBatchValidationPattern, ART.exposureWorkpad, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics, ART.challenge, ...NORMALIZED_COMPILER_ARTIFACT_NAMES, ...LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES, ...TARGET_PROFILE_FAMILY_ARTIFACT_NAMES, ...PRODUCT_ACTIVITY_FAMILY_ARTIFACT_NAMES, ...DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES, ...UPLOADED_SOURCE_DOCUMENT_ARTIFACT_NAMES, ...QUALIFIED_REVIEW_ARTIFACT_NAMES]);
export const ARCHIVED_LEGACY_ARTIFACT_NAMES = Object.freeze([ART.urlManifest, ART.oldCorpus, ART.exposureLegacy, ART.profilesCombined, ART.forensicsCombined]);
export const LEGACY_ARTIFACT_NAMES = ARCHIVED_LEGACY_ARTIFACT_NAMES;
export const LEGACY_COMPILER_ARTIFACT_NAMES = Object.freeze([ART.profilesCombined, ART.forensicsCombined]);
export const ARTIFACT_NAMES = Object.freeze([...UPLOADED_SOURCE_DOCUMENT_ARTIFACT_NAMES, ...AGENT_1_ARTIFACT_NAMES, ART.sourceHandoff, ART.legalDeterministicMap, ART.legalSemanticProfile, ART.legalReinvestigationWorkpad, ART.legalIndex, ART.legalSignalDerivationProfile, ART.m7LegalSignalOverlay, ART.m10SelectedLegalSupport, ART.targetMain, ART.targetForensics, ART.featureCandidateInventory, ART.featureMain, ART.featureForensics, ART.dataMain, ART.dataForensics, ...PHASE7_DAP_RUNTIME_ARTIFACT_NAMES, ...EXTENDED_DAP_ARTIFACT_NAMES, ...INTEGRATED_DAP_ARTIFACT_NAMES, ...M11_STATIC_ARTIFACT_NAMES, ART.challenge, ...NORMALIZED_COMPILER_ARTIFACT_NAMES, ...QUALIFIED_REVIEW_ARTIFACT_NAMES, ART.renderer]);
export const AGENTS = Object.freeze([AGENT_IDS.a1a, AGENT_IDS.a1b, AGENT_IDS.a2a, AGENT_IDS.a2b, AGENT_IDS.a3, AGENT_IDS.a4, AGENT_IDS.a5, AGENT_IDS.a7, "document_source_ingestor", "agent_4b_extended_dap", "agent_4c_integrated_dap_compiler", "compiler", QUALIFIED_REVIEW_SYSTEM_AGENT, "portfolio_renderer", "operator"]);
export const WRITE_PERMISSIONS = Object.freeze({ [AGENT_IDS.a1a]: AGENT_1A_ARTIFACT_NAMES, [AGENT_IDS.a1b]: AGENT_1B_WRITE_PERMISSION_ARTIFACT_NAMES, [AGENT_IDS.a2a]: [ART.sourceHandoff], [AGENT_IDS.a2b]: [ART.legalDeterministicMap, ART.legalSemanticProfile, ART.legalReinvestigationWorkpad, ART.legalIndex, ART.legalSignalDerivationProfile], [AGENT_IDS.a3]: [ART.targetMain, ART.targetForensics, ART.featureCandidateInventory, ART.featureMain, ART.featureForensics], [AGENT_IDS.a4]: [ART.dataMain, ART.dataForensics, ...PHASE7_DAP_RUNTIME_ARTIFACT_NAMES, ART.dapSemanticBatchValidationPattern], [AGENT_IDS.a5]: [ART.exposureRoutePlan, ART.exposureBatchPattern, ART.exposureBatchValidationPattern, ART.exposureWorkpad, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics, ART.challenge], [AGENT_IDS.a7]: [ART.exposureBatchValidationPattern, ART.challenge], document_source_ingestor: UPLOADED_SOURCE_DOCUMENT_ARTIFACT_NAMES, agent_4b_extended_dap: EXTENDED_DAP_ARTIFACT_NAMES, agent_4c_integrated_dap_compiler: INTEGRATED_DAP_ARTIFACT_NAMES, compiler: COMPILER_ARTIFACT_NAMES, [QUALIFIED_REVIEW_SYSTEM_AGENT]: QUALIFIED_REVIEW_ARTIFACT_NAMES, portfolio_renderer: [ART.renderer], operator: [...ARTIFACT_NAMES, ...M11_DYNAMIC_ARTIFACT_PATTERNS, ...PHASE7_DAP_DYNAMIC_ARTIFACT_PATTERNS, ...ARCHIVED_LEGACY_ARTIFACT_NAMES] });
export const PHASE_WRITE_PERMISSIONS = Object.freeze({ AGENT_1A_URL_MANIFEST: AGENT_1A_ARTIFACT_NAMES, AGENT_1B_EXTRACT: AGENT_1B_WRITE_PERMISSION_ARTIFACT_NAMES, M6_BUCKET_INDEX: [ART.sourceHandoff], M9: [ART.legalDeterministicMap, ART.legalSemanticProfile, ART.legalReinvestigationWorkpad, ART.legalIndex, ART.legalSignalDerivationProfile], M7_TARGET_PROFILE: [ART.targetMain], M7_TARGET_PROFILE_FORENSICS: [ART.targetForensics], M8_FEATURE_CANDIDATE_INVENTORY: [ART.featureCandidateInventory], M8_TARGET_FEATURE_PROFILE: [ART.featureMain], M8_TARGET_FEATURE_PROFILE_FORENSICS: [ART.featureForensics], M10: [ART.dataMain], M10_FORENSICS: [ART.dataForensics], DATA_PROVENANCE_PROFILE_LAYER4: [...PHASE7_DAP_RUNTIME_ARTIFACT_NAMES, ART.dapSemanticBatchValidationPattern], AGENT_4B_EXTENDED_DAP_INDIA_READINESS: EXTENDED_DAP_ARTIFACT_NAMES, AGENT_4C_INTEGRATED_DAP_REPORT: INTEGRATED_DAP_ARTIFACT_NAMES, M11: [ART.exposureRoutePlan, ART.exposureBatchPattern, ART.exposureBatchValidationPattern, ART.exposureWorkpad, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics], M12: [ART.exposureBatchValidationPattern, ART.challenge], NORMALIZED_COMPILER: COMPILER_ARTIFACT_NAMES, QUALIFIED_REVIEW_HANDOFF: [ART.qualifiedReviewHandoff, ...QUALIFIED_REVIEW_SECTION_ARTIFACT_NAMES], QUALIFIED_REVIEW_RENDERER: [ART.qualifiedReviewRendererPayload], QUALIFIED_REVIEW_SUBMISSION: [ART.qualifiedReviewSubmission], RENDERER: [ART.renderer], COMPLETE: [] });
export const READ_PERMISSIONS = Object.freeze({ [AGENT_IDS.a1a]: [], [AGENT_IDS.a1b]: ["deduped_url_manifest"], [AGENT_IDS.a2a]: [...AGENT_1_ARTIFACT_NAMES, ...AGENT_1B_OPTIONAL_FAMILY_ARTIFACT_NAMES], [AGENT_IDS.a2b]: ["source_family_index", ART.sourceHandoff, ...LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES], [AGENT_IDS.a3]: ["source_family_index", ART.sourceHandoff, ART.legalSignalDerivationProfile, ART.targetMain, ART.targetForensics, ART.featureCandidateInventory, ART.featureMain, ...TARGET_PROFILE_FAMILY_ARTIFACT_NAMES, ...PRODUCT_ACTIVITY_FAMILY_ARTIFACT_NAMES], [AGENT_IDS.a4]: ["source_family_index", ART.sourceHandoff, ART.legalIndex, ART.legalSignalDerivationProfile, ART.targetMain, ART.targetForensics, ART.featureCandidateInventory, ART.featureMain, ART.featureForensics, ART.dataMain, ...PHASE7_DAP_RUNTIME_ARTIFACT_NAMES, ART.dapSemanticBatchValidationPattern, ...DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES], [AGENT_IDS.a5]: ["source_family_index", ART.sourceHandoff, ART.legalIndex, ART.legalSignalDerivationProfile, ART.targetMain, ART.targetForensics, ART.featureCandidateInventory, ART.featureMain, ART.featureForensics, ART.dataMain, ART.dataForensics, ...LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES, ART.exposureRoutePlan, ART.exposureBatchPattern, ART.exposureBatchValidationPattern, ART.exposureWorkpad, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics, ART.challenge], [AGENT_IDS.a7]: ["source_family_index", ART.sourceHandoff, ART.legalIndex, ART.legalSignalDerivationProfile, ART.targetMain, ART.targetForensics, ART.featureCandidateInventory, ART.featureMain, ART.featureForensics, ART.dataMain, ART.dataForensics, ART.exposureRoutePlan, ART.exposureBatchPattern, ART.exposureBatchValidationPattern, ART.exposureWorkpad, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics], document_source_ingestor: [], agent_4b_extended_dap: [ART.sourceHandoff, ART.legalIndex, ART.legalSignalDerivationProfile, ART.targetMain, ART.targetForensics, ART.featureCandidateInventory, ART.featureMain, ART.featureForensics, ART.dataMain, ART.dataForensics, ...DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES, ...LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES], agent_4c_integrated_dap_compiler: [ART.dataMain, ART.dataForensics, ART.extendedDap], compiler: [ART.sourceHandoff, ART.legalIndex, ART.legalSignalDerivationProfile, ART.targetMain, ART.targetForensics, ART.featureCandidateInventory, ART.featureMain, ART.featureForensics, ART.dataMain, ART.dataForensics, ART.extendedDap, ART.integratedDap, ART.exposureRoutePlan, ART.exposureBatchPattern, ART.exposureBatchValidationPattern, ART.exposureWorkpad, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics, ART.challenge, ART.final], [QUALIFIED_REVIEW_SYSTEM_AGENT]: QUALIFIED_REVIEW_READ_ARTIFACT_NAMES, portfolio_renderer: [ART.final, ART.normalizedReportManifest, ART.reviewReadySectionHandoff, ART.qualifiedReviewHandoff, ART.qualifiedReviewSubmission, ...NORMALIZED_SECTION_ARTIFACT_NAMES, ART.renderer], operator: [...ARTIFACT_NAMES, ...AGENT_1B_OPTIONAL_FAMILY_ARTIFACT_NAMES, ...M11_DYNAMIC_ARTIFACT_PATTERNS, ...PHASE7_DAP_DYNAMIC_ARTIFACT_PATTERNS, ...ARCHIVED_LEGACY_ARTIFACT_NAMES] });
export function isKnownArtifactName(artifactName) { const name = String(artifactName || ""); return ARTIFACT_NAMES.includes(name) || ARCHIVED_LEGACY_ARTIFACT_NAMES.includes(name) || LOSSLESS_FAMILY_ARTIFACT_PATTERN.test(name) || M11_BATCH_ARTIFACT_PATTERN.test(name) || M11_BATCH_VALIDATION_ARTIFACT_PATTERN.test(name) || PHASE7_DAP_BATCH_ARTIFACT_PATTERN.test(name) || PHASE7_DAP_BATCH_VALIDATION_ARTIFACT_PATTERN.test(name); }
export function artifactMatchesPermission(artifactName, permission) { if (permission === artifactName) return true; if (permission === ART.exposureBatchPattern) return M11_BATCH_ARTIFACT_PATTERN.test(artifactName); if (permission === ART.exposureBatchValidationPattern) return M11_BATCH_VALIDATION_ARTIFACT_PATTERN.test(artifactName); if (permission === ART.dapSemanticBatchValidationPattern) return PHASE7_DAP_BATCH_VALIDATION_ARTIFACT_PATTERN.test(artifactName); if (String(permission || "").startsWith("lossless_family__")) return artifactName === permission || artifactName.startsWith(`${permission}__part_`); return false; }
export function assertKnownArtifactName(artifactName) { if (!isKnownArtifactName(artifactName)) throw new Error(`INVALID_ARTIFACT_NAME:${artifactName || "missing"}`); }
export function assertKnownPhase(phase) { if (!PHASES.includes(phase)) throw new Error(`INVALID_PHASE:${phase || "missing"}`); }
export function assertKnownAgent(agent) { if (!AGENTS.includes(agent)) throw new Error(`INVALID_AGENT:${agent}`); }
export function assertPhaseCanWriteArtifact(phase, artifactName) { assertKnownPhase(phase); assertKnownArtifactName(artifactName); const allowed = PHASE_WRITE_PERMISSIONS[phase] || []; if (!allowed.some((permission) => artifactMatchesPermission(artifactName, permission))) throw new Error(`PHASE_WRITE_FORBIDDEN:${phase}:${artifactName}`); }
function escapeRegExp(value) { const replacements = { "\\": "\\\\", "^": "\\^", "$": "\\$", "*": "\\*", "+": "\\+", "?": "\\?", ".": "\\.", "(": "\\(", ")": "\\)", "|": "\\|", "{": "\\{", "}": "\\}", "[": "\\[", "]": "\\]" }; return String(value).split("").map((ch) => replacements[ch] || ch).join(""); }
