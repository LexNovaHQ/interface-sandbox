const ART = Object.freeze({
  domainSelectionProfile: "domain_selection_profile",
  activeRunPackageManifest: "active_run_package_manifest",
  domainDerivationProfile: "domain_derivation_profile",
  domainDerivationDeterministicMap: "domain_derivation_deterministic_map",
  domainDerivationSemanticProfile: "domain_derivation_semantic_profile",
  domainDerivationSourceIndex: "domain_derivation_source_index",
  uploadedSourceDocumentIndex: "uploaded_source_document_index",
  uploadedSourceDocumentCorpus: "uploaded_source_document_corpus",
  sourceHandoff: "source_discovery_handoff",
  sourceDiscoveryMatrixManifest: "source_discovery_matrix_manifest",
  adapterExpansionLog: "adapter_expansion_log",
  neutralEvidenceBucketManifest: "neutral_evidence_bucket_manifest",
  postPhase1DomainGateHandoff: "post_phase_1_domain_gate_handoff",
  legalDocInventory: "legal_doc_inventory",
  legalDocExtractionIndex: "legal_doc_extraction_index",
  legalDocLosslessValidationManifest: "legal_doc_lossless_validation_manifest",
  legalDocDynamicPattern: "legal_doc_{DOC_TYPE}",
  cartographySourceInventory: "cartography_source_inventory",
  cartographyLocatorSpine: "cartography_locator_spine",
  cartographyProfileRouteMatrix: "cartography_profile_route_matrix",
  cartographySemanticNavigationOverlay: "cartography_semantic_navigation_overlay",
  targetProfileDeterministicMap: "target_profile_deterministic_map",
  targetProfileSemanticProfile: "target_profile_semantic_profile",
  targetProfileSourceIndex: "target_profile_source_index",
  activityProfileDeterministicMap: "activity_profile_deterministic_map",
  activityProfileSemanticProfile: "activity_profile_semantic_profile",
  activityProfileSourceIndex: "activity_profile_source_index",
  dataPrivacyDeterministicMap: "data_privacy_deterministic_map",
  dataPrivacySemanticProfile: "data_privacy_semantic_profile",
  dataPrivacyNavigationIndex: "data_privacy_navigation_index",
  domainControlObligationDeterministicMap: "domain_control_obligation_deterministic_map",
  domainControlObligationSemanticProfile: "domain_control_obligation_semantic_profile",
  domainControlObligationNavigationIndex: "domain_control_obligation_navigation_index",
  legalCartographyDeterministicMap: "legal_cartography_deterministic_map",
  legalCartographySemanticProfile: "legal_cartography_semantic_profile",
  legalCartographyReinvestigationWorkpad: "legal_cartography_reinvestigation_workpad",
  legalCartographyIndex: "legal_cartography_index",
  legalSignalDerivationProfile: "legal_signal_derivation_profile",
  cartographyIndex: "cartography_index",
  cartographyValidationManifest: "cartography_validation_manifest",
  targetProfile: "target_profile",
  targetForensics: "target_profile_forensics",
  activityInventory: "feature_candidate_inventory",
  activityProfile: "target_feature_profile",
  activityForensics: "target_feature_profile_forensics",
  dapRegistryManifest: "dap_registry_manifest",
  dapStrategicDerivationMatrix: "dap_strategic_derivation_matrix",
  dapSemanticBatchRouteManifest: "dap_semantic_batch_route_manifest",
  dapSemanticBatchValidationManifest: "dap_semantic_batch_validation_manifest",
  dataProvenanceSemanticBatchGate: "data_provenance_profile_semantic_batch_gate",
  dapSemanticBatchValidationPattern: "dap_semantic_batch_validation__{BATCH_ID}",
  dapForensicsProfile: "dap_forensics_profile",
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
  diligenceQaCompletionReceipt: "diligence_qa_completion_receipt"
});

export const DOMAIN_GATE_RUNTIME_ARTIFACT_NAMES = Object.freeze([ART.domainSelectionProfile, ART.activeRunPackageManifest]);
export const DOMAIN_DERIVATION_ARTIFACT_NAMES = Object.freeze([ART.domainDerivationProfile, ART.activeRunPackageManifest]);
export const AGENT_IDS = Object.freeze({ sourceUrlManifest: "agent_1a_url_manifest", sourceExtractor: "agent_1b_extract", sourceDiscovery: "agent_2a_bucket_routing", cartographyIndex: "agent_2_cartography_index", legalCartography: "agent_2b_m9", targetActivity: "agent_3_target_feature", dataProvenance: "agent_4_data_privacy", exposureRegistry: "agent_5_exposure_registry", operatorChallenge: "agent_7_m12", documentSourceIngestor: "document_source_ingestor", compiler: "compiler", qualifiedReview: "qualified_review_system", diligenceQaGate: "diligence_qa_gate", assemblyEngine: "assembly_engine", renderer: "portfolio_renderer", operator: "operator" });

