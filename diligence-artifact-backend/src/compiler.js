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

const CRITICAL_ARTIFACTS = Object.freeze([
  ...MATERIAL_ARTIFACTS,
  ...FORENSIC_ARTIFACTS
]);

export function compileFinalOutputHandoff({ run, artifacts }) {
  const compiledAt = new Date().toISOString();
  const missingArtifacts = collectMissingArtifacts(artifacts);
  const dynamicManifest = normalizeDynamicManifest(artifacts.compiler_dynamic_artifact_manifest);
  const validation_status = resolveCompilerValidationStatus({ missingArtifacts, dynamicManifest, artifacts });

  const profiles_combined = buildProfilesCombined({ run, artifacts, compiledAt, missingArtifacts, validation_status });
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
      compiler_trace: buildCompilerTrace({ validation_status, missingArtifacts, dynamicManifest, artifacts }),
      next_branches: {
        renderer: {
          status: validation_status === "CONTROLLED_FAILURE" ? "BLOCKED" : "READY",
          input_artifacts: ["profiles_combined", "forensics_combined", "final_output_handoff"]
        },
        vault: {
          status: validation_status === "CONTROLLED_FAILURE" ? "BLOCKED" : "READY_FOR_MAPPING",
          input_artifacts: ["profiles_combined", "forensics_combined", "final_output_handoff"],
          boundary: "Assembly/vault intake must prefill only public-footprint-supported fields and route all unconfirmed internal/commercial facts to confirmation questions."
        }
      },
      terminal_checks: {
        required_artifacts_present: missingArtifacts.length === 0,
        no_placeholder_path_ids: !containsPlaceholderPathIds(artifacts),
        old_exposure_registry_profile_not_used: !Boolean(artifacts.exposure_registry_profile),
        split_exposure_profiles_present: Boolean(artifacts.exposure_registry_controlled_profile) && Boolean(artifacts.exposure_registry_triggered_profile),
        challenge_gate_present: Boolean(artifacts.challenge_gate),
        compiler_is_deterministic_assembler_only: true
      }
    }
  };
}

function buildProfilesCombined({ run, artifacts, compiledAt, missingArtifacts, validation_status }) {
  return {
    profiles_combined: {
      run_meta: buildRunMeta({ run, compiledAt }),
      validation_status,
      missing_artifacts: missingArtifacts.filter((row) => row.family === "material"),
      profiles: {
        source_discovery_handoff: artifacts.source_discovery_handoff || null,
        legal_cartography_index: artifacts.legal_cartography_index || null,
        target_profile: artifacts.target_profile || null,
        target_feature_profile: artifacts.target_feature_profile || null,
        data_provenance_profile: artifacts.data_provenance_profile || null,
        exposure_registry_controlled_profile: artifacts.exposure_registry_controlled_profile || null,
        exposure_registry_triggered_profile: artifacts.exposure_registry_triggered_profile || null,
        challenge_gate: artifacts.challenge_gate || null
      },
      exposure_registry_controlled: artifacts.exposure_registry_controlled_profile || null,
      exposure_registry_triggered: artifacts.exposure_registry_triggered_profile || null,
      compiler_boundary: {
        deterministic_only: true,
        no_report_prose_generated: true,
        no_new_findings_created: true,
        no_vault_prefill_generated: true,
        old_exposure_registry_profile_retired: true
      }
    }
  };
}

function buildForensicsCombined({ run, artifacts, compiledAt, missingArtifacts, validation_status, dynamicManifest }) {
  return {
    forensics_combined: {
      run_meta: buildRunMeta({ run, compiledAt }),
      validation_status,
      missing_artifacts: missingArtifacts.filter((row) => row.family === "forensic" || row.family === "dynamic_m11"),
      forensics: {
        target_profile_forensics: artifacts.target_profile_forensics || null,
        target_feature_profile_forensics: artifacts.target_feature_profile_forensics || null,
        data_provenance_profile_forensics: artifacts.data_provenance_profile_forensics || null,
        exposure_registry_route_plan: artifacts.exposure_registry_route_plan || null,
        m11_batch_artifacts: safeArray(artifacts.m11_batch_artifacts),
        m12_batch_validation_artifacts: safeArray(artifacts.m12_batch_validation_artifacts),
        exposure_registry_workpad_98: artifacts.exposure_registry_workpad_98 || null,
        exposure_registry_profile_forensics: artifacts.exposure_registry_profile_forensics || null
      },
      dynamic_m11_artifact_manifest: dynamicManifest,
      compiler_boundary: {
        deterministic_only: true,
        no_row_re_evaluation: true,
        no_forensic_reconstruction: true,
        source_artifacts_preserved_without_mutation: true
      }
    }
  };
}

function collectMissingArtifacts(artifacts) {
  const missing = [];
  for (const artifactName of MATERIAL_ARTIFACTS) {
    if (!isPresent(artifacts[artifactName])) missing.push({ artifact_name: artifactName, family: "material", critical: true });
  }
  for (const artifactName of FORENSIC_ARTIFACTS) {
    if (!isPresent(artifacts[artifactName])) missing.push({ artifact_name: artifactName, family: "forensic", critical: true });
  }

  const dynamicManifest = normalizeDynamicManifest(artifacts.compiler_dynamic_artifact_manifest);
  for (const artifactName of dynamicManifest.missing_batch_artifacts || []) {
    missing.push({ artifact_name: artifactName, family: "dynamic_m11", critical: true });
  }
  for (const artifactName of dynamicManifest.missing_batch_validation_artifacts || []) {
    missing.push({ artifact_name: artifactName, family: "dynamic_m11", critical: true });
  }
  return missing;
}

