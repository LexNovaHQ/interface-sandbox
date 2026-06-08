const LEGAL_STACK_EMBEDDED_ARTIFACT_INSTRUCTION = `
LEGAL STACK EMBEDDED ARTIFACT INSTRUCTION:
Before marking DPA, AUP, or SLA as ABSENT, Gemini must inspect the admitted legal/governance text in source_bundle.evidence_buffer and source_bundle.artifact_inventory for embedded annexures, schedules, addenda, exhibits, appendices, or clearly labelled sections.
Do not rely only on standalone URLs, page titles, artifact class, or source labels.
If admitted Terms of Service, Privacy Policy, or another admitted legal/governance artifact contains labels such as Annexure, Schedule, Exhibit, Appendix, Addendum, Data Processing Addendum, Data Processing Agreement, DPA, Service Level Agreement, SLA, Support Services, Acceptable Use Policy, AUP, Prohibited Use, Usage Restrictions, or Sub-processors, treat the corresponding DPA/AUP/SLA as existing if usable text is present.
For an embedded artifact, set exists=true, document_url to the containing admitted source URL, evidence_status=INGESTED if usable text is available or INSUFFICIENT if partial/ambiguous, and record embedded_annexure, embedded_addendum, or embedded_section_only in legal_stack_assessment.
Do not mark an embedded DPA/SLA/AUP absent merely because there is no separate standalone URL.
This is a Gemini reasoning obligation. Do not call external tools, browse, fetch, or use deterministic scanners.
`;

const STAGE_CONFIGS = Object.freeze({
  evidence_refiner: {
    stage_id: "evidence_refiner",
    prompt_stage_id: "evidence_refiner",
    output_key: "source_bundle",
    output_schema_key: "sourceBundle",
    pool: "json",
    max_output_tokens: 8192,
    timeout_ms: 45000,
    temperature: 0
  },
  target_feature_profile: {
    stage_id: "target_feature_profile",
    prompt_stage_id: "target_feature_profile",
    output_key: "target_feature_profile",
    output_schema_key: "targetFeatureProfile",
    pool: "reasoning",
    max_output_tokens: 8192,
    timeout_ms: 60000,
    temperature: 0
  },
  legal_stack_review: {
    stage_id: "legal_stack_review",
    prompt_stage_id: "legal_stack_review",
    output_key: "legal_stack_review",
    output_schema_key: "legalStackReview",
    pool: "reasoning",
    max_output_tokens: 8192,
    timeout_ms: 60000,
    temperature: 0,
    runtime_instruction: LEGAL_STACK_EMBEDDED_ARTIFACT_INSTRUCTION.trim()
  },
  registry_ledger_evaluation: {
    stage_id: "registry_ledger_evaluation",
    prompt_stage_id: "registry_ledger_evaluation",
    output_key: "registry_ledger",
    output_schema_key: "registryLedger",
    pool: "registry",
    max_output_tokens: 16384,
    timeout_ms: 90000,
    temperature: 0
  },
  operator_challenge: {
    stage_id: "operator_challenge",
    prompt_stage_id: "operator_challenge",
    output_key: "operator_challenge",
    output_schema_key: "operatorChallenge",
    pool: "reasoning",
    max_output_tokens: 8192,
    timeout_ms: 60000,
    temperature: 0
  },
  final_compiler: {
    stage_id: "final_compiler",
    prompt_stage_id: "final_compiler",
    output_key: "compiler_output",
    output_schema_key: "compilerOutput",
    pool: "final",
    max_output_tokens: 16384,
    timeout_ms: 90000,
    temperature: 0
  }
});

export function listDiligenceStageConfigs() {
  return Object.values(STAGE_CONFIGS).map((config) => {
    const publicConfig = { ...config };
    if (publicConfig.runtime_instruction) {
      publicConfig.runtime_instruction_configured = true;
      delete publicConfig.runtime_instruction;
    }
    return publicConfig;
  });
}

export function getDiligenceStageConfig(stageId) {
  const normalized = String(stageId || "").trim();
  const config = STAGE_CONFIGS[normalized];

  if (!config) {
    throw new Error(`Unknown diligence stage: ${stageId}`);
  }

  return { ...config };
}

export function getDiligenceStageIds() {
  return Object.keys(STAGE_CONFIGS);
}
