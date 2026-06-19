// diligence-system/scratchpad-manager.js
// DILIGENCE RUN SCRATCHPAD + FAILURE FORENSICS MANAGER
// Purpose: sidecar observability + model-retention memory for S0 → P7 → RENDERER.
// This module does not change canonical phase outputs. It builds and normalizes
// a run-level forensic scratchpad that can be persisted by run-store.js and
// displayed by the public UI.

const SCRATCHPAD_VERSION = "1.0";
const FORENSICS_VERSION = "1.0";

export const SCRATCHPAD_NODE_SEQUENCE = Object.freeze([
  "S0",
  "P1",
  "P2",
  "P3",
  "P4",
  "P5",
  "P6",
  "P7",
  "RENDERER"
]);

const NODE_LABELS = Object.freeze({
  S0: "Source Extraction",
  P1: "Source Discovery / Evidence Box",
  P2: "Target Profile",
  P3: "Target Feature Profile",
  P4: "Legal Cartography Index",
  P5: "Target Data Provenance Profile",
  P6: "Exposure Registry Ledger",
  P7: "Final Output Compiler",
  RENDERER: "Deterministic Renderer"
});

const DEFAULT_NODE_SCRATCHPAD = Object.freeze({
  status: "PENDING",
  summary: null,
  evidence_refs: [],
  working_notes: [],
  decisions: [],
  gaps: [],
  assumptions: [],
  contradictions: [],
  carry_forward: [],
  risk_flags: [],
  validation_notes: [],
  model_retention_hints: [],
  started_at: null,
  completed_at: null,
  failed_at: null
});

function nowIso() {
  return new Date().toISOString();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value.filter((item) => item !== undefined && item !== null) : [value];
}

function cleanString(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text || null;
}

function truncate(value, max = 1200) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (!text) return "";
  return text.length <= max ? text : `${text.slice(0, max)}…[truncated]`;
}

