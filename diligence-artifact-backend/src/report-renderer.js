export function buildRendererPayload({ run, final_output_handoff }) {
  const handoff = final_output_handoff?.final_output_handoff || final_output_handoff;
  const profiles = handoff?.profiles || {};

  return {
    renderer_payload: {
      run_id: run.run_id,
      target: run.target,
      target_url: run.root_url || run.target,
      generated_by: "portfolio_renderer",
      generated_at: new Date().toISOString(),
      validation_status: handoff?.validation_status || "UNKNOWN",
      sections: [
        {
          id: "matter_overview",
          title: "Matter Overview",
          data: handoff?.matter_overview || {}
        },
        {
          id: "source_discovery",
          title: "Source Discovery",
          data: profiles.source_discovery_handoff || {}
        },
        {
          id: "legal_cartography",
          title: "Legal Cartography",
          data: profiles.legal_cartography_index || {}
        },
        {
          id: "target_profile",
          title: "Target Profile",
          data: profiles.target_profile || {}
        },
        {
          id: "feature_profile",
          title: "Target Feature Profile",
          data: profiles.target_feature_profile || {}
        },
        {
          id: "data_provenance",
          title: "Data Provenance / Privacy Readiness",
          data: profiles.data_provenance_profile || {}
        },
        {
          id: "exposure_registry",
          title: "Exposure Registry",
          data: profiles.exposure_registry_profile || {}
        },
        {
          id: "challenge_gate",
          title: "Operator Challenge Gate",
          data: profiles.challenge_gate || {}
        }
      ],
      raw_final_output_handoff: handoff
    }
  };
}
