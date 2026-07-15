import { CARTOGRAPHY_ARTIFACT_NAMES, COMPILER_ARTIFACT_NAMES, DOMAIN_GATE_RUNTIME_ARTIFACT_NAMES, PHASE7_DAP_BATCH_ARTIFACT_NAMES, SOURCE_DISCOVERY_CONTROL_ARTIFACT_NAMES, SOURCE_DISCOVERY_HANDOFF_ARTIFACT_NAMES, SOURCE_DISCOVERY_LEGAL_DOC_CONTROL_ARTIFACT_NAMES } from "./artifact-permissions.contract.js";
import { QUALIFIED_REVIEW_RUNTIME_WRITES } from "./phase13-runtime.contract.js";

export const CENTRAL_ARTIFACT_GROUPS = Object.freeze({
  SOURCE_DISCOVERY: [...DOMAIN_GATE_RUNTIME_ARTIFACT_NAMES, "deduped_url_manifest", ...SOURCE_DISCOVERY_CONTROL_ARTIFACT_NAMES, "source_family_index", ...SOURCE_DISCOVERY_LEGAL_DOC_CONTROL_ARTIFACT_NAMES, ...SOURCE_DISCOVERY_HANDOFF_ARTIFACT_NAMES],
  CARTOGRAPHY_INDEX: CARTOGRAPHY_ARTIFACT_NAMES,
  TARGET_PROFILE_REVIEW: ["target_profile"],
  TARGET_PROFILE_FORENSICS: ["target_profile_forensics"],
  ACTIVITY_PROFILE_REVIEW: ["feature_candidate_inventory", "target_feature_profile"],
  ACTIVITY_PROFILE_FORENSICS: ["target_feature_profile_forensics"],
  DATA_PROVENANCE_PROFILE: ["dap_registry_manifest", "dap_strategic_derivation_matrix", "dap_semantic_batch_route_manifest", ...PHASE7_DAP_BATCH_ARTIFACT_NAMES, "dap_semantic_batch_validation_manifest", "data_provenance_profile_semantic_batch_gate"],
  DATA_PROVENANCE_FORENSICS: ["dap_forensics_profile"],
  EXPOSURE_PROFILE: ["exposure_registry_route_plan", "exposure_registry_workpad_98", "exposure_registry_controlled_profile", "exposure_registry_triggered_profile", "exposure_registry_profile_forensics"],
  OPERATOR_CHALLENGE: ["challenge_gate"],
  COMPILER: COMPILER_ARTIFACT_NAMES,
  QUALIFIED_REVIEW: QUALIFIED_REVIEW_RUNTIME_WRITES,
  QUALIFIED_REVIEW_SUBMISSION: ["qualified_review_submission_request", "qualified_review_submission", "qr_final_value_ledger", "document_activation_manifest"],
  DILIGENCE_QA_COMPLETE: ["diligence_qa_completion_receipt"],
  ASSEMBLY_ENGINE: ["document_assembly_payload", "review_ready_draft_manifest", "document_assembly_validation_manifest"]
});

export const QR_SECTION_ARTIFACT_NAMES = Object.freeze([]);
export const QR_RUNTIME_ARTIFACT_NAMES = Object.freeze([...QUALIFIED_REVIEW_RUNTIME_WRITES, "qualified_review_draft", "qualified_review_submission_request"]);
export const REPORT_RENDERER_ARTIFACT_NAMES = Object.freeze(["renderer_payload"]);
export function artifactsForCentralPhase(centralPhaseId) { return CENTRAL_ARTIFACT_GROUPS[centralPhaseId] || []; }
export function isQualifiedReviewRuntimeArtifact(artifactName) { return QR_RUNTIME_ARTIFACT_NAMES.includes(artifactName); }
