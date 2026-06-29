const MATERIAL_ARTIFACTS = Object.freeze([
  "source_discovery_handoff",
  "legal_cartography_index",
  "target_profile",
  "target_feature_profile",
  "data_provenance_profile",
  "exposure_registry_controlled_profile",
  "exposure_registry_triggered_profile",
  "challenge_gate"
]);

const FORENSIC_ARTIFACTS = Object.freeze([
  "target_profile_forensics",
  "target_feature_profile_forensics",
  "data_provenance_profile_forensics",
  "exposure_registry_route_plan",
  "exposure_registry_workpad_98",
  "exposure_registry_profile_forensics"
]);

const M11_ROW_FIELDS = Object.freeze(["Threat_ID", "target_match", "evaluation_status", "basis_proof", "control_exclusion_evaluation", "evidence_source_basis", "fp_mechanism", "Archetype", "Subcategory", "Surface", "authority_anchors", "Pain_Tier", "Pain_Depth", "Pain_Category", "Legal_Pain", "remediation", "review_route", "row_limitations"]);
const M11_CONTROLLED_STATUSES = new Set(["CONTROLLED_BY_VISIBLE_CONTROL", "CONTROLLED_BY_EXCLUSION", "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION"]);

export function compileFinalOutputHandoff({ run, artifacts }) {
  const compiledAt = new Date().toISOString();
  const missingArtifacts = collectMissingArtifacts(artifacts);
  const dynamicManifest = normalizeDynamicManifest(artifacts.compiler_dynamic_artifact_manifest);
  const m11Gate = validateM11MaterialGate(artifacts);
  const validation_status = resolveCompilerValidationStatus({ missingArtifacts, dynamicManifest, artifacts, m11Gate });

  const profiles_combined = buildProfilesCombined({ run, artifacts, compiledAt, missingArtifacts, validation_status, m11Gate });
  const forensics_combined = buildForensicsCombined({ run, artifacts, compiledAt, missingArtifacts, validation_status, dynamicManifest });

  return {
    profiles_combined,
    forensics_combined,
    final_output_handoff: {
      run_meta: buildRunMeta({ run, compiledAt }),
      validation_status,
      missing_artifacts: missingArtifacts,
      profile: profiles_combined.profiles,
      profiles: profiles_combined.profiles,
      forensics: forensics_combined.forensics,
      exposure_registry_controlled: artifacts.exposure_registry_controlled_profile || null,
      exposure_registry_triggered: artifacts.exposure_registry_triggered_profile || null,
      challenge_gate: artifacts.challenge_gate || null,
      artifact_manifest: buildArtifactManifest({ artifacts, missingArtifacts, dynamicManifest }),
      compiler_trace: buildCompilerTrace({ validation_status, missingArtifacts, dynamicManifest, artifacts, m11Gate }),
      next_branches: {
        renderer: { status: validation_status === "CONTROLLED_FAILURE" ? "BLOCKED" : "READY", input_artifacts: ["profiles_combined", "forensics_combined", "final_output_handoff"] },
        vault: { status: validation_status === "CONTROLLED_FAILURE" ? "BLOCKED" : "READY_FOR_MAPPING", input_artifacts: ["profiles_combined", "forensics_combined", "final_output_handoff"], boundary: "Assembly/vault intake must prefill only public-footprint-supported fields and route all unconfirmed internal/commercial facts to confirmation questions." }
      },
      terminal_checks: {
        required_artifacts_present: missingArtifacts.length === 0,
        no_placeholder_path_ids: !containsPlaceholderPathIds(artifacts),
        old_exposure_registry_profile_not_used: !Boolean(artifacts.exposure_registry_profile),
        split_exposure_profiles_present: Boolean(artifacts.exposure_registry_controlled_profile) && Boolean(artifacts.exposure_registry_triggered_profile),
        m11_material_gate_passed: m11Gate.status === "PASS",
        challenge_gate_present: Boolean(artifacts.challenge_gate),
        compiler_is_deterministic_assembler_only: true
      }
    }
  };
}

