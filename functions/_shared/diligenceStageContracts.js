export const DILIGENCE_STAGE_ORDER = Object.freeze([
  "evidence_refiner",
  "target_feature_profile",
  "legal_stack_review",
  "registry_ledger_evaluation",
  "operator_challenge",
  "final_compiler"
]);

export const DILIGENCE_STAGE_CONTRACTS = Object.freeze({
  evidence_refiner: Object.freeze({
    stage_id: "evidence_refiner",
    node: "0.5",
    label: "Evidence Refiner",
    prompt_path: "docs/prompts/diligence-v2/01_EVIDENCE_REFINER.prompt.md",
    owner: "pages_function_gemini",
    input_owner: "source_collector",
    output_schema_key: "source_bundle",
    output_schema_path: "/data/schemas/sourceBundle.schema.json",
    model_execution_allowed: true,
    runtime_status: "not_implemented",
    notes: [
      "Turns raw source footprint into admitted source_bundle evidence.",
      "Discovery/search material is not evidence unless admitted under the stage rules."
    ],
    forbidden_outputs: [
      "findings",
      "vault_prefill_suggestions",
      "assembly_handoff",
      "handoff_envelope"
    ]
  }),
  target_feature_profile: Object.freeze({
    stage_id: "target_feature_profile",
    node: "1",
    label: "Target + Feature Profile",
    prompt_path: "docs/prompts/diligence-v2/02_TARGET_FEATURE_PROFILE.prompt.md",
    owner: "pages_function_gemini",
    input_owner: "evidence_refiner",
    output_schema_key: "target_feature_profile",
    output_schema_path: "/data/schemas/targetFeatureProfile.schema.json",
    model_execution_allowed: true,
    runtime_status: "not_implemented",
    notes: [
      "Maps target profile, primary product, features, archetypes, and surfaces from admitted evidence only."
    ],
    forbidden_outputs: [
      "legal_stack_review",
      "registry_evaluation_ledger",
      "findings",
      "vault_prefill_suggestions",
      "assembly_handoff",
      "handoff_envelope"
    ]
  }),
  legal_stack_review: Object.freeze({
    stage_id: "legal_stack_review",
    node: "2",
    label: "Legal Stack + Redline",
    prompt_path: "docs/prompts/diligence-v2/03_LEGAL_STACK_REVIEW.prompt.md",
    owner: "pages_function_gemini",
    input_owner: "target_feature_profile",
    output_schema_key: "legal_stack_review",
    output_schema_path: "/data/schemas/legalStackReview.schema.json",
    model_execution_allowed: true,
    runtime_status: "not_implemented",
    notes: [
      "Reviews visible public ToS, Privacy Policy, DPA, AUP, and SLA surfaces.",
      "Uses public-footprint language and does not infer private documents."
    ],
    forbidden_outputs: [
      "registry_evaluation_ledger",
      "findings",
      "vault_prefill_suggestions",
      "assembly_handoff",
      "handoff_envelope"
    ]
  }),
  registry_ledger_evaluation: Object.freeze({
    stage_id: "registry_ledger_evaluation",
    node: "3",
    label: "Registry Ledger Evaluation",
    prompt_path: "docs/prompts/diligence-v2/04_REGISTRY_LEDGER_EVALUATION.prompt.md",
    owner: "pages_function_gemini_batched",
    input_owner: "legal_stack_review",
    output_schema_key: "registry_evaluation_ledger",
    output_schema_path: "/data/schemas/registryLedger.schema.json",
    model_execution_allowed: true,
    requires_batching: true,
    requires_merge_after_stage: true,
    runtime_status: "not_implemented",
    notes: [
      "Evaluates supplied registry batch rows exactly once each.",
      "The backend/orchestrator must merge batches and validate full registry count before Operator Challenge."
    ],
    forbidden_outputs: [
      "operator_challenge_gate",
      "findings",
      "vault_prefill_suggestions",
      "assembly_handoff",
      "handoff_envelope"
    ]
  }),
  operator_challenge: Object.freeze({
    stage_id: "operator_challenge",
    node: "4",
    label: "Operator Challenge",
    prompt_path: "docs/prompts/diligence-v2/05_OPERATOR_CHALLENGE.prompt.md",
    owner: "pages_function_gemini",
    input_owner: "merged_registry_ledger",
    output_schema_key: "operator_challenge_gate",
    output_schema_path: "/data/schemas/operatorChallenge.schema.json",
    model_execution_allowed: true,
    requires_merged_ledger: true,
    requires_correction_merge_after_stage: true,
    runtime_status: "not_implemented",
    notes: [
      "Challenges the completed merged registry ledger only.",
      "Does not re-evaluate the registry from scratch and does not invent missing Hunter logic."
    ],
    forbidden_outputs: [
      "findings",
      "vault_prefill_suggestions",
      "assembly_handoff",
      "handoff_envelope"
    ]
  }),
  final_compiler: Object.freeze({
    stage_id: "final_compiler",
    node: "5",
    label: "Final Compiler",
    prompt_path: "docs/prompts/diligence-v2/06_FINAL_COMPILER.prompt.md",
    owner: "pages_function_gemini",
    input_owner: "post_challenge_registry_ledger",
    output_schema_key: "diligence_compiler_output",
    output_schema_path: "/data/schemas/compilerOutput.schema.json",
    model_execution_allowed: true,
    runtime_status: "not_implemented",
    notes: [
      "Compiles report/compiler output only.",
      "Node 5B owns vault_prefill_suggestions, assembly_handoff, handoff_envelope, and Firestore writes."
    ],
    forbidden_outputs: [
      "vault_prefill_suggestions",
      "assembly_handoff",
      "handoff_envelope",
      "firestore_writes"
    ]
  })
});

export function listDiligenceStageContracts() {
  return DILIGENCE_STAGE_ORDER.map((stageId) => DILIGENCE_STAGE_CONTRACTS[stageId]);
}

export function getDiligenceStageContract(stageId) {
  if (!stageId || typeof stageId !== "string") return null;
  return DILIGENCE_STAGE_CONTRACTS[stageId] ?? null;
}

export function assertKnownDiligenceStage(stageId) {
  const contract = getDiligenceStageContract(stageId);

  if (!contract) {
    const knownStages = DILIGENCE_STAGE_ORDER.join(", ");
    throw new Error(`Unknown Diligence stage "${stageId}". Known stages: ${knownStages}`);
  }

  return contract;
}

export function getDiligenceRuntimeBoundary() {
  return Object.freeze({
    runtime_status: "contract_skeleton_only",
    source_of_truth: "docs/contracts/DILIGENCE_RUNTIME_WIRING_PLAN_v1.md",
    prompt_index: "docs/prompts/diligence-v2/PROMPT_INDEX.md",
    node_5b_contract: "docs/contracts/NODE_5B_DETERMINISTIC_ASSEMBLER_CONTRACT_v1.md",
    model_key_exposure: "server_only",
    browser_model_execution_allowed: false,
    node_5_forbidden_outputs: [
      "vault_prefill_suggestions",
      "assembly_handoff",
      "handoff_envelope"
    ],
    node_5b_model_execution_allowed: false,
    canonical_source_modes: ["url", "text", "url_plus_text"]
  });
}
