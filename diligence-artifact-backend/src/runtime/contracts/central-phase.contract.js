const PHASE7_BATCH_OUTPUTS = Object.freeze(["dap_semantic_batch_exec_artifact", "dap_semantic_batch_lim_artifact", "dap_semantic_batch_party_artifact", "dap_semantic_batch_role_artifact", "dap_semantic_batch_flow_artifact", "dap_semantic_batch_obj_artifact", "dap_semantic_batch_auth_artifact", "dap_semantic_batch_ctrl_artifact", "dap_semantic_batch_contact_cm_artifact", "dap_semantic_batch_vend_artifact", "dap_semantic_batch_loc_artifact", "dap_semantic_batch_ret_artifact", "dap_semantic_batch_sec_artifact", "dap_semantic_batch_sens_artifact", "dap_semantic_batch_dom_artifact", "dap_semantic_batch_ready_artifact", "dap_semantic_batch_req_artifact"]);

export const CENTRAL_PHASES = Object.freeze([
  phase(1, "SOURCE_DISCOVERY", "Source Discovery", ["AGENT_1A_URL_MANIFEST", "AGENT_1B_EXTRACT", "M6_BUCKET_INDEX"], [], ["source_discovery_handoff"]),
  phase(2, "LEGAL_CARTOGRAPHY_INDEX", "Legal Cartography and Index", ["M9"], [], ["legal_cartography_index", "legal_signal_derivation_profile"]),
  phase(3, "TARGET_PROFILE_REVIEW", "Target Profile Review", ["M7_TARGET_PROFILE"], [], ["target_profile"]),
  phase(4, "TARGET_PROFILE_FORENSICS", "Target Profile Forensics", ["M7_TARGET_PROFILE_FORENSICS"], [], ["target_profile_forensics"]),
  phase(5, "ACTIVITY_PROFILE_REVIEW", "Activity Profile Review", ["M8_FEATURE_CANDIDATE_INVENTORY", "M8_TARGET_FEATURE_PROFILE"], [], ["feature_candidate_inventory", "target_feature_profile"]),
  phase(6, "ACTIVITY_PROFILE_FORENSICS", "Activity Profile Forensics", ["M8_TARGET_FEATURE_PROFILE_FORENSICS"], [], ["target_feature_profile_forensics"]),
  phase(7, "DATA_PROVENANCE_PROFILE", "Data Provenance Profile", ["DATA_PROVENANCE_PROFILE_LAYER4", "DATA_PROVENANCE_PROFILE_LAYER5"], ["M8_TARGET_FEATURE_PROFILE_FORENSICS"], ["data_privacy_navigation_index", ...PHASE7_BATCH_OUTPUTS, "dap_semantic_batch_validation_manifest", "data_provenance_profile_semantic_batch_gate"]),
  phase(8, "DATA_PROVENANCE_FORENSICS", "DAP Forensics", ["DATA_PROVENANCE_PROFILE_FORENSICS"], ["DATA_PROVENANCE_PROFILE_LAYER5"], ["dap_forensics_profile"]),
  phase(9, "EXPOSURE_PROFILE", "Exposure Profile", ["M11"], ["DATA_PROVENANCE_PROFILE_FORENSICS"], ["exposure_registry_route_plan", "exposure_registry_workpad_98", "exposure_registry_controlled_profile", "exposure_registry_triggered_profile", "exposure_registry_profile_forensics"]),
  phase(10, "OPERATOR_CHALLENGE", "Operator Challenge", ["M12"], ["M11"], ["challenge_gate"]),
  phase(11, "COMPILER", "Compiler", ["NORMALIZED_COMPILER", "NORMALIZED_REPORT_RENDERER"], ["M12"], ["normalized_report_manifest", "review_ready_section_handoff", "final_output_handoff", "renderer_payload"]),
  phase(12, "QUALIFIED_REVIEW", "Qualified Review", ["QUALIFIED_REVIEW"], ["NORMALIZED_COMPILER"], ["qr_artifact__entity_commercial", "qr_artifact__technology_infrastructure", "qr_artifact__ai_capability_product_behavior", "qr_artifact__dap_privacy_india_cyber", "qualified_review_renderer_payload", "qualified_review_validation_manifest"]),
  phase(13, "DILIGENCE_QA_COMPLETE", "Diligence-QA Complete", ["DILIGENCE_QA_COMPLETE"], ["COMPILER", "QUALIFIED_REVIEW"], ["diligence_qa_completion_receipt"]),
  phase(14, "QUALIFIED_REVIEW_SUBMISSION", "Qualified Review Submission", ["QUALIFIED_REVIEW_SUBMISSION"], ["QUALIFIED_REVIEW"], ["qualified_review_submission"]),
  phase(15, "ASSEMBLY_ENGINE", "Assembly Engine Phases", ["ASSEMBLY_ENGINE"], ["QUALIFIED_REVIEW_SUBMISSION"], [])
]);

export const CENTRAL_PHASE_BY_ID = Object.freeze(Object.fromEntries(CENTRAL_PHASES.map((row) => [row.central_phase_id, row])));
export const CENTRAL_PHASE_BY_INTERNAL_JOB = Object.freeze(CENTRAL_PHASES.reduce((acc, row) => { for (const jobId of row.internal_jobs) acc[jobId] = row; return acc; }, {}));
export function getCentralPhase(centralPhaseId) { const row = CENTRAL_PHASE_BY_ID[centralPhaseId]; if (!row) throw new Error(`INVALID_CENTRAL_PHASE:${centralPhaseId || "missing"}`); return row; }
export function centralPhaseForInternalJob(internalJobId) { return CENTRAL_PHASE_BY_INTERNAL_JOB[internalJobId] || null; }
export function centralPhaseStatusForInternalJob(internalJobId) { const row = centralPhaseForInternalJob(internalJobId); return row ? { central_phase_id: row.central_phase_id, central_phase_label: row.public_label, sequence: row.sequence, internal_job_id: internalJobId } : { central_phase_id: "UNKNOWN", central_phase_label: "Unknown", sequence: null, internal_job_id: internalJobId || "" }; }
function phase(sequence, central_phase_id, public_label, internal_jobs, execution_dependencies, terminal_outputs) { return Object.freeze({ sequence, central_phase_id, public_label, internal_jobs: Object.freeze(internal_jobs), execution_dependencies: Object.freeze(execution_dependencies), terminal_outputs: Object.freeze(terminal_outputs) }); }
