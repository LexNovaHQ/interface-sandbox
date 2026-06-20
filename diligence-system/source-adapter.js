// source-adapter.js
// Lean S0 orchestration spine. The contract is canon; helper modules perform mechanical work.

import crypto from "crypto";

import {
  S0_SOURCE_CONTRACT_VERSION,
  S0_NODE_ID,
  S0_SOURCE_MODES,
  S0_DOWNSTREAM_MODES,
  S0_SOURCE_FAMILY_ORDER,
  S0_FAMILY_CAPS,
  S0_MAX_REPAIR_ATTEMPTS,
  S0_HYBRID_EXTRACTION_MANIFEST_TOP_LEVEL_FIELDS,
  S0_EXTRACTION_FORENSIC_LEDGER_TOP_LEVEL_FIELDS,
  validateS0TerminalOutputShape
} from "./s0-source-contract.js";

import {
  buildS0ModelCall
} from "./s0-prompt-renderer.js";

import {
  normalizeInput,
  canonicalizeTarget,
  canonicalizeTextTarget,
  canonicalizeSyntheticTarget,
  canonicalizeUrl,
  scopeClassForUrl,
  generateKnownPathCandidates,
  classifyCandidate,
  isKnownFamilySubfamily,
  isDiscoveredProductSlug,
  hasD4DataFlowSignal,
  compareCandidatePriority,
  hardFamilyCap,
  hardSubfamilyCap,
  totalAcceptedHardMax
} from "./s0-source-classifier.js";

import {
  blankNavigationMap,
  blankCandidateRoutesByFamily,
  fetchRootNavigation,
  fetchRobotsAndSitemaps,
  fetchCandidateText,
  buildLosslessArtifact,
  buildAbsentInventoryRow,
  wordCount
} from "./s0-source-fetcher.js";

import {
  dedupeCandidatesByUrl,
  dedupeArtifactsByContent,
  buildNearDuplicateClusters,
  applyNearDuplicateReview,
  syncInventoryRefs
} from "./s0-source-dedupe.js";

export const S0_SOURCE_ADAPTER_VERSION = "source_adapter_v3_split_lean";

export async function runSourceAdapter({
  input = {},
  fetchImpl = globalThis.fetch,
  callModel = null,
  now = () => new Date()
} = {}) {
  const state = createS0State({ input, now });

  await sx0ValidateAndCanonicalize({ state });
  await sx1RootFetchAndNavigationMap({ state, fetchImpl });
  await sx2GenerateCandidates({ state, callModel });
  await sx3ClassifyCandidates({ state, callModel });
  sx4DedupeCandidates({ state });
  sx5SelectFetchQueue({ state });
  await sx6FetchAndExtractLossless({ state, fetchImpl });
  sx7DedupeAndAdmitArtifacts({ state });
  await sx8ModelNearDuplicateReview({ state, callModel });
  await sx9ModelSubfamilySatisfactionReview({ state, callModel });
  await sx10CoverageChallenge({ state, callModel });
  await sx11TargetedSecondPass({ state, fetchImpl });

  return sx12AssembleAndValidate({ state, now });
}

function createS0State({ input, now }) {
  const startedAt = isoNow(now);

  return {
    input,
    started_at: startedAt,
    completed_at: null,

    run: {
      run_id: stringOr(input.run_id, `s0_${Date.now()}_${randomId(6)}`),
      source_mode: null,
      downstream_mode: null,
      search_pool_enabled: input.search_pool_enabled !== false,
      grounding_enabled: input.grounding_enabled !== false,
      deterministic_fetch_enabled: input.deterministic_fetch_enabled !== false,
      output_is_candidate_only: true
    },

    target: {},
    navigation_map: blankNavigationMap(),
    candidate_sources: [],
    artifact_inventory: [],
    lossless_text_artifacts: [],
    dedupe_records: [],
    collection_limitations: [],

    ledger_events: [],
    candidate_discovery_log: [],
    fetch_log: [],
    dedupe_log: [],
    model_review_log: [],
    validation_repair_log: [],
    terminal_gate_log: [],

    runtime: {
      root_fetch: null,
      fetch_queue: [],
      challenge_queue: [],
      unresolved_slots: [],
      candidate_seq: 0,
      artifact_seq: 0,
      lossless_seq: 0,
      dedupe_seq: 0,
      limitation_seq: 0,
      failure_seq: 0,
      second_pass_attempts: new Map()
    }
  };
}