function safeClone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function uniqueStrings(values = []) {
  const out = [];
  const seen = new Set();
  for (const value of asArray(values)) {
    const text = cleanString(value);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
}

function normalizeNoteArray(values = []) {
  return asArray(values).map((item) => {
    if (typeof item === "string") return { note: item };
    if (isPlainObject(item)) return item;
    return { note: truncate(item, 500) };
  });
}

function normalizeStatus(status, fallback = "PENDING") {
  const value = cleanString(status);
  if (!value) return fallback;
  return value.toUpperCase();
}

function emptyNodeScratchpad(nodeId) {
  return {
    node_id: nodeId,
    node_label: NODE_LABELS[nodeId] || nodeId,
    ...safeClone(DEFAULT_NODE_SCRATCHPAD)
  };
}

function makeEmptyNodeMap() {
  return Object.fromEntries(SCRATCHPAD_NODE_SEQUENCE.map((nodeId) => [nodeId, emptyNodeScratchpad(nodeId)]));
}

export function createRunScratchpad({ runId, input = {}, state = {} } = {}) {
  const createdAt = nowIso();
  return {
    scratchpad_version: SCRATCHPAD_VERSION,
    run_id: runId || state.run_id || null,
    status: state.status || "QUEUED",
    target_url: input.target_url || state.input?.target_url || null,
    company_name: input.company_name || state.input?.company_name || null,
    source_mode: input.source_mode || state.input?.source_mode || null,
    created_at: createdAt,
    updated_at: createdAt,
    node_sequence: [...SCRATCHPAD_NODE_SEQUENCE],
    node_timeline: buildNodeTimeline(state),
    events: [
      makeScratchpadEvent({
        event_type: "JOB_CREATED",
        node_id: null,
        status: state.status || "QUEUED",
        message: "Diligence run created."
      })
    ],
    node_scratchpads: makeEmptyNodeMap(),
    run_memory: {
      evidence_refs: [],
      confirmed_facts: [],
      weak_or_missing_evidence: [],
      assumptions: [],
      contradictions: [],
      carry_forward: [],
      risk_flags: [],
      open_questions: [],
      model_retention_hints: []
    },
    p6_registry_workbench: {
      route_plan_summary: null,
      model_batch_plan: [],
      active_batch_id: null,
      batches: [],
      row_events: [],
      coverage_validation: null
    },
    latest_failure: null
  };
}

export function ensureRunScratchpad({ scratchpad, runId, input = {}, state = {} } = {}) {
  const base = isPlainObject(scratchpad)
    ? safeClone(scratchpad)
    : createRunScratchpad({ runId, input, state });

  base.scratchpad_version = base.scratchpad_version || SCRATCHPAD_VERSION;
  base.run_id = base.run_id || runId || state.run_id || null;
  base.status = state.status || base.status || "UNKNOWN";
  base.target_url = base.target_url || input.target_url || state.input?.target_url || null;
  base.company_name = base.company_name || input.company_name || state.input?.company_name || null;
  base.source_mode = base.source_mode || input.source_mode || state.input?.source_mode || null;
  base.created_at = base.created_at || nowIso();
  base.updated_at = nowIso();
  base.node_sequence = Array.isArray(base.node_sequence) ? base.node_sequence : [...SCRATCHPAD_NODE_SEQUENCE];
  base.node_timeline = buildNodeTimeline(state, base.node_timeline);
  base.events = Array.isArray(base.events) ? base.events : [];
  base.node_scratchpads = isPlainObject(base.node_scratchpads) ? base.node_scratchpads : {};

  for (const nodeId of SCRATCHPAD_NODE_SEQUENCE) {
    base.node_scratchpads[nodeId] = normalizeNodeScratchpad({
      nodeId,
      update: base.node_scratchpads[nodeId]
    });
  }

  base.run_memory = normalizeRunMemory(base.run_memory);
  base.p6_registry_workbench = normalizeP6Workbench(base.p6_registry_workbench);
  base.latest_failure = base.latest_failure || null;
  return base;
}

export function makeScratchpadEvent({ event_type, node_id = null, status = null, message = null, detail = null, at = null } = {}) {
  return {
    event_id: `evt_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    event_type: event_type || "SCRATCHPAD_EVENT",
    node_id,
    status,
    message: message || null,
    detail: detail === undefined ? null : detail,
    at: at || nowIso()
  };
}

export function appendScratchpadEvent({ scratchpad, event, runId, input = {}, state = {} } = {}) {
  const next = ensureRunScratchpad({ scratchpad, runId, input, state });
  next.events.push(makeScratchpadEvent(event || {}));
  next.updated_at = nowIso();
  return trimScratchpad(next);
}

export function markNodeStarted({ scratchpad, nodeId, state = {}, runId, input = {} } = {}) {
  const next = appendScratchpadEvent({
    scratchpad,
    runId,
    input,
    state,
    event: {
      event_type: "NODE_STARTED",
      node_id: nodeId,
      status: "RUNNING",
      message: `Running ${nodeId}.`
    }
  });

  const node = normalizeNodeScratchpad({ nodeId, update: next.node_scratchpads[nodeId] });
  node.status = "RUNNING";
  node.started_at = node.started_at || nowIso();
  next.node_scratchpads[nodeId] = node;
  next.node_timeline = buildNodeTimeline({ ...state, current_node: nodeId }, next.node_timeline);
  next.status = "RUNNING";
  next.updated_at = nowIso();
  return next;
}

export function markNodeCompleted({ scratchpad, nodeId, artifact = {}, state = {}, runId, input = {} } = {}) {
  let next = ensureRunScratchpad({ scratchpad, runId, input, state });
  const update = extractScratchpadUpdate({ nodeId, artifact });
  next = mergeNodeScratchpadUpdate({ scratchpad: next, nodeId, update, artifact });

  next = appendScratchpadEvent({
    scratchpad: next,
    runId,
    input,
    state,
    event: {
      event_type: "NODE_COMPLETED",
      node_id: nodeId,
      status: "LOCKED",
      message: `${nodeId} completed.`,
      detail: summarizeArtifactForScratchpad(artifact)
    }
  });

  const node = normalizeNodeScratchpad({ nodeId, update: next.node_scratchpads[nodeId] });
  node.status = "LOCKED";
  node.completed_at = nowIso();
  next.node_scratchpads[nodeId] = node;
  next.node_timeline = buildNodeTimeline(state, next.node_timeline);
  next.updated_at = nowIso();
  return trimScratchpad(next);
}

export function markNodeFailed({ scratchpad, nodeId, error, nodeResult = null, state = {}, runId, input = {} } = {}) {
  const failure = buildFailureForensics({
    runId: runId || state.run_id,
    failedNode: nodeId,
    error,
    nodeResult,
    state,
    input
  });

  let next = appendScratchpadEvent({
    scratchpad,
    runId,
    input,
    state,
    event: {
      event_type: "NODE_FAILED",
      node_id: nodeId,
      status: "FAILED",
      message: failure.error_message,
      detail: failure.public_summary
    }
  });

  const node = normalizeNodeScratchpad({ nodeId, update: next.node_scratchpads[nodeId] });
  node.status = "FAILED";
  node.failed_at = nowIso();
  node.validation_notes.push({ note: failure.error_message, source: "runtime_failure" });
  next.node_scratchpads[nodeId] = node;
  next.latest_failure = failure;
  next.status = "FAILED";
  next.node_timeline = buildNodeTimeline({ ...state, failed_node: nodeId, status: "FAILED" }, next.node_timeline);
  next.updated_at = nowIso();
  return trimScratchpad(next);
}

export function mergeNodeScratchpadUpdate({ scratchpad, nodeId, update = {}, artifact = {} } = {}) {
  const next = ensureRunScratchpad({ scratchpad });
  const normalized = normalizeNodeScratchpad({ nodeId, update });
  const existing = normalizeNodeScratchpad({ nodeId, update: next.node_scratchpads[nodeId] });

  const merged = {
    ...existing,
    status: normalized.status !== "PENDING" ? normalized.status : existing.status,
    summary: normalized.summary || existing.summary,
    evidence_refs: uniqueStrings([...existing.evidence_refs, ...normalized.evidence_refs]),
    working_notes: [...existing.working_notes, ...normalized.working_notes],
    decisions: [...existing.decisions, ...normalized.decisions],
    gaps: [...existing.gaps, ...normalized.gaps],
    assumptions: [...existing.assumptions, ...normalized.assumptions],
    contradictions: [...existing.contradictions, ...normalized.contradictions],
    carry_forward: [...existing.carry_forward, ...normalized.carry_forward],
    risk_flags: [...existing.risk_flags, ...normalized.risk_flags],
    validation_notes: [...existing.validation_notes, ...normalized.validation_notes],
    model_retention_hints: [...existing.model_retention_hints, ...normalized.model_retention_hints],
    started_at: existing.started_at || normalized.started_at,
    completed_at: normalized.completed_at || existing.completed_at,
    failed_at: normalized.failed_at || existing.failed_at
  };

  next.node_scratchpads[nodeId] = merged;
  next.run_memory = mergeRunMemory(next.run_memory, merged);

  const p6Update = buildP6WorkbenchUpdate({ nodeId, artifact, update });
  if (p6Update) {
    next.p6_registry_workbench = mergeP6Workbench(next.p6_registry_workbench, p6Update);
  }

  next.updated_at = nowIso();
  return trimScratchpad(next);
}

export function extractScratchpadUpdate({ nodeId, artifact = {} } = {}) {
  const output = artifact?.output || artifact || {};
  const candidates = [
    artifact.runtime_scratchpad_update,
    artifact.scratchpad_update,
    output.runtime_scratchpad_update,
    output.phase_scratchpad,
    output.scratchpad_update,
    output.technical_audit_log,
    output[`${nodeId?.toLowerCase?.()}_scratchpad`]
  ].filter(Boolean);

  const base = {
    node_id: nodeId,
    status: artifact?.status || output?.status || "LOCKED",
    summary: deriveNodeSummary({ nodeId, artifact }),
    evidence_refs: [],
    working_notes: [],
    decisions: [],
    gaps: [],
    assumptions: [],
    contradictions: [],
    carry_forward: [],
    risk_flags: [],
    validation_notes: [],
    model_retention_hints: []
  };

  for (const candidate of candidates) {
    const normalized = normalizeNodeScratchpad({ nodeId, update: candidate });
    base.evidence_refs.push(...normalized.evidence_refs);
    base.working_notes.push(...normalized.working_notes);
    base.decisions.push(...normalized.decisions);
    base.gaps.push(...normalized.gaps);
    base.assumptions.push(...normalized.assumptions);
    base.contradictions.push(...normalized.contradictions);
    base.carry_forward.push(...normalized.carry_forward);
    base.risk_flags.push(...normalized.risk_flags);
    base.validation_notes.push(...normalized.validation_notes);
    base.model_retention_hints.push(...normalized.model_retention_hints);
    if (!base.summary && normalized.summary) base.summary = normalized.summary;
  }

  const validationNotes = artifact?.mechanical_validation
    ? [{ note: "Mechanical validation completed.", validation: artifact.mechanical_validation }]
    : [];
  base.validation_notes.push(...validationNotes);

  return normalizeNodeScratchpad({ nodeId, update: base });
}

export function stripScratchpadSidecarFromPhaseOutput(parsed = {}) {
  if (!isPlainObject(parsed)) return parsed;
  const clone = safeClone(parsed);
  delete clone.runtime_scratchpad_update;
  delete clone.phase_scratchpad;
  delete clone.scratchpad_update;
  delete clone.technical_audit_log;
  return clone;
}

export function extractAndStripScratchpadSidecar({ nodeId, parsed = {} } = {}) {
  const scratchpad_update = extractScratchpadUpdate({ nodeId, artifact: { output: parsed } });
  const canonical_output = stripScratchpadSidecarFromPhaseOutput(parsed);
  return { canonical_output, scratchpad_update };
}

export function buildScratchpadContext({ scratchpad, nodeId, maxEvents = 24, maxItems = 40 } = {}) {
  const safe = ensureRunScratchpad({ scratchpad });
  const currentIndex = SCRATCHPAD_NODE_SEQUENCE.indexOf(nodeId);
  const priorNodes = currentIndex >= 0 ? SCRATCHPAD_NODE_SEQUENCE.slice(0, currentIndex) : [];

  const priorNodeSummaries = priorNodes.map((priorNode) => {
    const node = safe.node_scratchpads[priorNode] || emptyNodeScratchpad(priorNode);
    return {
      node_id: priorNode,
      status: node.status,
      summary: node.summary,
      carry_forward: node.carry_forward.slice(-10),
      risk_flags: node.risk_flags.slice(-10),
      gaps: node.gaps.slice(-10)
    };
  });

  return {
    scratchpad_version: safe.scratchpad_version,
    run_id: safe.run_id,
    current_node: nodeId,
    instruction: "Use this as structured operational memory. Do not treat it as final output. Do not expose hidden chain-of-thought. Preserve canonical phase output requirements.",
    prior_events: safe.events.slice(-maxEvents),
    prior_node_summaries: priorNodeSummaries,
    carry_forward: safe.run_memory.carry_forward.slice(-maxItems),
    open_questions: safe.run_memory.open_questions.slice(-maxItems),
    weak_or_missing_evidence: safe.run_memory.weak_or_missing_evidence.slice(-maxItems),
    assumptions: safe.run_memory.assumptions.slice(-maxItems),
    contradictions: safe.run_memory.contradictions.slice(-maxItems),
    risk_flags: safe.run_memory.risk_flags.slice(-maxItems),
    model_retention_hints: safe.run_memory.model_retention_hints.slice(-maxItems),
    p6_registry_workbench: nodeId === "P6" || nodeId === "P7" ? safe.p6_registry_workbench : undefined
  };
}

export function buildPublicScratchpadView({ scratchpad, state = {} } = {}) {
  const safe = ensureRunScratchpad({ scratchpad, state });
  return {
    ok: true,
    scratchpad_version: safe.scratchpad_version,
    run_id: safe.run_id,
    status: state.status || safe.status,
    target_url: safe.target_url,
    company_name: safe.company_name,
    source_mode: safe.source_mode,
    updated_at: safe.updated_at,
    node_timeline: buildNodeTimeline(state, safe.node_timeline),
    events: safe.events,
    node_scratchpads: safe.node_scratchpads,
    run_memory: safe.run_memory,
    p6_registry_workbench: safe.p6_registry_workbench,
    latest_failure: safe.latest_failure
  };
}

export function buildFailureForensics({ runId, failedNode, error, nodeResult = null, state = {}, input = {}, artifacts = null } = {}) {
  const errorMessage = errorMessageFrom(error || nodeResult?.error || nodeResult?.message || state.error?.message);
  return {
    forensics_version: FORENSICS_VERSION,
    run_id: runId || state.run_id || null,
    failed_node: failedNode || state.failed_node || nodeResult?.node_id || null,
    status: "FAILED",
    error_message: errorMessage,
    created_at: nowIso(),
    public_summary: {
      latest_message: state.latest_message || errorMessage,
      completed_nodes: state.completed_nodes || [],
      current_node: state.current_node || null,
      next_node: state.next_node || null,
      progress: state.progress || null
    },
    input: sanitizeInputForForensics(input || state.input || {}),
    node_result: nodeResult || null,
    mechanical_validation: nodeResult?.mechanical_validation || nodeResult?.mechanical_validations || null,
    reference_bundle: nodeResult?.reference_bundle || nodeResult?.reference_bundles || null,
    upstream_keys: nodeResult?.upstream_keys || null,
    model_meta: nodeResult?.model_meta || nodeResult?.model_meta_last || null,
    model_meta_by_phase: nodeResult?.model_meta_by_phase || null,
    parse_repair_trace: nodeResult?.parse_repair_trace || null,
    artifacts_present: artifacts ? Object.keys(artifacts) : null,
    raw_state: state || null
  };
}

export function normalizeNodeScratchpad({ nodeId, update = {} } = {}) {
  const base = emptyNodeScratchpad(nodeId);

  if (!isPlainObject(update)) {
    if (typeof update === "string") {
      base.working_notes.push({ note: update });
    }
    return base;
  }

  const source = update.runtime_scratchpad_update || update.phase_scratchpad || update.scratchpad_update || update;

  base.status = normalizeStatus(source.status, base.status);
  base.summary = cleanString(source.summary || source.phase_summary || source.node_summary || source.message) || base.summary;
  base.evidence_refs = uniqueStrings([
    ...asArray(source.evidence_refs),
    ...asArray(source.important_evidence_refs),
    ...asArray(source.source_refs)
  ]);
  base.working_notes = normalizeNoteArray([
    ...asArray(source.working_notes),
    ...asArray(source.audit_notes),
    ...asArray(source.scratchpad_notes),
    ...asArray(source.row_evaluations)
  ]);
  base.decisions = normalizeNoteArray([
    ...asArray(source.decisions),
    ...asArray(source.classification_decisions),
    ...asArray(source.gate_decisions)
  ]);
  base.gaps = normalizeNoteArray([
    ...asArray(source.gaps),
    ...asArray(source.weak_or_missing_evidence),
    ...asArray(source.evidence_gaps),
    ...asArray(source.missing_signal_fields)
  ]);
  base.assumptions = normalizeNoteArray([
    ...asArray(source.assumptions),
    ...asArray(source.assumptions_made)
  ]);
  base.contradictions = normalizeNoteArray([
    ...asArray(source.contradictions),
    ...asArray(source.contradictions_or_tensions),
    ...asArray(source.document_stack_redline)
  ]);
  base.carry_forward = normalizeNoteArray([
    ...asArray(source.carry_forward),
    ...asArray(source.carry_forward_to_next_phase),
    ...asArray(source.next_phase_instructions),
    ...asArray(source.next_phase_attention)
  ]);
  base.risk_flags = normalizeNoteArray([
    ...asArray(source.risk_flags),
    ...asArray(source.warning_flags),
    ...asArray(source.limitations)
  ]);
  base.validation_notes = normalizeNoteArray([
    ...asArray(source.validation_notes),
    ...asArray(source.validator_notes),
    ...asArray(source.errors),
    ...asArray(source.warnings)
  ]);
  base.model_retention_hints = normalizeNoteArray([
    ...asArray(source.model_retention_hints),
    ...asArray(source.do_not_forget),
    ...asArray(source.retained_variables),
    ...asArray(source.memory_carry_forward)
  ]);
  base.started_at = source.started_at || base.started_at;
  base.completed_at = source.completed_at || base.completed_at;
  base.failed_at = source.failed_at || base.failed_at;
  return base;
}

export function buildNodeTimeline(state = {}, priorTimeline = []) {
  const completed = new Set(asArray(state.completed_nodes));
  const current = state.current_node || null;
  const next = state.next_node || null;
  const failed = state.failed_node || null;
  const priorByNode = new Map(asArray(priorTimeline).map((item) => [item.node_id, item]));

  return SCRATCHPAD_NODE_SEQUENCE.map((nodeId) => {
    const prior = priorByNode.get(nodeId) || {};
    let status = "PENDING";
    if (completed.has(nodeId)) status = "LOCKED";
    if (nodeId === next && state.status !== "COMPLETE") status = status === "LOCKED" ? status : "NEXT";
    if (nodeId === current) status = "RUNNING";
    if (nodeId === failed) status = "FAILED";

    return {
      node_id: nodeId,
      label: NODE_LABELS[nodeId] || nodeId,
      status,
      started_at: prior.started_at || null,
      completed_at: prior.completed_at || null,
      failed_at: prior.failed_at || null
    };
  });
}

function normalizeRunMemory(memory = {}) {
  const source = isPlainObject(memory) ? memory : {};
  return {
    evidence_refs: uniqueStrings(source.evidence_refs),
    confirmed_facts: normalizeNoteArray(source.confirmed_facts),
    weak_or_missing_evidence: normalizeNoteArray(source.weak_or_missing_evidence),
    assumptions: normalizeNoteArray(source.assumptions),
    contradictions: normalizeNoteArray(source.contradictions),
    carry_forward: normalizeNoteArray(source.carry_forward),
    risk_flags: normalizeNoteArray(source.risk_flags),
    open_questions: normalizeNoteArray(source.open_questions),
    model_retention_hints: normalizeNoteArray(source.model_retention_hints)
  };
}

function mergeRunMemory(memory, node) {
  const next = normalizeRunMemory(memory);
  next.evidence_refs = uniqueStrings([...next.evidence_refs, ...node.evidence_refs]);
  next.confirmed_facts.push(...node.decisions.filter((item) => item.fact || item.decision || item.note));
  next.weak_or_missing_evidence.push(...node.gaps);
  next.assumptions.push(...node.assumptions);
  next.contradictions.push(...node.contradictions);
  next.carry_forward.push(...node.carry_forward);
  next.risk_flags.push(...node.risk_flags);
  next.model_retention_hints.push(...node.model_retention_hints);
  return trimRunMemory(next);
}

function trimRunMemory(memory, max = 250) {
  const next = normalizeRunMemory(memory);
  for (const key of Object.keys(next)) {
    if (Array.isArray(next[key]) && next[key].length > max) {
      next[key] = next[key].slice(-max);
    }
  }
  return next;
}

function normalizeP6Workbench(workbench = {}) {
  const source = isPlainObject(workbench) ? workbench : {};
  return {
    route_plan_summary: source.route_plan_summary || null,
    model_batch_plan: Array.isArray(source.model_batch_plan) ? source.model_batch_plan : [],
    active_batch_id: source.active_batch_id || null,
    batches: Array.isArray(source.batches) ? source.batches : [],
    row_events: Array.isArray(source.row_events) ? source.row_events : [],
    coverage_validation: source.coverage_validation || null
  };
}

function buildP6WorkbenchUpdate({ nodeId, artifact = {}, update = {} } = {}) {
  if (nodeId !== "P6") return null;

  const out = { batches: [], row_events: [] };
  const extra = artifact || {};
  const output = artifact?.output || {};

  if (extra.p6_batch_coverage_validation || output.p6_batch_coverage_validation) {
    out.coverage_validation = extra.p6_batch_coverage_validation || output.p6_batch_coverage_validation;
  }

  const routePlanSummary =
    update.route_plan_summary ||
    output.registry_evaluation_trace?.route_plan_summary ||
    output.target_exposure_profile?.route_plan_summary ||
    null;

  if (routePlanSummary) out.route_plan_summary = routePlanSummary;

  const modelBatchPlan =
    update.model_batch_plan ||
    output.registry_evaluation_trace?.model_batch_plan ||
    output.target_exposure_profile?.model_batch_plan ||
    null;

  if (Array.isArray(modelBatchPlan)) out.model_batch_plan = modelBatchPlan;

  const rows = output.target_exposure_profile?.registry_ledger || output.registry_ledger || [];
  if (Array.isArray(rows) && rows.length) {
    out.row_events = rows.map((row) => ({
      row_id: row.threat_id || row.registry_row_id || row.id || null,
      status: row.status || row.final_status || row.registry_status || null,
      route_reason: row.route_reason || row.routing_basis || null,
      basis: row.condition?.basis || row.basis || row.reasoning_basis || null
    }));
  }

  return out;
}

function mergeP6Workbench(existing, update) {
  const base = normalizeP6Workbench(existing);
  if (!update) return base;
  if (update.route_plan_summary) base.route_plan_summary = update.route_plan_summary;
  if (Array.isArray(update.model_batch_plan) && update.model_batch_plan.length) base.model_batch_plan = update.model_batch_plan;
  if (update.active_batch_id) base.active_batch_id = update.active_batch_id;
  if (Array.isArray(update.batches)) base.batches.push(...update.batches);
  if (Array.isArray(update.row_events)) base.row_events.push(...update.row_events);
  if (update.coverage_validation) base.coverage_validation = update.coverage_validation;
  base.batches = base.batches.slice(-100);
  base.row_events = base.row_events.slice(-500);
  return base;
}

function summarizeArtifactForScratchpad(artifact = {}) {
  return {
    node_id: artifact.node_id || null,
    status: artifact.status || null,
    persisted_at: artifact.persisted_at || null,
    mechanical_validation_ok: artifact.mechanical_validation?.ok ?? null,
    mechanical_validation_errors: artifact.mechanical_validation?.errors || [],
    mechanical_validation_warnings: artifact.mechanical_validation?.warnings || []
  };
}

function deriveNodeSummary({ nodeId, artifact = {} } = {}) {
  if (!artifact) return null;
  if (artifact.summary) return artifact.summary;
  if (artifact.output?.summary) return artifact.output.summary;
  if (artifact.status) return `${nodeId} artifact status: ${artifact.status}`;
  return null;
}

function sanitizeInputForForensics(input = {}) {
  const clone = safeClone(input || {});
  if (typeof clone.pasted_public_material === "string" && clone.pasted_public_material.length > 2000) {
    clone.pasted_public_material = `${clone.pasted_public_material.slice(0, 2000)}…[truncated_for_forensics]`;
  }
  return clone;
}

function errorMessageFrom(error) {
  if (!error) return "UNKNOWN_ERROR";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || error.name || "UNKNOWN_ERROR";
  if (isPlainObject(error) && error.message) return String(error.message);
  return truncate(error, 1200);
}

function trimScratchpad(scratchpad, { maxEvents = 1000 } = {}) {
  const next = ensureRunScratchpad({ scratchpad });
  if (next.events.length > maxEvents) next.events = next.events.slice(-maxEvents);
  next.run_memory = trimRunMemory(next.run_memory);
  return next;
}
