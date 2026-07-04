import {
  AGENT_1A_ARTIFACT_NAMES,
  AGENT_1B_ARTIFACT_NAMES,
  AGENT_1B_OPTIONAL_FAMILY_ARTIFACT_NAMES,
  AGENT_1_ARTIFACT_NAMES,
  COMPILER_ARTIFACT_NAMES,
  DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES,
  EXTENDED_DAP_ARTIFACT_NAMES,
  FEATURE_CANDIDATE_INVENTORY_ARTIFACT_NAMES,
  INTEGRATED_DAP_ARTIFACT_NAMES,
  LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES,
  M7_DETERMINISTIC_LEGAL_SIGNAL_ARTIFACT_NAMES,
  M10_SELECTED_LEGAL_SUPPORT_ARTIFACT_NAMES,
  M11_STATIC_ARTIFACT_NAMES,
  NORMALIZED_SECTION_ARTIFACT_NAMES,
  PRODUCT_ACTIVITY_FAMILY_ARTIFACT_NAMES,
  TARGET_PROFILE_FAMILY_ARTIFACT_NAMES,
  QUALIFIED_REVIEW_RUNTIME_ARTIFACT_NAMES,
  DILIGENCE_QA_ARTIFACT_NAMES
} from "./artifact-permissions.contract.js";

const packetFile = (prefix, suffix = ".yaml") => `${prefix}BINDING_` + `PACKET${suffix}`;
const SYSTEM_BLOCKING_DOCTRINE_FILE = "agent-packages/00_SYSTEM_BLOCKING_DOCTRINE.md";

const LEGAL_CARTOGRAPHY_PACKAGE_ROOT = "agent-packages/agent_2b_m9";
const LEGAL_CARTOGRAPHY_FILES = Object.freeze([
  SYSTEM_BLOCKING_DOCTRINE_FILE,
  `${LEGAL_CARTOGRAPHY_PACKAGE_ROOT}/` + packetFile("AGENT2B_M9_RUNTIME_"),
  `${LEGAL_CARTOGRAPHY_PACKAGE_ROOT}/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md`,
  `${LEGAL_CARTOGRAPHY_PACKAGE_ROOT}/04_M9_LEGAL_CARTOGRAPHY_RUNTIME_SYNC_PATCHED.md`,
  `${LEGAL_CARTOGRAPHY_PACKAGE_ROOT}/00_VALIDATOR_RULES_INTEGRATED.md`,
  `${LEGAL_CARTOGRAPHY_PACKAGE_ROOT}/00_TERMINAL_RECEIPT_RULES_INTEGRATED.md`
]);

const TARGET_ACTIVITY_PACKAGE_ROOT = "agent-packages/agent_3_target_feature";
const TARGET_ACTIVITY_RUNTIME_FILES = Object.freeze([SYSTEM_BLOCKING_DOCTRINE_FILE, `${TARGET_ACTIVITY_PACKAGE_ROOT}/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md`, `${TARGET_ACTIVITY_PACKAGE_ROOT}/` + packetFile("AGENT3_RUNTIME_")]);
const TARGET_ACTIVITY_VALIDATION_FILES = Object.freeze([`${TARGET_ACTIVITY_PACKAGE_ROOT}/00_VALIDATOR_RULES_INTEGRATED.md`, `${TARGET_ACTIVITY_PACKAGE_ROOT}/00_VALIDATOR_RULES_M8_FEATURE_INVENTORY_INDEX_ADDENDUM.md`, `${TARGET_ACTIVITY_PACKAGE_ROOT}/AGENT3_BACKEND_OUTPUT_CONTRACT.md`, `${TARGET_ACTIVITY_PACKAGE_ROOT}/AGENT3_FEATURE_CANDIDATE_INVENTORY_OUTPUT_CONTRACT.md`, `${TARGET_ACTIVITY_PACKAGE_ROOT}/00_TERMINAL_RECEIPT_RULES_INTEGRATED.md`]);
const TARGET_PROFILE_REFERENCE_FILES = Object.freeze(["M7_TARGET_PROFILE_DERIVATION_AUTHORITY.yaml", "FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml"]);
const TARGET_ACTIVITY_REFERENCE_FILES = Object.freeze(["REGISTRY_KEY_v3_0.md", "FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml", "FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml", "CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml"]);

