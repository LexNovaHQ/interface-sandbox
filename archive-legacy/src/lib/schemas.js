export const SCHEMA_PATHS = {
  sourceBundle: "/data/schemas/sourceBundle.schema.json",
  companyProfile: "/data/schemas/companyProfile.schema.json",
  targetFeatureProfile: "/data/schemas/targetFeatureProfile.schema.json",
  stage6Review: "/data/schemas/stage6Review.schema.json",
  registryLedger: "/data/schemas/registryLedger.schema.json",
  operatorChallenge: "/data/schemas/operatorChallenge.schema.json",
  compilerOutput: "/data/schemas/compilerOutput.schema.json",
  diligenceReport: "/data/schemas/diligenceReport.schema.json",
  assemblyOutput: "/data/schemas/assemblyOutput.schema.json",
  functionalIntakeVault: "/data/schemas/vault.schema.json",
  handoffEnvelope: "/data/schemas/handoffEnvelope.schema.json",
  diligenceRunState: "/data/schemas/diligenceRunState.schema.json",
  schemaManifest: "/data/schemas/schemaManifest.schema.json",
  deliveryState: "/data/schemas/deliveryState.schema.json",
  maintenanceRun: "/data/schemas/maintenanceRun.schema.json"
};

export const CANONICAL_SCHEMA_PATHS = {
  source_bundle: SCHEMA_PATHS.sourceBundle,
  company_profile: SCHEMA_PATHS.companyProfile,
  target_feature_profile: SCHEMA_PATHS.targetFeatureProfile,
  stage6_review: SCHEMA_PATHS.stage6Review,
  stage6a_legal_document_cartography: SCHEMA_PATHS.stage6Review,
  stage6b_data_provenance: SCHEMA_PATHS.stage6Review,
  stage6_integrated_handoff: SCHEMA_PATHS.stage6Review,
  registry_evaluation_ledger: SCHEMA_PATHS.registryLedger,
  operator_challenge_gate: SCHEMA_PATHS.operatorChallenge,
  diligence_compiler_output: SCHEMA_PATHS.compilerOutput,
  final_diligence_report: SCHEMA_PATHS.diligenceReport,
  assembly_handoff_payload: SCHEMA_PATHS.assemblyOutput,
  functional_assembly_intake_vault: SCHEMA_PATHS.functionalIntakeVault,
  vault_payload: SCHEMA_PATHS.functionalIntakeVault,
  handoff_envelope: SCHEMA_PATHS.handoffEnvelope,
  diligence_run_state: SCHEMA_PATHS.diligenceRunState,
  schema_manifest: SCHEMA_PATHS.schemaManifest,
  delivery_state: SCHEMA_PATHS.deliveryState,
  maintenance_run: SCHEMA_PATHS.maintenanceRun
};