async function sx0ValidateAndCanonicalize({ state }) {
  const input = normalizeInput(state.input);
  state.input = input;
  state.run.source_mode = input.source_mode;
  state.run.downstream_mode = input.downstream_mode;

  if (!S0_SOURCE_MODES.includes(input.source_mode)) fatalBoundary(state, "invalid mode");
  if (!S0_DOWNSTREAM_MODES.includes(input.downstream_mode)) fatalBoundary(state, "invalid downstream mode");

  if (["url", "url_plus_text"].includes(input.source_mode)) {
    if (!input.target_url) fatalBoundary(state, "no clear target");
    state.target = canonicalizeTarget(input.target_url, input.company_name_candidate);
  } else if (input.source_mode === "text") {
    if (!input.text) fatalBoundary(state, "no clear target");
    state.target = canonicalizeTextTarget(input);
  } else {
    state.target = canonicalizeSyntheticTarget(input);
  }

  state.navigation_map = blankNavigationMap(state.target.root_url);
  logEvent(state, "SX.0_INPUT_VALIDATED", { source_mode: input.source_mode, downstream_mode: input.downstream_mode });
}

async function sx1RootFetchAndNavigationMap({ state, fetchImpl }) {
  if (!isUrlMode(state)) {
    logEvent(state, "SX.1_TEXT_MODE_NAVIGATION_BYPASS", { reason: "text/synthetic mode disables public fetch navigation" });
    return;
  }

  addCandidate(state, {
    candidate_url: state.target.root_url,
    canonical_url: state.target.root_url,
    source_family: "TARGET_FAMILY",
    source_subfamily: "T0_ROOT",
    route_source: "ROOT",
    route_basis: "canonical root URL"
  });

  const rootNav = await fetchRootNavigation({ target: state.target, fetchImpl });
  state.runtime.root_fetch = rootNav.root;
  state.navigation_map = rootNav.navigation_map;

  state.fetch_log.push({ step: "SX.1", url: state.target.root_url, ok: rootNav.root.ok, status: rootNav.root.status, error: rootNav.root.error || "", at: iso() });

  if (!rootNav.root.ok) {
    addCollectionLimitation(state, {
      limitation_type: "ACCESS_FAILED",
      affected_family: "TARGET_FAMILY",
      affected_subfamily: "T0_ROOT",
      basis: `root fetch failed: ${rootNav.root.error || rootNav.root.status}`,
      downstream_effect: "navigation_map may be incomplete"
    });
    return;
  }

  for (const candidate of rootNav.route_candidates) addCandidate(state, candidate);

  const sitemap = await fetchRobotsAndSitemaps({ target: state.target, fetchImpl });
  state.navigation_map.robots_sitemap_links = sitemap.robots_sitemap_links;
  state.navigation_map.sitemap_links = sitemap.sitemap_links;
  state.fetch_log.push(...sitemap.fetch_log.map((row) => ({ ...row, step: "SX.1", at: iso() })));
  for (const candidate of sitemap.route_candidates) addCandidate(state, candidate);

  rebuildCandidateRoutesByFamily(state);
}

async function sx2GenerateCandidates({ state, callModel }) {
  if (isUrlMode(state)) {
    for (const candidate of generateKnownPathCandidates({ target: state.target })) addCandidate(state, candidate);
  }

  if (["text", "url_plus_text"].includes(state.run.source_mode) && state.input.text) {
    addCandidate(state, {
      candidate_url: "pasted://public-material",
      canonical_url: "pasted://public-material",
      source_family: "TARGET_FAMILY",
      source_subfamily: "T4_SUPPORTING_IDENTITY",
      route_source: "PASTED_TEXT",
      route_basis: "user-supplied pasted public first-party material",
      scope_class: "PASTED_PUBLIC_MATERIAL_CANDIDATE"
    });
  }

  if (state.run.source_mode === "synthetic_demo") {
    addCandidate(state, {
      candidate_url: "synthetic://demo-fixture",
      canonical_url: "synthetic://demo-fixture",
      source_family: "TARGET_FAMILY",
      source_subfamily: "T0_ROOT",
      route_source: "SYNTHETIC_DEMO",
      route_basis: "synthetic demo fixture",
      scope_class: "SYNTHETIC_DEMO_CANDIDATE"
    });
  }

  const missing = missingCandidateFamilies(state);
  if (missing.length && callModel) {
    const scout = await callModelTask(state, callModel, "S0_SEARCH_SCOUT", { target: state.target, missing_family_slots: missing });
    for (const lead of asArray(scout?.candidates)) {
      addCandidate(state, {
        candidate_url: lead.url,
        canonical_url: canonicalizeUrl(lead.url, state.target.root_url),
        source_family: lead.source_family,
        source_subfamily: lead.source_subfamily,
        route_source: "SEARCH_SCOUT",
        route_basis: lead.route_basis || "search scout lead"
      });
    }
  }

  rebuildCandidateRoutesByFamily(state);
}

