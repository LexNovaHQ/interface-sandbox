import { LEGAL_CARTOGRAPHY_INDEX_CONTRACT } from "./legal-cartography-index.contract.js";
import { runM9HybridOrchestrator, M9_HYBRID_SAVE_ORDER } from "../../m9-hybrid-orchestrator.js";

export const LEGAL_CARTOGRAPHY_INDEX_RUNNER = Object.freeze({
  phase_id: LEGAL_CARTOGRAPHY_INDEX_CONTRACT.central_phase_id,
  public_label: LEGAL_CARTOGRAPHY_INDEX_CONTRACT.public_label,
  implementation_status: "PHASE_RUNNER_WIRED_TO_M9_HYBRID_ORCHESTRATOR",
  production_entrypoint_switched: false,
  required_save_order: M9_HYBRID_SAVE_ORDER,
  saves_legal_signal_derivation_profile: true,
  saves_m7_overlay_or_m10_support_packet: false
});

export async function runLegalCartographyPhaseJob(input = {}) {
  return runM9HybridOrchestrator(input);
}