export const COMMON_ROOT_CODES = Object.freeze(["homepage_landing", "company_identity", "contact_notice", "product_service", "platform_feature_solution", "technical_docs_api", "docs_api_data_flow", "integrations_ecosystem", "pricing_commercial_availability", "use_case_customer_industry", "privacy_data_processing", "security_trust_compliance", "data_governance_controls", "ai_safety_transparency", "support_help_resources", "regulatory_licensing_status", "grievance_complaints"]);
export const RETIRED_COMMON_ROOT_CODES = Object.freeze(["about_company", "legal_identity_notice", "operator_entity_signals", "supporting_company_signals", "security_trust", "trust_compliance", "support_help", "blog_resources", "careers_hiring", "public_repository_developer_assets", "third_party_profiles", "technical_docs_api_developer"]);
const COMMON_ROOT_PATTERN_SOURCE = COMMON_ROOT_CODES.map(escapeRegExp).join("|");
export const LOSSLESS_COMMON_ROOT_ARTIFACT_PATTERN = new RegExp(`^lossless_root__(${COMMON_ROOT_PATTERN_SOURCE})(?:__part_\\d{3})?$`);
export const LOSSLESS_COMMON_ROOT_PART_ARTIFACT_PATTERN = new RegExp(`^lossless_root__(${COMMON_ROOT_PATTERN_SOURCE})__part_\\d{3}$`);
export const LEGAL_DOC_ARTIFACT_PATTERN = /^legal_doc_[a-z0-9]+(?:_[a-z0-9]+)*(?:__[a-z0-9-]+)?$/;
export const LEGAL_DOC_DYNAMIC_PERMISSION = ART.legalDocDynamicPattern;
export const LOSSLESS_COMMON_ROOT_ARTIFACT_NAMES = Object.freeze(COMMON_ROOT_CODES.map((code) => `lossless_root__${code}`));

export const SOURCE_DISCOVERY_CONTROL_ARTIFACT_NAMES = Object.freeze([ART.sourceDiscoveryMatrixManifest, ART.adapterExpansionLog, ART.neutralEvidenceBucketManifest]);
export const SOURCE_DISCOVERY_LEGAL_DOC_CONTROL_ARTIFACT_NAMES = Object.freeze([ART.legalDocInventory, ART.legalDocExtractionIndex, ART.legalDocLosslessValidationManifest]);
export const SOURCE_DISCOVERY_HANDOFF_ARTIFACT_NAMES = Object.freeze([ART.sourceHandoff, ART.postPhase1DomainGateHandoff]);
export const TARGET_PROFILE_SOURCE_ARTIFACT_NAMES = Object.freeze(["lossless_root__homepage_landing", "lossless_root__company_identity", "lossless_root__contact_notice", "lossless_root__pricing_commercial_availability", "lossless_root__regulatory_licensing_status", "lossless_root__grievance_complaints"]);
export const ACTIVITY_PROFILE_SOURCE_ARTIFACT_NAMES = Object.freeze(["lossless_root__product_service", "lossless_root__platform_feature_solution", "lossless_root__technical_docs_api", "lossless_root__docs_api_data_flow", "lossless_root__integrations_ecosystem", "lossless_root__pricing_commercial_availability", "lossless_root__use_case_customer_industry", "lossless_root__support_help_resources", "lossless_root__ai_safety_transparency"]);
export const DOMAIN_DERIVATION_SOURCE_ROOT_ARTIFACT_NAMES = Object.freeze(["lossless_root__homepage_landing", "lossless_root__company_identity", "lossless_root__product_service", "lossless_root__platform_feature_solution", "lossless_root__technical_docs_api", "lossless_root__docs_api_data_flow", "lossless_root__pricing_commercial_availability", "lossless_root__use_case_customer_industry", "lossless_root__integrations_ecosystem", "lossless_root__ai_safety_transparency", "lossless_root__regulatory_licensing_status", "lossless_root__grievance_complaints"]);
export const PHASE3_TARGET_ACTIVITY_SOURCE_ARTIFACT_NAMES = Object.freeze([...new Set([...TARGET_PROFILE_SOURCE_ARTIFACT_NAMES, ...ACTIVITY_PROFILE_SOURCE_ARTIFACT_NAMES])]);
export const DATA_PROVENANCE_SOURCE_ARTIFACT_NAMES = Object.freeze(["lossless_root__privacy_data_processing", "lossless_root__security_trust_compliance", "lossless_root__data_governance_controls", "lossless_root__technical_docs_api", "lossless_root__docs_api_data_flow", "lossless_root__integrations_ecosystem", "lossless_root__ai_safety_transparency", "lossless_root__regulatory_licensing_status", "lossless_root__grievance_complaints"]);
export const DOMAIN_CONTROL_OBLIGATION_SOURCE_ARTIFACT_NAMES = Object.freeze(["lossless_root__regulatory_licensing_status", "lossless_root__grievance_complaints", "lossless_root__security_trust_compliance", "lossless_root__data_governance_controls", "lossless_root__product_service", "lossless_root__platform_feature_solution", "lossless_root__pricing_commercial_availability", "lossless_root__company_identity", "lossless_root__ai_safety_transparency", "lossless_root__homepage_landing"]);
export const LEGAL_GOVERNANCE_SOURCE_ARTIFACT_NAMES = Object.freeze([...SOURCE_DISCOVERY_LEGAL_DOC_CONTROL_ARTIFACT_NAMES, LEGAL_DOC_DYNAMIC_PERMISSION, "lossless_root__company_identity", "lossless_root__contact_notice", "lossless_root__privacy_data_processing", "lossless_root__security_trust_compliance", "lossless_root__data_governance_controls", "lossless_root__ai_safety_transparency", "lossless_root__regulatory_licensing_status", "lossless_root__grievance_complaints"]);

