export const CENTRAL_PHASES = Object.freeze([
  {
    sequence: 1,
    central_phase_id: "SOURCE_DISCOVERY",
    public_label: "Source Discovery",
    internal_jobs: ["AGENT_1A_URL_MANIFEST", "AGENT_1B_EXTRACT", "M6_BUCKET_INDEX"],
    execution_dependencies: [],
    terminal_outputs: ["source_discovery_handoff"]
  },
  {
    sequence: 2,
    central_phase_id: "LEGAL_CARTOGRAPHY_INDEX",
    public_label: "Legal Cartography and Index",
    internal_jobs: ["M9"],
    execution_dependencies: [],
    terminal_outputs: ["legal_cartography_index"]
  },
  {
    sequence: 3,
    central_phase_id: "TARGET_PROFILE_REVIEW",
    public_label: "Target Profile Review",
    internal_jobs: ["M7_TARGET_PROFILE"],
    execution_dependencies: [],
    terminal_outputs: ["target_profile"]
  },
  {
    sequence: 4,
    central_phase_id: "TARGET_PROFILE_FORENSICS",
    public_label: "Target Profile Forensics",
    internal_jobs: ["M7_TARGET_PROFILE_FORENSICS"],
    execution_dependencies: [],
    terminal_outputs: ["target_profile_forensics"]
  },
  {
    sequence: 5,
    central_phase_id: "ACTIVITY_PROFILE_REVIEW",
    public_label: "Activity Profile Review",
    internal_jobs: ["M8_FEATURE_CANDIDATE_INVENTORY", "M8_TARGET_FEATURE_PROFILE"],
    execution_dependencies: [],
    terminal_outputs: ["feature_candidate_inventory", "target_feature_profile"]
  },
  {
    sequence: 6,
    central_phase_id: "ACTIVITY_PROFILE_FORENSICS",
    public_label: "Activity Profile Forensics",
    internal_jobs: ["M8_TARGET_FEATURE_PROFILE_FORENSICS"],
    execution_dependencies: [],
    terminal_outputs: ["target_feature_profile_forensics"]
  },
  {
    sequence: 7,
    central_phase_id: "DATA_PROVENANCE_PROFILE",
    public_label: "Data Provenance Profile",
    internal_jobs: ["M10", "AGENT_4B_EXTENDED_DAP_INDIA_READINESS", "AGENT_4C_INTEGRATED_DAP_REPORT"],
    execution_dependencies: ["M10_FORENSICS"],
    terminal_outputs: ["data_provenance_profile", "extended_dap_india_readiness_profile", "integrated_dap_report"]
  },
  {
    sequence: 8,
    central_phase_id: "DATA_PROVENANCE_FORENSICS",
    public_label: "Data Provenance Forensics",
    internal_jobs: ["M10_FORENSICS"],
    execution_dependencies: ["M10"],
    terminal_outputs: ["data_provenance_profile_forensics"]
  },
  {
    sequence: 9,
    central_phase_id: "EXPOSURE_PROFILE",
    public_label: "Exposure Profile",
    internal_jobs: ["M11"],
    execution_dependencies: [],
    terminal_outputs: ["exposure_registry_route_plan", "exposure_registry_workpad_98", "exposure_registry_controlled_profile", "exposure_registry_triggered_profile", "exposure_registry_profile_forensics"]
  },
  {
    sequence: 10,
    central_phase_id: "OPERATOR_CHALLENGE",
    public_label: "Operator Challenge",
    internal_jobs: ["M12"],
    execution_dependencies: [],
    terminal_outputs: ["challenge_gate"]
  },
  {
    sequence: 11,
    central_phase_id: "COMPILER",
    public_label: "Compiler",
    internal_jobs: ["NORMALIZED_COMPILER", "NORMALIZED_REPORT_RENDERER"],
    execution_dependencies: [],
    terminal_outputs: ["normalized_report_manifest", "review_ready_section_handoff", "final_output_handoff", "renderer_payload"]
  },
  {
    sequence: 12,
    central_phase_id: "QUALIFIED_REVIEW",
    public_label: "Qualified Review",
    internal_jobs: ["QUALIFIED_REVIEW"],
    execution_dependencies: ["NORMALIZED_COMPILER"],
    terminal_outputs: ["qr_artifact__entity_commercial", "qr_artifact__technology_infrastructure", "qr_artifact__ai_capability_product_behavior", "qr_artifact__dap_privacy_india_cyber", "qualified_review_renderer_payload", "qualified_review_validation_manifest"]
  },
  {
    sequence: 13,
    central_phase_id: "DILIGENCE_QA_COMPLETE",
    public_label: "Diligence-QA Complete",
    internal_jobs: ["DILIGENCE_QA_COMPLETE"],
    execution_dependencies: ["COMPILER", "QUALIFIED_REVIEW"],
    terminal_outputs: ["diligence_qa_completion_receipt"]
  },
  {
    sequence: 14,
    central_phase_id: "QUALIFIED_REVIEW_SUBMISSION",
    public_label: "Qualified Review Submission",
    internal_jobs: ["QUALIFIED_REVIEW_SUBMISSION"],
    execution_dependencies: ["QUALIFIED_REVIEW"],
    terminal_outputs: ["qualified_review_submission"]
  },
  {
    sequence: 15,
    central_phase_id: "ASSEMBLY_ENGINE",
    public_label: "Assembly Engine Phases",
    internal_jobs: ["ASSEMBLY_ENGINE"],
    execution_dependencies: ["QUALIFIED_REVIEW_SUBMISSION"],
    terminal_outputs: []
  }
]);

export const CENTRAL_PHASE_BY_ID = Object.freeze(Object.fromEntries(CENTRAL_PHASES.map((phase) => [phase.central_phase_id, phase])));

export const CENTRAL_PHASE_BY_INTERNAL_JOB = Object.freeze(
  CENTRAL_PHASES.reduce((acc, phase) => {
    for (const jobId of phase.internal_jobs) acc[jobId] = phase;
    return acc;
  }, {})
);

export function getCentralPhase(centralPhaseId) {
  const phase = CENTRAL_PHASE_BY_ID[centralPhaseId];
  if (!phase) throw new Error(`INVALID_CENTRAL_PHASE:${centralPhaseId || "missing"}`);
  return phase;
}

export function centralPhaseForInternalJob(internalJobId) {
  return CENTRAL_PHASE_BY_INTERNAL_JOB[internalJobId] || null;
}

export function centralPhaseStatusForInternalJob(internalJobId) {
  const phase = centralPhaseForInternalJob(internalJobId);
  return phase ? { central_phase_id: phase.central_phase_id, central_phase_label: phase.public_label, sequence: phase.sequence, internal_job_id: internalJobId } : { central_phase_id: "UNKNOWN", central_phase_label: "Unknown", sequence: null, internal_job_id: internalJobId || "" };
}