function buildProfilesCombined({ run, artifacts, compiledAt, missingArtifacts, validation_status, m11Gate }) {
  return { run_meta: buildRunMeta({ run, compiledAt }), validation_status, missing_artifacts: missingArtifacts.filter((row) => row.family === "material"), profiles: { source_discovery_handoff: artifacts.source_discovery_handoff || null, legal_cartography_index: artifacts.legal_cartography_index || null, target_profile: artifacts.target_profile || null, target_feature_profile: artifacts.target_feature_profile || null, data_provenance_profile: artifacts.data_provenance_profile || null, exposure_registry_controlled_profile: artifacts.exposure_registry_controlled_profile || null, exposure_registry_triggered_profile: artifacts.exposure_registry_triggered_profile || null, challenge_gate: artifacts.challenge_gate || null }, exposure_registry_controlled: artifacts.exposure_registry_controlled_profile || null, exposure_registry_triggered: artifacts.exposure_registry_triggered_profile || null, compiler_boundary: { deterministic_only: true, no_report_prose_generated: true, no_new_findings_created: true, no_vault_prefill_generated: true, old_exposure_registry_profile_retired: true, m11_material_gate: m11Gate } };
}

function buildForensicsCombined({ run, artifacts, compiledAt, missingArtifacts, validation_status, dynamicManifest }) {
  return { run_meta: buildRunMeta({ run, compiledAt }), validation_status, missing_artifacts: missingArtifacts.filter((row) => row.family === "forensic" || row.family === "dynamic_m11"), forensics: { target_profile_forensics: artifacts.target_profile_forensics || null, target_feature_profile_forensics: artifacts.target_feature_profile_forensics || null, data_provenance_profile_forensics: artifacts.data_provenance_profile_forensics || null, exposure_registry_route_plan: artifacts.exposure_registry_route_plan || null, m11_batch_artifacts: safeArray(artifacts.m11_batch_artifacts), m12_batch_validation_artifacts: safeArray(artifacts.m12_batch_validation_artifacts), exposure_registry_workpad_98: artifacts.exposure_registry_workpad_98 || null, exposure_registry_profile_forensics: artifacts.exposure_registry_profile_forensics || null }, dynamic_m11_artifact_manifest: dynamicManifest, compiler_boundary: { deterministic_only: true, no_row_re_evaluation: true, no_forensic_reconstruction: true, source_artifacts_preserved_without_mutation: true } };
}

function collectMissingArtifacts(artifacts) {
  const missing = [];
  for (const artifactName of MATERIAL_ARTIFACTS) if (!isPresent(artifacts[artifactName])) missing.push({ artifact_name: artifactName, family: "material", critical: true });
  for (const artifactName of FORENSIC_ARTIFACTS) if (!isPresent(artifacts[artifactName])) missing.push({ artifact_name: artifactName, family: "forensic", critical: true });
  const dynamicManifest = normalizeDynamicManifest(artifacts.compiler_dynamic_artifact_manifest);
  for (const artifactName of dynamicManifest.missing_batch_artifacts || []) missing.push({ artifact_name: artifactName, family: "dynamic_m11", critical: true });
  for (const artifactName of dynamicManifest.missing_batch_validation_artifacts || []) missing.push({ artifact_name: artifactName, family: "dynamic_m11", critical: true });
  return missing;
}

function resolveCompilerValidationStatus({ missingArtifacts, dynamicManifest, artifacts, m11Gate }) {
  if (missingArtifacts.some((row) => row.critical)) return "CONTROLLED_FAILURE";
  if (m11Gate.status === "CONTROLLED_FAILURE") return "CONTROLLED_FAILURE";
  const challengeStatus = normalizeStatus(artifacts.challenge_gate?.lock_status || artifacts.challenge_gate?.status || artifacts.challenge_gate?.operator_challenge_gate?.lock_status);
  if (!challengeStatus) return "CONTROLLED_FAILURE";
  if (challengeStatus === "CONTROLLED_FAILURE" || challengeStatus === "REPAIR_REQUIRED") return "CONTROLLED_FAILURE";
  if (challengeStatus === "LOCKED_WITH_LIMITATIONS" || challengeStatus === "PASS_WITH_LIMITATION") return "LOCKED_WITH_LIMITATIONS";
  if (dynamicManifest.batch_count !== dynamicManifest.loaded_batch_artifacts || dynamicManifest.batch_count !== dynamicManifest.loaded_batch_validation_artifacts) return "CONTROLLED_FAILURE";
  if (hasLimitationSignal(artifacts)) return "LOCKED_WITH_LIMITATIONS";
  return "LOCKED";
}