async function sx3ClassifyCandidates({ state, callModel }) {
  const ambiguous = [];

  for (const candidate of state.candidate_sources) {
    if (candidate.source_family && candidate.source_subfamily) continue;

    const classified = classifyCandidate(candidate);
    candidate.source_family = classified.source_family;
    candidate.source_subfamily = classified.source_subfamily;

    if (!candidate.source_family || !candidate.source_subfamily) ambiguous.push(candidate);
  }

  if (ambiguous.length && callModel) {
    const review = await callModelTask(state, callModel, "S0_AMBIGUOUS_CLASSIFICATION_REVIEW", { candidates: compactCandidates(ambiguous) });
    for (const item of asArray(review?.classifications)) {
      const candidate = findCandidate(state, item.candidate_source_id);
      if (candidate && isKnownFamilySubfamily(item.source_family, item.source_subfamily)) {
        candidate.source_family = item.source_family;
        candidate.source_subfamily = item.source_subfamily;
        candidate.route_basis = joinBasis(candidate.route_basis, item.basis);
      }
    }
  }

  for (const candidate of state.candidate_sources) {
    if (!isKnownFamilySubfamily(candidate.source_family, candidate.source_subfamily)) {
      markDeferred(candidate, "unresolved family/subfamily classification");
      addCollectionLimitation(state, {
        limitation_type: "UNFILLED_SUBFAMILY",
        affected_item_ids: [candidate.candidate_source_id],
        basis: "candidate deferred because family/subfamily could not be resolved",
        downstream_effect: "candidate not fetched"
      });
    }
  }
}

function sx4DedupeCandidates({ state }) {
  dedupeCandidatesByUrl({
    candidates: state.candidate_sources,
    addDedupeRecord: (record) => addDedupeRecord(state, record)
  });
}

function sx5SelectFetchQueue({ state }) {
  const familyCounts = Object.fromEntries(S0_SOURCE_FAMILY_ORDER.map((family) => [family, 0]));
  const subfamilyCounts = {};
  const queue = [];

  const candidates = state.candidate_sources
    .filter((row) => !["DEFERRED", "REJECTED", "DEDUPED"].includes(row.final_status))
    .sort(compareCandidatePriority);

  for (const candidate of candidates) {
    const family = candidate.source_family;
    const subfamily = candidate.source_subfamily;

    if (!isKnownFamilySubfamily(family, subfamily)) {
      markDeferred(candidate, "missing family/subfamily");
      continue;
    }
    if (queue.length >= totalAcceptedHardMax()) {
      markDeferred(candidate, "total accepted source hard max reached");
      continue;
    }
    if ((familyCounts[family] || 0) >= hardFamilyCap(family)) {
      markDeferred(candidate, "family hard cap reached");
      continue;
    }
    if ((subfamilyCounts[subfamily] || 0) >= hardSubfamilyCap(subfamily)) {
      markDeferred(candidate, "subfamily hard cap reached");
      continue;
    }
    if (subfamily === "P1_PRODUCT_SLUG" && !isDiscoveredProductSlug(candidate)) {
      markRejected(candidate, "product slug brute-force forbidden");
      continue;
    }
    if (subfamily === "D4_DOCS_API_DATA_FLOW" && !hasD4DataFlowSignal(candidate)) {
      markDeferred(candidate, "D4 docs/API data-flow signal missing");
      continue;
    }

    candidate.fetch_decision = "FETCH";
    candidate.fetch_decision_reason = "selected by family/subfamily queue";
    queue.push(candidate);
    familyCounts[family] += 1;
    subfamilyCounts[subfamily] = (subfamilyCounts[subfamily] || 0) + 1;
  }

  state.runtime.fetch_queue = queue;
}

