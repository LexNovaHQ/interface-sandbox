/*
 * RETIRED LEGACY LIVE DILIGENCE ORCHESTRATOR SHIM.
 *
 * The historical implementation in this file used the retired Stage 5 package-builder
 * and the old target_feature_profile stage. That path is no longer allowed.
 *
 * Any import of this legacy path is now routed to the locked canonical orchestrator,
 * which uses liveEvidenceAndProfilePipeline -> runStage5Runtime -> Stage 6+.
 */

export { runLiveDiligenceReview } from "./liveDiligenceRunOrchestratorLocked.js";
