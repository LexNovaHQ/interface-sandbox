/*
 * LexNova Runtime — Stage 5 Forensic Envelope
 * Shared audit artifact shape only. No model calls. No live wiring.
 */

import { nowIso } from './stage5SharedTypes.js';

export function buildStage5InputSummary(input = {}) {
  return {
    top_level_keys: input && typeof input === 'object' ? Object.keys(input).sort() : [],
    source_count: Array.isArray(input.sources) ? input.sources.length : Array.isArray(input.source_inventory) ? input.source_inventory.length : 0,
    candidate_count: Array.isArray(input.candidates) ? input.candidates.length : Array.isArray(input.candidate_signals) ? input.candidate_signals.length : 0
  };
}

export function buildStage5OutputSummary(output = {}) {
  return {
    top_level_keys: output && typeof output === 'object' ? Object.keys(output).sort() : [],
    feature_count: Array.isArray(output.feature_inventory) ? output.feature_inventory.length : Array.isArray(output.product_functions) ? output.product_functions.length : 0,
    warning_count: Array.isArray(output.warnings) ? output.warnings.length : 0,
    limitation_count: Array.isArray(output.limitations) ? output.limitations.length : 0
  };
}

export function buildStage5HandoffIntegrity(meta = {}) {
  return {
    input_artifact_refs: meta.input_artifact_refs || [],
    output_artifact_refs: meta.output_artifact_refs || [],
    validation_artifact_refs: meta.validation_artifact_refs || [],
    canonical_output_pointer: meta.canonical_output_pointer || null,
    downstream_ready: Boolean(meta.downstream_ready),
    notes: meta.notes || []
  };
}

export function createStage5ForensicArtifact(meta = {}) {
  const started = meta.started_at || nowIso();
  const completed = meta.completed_at || nowIso();
  return {
    artifact_version: 'stage5_forensic_artifact_v1',
    run_id: meta.run_id || null,
    target_profile_ref: meta.target_profile_ref || null,
    phase_id: meta.phase_id || null,
    phase_name: meta.phase_name || null,
    started_at: started,
    completed_at: completed,
    duration_ms: Number(meta.duration_ms || 0),
    input_summary: meta.input_summary || buildStage5InputSummary(meta.input || {}),
    output_summary: meta.output_summary || buildStage5OutputSummary(meta.output || {}),
    canonical_output_pointer: meta.canonical_output_pointer || null,
    validation_result: meta.validation_result || null,
    token_usage: meta.token_usage || null,
    warnings: meta.warnings || [],
    errors: meta.errors || [],
    handoff_integrity: meta.handoff_integrity || buildStage5HandoffIntegrity(meta),
    artifact_payload: meta.artifact_payload || meta.output || {}
  };
}

export function summarizeStage5Forensics(artifacts = []) {
  return {
    artifact_count: artifacts.length,
    phases: artifacts.map((artifact) => artifact.phase_id).filter(Boolean),
    total_duration_ms: artifacts.reduce((sum, artifact) => sum + Number(artifact.duration_ms || 0), 0),
    warning_count: artifacts.reduce((sum, artifact) => sum + (artifact.warnings || []).length, 0),
    error_count: artifacts.reduce((sum, artifact) => sum + (artifact.errors || []).length, 0)
  };
}