async function sx6FetchAndExtractLossless({ state, fetchImpl }) {
  for (const candidate of state.runtime.fetch_queue) {
    if (candidate.route_source === "PASTED_TEXT") {
      acceptInlineText(state, candidate, state.input.text || "", "PASTED_TEXT");
      continue;
    }
    if (candidate.route_source === "SYNTHETIC_DEMO") {
      acceptInlineText(state, candidate, state.input.demo_text || "Synthetic demo fixture.", "SYNTHETIC_DEMO");
      continue;
    }

    const result = await fetchCandidateText({ candidate, fetchImpl, cachedRootFetch: state.runtime.root_fetch });
    state.fetch_log.push({ candidate_source_id: candidate.candidate_source_id, url: candidate.canonical_url || candidate.candidate_url, step: "SX.6", ok: result.ok, status: result.status, error: result.error || "", at: iso() });

    if (!result.ok || wordCount(result.clean_text) < 20) {
      candidate.final_status = "FETCH_FAILED";
      const status = result.ok ? "INSUFFICIENT_TEXT" : "ACCESS_FAILED";
      state.artifact_inventory.push(buildAbsentInventoryRow({ candidate, artifactId: nextArtifactId(state), status, warning: result.error || status }));
      addCollectionLimitation(state, {
        limitation_type: result.ok ? "THIN_COVERAGE" : "ACCESS_FAILED",
        affected_family: candidate.source_family,
        affected_subfamily: candidate.source_subfamily,
        affected_item_ids: [candidate.candidate_source_id],
        basis: result.error || "fetch succeeded but extracted text was thin or empty",
        downstream_effect: "source not accepted as lossless evidence"
      });
      continue;
    }

    acceptInlineText(state, candidate, result.raw_text, result.method || "HTTP_FETCH", result.clean_text);
  }
}

function sx7DedupeAndAdmitArtifacts({ state }) {
  const result = dedupeArtifactsByContent({
    artifacts: state.lossless_text_artifacts,
    candidates: state.candidate_sources,
    addDedupeRecord: (record) => addDedupeRecord(state, record)
  });

  state.lossless_text_artifacts = result.kept;
  syncInventoryRefs({ inventory: state.artifact_inventory, keptLosslessIds: result.keptIds });
}

async function sx8ModelNearDuplicateReview({ state, callModel }) {
  const clusters = buildNearDuplicateClusters(state.lossless_text_artifacts);
  if (!clusters.length) return;

  if (!callModel) {
    logModel(state, "S0_NEAR_DUPLICATE_REVIEW", { status: "SKIPPED_NO_MODEL", cluster_count: clusters.length });
    return;
  }

  for (const cluster of clusters) {
    const review = await callModelTask(state, callModel, "S0_NEAR_DUPLICATE_REVIEW", { cluster });
    logModel(state, "S0_NEAR_DUPLICATE_REVIEW", { result: review });
    applyNearDuplicateReview({ review, candidates: state.candidate_sources, addDedupeRecord: (record) => addDedupeRecord(state, record) });
  }
}

async function sx9ModelSubfamilySatisfactionReview({ state, callModel }) {
  const packet = buildSatisfactionPacket(state);

  if (!callModel) {
    logModel(state, "S0_SUBFAMILY_SATISFACTION_REVIEW", { status: "SKIPPED_NO_MODEL", deterministic_packet: packet });
    state.runtime.unresolved_slots = deterministicUnresolvedSlots(state);
    return;
  }

  const review = await callModelTask(state, callModel, "S0_SUBFAMILY_SATISFACTION_REVIEW", packet);
  logModel(state, "S0_SUBFAMILY_SATISFACTION_REVIEW", { result: review });
  state.runtime.unresolved_slots = extractUnresolvedSlotsFromReview(state, review);
}

async function sx10CoverageChallenge({ state, callModel }) {
  const unresolved = state.runtime.unresolved_slots || [];
  if (!unresolved.length) return;

  if (!callModel) {
    for (const slot of unresolved) {
      addCollectionLimitation(state, {
        limitation_type: "UNFILLED_SUBFAMILY",
        affected_family: slot.source_family,
        affected_subfamily: slot.source_subfamily,
        basis: "coverage challenge unavailable because model hook is absent",
        downstream_effect: "slot remains unresolved"
      });
    }
    return;
  }

  const challenge = await callModelTask(state, callModel, "S0_COVERAGE_CHALLENGE", { target: state.target, unresolved_slots: unresolved, remaining_caps: buildRemainingCaps(state) });
  logModel(state, "S0_COVERAGE_CHALLENGE", { result: challenge });

  for (const lead of asArray(challenge?.candidates)) {
    const candidate = addCandidate(state, {
      candidate_url: lead.url,
      canonical_url: canonicalizeUrl(lead.url, state.target.root_url),
      source_family: lead.source_family,
      source_subfamily: lead.source_subfamily,
      route_source: "COVERAGE_CHALLENGE",
      route_basis: lead.route_basis || "coverage challenge lead"
    });
    state.runtime.challenge_queue.push(candidate);
  }
}