function validateM11MaterialGate(artifacts = {}) {
  const failures = [];
  const controlled = unwrap(artifacts.exposure_registry_controlled_profile, "exposure_registry_controlled_profile");
  const triggered = unwrap(artifacts.exposure_registry_triggered_profile, "exposure_registry_triggered_profile");
  const workpad = unwrap(artifacts.exposure_registry_workpad_98, "exposure_registry_workpad_98");
  const controlledRows = safeArray(controlled.controlled_rows);
  const triggeredRows = safeArray(triggered.triggered_rows);
  const workpadRows = safeArray(workpad.registry_rows);
  const controlledIds = new Set();
  const triggeredIds = new Set();

  for (const row of controlledRows) {
    const id = row.Threat_ID || "";
    if (!id) failures.push("controlled row missing Threat_ID");
    if (controlledIds.has(id)) failures.push(`duplicate controlled Threat_ID:${id}`);
    controlledIds.add(id);
    const status = String(row.evaluation_status || row.final_material_status || "").toUpperCase();
    if (status === "CONTROLLED") failures.push(`plain CONTROLLED forbidden:${id}`);
    if (!M11_CONTROLLED_STATUSES.has(status)) failures.push(`bad controlled status:${id}:${status || "blank"}`);
    checkFields(row, `controlled:${id || "unknown"}`, failures);
  }
  for (const row of triggeredRows) {
    const id = row.Threat_ID || "";
    if (!id) failures.push("triggered row missing Threat_ID");
    if (triggeredIds.has(id)) failures.push(`duplicate triggered Threat_ID:${id}`);
    triggeredIds.add(id);
    const status = String(row.evaluation_status || row.final_material_status || "").toUpperCase();
    if (status !== "TRIGGERED") failures.push(`bad triggered status:${id}:${status || "blank"}`);
    checkFields(row, `triggered:${id || "unknown"}`, failures);
  }
  for (const id of controlledIds) if (triggeredIds.has(id)) failures.push(`Threat_ID in both profiles:${id}`);
  for (const row of workpadRows) if (String(row.final_material_status || "").toUpperCase() === "CONTROLLED") failures.push(`plain CONTROLLED in workpad:${row.Threat_ID || "unknown"}`);
  return { status: failures.length ? "CONTROLLED_FAILURE" : "PASS", failures, controlled_rows: controlledRows.length, triggered_rows: triggeredRows.length, workpad_rows: workpadRows.length, controlled_statuses: [...M11_CONTROLLED_STATUSES], triggered_status: "TRIGGERED" };
}

