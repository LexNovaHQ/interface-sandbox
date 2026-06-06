export const SCHEMA_PATHS = {
  sourceBundle: "/data/schemas/sourceBundle.schema.json",
  targetFeatureProfile: "/data/schemas/targetFeatureProfile.schema.json",
  legalStackReview: "/data/schemas/legalStackReview.schema.json",
  registryLedger: "/data/schemas/registryLedger.schema.json",
  operatorChallenge: "/data/schemas/operatorChallenge.schema.json",
  compilerOutput: "/data/schemas/compilerOutput.schema.json",
  diligenceReport: "/data/schemas/diligenceReport.schema.json",
  assemblyOutput: "/data/schemas/assemblyOutput.schema.json",
  vault: "/data/schemas/vault.schema.json",
  handoffEnvelope: "/data/schemas/handoffEnvelope.schema.json",
  diligenceRunState: "/data/schemas/diligenceRunState.schema.json",
  schemaManifest: "/data/schemas/schemaManifest.schema.json",
  deliveryState: "/data/schemas/deliveryState.schema.json",
  maintenanceRun: "/data/schemas/maintenanceRun.schema.json"
};

export const CANONICAL_SCHEMA_PATHS = {
  source_bundle: SCHEMA_PATHS.sourceBundle,
  target_feature_profile: SCHEMA_PATHS.targetFeatureProfile,
  legal_stack_review: SCHEMA_PATHS.legalStackReview,
  registry_evaluation_ledger: SCHEMA_PATHS.registryLedger,
  operator_challenge_gate: SCHEMA_PATHS.operatorChallenge,
  diligence_compiler_output: SCHEMA_PATHS.compilerOutput,
  final_diligence_report: SCHEMA_PATHS.diligenceReport,
  assembly_handoff_payload: SCHEMA_PATHS.assemblyOutput,
  vault_payload: SCHEMA_PATHS.vault,
  handoff_envelope: SCHEMA_PATHS.handoffEnvelope,
  diligence_run_state: SCHEMA_PATHS.diligenceRunState,
  schema_manifest: SCHEMA_PATHS.schemaManifest,
  delivery_state: SCHEMA_PATHS.deliveryState,
  maintenance_run: SCHEMA_PATHS.maintenanceRun
};