async function sx11TargetedSecondPass({ state, fetchImpl }) {
  if (!state.runtime.challenge_queue.length) return;

  const saved = state.runtime.fetch_queue;
  state.runtime.fetch_queue = state.runtime.challenge_queue.filter((candidate) => {
    const key = `${candidate.source_family}:${candidate.source_subfamily}`;
    const attempts = state.runtime.second_pass_attempts.get(key) || 0;
    if (attempts >= S0_MAX_REPAIR_ATTEMPTS) return false;
    state.runtime.second_pass_attempts.set(key, attempts + 1);
    candidate.fetch_decision = "FETCH";
    candidate.fetch_decision_reason = "targeted second pass challenge candidate";
    return true;
  });

  await sx6FetchAndExtractLossless({ state, fetchImpl });
  sx7DedupeAndAdmitArtifacts({ state });
  state.runtime.fetch_queue = saved;
}

function sx12AssembleAndValidate({ state, now }) {
  state.completed_at = isoNow(now);
  const output = repairTerminalShape({
    hybrid_extraction_manifest: buildHybridExtractionManifest(state),
    extraction_forensic_ledger: buildExtractionForensicLedger(state)
  });

  const check = validateS0TerminalOutputShape(output);
  state.terminal_gate_log.push({ gate_id: "G8", gate_name: "Terminal Schema Gate", ok: check.ok, result: check, at: iso() });

  if (!check.ok) {
    addFailureTicket(state, { gate_id: "G8", failed_condition: check.error || "TERMINAL_SCHEMA_INVALID", severity: "FATAL", repair_route: "SCHEMA_REPAIR", final_status: "FATAL" });
    throw Object.assign(new Error("S0_TERMINAL_SCHEMA_INVALID"), { detail: check, output });
  }

  return output;
}

function addCandidate(state, candidateInput) {
  const candidate = {
    candidate_source_id: `cand_${String(++state.runtime.candidate_seq).padStart(4, "0")}`,
    candidate_url: candidateInput.candidate_url || "",
    canonical_url: candidateInput.canonical_url || candidateInput.candidate_url || "",
    source_family: candidateInput.source_family || "",
    source_subfamily: candidateInput.source_subfamily || "",
    route_source: normalizeRouteSource(candidateInput.route_source || "ROOT"),
    route_basis: candidateInput.route_basis || "",
    scope_class: candidateInput.scope_class || scopeClassForUrl(candidateInput.candidate_url, state.target),
    fetch_decision: "DEFER",
    fetch_decision_reason: "pending queue selection",
    final_status: "DEFERRED"
  };

  if (["THIRD_PARTY_NON_GOVERNANCE", "PRIVATE_OR_PROHIBITED"].includes(candidate.scope_class)) {
    markRejected(candidate, "scope rejected");
  }

  state.candidate_sources.push(candidate);
  state.candidate_discovery_log.push({ ...candidate, at: iso() });
  return candidate;
}

function acceptInlineText(state, candidate, rawText, method, cleanText = null) {
  const artifactId = nextArtifactId(state);
  const losslessId = `lossless_${String(++state.runtime.lossless_seq).padStart(4, "0")}`;
  const built = buildLosslessArtifact({ candidate, rawText, cleanText, method, artifactId, losslessId });
  state.artifact_inventory.push(built.inventory);
  state.lossless_text_artifacts.push(built.lossless);
  candidate.fetch_decision = "FETCH";
  candidate.fetch_decision_reason = "accepted lossless artifact created";
  candidate.final_status = "ACCEPTED_LOSSLESS";
}

function buildHybridExtractionManifest(state) {
  return orderObject({
    extraction_call_card: buildExtractionCallCard(state),
    target: state.target,
    navigation_map: state.navigation_map,
    collection_summary: buildCollectionSummary(state),
    candidate_sources: state.candidate_sources.map(stripCandidate),
    artifact_inventory: state.artifact_inventory,
    lossless_text_artifacts: state.lossless_text_artifacts,
    dedupe_records: state.dedupe_records,
    collection_limitations: state.collection_limitations,
    downstream_handoff: buildDownstreamHandoff(state)
  }, S0_HYBRID_EXTRACTION_MANIFEST_TOP_LEVEL_FIELDS);
}

