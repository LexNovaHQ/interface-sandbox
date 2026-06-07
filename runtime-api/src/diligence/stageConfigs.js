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
    temperature: 0
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
  return Object.values(STAGE_CONFIGS).map((config) => ({ ...config }));
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