const DATA_PROVENANCE_PACKAGE_ROOT = "agent-packages/agent_4_data_privacy";
const DATA_PROVENANCE_FILES = Object.freeze([SYSTEM_BLOCKING_DOCTRINE_FILE, `${DATA_PROVENANCE_PACKAGE_ROOT}/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md`, `${DATA_PROVENANCE_PACKAGE_ROOT}/` + packetFile("AGENT4_RUNTIME_", "_SYNCED_M10.yaml"), `${DATA_PROVENANCE_PACKAGE_ROOT}/M10_DATA_PROVENANCE.md`, `${DATA_PROVENANCE_PACKAGE_ROOT}/M10_QR_CONTACT_CONSENT_MANAGER_ADDENDUM.md`, `${DATA_PROVENANCE_PACKAGE_ROOT}/00_VALIDATOR_RULES_INTEGRATED_AGENT4_SYNCED.md`, `${DATA_PROVENANCE_PACKAGE_ROOT}/AGENT4_BACKEND_OUTPUT_CONTRACT_SYNCED_M10.md`, `${DATA_PROVENANCE_PACKAGE_ROOT}/BACKEND_CANONICAL_OUTPUT_ADAPTER.md`, `${DATA_PROVENANCE_PACKAGE_ROOT}/00_TERMINAL_RECEIPT_RULES_INTEGRATED_AGENT4_SYNCED.md`]);

const EXPOSURE_PACKAGE_ROOT = "agent-packages/agent_5_exposure_registry";
const EXPOSURE_FILES = Object.freeze([SYSTEM_BLOCKING_DOCTRINE_FILE, `${EXPOSURE_PACKAGE_ROOT}/` + packetFile("AGENT5_RUNTIME_", "_SYNCED_M11.yaml"), `${EXPOSURE_PACKAGE_ROOT}/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED_AGENT5_SYNCED.md`, `${EXPOSURE_PACKAGE_ROOT}/M11_EXPOSURE_REGISTRY.md`, `${EXPOSURE_PACKAGE_ROOT}/00_VALIDATOR_RULES_INTEGRATED_AGENT5_SYNCED.md`, `${EXPOSURE_PACKAGE_ROOT}/AGENT5_BACKEND_OUTPUT_CONTRACT_SYNCED_M11.md`, `${EXPOSURE_PACKAGE_ROOT}/AGENT5_M12_SCOPE_OVERRIDE.md`, `${EXPOSURE_PACKAGE_ROOT}/00_TERMINAL_RECEIPT_RULES_INTEGRATED_AGENT5_SYNCED.md`, `${EXPOSURE_PACKAGE_ROOT}/BACKEND_CANONICAL_OUTPUT_ADAPTER.md`]);
const EXPOSURE_REFERENCE_FILES = Object.freeze(["AI_THREAT_REGISTRY.yaml", "REGISTRY_KEY_v3_0.md", "03_REGISTRY_EVALUATION_RULES.yaml", "FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml", "FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml"]);

const LEGAL_CARTOGRAPHY_REQUIRED_ARTIFACT_NAMES = Object.freeze(["legal_cartography_deterministic_map", "legal_cartography_semantic_profile", "legal_cartography_index", ...M7_DETERMINISTIC_LEGAL_SIGNAL_ARTIFACT_NAMES, ...M10_SELECTED_LEGAL_SUPPORT_ARTIFACT_NAMES]);
const NORMALIZED_RENDERER_READS = Object.freeze(["final_output_handoff", "normalized_report_manifest", ...NORMALIZED_SECTION_ARTIFACT_NAMES]);
const DATA_PROVENANCE_PRIMARY_READS = Object.freeze(["source_discovery_handoff", "legal_cartography_index", "target_feature_profile", ...DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES, ...M10_SELECTED_LEGAL_SUPPORT_ARTIFACT_NAMES]);