export const TARGET_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES = Object.freeze([ART.targetProfileDeterministicMap, ART.targetProfileSemanticProfile, ART.targetProfileSourceIndex]);
export const DOMAIN_DERIVATION_SOURCE_INDEX_ARTIFACT_NAMES = Object.freeze([ART.domainDerivationDeterministicMap, ART.domainDerivationSemanticProfile, ART.domainDerivationSourceIndex]);
export const ACTIVITY_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES = Object.freeze([ART.activityProfileDeterministicMap, ART.activityProfileSemanticProfile, ART.activityProfileSourceIndex]);
export const DATA_PRIVACY_NAVIGATION_INDEX_ARTIFACT_NAMES = Object.freeze([ART.dataPrivacyDeterministicMap, ART.dataPrivacySemanticProfile, ART.dataPrivacyNavigationIndex]);
export const DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX_ARTIFACT_NAMES = Object.freeze([ART.domainControlObligationDeterministicMap, ART.domainControlObligationSemanticProfile, ART.domainControlObligationNavigationIndex]);
export const LEGAL_CARTOGRAPHY_ARTIFACT_NAMES = Object.freeze([ART.legalCartographyDeterministicMap, ART.legalCartographySemanticProfile, ART.legalCartographyIndex, ART.legalSignalDerivationProfile]);
export const LEGAL_CARTOGRAPHY_OPTIONAL_ARTIFACT_NAMES = Object.freeze([ART.legalCartographyReinvestigationWorkpad]);
export const LEGAL_SIGNAL_DERIVATION_ARTIFACT_NAMES = Object.freeze([ART.legalSignalDerivationProfile]);
export const CARTOGRAPHY_LAYER1_ARTIFACT_NAMES = Object.freeze([ART.cartographySourceInventory]);
export const CARTOGRAPHY_LAYER2_ARTIFACT_NAMES = Object.freeze([ART.cartographyLocatorSpine]);
export const CARTOGRAPHY_LAYER3_ARTIFACT_NAMES = Object.freeze([ART.cartographyProfileRouteMatrix]);
export const CARTOGRAPHY_LAYER4_ARTIFACT_NAMES = Object.freeze([ART.cartographySemanticNavigationOverlay]);
export const CARTOGRAPHY_PROFILE_INDEX_ARTIFACT_NAMES = ACTIVITY_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES;
export const CARTOGRAPHY_LAYER5_ARTIFACT_NAMES = Object.freeze([ART.cartographyIndex, ART.cartographyValidationManifest]);
export const CARTOGRAPHY_ARTIFACT_NAMES = Object.freeze([...CARTOGRAPHY_LAYER1_ARTIFACT_NAMES, ...CARTOGRAPHY_LAYER2_ARTIFACT_NAMES, ...CARTOGRAPHY_LAYER3_ARTIFACT_NAMES, ...CARTOGRAPHY_LAYER4_ARTIFACT_NAMES, ...LEGAL_CARTOGRAPHY_ARTIFACT_NAMES, ...LEGAL_CARTOGRAPHY_OPTIONAL_ARTIFACT_NAMES, ...TARGET_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES, ...DOMAIN_DERIVATION_SOURCE_INDEX_ARTIFACT_NAMES, ...ACTIVITY_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES, ...DATA_PRIVACY_NAVIGATION_INDEX_ARTIFACT_NAMES, ...DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX_ARTIFACT_NAMES, ...CARTOGRAPHY_LAYER5_ARTIFACT_NAMES]);
export const CARTOGRAPHY_SOURCE_INPUT_ARTIFACT_NAMES = Object.freeze([ART.sourceHandoff, ART.postPhase1DomainGateHandoff, ART.sourceDiscoveryMatrixManifest, ART.neutralEvidenceBucketManifest, ART.adapterExpansionLog, "source_family_index", ...LOSSLESS_COMMON_ROOT_ARTIFACT_NAMES, ...SOURCE_DISCOVERY_LEGAL_DOC_CONTROL_ARTIFACT_NAMES, LEGAL_DOC_DYNAMIC_PERMISSION]);

