// Source Discovery Magna Carta v1
//
// Deterministic code may fetch, extract, normalize, dedupe, verify first-party status,
// and prepare source text. It may not discover/classify source families.
//
// This module is retained temporarily only because the current orchestrator imports
// buildDeterministicSourceCandidates(). The legacy route-guessing implementation has
// been removed because it conflicted with the Magna Carta by creating support-source
// candidates before Gemini classification.

export const DETERMINISTIC_SUPPORT_PATHS_BY_FAMILY = Object.freeze({});

export function buildDeterministicSourceCandidates() {
  return [];
}

export function buildSearchDiscoveryBatches() {
  throw new Error("buildSearchDiscoveryBatches is legacy. Use buildFamilySearchQueries from sourceDiscoverySearchPlan.js under Source Discovery Magna Carta v1.");
}

export function flattenSearchQueries() {
  throw new Error("flattenSearchQueries is legacy. Use buildFamilySearchQueries from sourceDiscoverySearchPlan.js under Source Discovery Magna Carta v1.");
}