function resolveCompilerValidationStatus({ missingArtifacts, dynamicManifest, artifacts }) {
  if (missingArtifacts.some((row) => row.critical)) return "CONTROLLED_FAILURE";
  const challengeStatus = normalizeStatus(artifacts.challenge_gate?.lock_status || artifacts.challenge_gate?.status || artifacts.challenge_gate?.operator_challenge_gate?.lock_status);
  if (challengeStatus === "CONTROLLED_FAILURE" || challengeStatus === "REPAIR_REQUIRED") return "CONTROLLED_FAILURE";
  if (challengeStatus === "LOCKED_WITH_LIMITATIONS" || challengeStatus === "PASS_WITH_LIMITATION") return "LOCKED_WITH_LIMITATIONS";
  if (dynamicManifest.batch_count !== dynamicManifest.loaded_batch_artifacts || dynamicManifest.batch_count !== dynamicManifest.loaded_batch_validation_artifacts) return "CONTROLLED_FAILURE";
  if (hasLimitationSignal(artifacts)) return "LOCKED_WITH_LIMITATIONS";
  return "LOCKED";
}

function buildRunMeta({ run, compiledAt }) {
  return {
    run_id: run.run_id,
    target: run.target || null,
    target_url: run.root_url || run.target || null,
    source_mode: run.source_mode || null,
    created_at: run.created_at || null,
    compiled_at: compiledAt,
    generated_by: "compiler"
  };
}

function buildArtifactManifest({ artifacts, missingArtifacts, dynamicManifest }) {
  const staticArtifacts = [...MATERIAL_ARTIFACTS, ...FORENSIC_ARTIFACTS].map((artifactName) => ({
    artifact_name: artifactName,
    present: isPresent(artifacts[artifactName]),
    family: MATERIAL_ARTIFACTS.includes(artifactName) ? "material" : "forensic"
  }));

  return {
    static_artifacts: staticArtifacts,
    dynamic_m11_artifacts: dynamicManifest,
    missing_artifacts: missingArtifacts,
    compiled_outputs: ["profiles_combined", "forensics_combined", "final_output_handoff"]
  };
}

function buildCompilerTrace({ validation_status, missingArtifacts, dynamicManifest, artifacts }) {
  return {
    compiler_version: "deterministic_profiles_forensics_compiler_v1",
    validation_status,
    deterministic_only: true,
    no_report_prose_generated: true,
    no_vault_mapping_generated: true,
    no_new_findings_created: true,
    missing_artifact_count: missingArtifacts.length,
    dynamic_batch_count: dynamicManifest.batch_count,
    loaded_batch_artifact_count: dynamicManifest.loaded_batch_artifacts,
    loaded_batch_validation_artifact_count: dynamicManifest.loaded_batch_validation_artifacts,
    profile_keys: MATERIAL_ARTIFACTS.filter((artifactName) => isPresent(artifacts[artifactName])),
    forensic_keys: FORENSIC_ARTIFACTS.filter((artifactName) => isPresent(artifacts[artifactName])),
    warnings: buildCompilerWarnings({ missingArtifacts, dynamicManifest, artifacts })
  };
}

function buildCompilerWarnings({ missingArtifacts, dynamicManifest, artifacts }) {
  const warnings = [];
  if (missingArtifacts.length) warnings.push(`MISSING_ARTIFACTS:${missingArtifacts.map((row) => row.artifact_name).join(",")}`);
  if (artifacts.exposure_registry_profile) warnings.push("LEGACY_EXPOSURE_REGISTRY_PROFILE_PRESENT_BUT_NOT_USED");
  if (containsPlaceholderPathIds(artifacts)) warnings.push("PLACEHOLDER_PATH_ID_PRESENT");
  if (dynamicManifest.batch_count !== dynamicManifest.loaded_batch_artifacts) warnings.push("DYNAMIC_M11_BATCH_ARTIFACT_COUNT_MISMATCH");
  if (dynamicManifest.batch_count !== dynamicManifest.loaded_batch_validation_artifacts) warnings.push("DYNAMIC_M12_BATCH_VALIDATION_COUNT_MISMATCH");
  return warnings;
}

function normalizeDynamicManifest(value) {
  const manifest = isPlainObject(value) ? value : {};
  return {
    batch_count: Number(manifest.batch_count || 0),
    loaded_batch_artifacts: Number(manifest.loaded_batch_artifacts || 0),
    loaded_batch_validation_artifacts: Number(manifest.loaded_batch_validation_artifacts || 0),
    batch_ids: safeArray(manifest.batch_ids),
    missing_batch_artifacts: safeArray(manifest.missing_batch_artifacts),
    missing_batch_validation_artifacts: safeArray(manifest.missing_batch_validation_artifacts)
  };
}

function normalizeStatus(value) {
  const status = String(value || "").trim();
  if (status === "PASS") return "LOCKED";
  if (status === "PASS_WITH_LIMITATION") return "LOCKED_WITH_LIMITATIONS";
  if (["LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE"].includes(status)) return status;
  return "";
}

function isPresent(value) {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasLimitationSignal(value) {
  const raw = JSON.stringify(value || {}).toUpperCase();
  return /LOCKED_WITH_LIMITATIONS|PASS_WITH_LIMITATION|LIMITATION|NOT_PUBLIC|ACCESS_FAILED|GATED|INSUFFICIENT|MISSING|CONTROLLED/.test(raw);
}

function containsPlaceholderPathIds(value) {
  return JSON.stringify(value || {}).toLowerCase().includes("target_profile.tp_id_001");
}