export const FEATURE_CANDIDATE_INVENTORY_ARTIFACT_NAMES = Object.freeze([ART.activityInventory]);
export const M7_DETERMINISTIC_LEGAL_SIGNAL_ARTIFACT_NAMES = Object.freeze([]);
export const M10_SELECTED_LEGAL_SUPPORT_ARTIFACT_NAMES = Object.freeze([]);
export const PHASE7_DAP_LAYER1_ARTIFACT_NAMES = Object.freeze([ART.dapRegistryManifest, ART.dapStrategicDerivationMatrix]);
export const PHASE7_DAP_LAYER2_ARTIFACT_NAMES = Object.freeze([]);
export const PHASE7_DAP_LAYER3_ARTIFACT_NAMES = Object.freeze([ART.dapSemanticBatchRouteManifest]);
export const PHASE7_DAP_BATCH_ARTIFACT_NAMES = Object.freeze(["dap_semantic_batch_exec_artifact", "dap_semantic_batch_lim_artifact", "dap_semantic_batch_party_artifact", "dap_semantic_batch_role_artifact", "dap_semantic_batch_flow_artifact", "dap_semantic_batch_obj_artifact", "dap_semantic_batch_auth_artifact", "dap_semantic_batch_ctrl_artifact", "dap_semantic_batch_contact_cm_artifact", "dap_semantic_batch_vend_artifact", "dap_semantic_batch_loc_artifact", "dap_semantic_batch_ret_artifact", "dap_semantic_batch_sec_artifact", "dap_semantic_batch_sens_artifact", "dap_semantic_batch_dom_artifact", "dap_semantic_batch_ready_artifact", "dap_semantic_batch_req_artifact"]);
export const PHASE7_DAP_LAYER4_ARTIFACT_NAMES = Object.freeze([...PHASE7_DAP_LAYER1_ARTIFACT_NAMES, ...PHASE7_DAP_LAYER3_ARTIFACT_NAMES, ...PHASE7_DAP_BATCH_ARTIFACT_NAMES]);
export const PHASE7_DAP_LAYER5_ARTIFACT_NAMES = Object.freeze([ART.dapSemanticBatchValidationManifest, ART.dataProvenanceSemanticBatchGate]);
export const PHASE7_DAP_RUNTIME_ARTIFACT_NAMES = Object.freeze([ART.dataPrivacyNavigationIndex, ...PHASE7_DAP_LAYER4_ARTIFACT_NAMES, ...PHASE7_DAP_LAYER5_ARTIFACT_NAMES]);
export const PHASE8_DAP_FORENSICS_ARTIFACT_NAMES = Object.freeze([ART.dapForensicsProfile]);
export const EXTENDED_DAP_ARTIFACT_NAMES = Object.freeze([]);
export const INTEGRATED_DAP_ARTIFACT_NAMES = Object.freeze([]);
export const M11_STATIC_ARTIFACT_NAMES = Object.freeze([ART.exposureRoutePlan, ART.exposureWorkpad, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics]);
export const M11_DYNAMIC_ARTIFACT_PATTERNS = Object.freeze([ART.exposureBatchPattern, ART.exposureBatchValidationPattern]);
export const PHASE7_DAP_DYNAMIC_ARTIFACT_PATTERNS = Object.freeze([ART.dapSemanticBatchValidationPattern]);
export const M11_BATCH_ARTIFACT_PATTERN = /^exposure_registry_batch__[A-Z0-9]+__\d{3}$/;
export const M11_BATCH_VALIDATION_ARTIFACT_PATTERN = /^exposure_registry_batch_validation__[A-Z0-9]+__\d{3}$/;
export const PHASE7_DAP_BATCH_ARTIFACT_PATTERN = /^dap_semantic_batch_(exec|lim|party|role|flow|obj|auth|ctrl|contact_cm|vend|loc|ret|sec|sens|dom|ready|req)_artifact$/;
export const PHASE7_DAP_BATCH_VALIDATION_ARTIFACT_PATTERN = /^dap_semantic_batch_validation__DAP-SEM-BATCH-\d{2}$/;
export const UPLOADED_SOURCE_DOCUMENT_ARTIFACT_NAMES = Object.freeze([ART.uploadedSourceDocumentIndex, ART.uploadedSourceDocumentCorpus]);
export const NORMALIZED_SECTION_ARTIFACT_NAMES = Object.freeze(["normalized_section__matter_overview", "normalized_section__executive_summary", "normalized_section__target_profile", "normalized_section__product_activity_ip_profile", "normalized_section__data_provenance_controls", "normalized_section__legal_document_control_review", "normalized_section__exposure_summary_harm_mechanism_workpad_summary", "normalized_section__exposure_diagnosis_table", "normalized_section__exposure_control_discipline", "normalized_section__review_route_action_plan", "normalized_section__control_handoff_readiness", "normalized_section__exposure_clarification_queue", "normalized_section__global_confirmation_queue", "normalized_section__methodology_limitations_forensic_annexure"]);
export const NORMALIZED_COMPILER_ARTIFACT_NAMES = Object.freeze([ART.normalizedReportManifest, ART.reviewReadySectionHandoff, ART.finalOutputHandoff, ...NORMALIZED_SECTION_ARTIFACT_NAMES]);
export const COMPILER_ARTIFACT_NAMES = NORMALIZED_COMPILER_ARTIFACT_NAMES;
export const QUALIFIED_REVIEW_SECTION_ARTIFACT_NAMES = Object.freeze([ART.qrEntityCommercial, ART.qrTechnologyInfrastructure, ART.qrAiCapabilityProductBehavior, ART.qrDapPrivacyIndiaCyber]);
export const QUALIFIED_REVIEW_RUNTIME_ARTIFACT_NAMES = Object.freeze([...QUALIFIED_REVIEW_SECTION_ARTIFACT_NAMES, ART.qualifiedReviewRendererPayload, ART.qualifiedReviewValidationManifest]);
export const QUALIFIED_REVIEW_ARTIFACT_NAMES = Object.freeze([ART.qualifiedReviewHandoff, ...QUALIFIED_REVIEW_SECTION_ARTIFACT_NAMES, ART.qualifiedReviewRendererPayload, ART.qualifiedReviewValidationManifest, ART.qualifiedReviewSubmission]);
export const DILIGENCE_QA_ARTIFACT_NAMES = Object.freeze([ART.diligenceQaCompletionReceipt]);