function buildExtractionForensicLedger(state) {
  return orderObject({
    ledger_meta: {
      ledger_id: `ledger_${state.run.run_id}`,
      node_id: S0_NODE_ID,
      run_id: state.run.run_id,
      contract_version: S0_SOURCE_CONTRACT_VERSION,
      ledger_type: "EXTRACTION_FORENSIC_LEDGER",
      started_at: state.started_at,
      completed_at: state.completed_at,
      ledger_lock_status: state.collection_limitations.length ? "LOCKED_WITH_WARNINGS" : "LOCKED"
    },
    ledger_events: state.ledger_events,
    candidate_discovery_log: state.candidate_discovery_log,
    fetch_log: state.fetch_log,
    dedupe_log: state.dedupe_log,
    model_review_log: state.model_review_log,
    validation_repair_log: state.validation_repair_log,
    terminal_gate_log: state.terminal_gate_log
  }, S0_EXTRACTION_FORENSIC_LEDGER_TOP_LEVEL_FIELDS);
}

function buildExtractionCallCard(state) {
  return {
    node_id: S0_NODE_ID,
    contract_version: S0_SOURCE_CONTRACT_VERSION,
    adapter_version: S0_SOURCE_ADAPTER_VERSION,
    run_id: state.run.run_id,
    source_mode: state.run.source_mode,
    downstream_mode: state.run.downstream_mode,
    canonical_output: "hybrid_extraction_manifest",
    search_pool_enabled: state.run.search_pool_enabled,
    grounding_enabled: state.run.grounding_enabled,
    deterministic_fetch_enabled: state.run.deterministic_fetch_enabled,
    output_is_candidate_only: true,
    generated_at: state.completed_at
  };
}

function buildCollectionSummary(state) {
  const familyCounts = countBy(state.lossless_text_artifacts, "source_family");
  const subfamilyCounts = countBy(state.lossless_text_artifacts, "source_subfamily");

  return {
    collection_status: state.collection_limitations.length ? "COMPLETED_WITH_LIMITATIONS" : "COMPLETED",
    candidate_count: state.candidate_sources.length,
    accepted_source_count: state.candidate_sources.filter((row) => row.final_status === "ACCEPTED_LOSSLESS").length,
    lossless_artifact_count: state.lossless_text_artifacts.length,
    fetch_success_count: state.fetch_log.filter((row) => row.ok).length,
    fetch_failure_count: state.fetch_log.filter((row) => !row.ok).length,
    dedupe_suppressed_count: state.dedupe_records.reduce((sum, row) => sum + row.suppressed_candidate_source_ids.length, 0),
    deferred_count: state.candidate_sources.filter((row) => row.final_status === "DEFERRED").length,
    scope_rejected_count: state.candidate_sources.filter((row) => row.final_status === "REJECTED").length,
    family_caps: S0_FAMILY_CAPS,
    family_counts: familyCounts,
    subfamily_counts: subfamilyCounts,
    family_stop_states: Object.fromEntries(S0_SOURCE_FAMILY_ORDER.map((family) => [family, familyCounts[family] ? "HAS_ACCEPTED_SOURCE" : "NO_ACCEPTED_SOURCE_OR_LIMITATION"])),
    coverage_status_by_family: Object.fromEntries(S0_SOURCE_FAMILY_ORDER.map((family) => [family, familyCounts[family] ? "PARTIAL_OR_SATISFIED" : "UNFILLED_OR_UNAVAILABLE"])),
    source_runtime_trace: {
      deterministic_steps_completed: ["SX.0", "SX.1", "SX.2", "SX.3", "SX.4", "SX.5", "SX.6", "SX.7", "SX.12"],
      model_steps_attempted: state.model_review_log.map((row) => row.review_type)
    }
  };
}

function buildDownstreamHandoff(state) {
  return {
    canonical_next_use: state.run.downstream_mode === "MONOLITH_RUNTIME" ? "MONOLITH_MODULE_VI_EVIDENCE_BUFFER" : "PHASE_1_SOURCE_DISCOVERY_EVIDENCE_BOX",
    candidate_only: true,
    lossless_text_available: state.lossless_text_artifacts.length > 0,
    artifact_inventory_ready: true,
    snippet_only_forbidden_as_accepted_evidence: true,
    evidence_buffer_materials: {
      source_text_array: "lossless_text_artifacts[]",
      artifact_map: "artifact_inventory[]",
      source_metadata: "candidate_sources[]",
      limitations: "collection_limitations[]"
    }
  };
}