function checkFields(row, label, failures) { for (const field of M11_ROW_FIELDS) if (!(field in row)) failures.push(`${label} missing ${field}`); }
function buildRunMeta({ run, compiledAt }) { return { run_id: run.run_id, target: run.target || null, target_url: run.root_url || run.target || null, source_mode: run.source_mode || null, created_at: run.created_at || null, compiled_at: compiledAt, generated_by: "compiler" }; }
function buildArtifactManifest({ artifacts, missingArtifacts, dynamicManifest }) { const staticArtifacts = [...MATERIAL_ARTIFACTS, ...FORENSIC_ARTIFACTS].map((artifactName) => ({ artifact_name: artifactName, present: isPresent(artifacts[artifactName]), family: MATERIAL_ARTIFACTS.includes(artifactName) ? "material" : "forensic" })); return { static_artifacts: staticArtifacts, dynamic_m11_artifacts: dynamicManifest, missing_artifacts: missingArtifacts, compiled_outputs: ["profiles_combined", "forensics_combined", "final_output_handoff"] }; }
function buildCompilerTrace({ validation_status, missingArtifacts, dynamicManifest, artifacts, m11Gate }) { return { compiler_version: "deterministic_profiles_forensics_compiler_v2", validation_status, deterministic_only: true, no_report_prose_generated: true, no_vault_mapping_generated: true, no_new_findings_created: true, missing_artifact_count: missingArtifacts.length, dynamic_batch_count: dynamicManifest.batch_count, loaded_batch_artifact_count: dynamicManifest.loaded_batch_artifacts, loaded_batch_validation_artifact_count: dynamicManifest.loaded_batch_validation_artifacts, m11_material_gate: m11Gate, profile_keys: MATERIAL_ARTIFACTS.filter((artifactName) => isPresent(artifacts[artifactName])), forensic_keys: FORENSIC_ARTIFACTS.filter((artifactName) => isPresent(artifacts[artifactName])), warnings: buildCompilerWarnings({ missingArtifacts, dynamicManifest, artifacts, m11Gate }) }; }
function buildCompilerWarnings({ missingArtifacts, dynamicManifest, artifacts, m11Gate }) { const warnings = []; if (missingArtifacts.length) warnings.push(`MISSING_ARTIFACTS:${missingArtifacts.map((row) => row.artifact_name).join(",")}`); if (artifacts.exposure_registry_profile) warnings.push("LEGACY_EXPOSURE_REGISTRY_PROFILE_PRESENT_BUT_NOT_USED"); if (containsPlaceholderPathIds(artifacts)) warnings.push("PLACEHOLDER_PATH_ID_PRESENT"); if (dynamicManifest.batch_count !== dynamicManifest.loaded_batch_artifacts) warnings.push("DYNAMIC_M11_BATCH_ARTIFACT_COUNT_MISMATCH"); if (dynamicManifest.batch_count !== dynamicManifest.loaded_batch_validation_artifacts) warnings.push("DYNAMIC_M12_BATCH_VALIDATION_COUNT_MISMATCH"); for (const failure of safeArray(m11Gate.failures)) warnings.push(`M11_MATERIAL_GATE:${failure}`); return warnings; }
function normalizeDynamicManifest(value) { const manifest = isPlainObject(value) ? value : {}; return { batch_count: Number(manifest.batch_count || 0), loaded_batch_artifacts: Number(manifest.loaded_batch_artifacts || 0), loaded_batch_validation_artifacts: Number(manifest.loaded_batch_validation_artifacts || 0), batch_ids: safeArray(manifest.batch_ids), missing_batch_artifacts: safeArray(manifest.missing_batch_artifacts), missing_batch_validation_artifacts: safeArray(manifest.missing_batch_validation_artifacts) }; }
function normalizeStatus(value) { const status = String(value || "").trim(); if (status === "PASS") return "LOCKED"; if (status === "PASS_WITH_LIMITATION") return "LOCKED_WITH_LIMITATIONS"; if (["LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE"].includes(status)) return status; return ""; }
function isPresent(value) { if (!value) return false; if (Array.isArray(value)) return value.length > 0; if (typeof value === "object") return Object.keys(value).length > 0; return true; }
function safeArray(value) { return Array.isArray(value) ? value : []; }
function isPlainObject(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function unwrap(value, key) { return value?.[key] || value?.artifact?.[key] || value || {}; }
function hasLimitationSignal(value) { const raw = JSON.stringify(value || {}).toUpperCase(); return /LOCKED_WITH_LIMITATIONS|PASS_WITH_LIMITATION|CONTROLLED_FAILURE|REPAIR_REQUIRED|LIMITATION|NOT_PUBLIC|ACCESS_FAILED|GATED|INSUFFICIENT|MISSING/.test(raw); }
function containsPlaceholderPathIds(value) { return JSON.stringify(value || {}).toLowerCase().includes("target_profile.tp_id_001"); }
