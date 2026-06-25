export function compileFinalOutputHandoff({ run, artifacts }) {
  const required = [
    "source_discovery_handoff",
    "legal_cartography_index",
    "target_profile",
    "target_feature_profile",
    "data_provenance_profile",
    "exposure_registry_profile",
    "challenge_gate"
  ];

  const missing = required.filter((name) => !artifacts[name]);
  const validation_status = missing.length ? "CONTROLLED_FAILURE" : "LOCKED";

  return {
    final_output_handoff: {
      run_id: run.run_id,
      target: run.target,
      target_url: run.root_url || run.target,
      generated_by: "compiler",
      validation_status,
      missing_artifacts: missing,
      matter_overview: {
        source_mode: run.source_mode,
        created_at: run.created_at,
        compiled_at: new Date().toISOString()
      },
      profiles: {
        source_discovery_handoff: artifacts.source_discovery_handoff || null,
        legal_cartography_index: artifacts.legal_cartography_index || null,
        target_profile: artifacts.target_profile || null,
        target_feature_profile: artifacts.target_feature_profile || null,
        data_provenance_profile: artifacts.data_provenance_profile || null,
        exposure_registry_profile: artifacts.exposure_registry_profile || null,
        challenge_gate: artifacts.challenge_gate || null
      },
      terminal_checks: {
        required_artifacts_present: missing.length === 0,
        no_placeholder_path_ids: !containsPlaceholderPathIds(artifacts),
        challenge_gate_present: Boolean(artifacts.challenge_gate)
      }
    }
  };
}

function containsPlaceholderPathIds(value) {
  return JSON.stringify(value || {}).toLowerCase().includes("target_profile.tp_id_001");
}
