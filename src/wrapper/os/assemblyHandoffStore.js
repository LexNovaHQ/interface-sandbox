import { createMatterId, saveMatterSnapshot } from "./matterStore.js";

const PENDING_HANDOFF_KEY = "legal_diligence_assembly_os_pending_handoff";
const HANDOFF_HISTORY_KEY = "legal_diligence_assembly_os_handoff_history";

function nowIso() {
  return new Date().toISOString();
}

function safeClone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function readNested(source, paths) {
  for (const path of paths) {
    const value = path.split(".").reduce((cursor, key) => cursor?.[key], source);
    if (value) return value;
  }
  return null;
}

export function extractStage10Handoff(liveResult = {}) {
  const root = liveResult?.stage10_handoff
    || liveResult?.review_ready_remediation_handoff
    || liveResult?.stage10
    || liveResult?.handoff
    || liveResult;

  const handoff_envelope = root?.handoff_envelope
    || root?.handoffEnvelope
    || readNested(liveResult, [
      "handoff_envelope",
      "stage_10.handoff_envelope",
      "artifacts.handoff_envelope"
    ]);

  const assembly_handoff = root?.assembly_handoff
    || root?.assemblyHandoff
    || readNested(liveResult, [
      "assembly_handoff",
      "stage_10.assembly_handoff",
      "artifacts.assembly_handoff"
    ]);

  return { handoff_envelope, assembly_handoff };
}

export function createPendingAssemblyHandoff(liveResult = {}, inputContext = {}) {
  const { handoff_envelope, assembly_handoff } = extractStage10Handoff(liveResult);

  if (!handoff_envelope || !assembly_handoff) {
    throw new Error("Live diligence result did not include a Stage 10 handoff for Assembly.");
  }

  const runId = handoff_envelope.run_id || assembly_handoff?.handoff_meta?.run_id || liveResult?.run_id || `run-${Date.now()}`;
  const matterId = createMatterId({
    targetProfile: assembly_handoff?.target_profile,
    runId
  });

  return {
    pending_handoff_id: `pending-${runId}-${Date.now()}`,
    matter_id: matterId,
    run_id: runId,
    status: "ASSEMBLY_REVIEW",
    source: "live_diligence",
    created_at: nowIso(),
    input_context: safeClone(inputContext),
    handoff_envelope: safeClone(handoff_envelope),
    assembly_handoff: safeClone(assembly_handoff),
    stage9_report_data: safeClone(liveResult?.stage9_report_data),
    html_report: liveResult?.html_report || "",
    live_result_summary: {
      mode: liveResult?.mode || null,
      reviewed_source_count: liveResult?.stage9_report_data?.report?.report_data?.evidence_reviewed?.reviewed_source_count ?? null,
      consolidated_finding_count: liveResult?.stage9_report_data?.report?.report_data?.exposure_findings?.consolidated_count ?? null,
      generated_at: liveResult?.generated_at || nowIso()
    }
  };
}

function readHistory() {
  try {
    return JSON.parse(window.localStorage.getItem(HANDOFF_HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

export function savePendingAssemblyHandoff(pending) {
  if (!pending?.handoff_envelope || !pending?.assembly_handoff) {
    throw new Error("Pending Assembly handoff requires handoff_envelope and assembly_handoff.");
  }

  window.localStorage.setItem(PENDING_HANDOFF_KEY, JSON.stringify(pending));

  const history = readHistory()
    .filter((item) => item?.pending_handoff_id !== pending.pending_handoff_id)
    .slice(0, 9);

  history.unshift({
    pending_handoff_id: pending.pending_handoff_id,
    matter_id: pending.matter_id,
    run_id: pending.run_id,
    source: pending.source,
    created_at: pending.created_at,
    target_profile: pending.assembly_handoff?.target_profile || {}
  });

  window.localStorage.setItem(HANDOFF_HISTORY_KEY, JSON.stringify(history));
  return pending;
}

export function loadPendingAssemblyHandoff() {
  try {
    const raw = window.localStorage.getItem(PENDING_HANDOFF_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingAssemblyHandoff() {
  window.localStorage.removeItem(PENDING_HANDOFF_KEY);
}

export async function pushLiveResultToAssembly(liveResult = {}, inputContext = {}) {
  const pending = savePendingAssemblyHandoff(createPendingAssemblyHandoff(liveResult, inputContext));

  const matterResult = await saveMatterSnapshot({
    matter_id: pending.matter_id,
    run_id: pending.run_id,
    status: "ASSEMBLY_REVIEW",
    target_profile: pending.assembly_handoff?.target_profile || {},
    handoff_envelope: pending.handoff_envelope,
    assembly_handoff: pending.assembly_handoff,
    stage9_report_data: pending.stage9_report_data,
    html_report: pending.html_report,
    vault_payload: null,
    document_stack: {
      status: "PENDING_VAULT_CONFIRMATION",
      route: pending.assembly_handoff?.assembly_route_recommendation || {},
      document_stack_status: pending.assembly_handoff?.document_stack_status || []
    },
    delivery: {
      status: "NOT_READY"
    },
    maintenance: {
      status: "NOT_STARTED"
    },
    input_context: pending.input_context,
    pending_handoff_id: pending.pending_handoff_id
  });

  return {
    ok: true,
    pending,
    matter_result: matterResult
  };
}