export const INTERNAL_PIPELINE_JOB_IDS = Object.freeze([
  "AGENT_1A_URL_MANIFEST",
  "AGENT_1B_EXTRACT",
  "M6_BUCKET_INDEX",
  "M9",
  "M7_TARGET_PROFILE",
  "M7_TARGET_PROFILE_FORENSICS",
  "M8_FEATURE_CANDIDATE_INVENTORY",
  "M8_TARGET_FEATURE_PROFILE",
  "M8_TARGET_FEATURE_PROFILE_FORENSICS",
  "M10",
  "M10_FORENSICS",
  "AGENT_4B_EXTENDED_DAP_INDIA_READINESS",
  "AGENT_4C_INTEGRATED_DAP_REPORT",
  "M11",
  "M12",
  "NORMALIZED_COMPILER",
  "NORMALIZED_REPORT_RENDERER",
  "QUALIFIED_REVIEW",
  "DILIGENCE_QA_COMPLETE",
  "QUALIFIED_REVIEW_SUBMISSION",
  "ASSEMBLY_ENGINE",
  "COMPLETE"
]);

export const PIPELINE_CONTRACTS = Object.freeze({
  AGENT_1A_URL_MANIFEST: { type: "deterministic", dynamic: true, actor_id: "agent_1a_url_manifest", reads: [], writes: AGENT_1A_ARTIFACT_NAMES, next: "AGENT_1B_EXTRACT", central_phase_id: "SOURCE_DISCOVERY", public_label: "Source Discovery" },
  AGENT_1B_EXTRACT: { type: "deterministic", dynamic: true, actor_id: "agent_1b_extract", reads: ["deduped_url_manifest"], writes: AGENT_1B_ARTIFACT_NAMES, optional_writes: AGENT_1B_OPTIONAL_FAMILY_ARTIFACT_NAMES, next: "M6_BUCKET_INDEX", central_phase_id: "SOURCE_DISCOVERY", public_label: "Source Discovery" },
  M6_BUCKET_INDEX: { type: "deterministic", dynamic: true, actor_id: "agent_2a_bucket_routing", reads: AGENT_1_ARTIFACT_NAMES, writes: ["source_discovery_handoff"], next: "M9", central_phase_id: "SOURCE_DISCOVERY", public_label: "Source Discovery" },
  M9: { type: "model", agent_id: "agent_2b_m9", prompt_files: LEGAL_CARTOGRAPHY_FILES, reads: ["source_discovery_handoff", ...LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES], writes: LEGAL_CARTOGRAPHY_REQUIRED_ARTIFACT_NAMES, next: "M7_TARGET_PROFILE", central_phase_id: "LEGAL_CARTOGRAPHY_INDEX", public_label: "Legal Cartography and Index" },
  M7_TARGET_PROFILE: { type: "model", agent_id: "agent_3_target_feature", prompt_files: [...TARGET_ACTIVITY_RUNTIME_FILES, `${TARGET_ACTIVITY_PACKAGE_ROOT}/02_M7_TARGET_PROFILE_BACKEND_CURRENT.md`, ...TARGET_ACTIVITY_VALIDATION_FILES], reads: ["source_discovery_handoff", ...M7_DETERMINISTIC_LEGAL_SIGNAL_ARTIFACT_NAMES, ...TARGET_PROFILE_FAMILY_ARTIFACT_NAMES], references: TARGET_PROFILE_REFERENCE_FILES, writes: ["target_profile"], next: "M7_TARGET_PROFILE_FORENSICS", central_phase_id: "TARGET_PROFILE_REVIEW", public_label: "Target Profile Review" },
  M7_TARGET_PROFILE_FORENSICS: { type: "deterministic", agent_id: "agent_3_target_feature", actor_id: "agent_3_target_feature", reads: ["source_discovery_handoff", ...M7_DETERMINISTIC_LEGAL_SIGNAL_ARTIFACT_NAMES, "target_profile", ...TARGET_PROFILE_FAMILY_ARTIFACT_NAMES], references: [], writes: ["target_profile_forensics"], next: "M8_FEATURE_CANDIDATE_INVENTORY", central_phase_id: "TARGET_PROFILE_FORENSICS", public_label: "Target Profile Forensics" },
  M8_FEATURE_CANDIDATE_INVENTORY: { type: "deterministic", agent_id: "agent_3_target_feature", actor_id: "agent_3_target_feature", reads: ["source_discovery_handoff", "target_profile", "target_profile_forensics", ...PRODUCT_ACTIVITY_FAMILY_ARTIFACT_NAMES], references: [], writes: FEATURE_CANDIDATE_INVENTORY_ARTIFACT_NAMES, next: "M8_TARGET_FEATURE_PROFILE", central_phase_id: "ACTIVITY_PROFILE_REVIEW", public_label: "Activity Profile Review" },
  M8_TARGET_FEATURE_PROFILE: { type: "model", agent_id: "agent_3_target_feature", prompt_files: [...TARGET_ACTIVITY_RUNTIME_FILES, `${TARGET_ACTIVITY_PACKAGE_ROOT}/03_M8_FEATURE_PROFILE_BACKEND_CURRENT.md`, `${TARGET_ACTIVITY_PACKAGE_ROOT}/03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC.md`, ...TARGET_ACTIVITY_VALIDATION_FILES], reads: ["source_discovery_handoff", "target_profile", "target_profile_forensics", "feature_candidate_inventory", ...PRODUCT_ACTIVITY_FAMILY_ARTIFACT_NAMES], references: TARGET_ACTIVITY_REFERENCE_FILES, writes: ["target_feature_profile"], next: "M8_TARGET_FEATURE_PROFILE_FORENSICS", central_phase_id: "ACTIVITY_PROFILE_REVIEW", public_label: "Activity Profile Review" },
  M8_TARGET_FEATURE_PROFILE_FORENSICS: { type: "deterministic", agent_id: "agent_3_target_feature", actor_id: "agent_3_target_feature", reads: ["source_discovery_handoff", "target_profile", "target_profile_forensics", "feature_candidate_inventory", "target_feature_profile", ...PRODUCT_ACTIVITY_FAMILY_ARTIFACT_NAMES], references: [], writes: ["target_feature_profile_forensics"], next: "M10", central_phase_id: "ACTIVITY_PROFILE_FORENSICS", public_label: "Activity Profile Forensics" },
  M10: { type: "model", agent_id: "agent_4_data_privacy", prompt_files: DATA_PROVENANCE_FILES, reads: DATA_PROVENANCE_PRIMARY_READS, writes: ["data_provenance_profile"], next: "M10_FORENSICS", central_phase_id: "DATA_PROVENANCE_PROFILE", public_label: "Data Provenance Profile", contract_note: "Data Provenance Profile uses D1-D5 as primary source authority and selected legal support only. It must not read target_profile, target_profile_forensics, feature_candidate_inventory, or target_feature_profile_forensics." },
  M10_FORENSICS: { type: "deterministic", agent_id: "agent_4_data_privacy", actor_id: "agent_4_data_privacy", reads: [...DATA_PROVENANCE_PRIMARY_READS, "data_provenance_profile"], references: [], writes: ["data_provenance_profile_forensics"], next: "AGENT_4B_EXTENDED_DAP_INDIA_READINESS", central_phase_id: "DATA_PROVENANCE_FORENSICS", public_label: "Data Provenance Forensics" },
  AGENT_4B_EXTENDED_DAP_INDIA_READINESS: { type: "deterministic", actor_id: "agent_4b_extended_dap", reads: ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_profile_forensics", "feature_candidate_inventory", "target_feature_profile", "target_feature_profile_forensics", "data_provenance_profile", "data_provenance_profile_forensics", ...DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES, ...LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES], references: ["FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml"], writes: EXTENDED_DAP_ARTIFACT_NAMES, next: "AGENT_4C_INTEGRATED_DAP_REPORT", central_phase_id: "DATA_PROVENANCE_PROFILE", public_label: "Data Provenance Profile" },
  AGENT_4C_INTEGRATED_DAP_REPORT: { type: "deterministic", actor_id: "agent_4c_integrated_dap_compiler", reads: ["data_provenance_profile", "data_provenance_profile_forensics", "extended_dap_india_readiness_profile"], references: ["FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml"], writes: INTEGRATED_DAP_ARTIFACT_NAMES, next: "M11", central_phase_id: "DATA_PROVENANCE_PROFILE", public_label: "Data Provenance Profile" },
  M11: { type: "orchestrated", actor_id: "agent_5_exposure_registry", agent_id: "agent_5_exposure_registry", prompt_files: EXPOSURE_FILES, reads: ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_profile_forensics", "feature_candidate_inventory", "target_feature_profile", "target_feature_profile_forensics", "data_provenance_profile", "data_provenance_profile_forensics", ...LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES], references: EXPOSURE_REFERENCE_FILES, writes: M11_STATIC_ARTIFACT_NAMES, next: "M12", central_phase_id: "EXPOSURE_PROFILE", public_label: "Exposure Profile" },
  M12: { type: "deterministic", actor_id: "agent_5_exposure_registry", reads: ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_profile_forensics", "feature_candidate_inventory", "target_feature_profile", "target_feature_profile_forensics", "data_provenance_profile", "data_provenance_profile_forensics", "exposure_registry_route_plan", "exposure_registry_workpad_98", "exposure_registry_controlled_profile", "exposure_registry_triggered_profile", "exposure_registry_profile_forensics"], writes: ["challenge_gate"], next: "NORMALIZED_COMPILER", central_phase_id: "OPERATOR_CHALLENGE", public_label: "Operator Challenge" },
  NORMALIZED_COMPILER: { type: "deterministic", actor_id: "compiler", reads: ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_profile_forensics", "feature_candidate_inventory", "target_feature_profile", "target_feature_profile_forensics", "data_provenance_profile", "data_provenance_profile_forensics", "extended_dap_india_readiness_profile", "integrated_dap_report", "exposure_registry_route_plan", "exposure_registry_workpad_98", "exposure_registry_controlled_profile", "exposure_registry_triggered_profile", "exposure_registry_profile_forensics", "challenge_gate"], writes: COMPILER_ARTIFACT_NAMES, next: "NORMALIZED_REPORT_RENDERER", central_phase_id: "COMPILER", public_label: "Compiler" },
  NORMALIZED_REPORT_RENDERER: { type: "deterministic", actor_id: "portfolio_renderer", reads: NORMALIZED_RENDERER_READS, writes: ["renderer_payload"], next: "QUALIFIED_REVIEW", central_phase_id: "COMPILER", public_label: "Compiler", compatibility_alias: "RENDERER" },
  QUALIFIED_REVIEW: { type: "deterministic", actor_id: "qualified_review_system", reads: ["normalized_report_manifest", "review_ready_section_handoff", "final_output_handoff"], writes: QUALIFIED_REVIEW_RUNTIME_ARTIFACT_NAMES, next: "DILIGENCE_QA_COMPLETE", central_phase_id: "QUALIFIED_REVIEW", public_label: "Qualified Review" },
  DILIGENCE_QA_COMPLETE: { type: "deterministic", actor_id: "diligence_qa_gate", reads: ["renderer_payload", "qualified_review_renderer_payload", "qualified_review_validation_manifest"], writes: DILIGENCE_QA_ARTIFACT_NAMES, next: "QUALIFIED_REVIEW_SUBMISSION", central_phase_id: "DILIGENCE_QA_COMPLETE", public_label: "Diligence-QA Complete" },
  QUALIFIED_REVIEW_SUBMISSION: { type: "public_runtime_save", actor_id: "qualified_review_system", reads: ["qualified_review_renderer_payload"], writes: ["qualified_review_submission"], next: "ASSEMBLY_ENGINE", central_phase_id: "QUALIFIED_REVIEW_SUBMISSION", public_label: "Qualified Review Submission" },
  ASSEMBLY_ENGINE: { type: "post_diligence_product_layer", actor_id: "assembly_engine", reads: ["qualified_review_submission"], writes: [], next: null, status: "NEXT_ACTIVE_BUILD_TARGET", central_phase_id: "ASSEMBLY_ENGINE", public_label: "Assembly Engine" },
  COMPLETE: { type: "terminal", actor_id: "diligence_qa_gate", reads: [], writes: [], next: null, central_phase_id: "DILIGENCE_QA_COMPLETE", public_label: "Diligence-QA Complete" }
});

export function getPipelineContract(internalJobId) {
  const contract = PIPELINE_CONTRACTS[internalJobId];
  if (!contract) throw new Error(`INVALID_PIPELINE_CONTRACT:${internalJobId || "missing"}`);
  return contract;
}

export function listPipelineContracts() {
  return Object.entries(PIPELINE_CONTRACTS).map(([internal_job_id, contract]) => ({ internal_job_id, contract }));
}

export const PIPELINE_CONTRACT_STATUS = Object.freeze({
  central_runtime_contract: "pipeline.contract",
  old_phase_contracts_dependency_removed_from_runtime: true,
  public_architecture_uses_central_phase_language: true,
  compatibility_internal_job_ids_retained: true
});