async function callModelTask({ state, callModel, task, input }) {
  const payload = buildS0ModelCall({
    task,
    input
  });

  try {
    const result = await callModel(payload);
    return parseMaybeJson(result);
  } catch (error) {
    state.model_review_log.push({
      review_type: task,
      status: "MODEL_CALL_FAILED",
      error: error?.message || String(error),
      at: new Date().toISOString()
    });

    addCollectionLimitation({
      state,
      limitationType: "TOOL_LIMITATION",
      basis: `model hook failed for ${task}`,
      downstreamEffect: "model-assisted review unavailable"
    });

    return null;
  }
}

function extractUnresolvedSlotsFromReview(state, review) {
  const unresolved = [];

  for (const item of asArray(review?.subfamily_satisfaction_review)) {
    if (["THIN", "MISFILLED_SLOT", "UNAVAILABLE_AFTER_SEARCH", "NEEDS_COVERAGE_CHALLENGE"].includes(item.status)) {
      unresolved.push(item);
      addCollectionLimitation(state, {
        limitation_type: item.status === "MISFILLED_SLOT" ? "MISFILLED_SLOT" : "THIN_COVERAGE",
        affected_family: item.source_family,
        affected_subfamily: item.source_subfamily,
        affected_item_ids: item.accepted_source_ids || [],
        basis: item.basis || item.status,
        downstream_effect: "coverage may need challenge or downstream caution"
      });
    }
  }

  return unresolved;
}

function buildSatisfactionPacket(state) {
  const bySlot = {};

  for (const artifact of state.lossless_text_artifacts) {
    const key = `${artifact.source_family}:${artifact.source_subfamily}`;
    bySlot[key] ||= { source_family: artifact.source_family, source_subfamily: artifact.source_subfamily, accepted_source_ids: [], accepted_urls: [] };
    bySlot[key].accepted_source_ids.push(artifact.candidate_source_id);
    bySlot[key].accepted_urls.push(artifact.source_url);
  }

  return { slots: Object.values(bySlot), collection_summary: { accepted: state.lossless_text_artifacts.length, candidates: state.candidate_sources.length } };
}

function deterministicUnresolvedSlots(state) {
  const counts = countBy(state.lossless_text_artifacts, "source_family");
  return S0_SOURCE_FAMILY_ORDER.filter((family) => !counts[family]).map((family) => ({ source_family: family, source_subfamily: "", status: "UNAVAILABLE_AFTER_SEARCH", basis: "no accepted source in family" }));
}

function buildRemainingCaps(state) {
  return {
    family_counts: countBy(state.lossless_text_artifacts, "source_family"),
    subfamily_counts: countBy(state.lossless_text_artifacts, "source_subfamily"),
    family_caps: S0_FAMILY_CAPS
  };
}

function missingCandidateFamilies(state) {
  const counts = countBy(state.candidate_sources.filter((row) => row.final_status !== "REJECTED"), "source_family");
  return S0_SOURCE_FAMILY_ORDER.filter((family) => !counts[family]);
}

function rebuildCandidateRoutesByFamily(state) {
  const routes = blankCandidateRoutesByFamily();
  for (const candidate of state.candidate_sources) {
    if (routes[candidate.source_family]) routes[candidate.source_family].push(candidate.canonical_url || candidate.candidate_url);
  }
  state.navigation_map.candidate_routes_by_family = routes;
}

function addDedupeRecord(state, recordInput) {
  const record = {
    dedupe_record_id: `dedupe_${String(++state.runtime.dedupe_seq).padStart(4, "0")}`,
    dedupe_type: recordInput.dedupe_type,
    canonical_candidate_source_id: recordInput.canonical_candidate_source_id || "",
    suppressed_candidate_source_ids: recordInput.suppressed_candidate_source_ids || [],
    dedupe_basis: recordInput.dedupe_basis || [],
    model_review_ref: recordInput.model_review_ref || "",
    not_silently_dropped: true
  };
  state.dedupe_records.push(record);
  state.dedupe_log.push({ ...record, at: iso() });
}