export const AGENT_1A_ARTIFACT_NAMES = Object.freeze([...DOMAIN_GATE_RUNTIME_ARTIFACT_NAMES, "deduped_url_manifest", ...SOURCE_DISCOVERY_CONTROL_ARTIFACT_NAMES]);
export const AGENT_1B_REQUIRED_ARTIFACT_NAMES = Object.freeze(["source_family_index", ...SOURCE_DISCOVERY_LEGAL_DOC_CONTROL_ARTIFACT_NAMES]);
export const AGENT_1B_OPTIONAL_ROOT_ARTIFACT_NAMES = LOSSLESS_COMMON_ROOT_ARTIFACT_NAMES;
export const AGENT_1B_WRITE_PERMISSION_ARTIFACT_NAMES = Object.freeze([...AGENT_1B_REQUIRED_ARTIFACT_NAMES, ...AGENT_1B_OPTIONAL_ROOT_ARTIFACT_NAMES, LEGAL_DOC_DYNAMIC_PERMISSION]);
export const AGENT_1B_ARTIFACT_NAMES = AGENT_1B_REQUIRED_ARTIFACT_NAMES;
export const AGENT_1_ARTIFACT_NAMES = Object.freeze([...AGENT_1A_ARTIFACT_NAMES, ...AGENT_1B_REQUIRED_ARTIFACT_NAMES]);

export const QUALIFIED_REVIEW_READ_ARTIFACT_NAMES = Object.freeze(["source_family_index", ...DOMAIN_GATE_RUNTIME_ARTIFACT_NAMES, ...SOURCE_DISCOVERY_CONTROL_ARTIFACT_NAMES, ...SOURCE_DISCOVERY_LEGAL_DOC_CONTROL_ARTIFACT_NAMES, ART.sourceHandoff, ART.postPhase1DomainGateHandoff, ...CARTOGRAPHY_ARTIFACT_NAMES, ART.targetProfile, ...DOMAIN_DERIVATION_ARTIFACT_NAMES, ART.targetForensics, ART.activityInventory, ART.activityProfile, ART.activityForensics, ...PHASE7_DAP_RUNTIME_ARTIFACT_NAMES, ...PHASE8_DAP_FORENSICS_ARTIFACT_NAMES, ART.exposureRoutePlan, ART.exposureBatchPattern, ART.exposureBatchValidationPattern, ART.exposureWorkpad, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics, ART.challengeGate, ...NORMALIZED_COMPILER_ARTIFACT_NAMES, ...LOSSLESS_COMMON_ROOT_ARTIFACT_NAMES, ...UPLOADED_SOURCE_DOCUMENT_ARTIFACT_NAMES, ...QUALIFIED_REVIEW_ARTIFACT_NAMES]);
export const ARTIFACT_NAMES = Object.freeze([...UPLOADED_SOURCE_DOCUMENT_ARTIFACT_NAMES, ...DOMAIN_GATE_RUNTIME_ARTIFACT_NAMES, ...SOURCE_DISCOVERY_CONTROL_ARTIFACT_NAMES, ...SOURCE_DISCOVERY_LEGAL_DOC_CONTROL_ARTIFACT_NAMES, ...LOSSLESS_COMMON_ROOT_ARTIFACT_NAMES, ...AGENT_1_ARTIFACT_NAMES, ART.sourceHandoff, ART.postPhase1DomainGateHandoff, ...CARTOGRAPHY_ARTIFACT_NAMES, ART.targetProfile, ...DOMAIN_DERIVATION_ARTIFACT_NAMES, ART.targetForensics, ART.activityInventory, ART.activityProfile, ART.activityForensics, ...PHASE7_DAP_RUNTIME_ARTIFACT_NAMES, ...PHASE8_DAP_FORENSICS_ARTIFACT_NAMES, ...M11_STATIC_ARTIFACT_NAMES, ART.challengeGate, ...NORMALIZED_COMPILER_ARTIFACT_NAMES, ...QUALIFIED_REVIEW_ARTIFACT_NAMES, ...DILIGENCE_QA_ARTIFACT_NAMES, ART.rendererPayload]);
export const AGENTS = Object.freeze([...Object.values(AGENT_IDS)]);

