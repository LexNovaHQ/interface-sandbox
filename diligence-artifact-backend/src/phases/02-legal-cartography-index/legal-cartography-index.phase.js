export const LEGAL_CARTOGRAPHY_INDEX_PHASE = Object.freeze({
  order: 2,
  phase_id: "LEGAL_CARTOGRAPHY_INDEX",
  public_label: "Legal Cartography and Index",
  implementation_status: "CENTRAL_RUNTIME_CONTRACTED_ORCHESTRATOR_ACTIVE",
  responsibility: "Own legal cartography navigation and deterministic legal signal derivation as two separate internal jobs: Legal Cartography Index and Legal Signal Derivation.",
  internal_jobs: Object.freeze([
    "LEGAL_CARTOGRAPHY_INDEX",
    "LEGAL_SIGNAL_DERIVATION"
  ]),
  material_outputs: Object.freeze([
    "legal_cartography_deterministic_map",
    "legal_cartography_semantic_profile",
    "legal_cartography_index",
    "legal_signal_derivation_profile"
  ]),
  forbidden_outputs: Object.freeze([
    "m7_deterministic_legal_signal_overlay",
    "m10_selected_legal_support_packet",
    "qualified_review_handoff",
    "qualified_review_renderer_payload",
    "renderer_payload"
  ]),
  production_entrypoint_switched: true,
  global_production_deployment_switched: false,
  runtime_boundary: "Runtime orchestrates Legal Cartography and Index through the central pipeline contract and the active agent_2b_m9 package. Helper/orchestrator internals may remain outside this folder until a later helper migration, but the runtime contract, package binding, reads, writes, and downstream handoff are active. M7, M10, and Qualified Review integrations are deferred to their own phases."
});