function addCollectionLimitation(state, row) {
  state.collection_limitations.push({
    limitation_id: `lim_${String(++state.runtime.limitation_seq).padStart(4, "0")}`,
    limitation_type: row.limitation_type,
    affected_family: row.affected_family || "",
    affected_subfamily: row.affected_subfamily || "",
    affected_item_ids: row.affected_item_ids || [],
    basis: row.basis || "",
    downstream_effect: row.downstream_effect || "",
    forensic_ref: row.forensic_ref || ""
  });
}

function addFailureTicket(state, row) {
  const ticket = {
    failure_id: `fail_${String(++state.runtime.failure_seq).padStart(4, "0")}`,
    gate_id: row.gate_id,
    failed_condition: row.failed_condition,
    affected_item_ids: row.affected_item_ids || [],
    failure_severity: row.severity,
    repair_route: row.repair_route,
    attempt_count: 0,
    max_attempts: S0_MAX_REPAIR_ATTEMPTS,
    final_status: row.final_status || "PASSED_WITH_WARNING"
  };
  state.validation_repair_log.push(ticket);
  return ticket;
}

function fatalBoundary(state, condition) {
  addFailureTicket(state, { gate_id: "G1", failed_condition: condition, severity: "FATAL", repair_route: "SCHEMA_REPAIR", final_status: "FATAL" });
  throw new Error(`S0_BOUNDARY_FATAL: ${condition}`);
}

function repairTerminalShape(output) {
  return {
    hybrid_extraction_manifest: orderObject(output.hybrid_extraction_manifest || {}, S0_HYBRID_EXTRACTION_MANIFEST_TOP_LEVEL_FIELDS),
    extraction_forensic_ledger: orderObject(output.extraction_forensic_ledger || {}, S0_EXTRACTION_FORENSIC_LEDGER_TOP_LEVEL_FIELDS)
  };
}

function orderObject(obj, fields) {
  const ordered = {};
  for (const field of fields) ordered[field] = obj[field] ?? defaultValueForField(field);
  return ordered;
}

function defaultValueForField(field) {
  if (field.endsWith("_log") || field.endsWith("s") || field.includes("records") || field.includes("limitations")) return [];
  return {};
}

function compactCandidates(candidates) {
  return candidates.map((row) => ({ candidate_source_id: row.candidate_source_id, candidate_url: row.candidate_url, route_source: row.route_source, route_basis: row.route_basis }));
}

function stripCandidate(row) {
  return {
    candidate_source_id: row.candidate_source_id,
    candidate_url: row.candidate_url,
    canonical_url: row.canonical_url,
    source_family: row.source_family,
    source_subfamily: row.source_subfamily,
    route_source: row.route_source,
    route_basis: row.route_basis,
    scope_class: row.scope_class,
    fetch_decision: row.fetch_decision,
    fetch_decision_reason: row.fetch_decision_reason,
    final_status: row.final_status
  };
}

function markDeferred(candidate, reason) {
  candidate.fetch_decision = "DEFER";
  candidate.fetch_decision_reason = reason;
  candidate.final_status = "DEFERRED";
}

function markRejected(candidate, reason) {
  candidate.fetch_decision = "REJECT";
  candidate.fetch_decision_reason = reason;
  candidate.final_status = "REJECTED";
}

function findCandidate(state, id) {
  return state.candidate_sources.find((row) => row.candidate_source_id === id);
}

function nextArtifactId(state) {
  return `art_${String(++state.runtime.artifact_seq).padStart(4, "0")}`;
}

function normalizeRouteSource(routeSource) {
  if (routeSource === "HASH" || routeSource === "HASH_ROUTE_ROUTE") return "HASH_ROUTE";
  return routeSource || "ROOT";
}

function logEvent(state, event, data = {}) {
  state.ledger_events.push({ event, ...data, at: iso() });
}

function logModel(state, reviewType, data = {}) {
  state.model_review_log.push({ review_type: reviewType, ...data, at: iso() });
}

function countBy(items, key) {
  const out = {};
  for (const item of items || []) {
    const value = item?.[key] || "UNKNOWN";
    out[value] = (out[value] || 0) + 1;
  }
  return out;
}

function isUrlMode(state) {
  return ["url", "url_plus_text"].includes(state.run.source_mode);
}

function parseMaybeJson(value) {
  if (!value) return value;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return { raw: String(value) };
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function joinBasis(a, b) {
  return [a, b].filter(Boolean).join(" | ");
}

function iso() {
  return new Date().toISOString();
}

function isoNow(now) {
  return now().toISOString();
}

function randomId(length) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
}

function stringOr(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