export const WRITE_PERMISSIONS = Object.freeze({
  [AGENT_IDS.sourceUrlManifest]: AGENT_1A_ARTIFACT_NAMES,
  [AGENT_IDS.sourceExtractor]: AGENT_1B_WRITE_PERMISSION_ARTIFACT_NAMES,
  [AGENT_IDS.sourceDiscovery]: SOURCE_DISCOVERY_HANDOFF_ARTIFACT_NAMES,
  [AGENT_IDS.cartographyIndex]: [...CARTOGRAPHY_LAYER1_ARTIFACT_NAMES, ...CARTOGRAPHY_LAYER2_ARTIFACT_NAMES, ...CARTOGRAPHY_LAYER3_ARTIFACT_NAMES, ...CARTOGRAPHY_LAYER4_ARTIFACT_NAMES, ...TARGET_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES, ...DOMAIN_DERIVATION_SOURCE_INDEX_ARTIFACT_NAMES, ...ACTIVITY_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES, ...DATA_PRIVACY_NAVIGATION_INDEX_ARTIFACT_NAMES, ...DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX_ARTIFACT_NAMES, ...CARTOGRAPHY_LAYER5_ARTIFACT_NAMES],
  [AGENT_IDS.legalCartography]: [...LEGAL_CARTOGRAPHY_ARTIFACT_NAMES, ...LEGAL_CARTOGRAPHY_OPTIONAL_ARTIFACT_NAMES],
  [AGENT_IDS.targetActivity]: [ART.targetProfile, ...DOMAIN_DERIVATION_ARTIFACT_NAMES, ART.targetForensics, ART.activityInventory, ART.activityProfile, ART.activityForensics],
  [AGENT_IDS.dataProvenance]: [...PHASE7_DAP_LAYER4_ARTIFACT_NAMES, ...PHASE7_DAP_LAYER5_ARTIFACT_NAMES, ...PHASE8_DAP_FORENSICS_ARTIFACT_NAMES, ART.dapSemanticBatchValidationPattern],
  [AGENT_IDS.exposureRegistry]: [ART.exposureRoutePlan, ART.exposureBatchPattern, ART.exposureBatchValidationPattern, ART.exposureWorkpad, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics, ART.challengeGate],
  [AGENT_IDS.operatorChallenge]: [ART.exposureBatchValidationPattern, ART.challengeGate],
  [AGENT_IDS.documentSourceIngestor]: UPLOADED_SOURCE_DOCUMENT_ARTIFACT_NAMES,
  [AGENT_IDS.compiler]: COMPILER_ARTIFACT_NAMES,
  [AGENT_IDS.qualifiedReview]: QUALIFIED_REVIEW_ARTIFACT_NAMES,
  [AGENT_IDS.diligenceQaGate]: DILIGENCE_QA_ARTIFACT_NAMES,
  [AGENT_IDS.assemblyEngine]: [],
  [AGENT_IDS.renderer]: [ART.rendererPayload],
  [AGENT_IDS.operator]: [...ARTIFACT_NAMES, LEGAL_DOC_DYNAMIC_PERMISSION, ...M11_DYNAMIC_ARTIFACT_PATTERNS, ...PHASE7_DAP_DYNAMIC_ARTIFACT_PATTERNS]
});

