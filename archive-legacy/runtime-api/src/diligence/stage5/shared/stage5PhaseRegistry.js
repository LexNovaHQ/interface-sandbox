/*
 * LexNova Runtime — Stage 5 Phase Registry
 * Built-in phase graph only. No model calls. No live wiring.
 */

export const STAGE5_PHASES = Object.freeze([
  { id: 'STAGE5_INPUT_MANIFEST', name: 'Stage 5 Input Manifest', kind: 'DETERMINISTIC', blocking: true, retry_allowed: false },
  { id: 'STAGE5_SOURCE_CANDIDATE_MANIFEST', name: 'Stage 5 Source Candidate Manifest', kind: 'DETERMINISTIC', blocking: true, retry_allowed: false },
  { id: 'STAGE5_MASTER_INSTRUCTION_PLAN', name: 'Stage 5 Master Instruction Plan', kind: 'DETERMINISTIC', blocking: true, retry_allowed: false },
  { id: 'STAGE5A_PRODUCT_FUNCTION_EXTRACTION', name: '5A Product Function Extraction', kind: 'MODEL', blocking: true, retry_allowed: true, max_attempts: 1 },
  { id: 'STAGE5A_VALIDATION', name: '5A Validation', kind: 'VALIDATION', blocking: true, retry_allowed: false },
  { id: 'STAGE5B_ARCHETYPE_SURFACE_TAGGING', name: '5B Archetype Surface Tagging', kind: 'MODEL', blocking: true, retry_allowed: true, max_attempts: 1 },
  { id: 'STAGE5B_VALIDATION', name: '5B Validation', kind: 'VALIDATION', blocking: true, retry_allowed: false },
  { id: 'STAGE5C_FEATURE_INVENTORY_BUILD', name: '5C Feature Inventory Build', kind: 'ASSEMBLY', blocking: true, retry_allowed: false },
  { id: 'STAGE5C_VALIDATION', name: '5C Validation', kind: 'VALIDATION', blocking: true, retry_allowed: false },
  { id: 'STAGE5D_FEATURE_DATA_TOUCHPOINT_EXTRACTION', name: '5D Feature Data Touchpoint Extraction', kind: 'MODEL', blocking: false, retry_allowed: true, max_attempts: 1 },
  { id: 'STAGE5D_VALIDATION', name: '5D Validation', kind: 'VALIDATION', blocking: false, retry_allowed: false },
  { id: 'STAGE5E_TARGET_FEATURE_PROFILE_ASSEMBLY', name: '5E Target Feature Profile Assembly', kind: 'ASSEMBLY', blocking: true, retry_allowed: false },
  { id: 'STAGE5_FINAL_VALIDATION', name: 'Stage 5 Final Validation', kind: 'VALIDATION', blocking: true, retry_allowed: false },
  { id: 'STAGE5_HANDOFF_INTEGRITY', name: 'Stage 5 Handoff Integrity', kind: 'FORENSIC', blocking: true, retry_allowed: false }
]);

export const STAGE5_PHASE_ORDER = Object.freeze(STAGE5_PHASES.map((phase) => phase.id));

export function getStage5Phase(id) {
  return STAGE5_PHASES.find((phase) => phase.id === id) || null;
}

export function getNextStage5Phase(id) {
  const index = STAGE5_PHASE_ORDER.indexOf(id);
  if (index < 0 || index >= STAGE5_PHASE_ORDER.length - 1) return null;
  return getStage5Phase(STAGE5_PHASE_ORDER[index + 1]);
}

export function isStage5ModelPhase(id) {
  return getStage5Phase(id)?.kind === 'MODEL';
}

export function isStage5DeterministicPhase(id) {
  const kind = getStage5Phase(id)?.kind;
  return kind === 'DETERMINISTIC' || kind === 'ASSEMBLY' || kind === 'VALIDATION' || kind === 'FORENSIC';
}

export function isStage5BlockingPhase(id) {
  return Boolean(getStage5Phase(id)?.blocking);
}