export const READ_PERMISSIONS = Object.freeze({
  [AGENT_IDS.sourceUrlManifest]: [],
  [AGENT_IDS.sourceExtractor]: ["deduped_url_manifest", ...SOURCE_DISCOVERY_CONTROL_ARTIFACT_NAMES],
  [AGENT_IDS.sourceDiscovery]: [...AGENT_1_ARTIFACT_NAMES, ...AGENT_1B_OPTIONAL_ROOT_ARTIFACT_NAMES, ...SOURCE_DISCOVERY_LEGAL_DOC_CONTROL_ARTIFACT_NAMES, LEGAL_DOC_DYNAMIC_PERMISSION],
  [AGENT_IDS.cartographyIndex]: [...CARTOGRAPHY_SOURCE_INPUT_ARTIFACT_NAMES, ...TARGET_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES, ...DOMAIN_DERIVATION_SOURCE_INDEX_ARTIFACT_NAMES, ...ACTIVITY_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES, ...DATA_PRIVACY_NAVIGATION_INDEX_ARTIFACT_NAMES, ...DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX_ARTIFACT_NAMES, ...LEGAL_CARTOGRAPHY_ARTIFACT_NAMES, ...LEGAL_CARTOGRAPHY_OPTIONAL_ARTIFACT_NAMES],
  [AGENT_IDS.legalCartography]: [...CARTOGRAPHY_SOURCE_INPUT_ARTIFACT_NAMES, ART.cartographySourceInventory, ART.cartographyLocatorSpine, ART.cartographyProfileRouteMatrix, ART.cartographySemanticNavigationOverlay],
  [AGENT_IDS.targetActivity]: [ART.sourceHandoff, ART.cartographyIndex, ART.targetProfileSourceIndex, ART.domainDerivationSourceIndex, ART.activityProfileSourceIndex, ART.legalSignalDerivationProfile, ART.targetProfile, ...DOMAIN_DERIVATION_SOURCE_ROOT_ARTIFACT_NAMES, ...PHASE3_TARGET_ACTIVITY_SOURCE_ARTIFACT_NAMES, ...DOMAIN_DERIVATION_ARTIFACT_NAMES, ART.targetForensics, ART.activityInventory, ART.activityProfile, ...DOMAIN_GATE_RUNTIME_ARTIFACT_NAMES],
  [AGENT_IDS.dataProvenance]: [ART.cartographyIndex, ART.dataPrivacyNavigationIndex, ART.legalCartographyIndex, ART.legalSignalDerivationProfile, ART.targetProfile, ...DOMAIN_DERIVATION_ARTIFACT_NAMES, ART.targetForensics, ART.activityInventory, ART.activityProfile, ART.activityForensics, ...DOMAIN_GATE_RUNTIME_ARTIFACT_NAMES, ...PHASE7_DAP_LAYER4_ARTIFACT_NAMES, ...PHASE7_DAP_LAYER5_ARTIFACT_NAMES, ...PHASE8_DAP_FORENSICS_ARTIFACT_NAMES, ART.dapSemanticBatchValidationPattern],
  [AGENT_IDS.exposureRegistry]: [ART.cartographyIndex, ART.legalCartographyIndex, ART.legalSignalDerivationProfile, ...DOMAIN_GATE_RUNTIME_ARTIFACT_NAMES, ART.targetProfile, ...DOMAIN_DERIVATION_ARTIFACT_NAMES, ART.targetForensics, ART.activityInventory, ART.activityProfile, ART.activityForensics, ...PHASE7_DAP_RUNTIME_ARTIFACT_NAMES, ...PHASE8_DAP_FORENSICS_ARTIFACT_NAMES, ...M11_STATIC_ARTIFACT_NAMES],
  [AGENT_IDS.operatorChallenge]: [ART.cartographyIndex, ART.legalCartographyIndex, ART.legalSignalDerivationProfile, ...DOMAIN_GATE_RUNTIME_ARTIFACT_NAMES, ART.targetProfile, ...DOMAIN_DERIVATION_ARTIFACT_NAMES, ART.targetForensics, ART.activityInventory, ART.activityProfile, ART.activityForensics, ...PHASE7_DAP_RUNTIME_ARTIFACT_NAMES, ...PHASE8_DAP_FORENSICS_ARTIFACT_NAMES, ...M11_STATIC_ARTIFACT_NAMES],
  [AGENT_IDS.compiler]: QUALIFIED_REVIEW_READ_ARTIFACT_NAMES,
  [AGENT_IDS.qualifiedReview]: QUALIFIED_REVIEW_READ_ARTIFACT_NAMES,
  [AGENT_IDS.diligenceQaGate]: QUALIFIED_REVIEW_READ_ARTIFACT_NAMES,
  [AGENT_IDS.assemblyEngine]: QUALIFIED_REVIEW_READ_ARTIFACT_NAMES,
  [AGENT_IDS.renderer]: [...NORMALIZED_COMPILER_ARTIFACT_NAMES],
  [AGENT_IDS.operator]: [...ARTIFACT_NAMES, LEGAL_DOC_DYNAMIC_PERMISSION, ...M11_DYNAMIC_ARTIFACT_PATTERNS, ...PHASE7_DAP_DYNAMIC_ARTIFACT_PATTERNS]
});

export const INTERNAL_JOB_WRITE_PERMISSIONS = Object.freeze({
  AGENT_1A_URL_MANIFEST: AGENT_1A_ARTIFACT_NAMES,
  AGENT_1B_EXTRACT: AGENT_1B_WRITE_PERMISSION_ARTIFACT_NAMES,
  M6_BUCKET_INDEX: SOURCE_DISCOVERY_HANDOFF_ARTIFACT_NAMES,
  P2_SOURCE_INVENTORY_CARTOGRAPHY: CARTOGRAPHY_LAYER1_ARTIFACT_NAMES,
  P2_LOCATOR_SPINE: CARTOGRAPHY_LAYER2_ARTIFACT_NAMES,
  P2_PROFILE_ROUTE_MATRIX: CARTOGRAPHY_LAYER3_ARTIFACT_NAMES,
  P2_SEMANTIC_NAVIGATION_OVERLAY: CARTOGRAPHY_LAYER4_ARTIFACT_NAMES,
  M9: [...LEGAL_CARTOGRAPHY_ARTIFACT_NAMES, ...LEGAL_CARTOGRAPHY_OPTIONAL_ARTIFACT_NAMES],
  P2A_TARGET_PROFILE_SOURCE_INDEX: TARGET_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES,
  P2B_DOMAIN_DERIVATION_SOURCE_INDEX: DOMAIN_DERIVATION_SOURCE_INDEX_ARTIFACT_NAMES,
  P2C_ACTIVITY_PROFILE_SOURCE_INDEX: ACTIVITY_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES,
  P2D_DATA_PRIVACY_NAVIGATION_INDEX: DATA_PRIVACY_NAVIGATION_INDEX_ARTIFACT_NAMES,
  P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX: DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX_ARTIFACT_NAMES,
  P2_INDEX_COMPILER_VALIDATION: CARTOGRAPHY_LAYER5_ARTIFACT_NAMES,
  M7_TARGET_PROFILE: [ART.targetProfile],
  P3_DOMAIN_DERIVATION_LAYER: DOMAIN_DERIVATION_ARTIFACT_NAMES,
  M7_TARGET_PROFILE_FORENSICS: [ART.targetForensics],
  M8_FEATURE_CANDIDATE_INVENTORY: [ART.activityInventory],
  M8_TARGET_FEATURE_PROFILE: [ART.activityProfile],
  M8_TARGET_FEATURE_PROFILE_FORENSICS: [ART.activityForensics],
  DATA_PROVENANCE_PROFILE_LAYER4: [...PHASE7_DAP_LAYER4_ARTIFACT_NAMES, ART.dapSemanticBatchValidationPattern],
  DATA_PROVENANCE_PROFILE_LAYER5: PHASE7_DAP_LAYER5_ARTIFACT_NAMES,
  DATA_PROVENANCE_PROFILE_FORENSICS: PHASE8_DAP_FORENSICS_ARTIFACT_NAMES,
  M11: [ART.exposureRoutePlan, ART.exposureBatchPattern, ART.exposureBatchValidationPattern, ART.exposureWorkpad, ART.exposureControlled, ART.exposureTriggered, ART.exposureForensics],
  M12: [ART.challengeGate],
  NORMALIZED_COMPILER: COMPILER_ARTIFACT_NAMES,
  NORMALIZED_REPORT_RENDERER: [ART.rendererPayload],
  RENDERER: [ART.rendererPayload],
  QUALIFIED_REVIEW: QUALIFIED_REVIEW_RUNTIME_ARTIFACT_NAMES,
  DILIGENCE_QA_COMPLETE: DILIGENCE_QA_ARTIFACT_NAMES,
  QUALIFIED_REVIEW_SUBMISSION: [ART.qualifiedReviewSubmission],
  ASSEMBLY_ENGINE: []
});
export const PHASE_WRITE_PERMISSIONS = INTERNAL_JOB_WRITE_PERMISSIONS;

export function isKnownArtifactName(artifactName) {
  const name = String(artifactName || "");
  return ARTIFACT_NAMES.includes(name) || LOSSLESS_COMMON_ROOT_ARTIFACT_PATTERN.test(name) || LEGAL_DOC_ARTIFACT_PATTERN.test(name) || M11_BATCH_ARTIFACT_PATTERN.test(name) || M11_BATCH_VALIDATION_ARTIFACT_PATTERN.test(name) || PHASE7_DAP_BATCH_ARTIFACT_PATTERN.test(name) || PHASE7_DAP_BATCH_VALIDATION_ARTIFACT_PATTERN.test(name);
}
export function artifactMatchesPermission(artifactName, permission) {
  if (permission === artifactName) return true;
  if (permission === LEGAL_DOC_DYNAMIC_PERMISSION) return LEGAL_DOC_ARTIFACT_PATTERN.test(artifactName);
  if (permission === ART.exposureBatchPattern) return M11_BATCH_ARTIFACT_PATTERN.test(artifactName);
  if (permission === ART.exposureBatchValidationPattern) return M11_BATCH_VALIDATION_ARTIFACT_PATTERN.test(artifactName);
  if (permission === ART.dapSemanticBatchValidationPattern) return PHASE7_DAP_BATCH_VALIDATION_PATTERN_COMPAT(artifactName);
  if (String(permission || "").startsWith("lossless_root__")) return artifactName === permission || artifactName.startsWith(`${permission}__part_`);
  return false;
}
function PHASE7_DAP_BATCH_VALIDATION_PATTERN_COMPAT(artifactName) { return PHASE7_DAP_BATCH_VALIDATION_ARTIFACT_PATTERN.test(artifactName); }
export function assertKnownArtifactName(artifactName) { if (!isKnownArtifactName(artifactName)) throw new Error(`INVALID_ARTIFACT_NAME:${artifactName || "missing"}`); }
export function assertKnownAgent(agentId) { if (!AGENTS.includes(agentId)) throw new Error(`INVALID_AGENT:${agentId || "missing"}`); }
export function assertCanReadArtifact(agentId, artifactName) { assertKnownAgent(agentId); assertKnownArtifactName(artifactName); const allowed = READ_PERMISSIONS[agentId] || []; if (!allowed.some((permission) => artifactMatchesPermission(artifactName, permission))) throw new Error(`READ_FORBIDDEN:${agentId}:${artifactName}`); }
export function assertCanWriteArtifact(agentId, artifactName) { assertKnownAgent(agentId); assertKnownArtifactName(artifactName); const allowed = WRITE_PERMISSIONS[agentId] || []; if (!allowed.some((permission) => artifactMatchesPermission(artifactName, permission))) throw new Error(`WRITE_FORBIDDEN:${agentId}:${artifactName}`); }
export function assertInternalJobCanWriteArtifact(internalJobId, artifactName) { assertKnownArtifactName(artifactName); const allowed = INTERNAL_JOB_WRITE_PERMISSIONS[internalJobId] || []; if (!allowed.some((permission) => artifactMatchesPermission(artifactName, permission))) throw new Error(`PHASE_WRITE_FORBIDDEN:${internalJobId}:${artifactName}`); }
function escapeRegExp(value) { return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
