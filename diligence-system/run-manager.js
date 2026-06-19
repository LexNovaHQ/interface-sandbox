// diligence-system/run-manager.js
import {
  JOB_NODE_SEQUENCE,
  createRunRecord,
  readRunState,
  writeRunState,
  writeArtifact,
  readArtifacts,
  readArtifact,
  markRunFailed,
  isAllowedJobNode,
  readRunScratchpad,
  writeRunScratchpad,
  writeRunForensics,
} from "./run-store.js";

import { runSingleNode } from "./phase-runner.js";


import {
  buildFailureForensics,
  buildScratchpadContext,
  createRunScratchpad,
  ensureRunScratchpad,
  markNodeCompleted,
  markNodeFailed,
  markNodeStarted,
} from "./scratchpad-manager.js";

const TOTAL_NODES = JOB_NODE_SEQUENCE.length;

const NODE_COMPLETE_MESSAGES = Object.freeze({
  S0: "S0 source collection completed.",
  P1: "P1 evidence box completed.",
  P2: "P2 target profile completed.",
  P3: "P3 target feature profile completed.",
  P4: "P4 legal cartography completed.",
  P5: "P5 data provenance profile completed.",
  P6: "P6 exposure registry completed.",
  P7: "P7 final output handoff completed.",
  RENDERER: "Public report rendered.",
});

function progressFor(completedCount) {
  const safeCompleted = Math.max(0, Math.min(TOTAL_NODES, Number(completedCount) || 0));

  return {
    completed: safeCompleted,
    total: TOTAL_NODES,
    percent: safeCompleted >= TOTAL_NODES
      ? 100
      : Math.round((safeCompleted / TOTAL_NODES) * 100),
  };
}

function publicError(error) {
  if (!error) return "UNKNOWN_ERROR";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || error.name || "UNKNOWN_ERROR";
  if (typeof error === "object" && error.message) return String(error.message);
  return String(error);
}

function uniqueCompletedNodes(nodes = []) {
  const seen = new Set();
  const out = [];

  for (const nodeId of nodes) {
    if (!isAllowedJobNode(nodeId)) continue;
    if (seen.has(nodeId)) continue;
    seen.add(nodeId);
    out.push(nodeId);
  }

  return out.sort((a, b) => JOB_NODE_SEQUENCE.indexOf(a) - JOB_NODE_SEQUENCE.indexOf(b));
}

function nextNodeAfter(nodeId) {
  const idx = JOB_NODE_SEQUENCE.indexOf(nodeId);

  if (idx < 0) {
    throw new Error(`UNKNOWN_JOB_NODE:${nodeId}`);
  }

  return JOB_NODE_SEQUENCE[idx + 1] || null;
}

function normalizeCreatePayload(state) {
  return {
    ok: true,
    run_id: state.run_id,
    status: state.status,
    next_node: state.next_node,
    poll_url: `/api/diligence/jobs/${state.run_id}`,
    advance_url: `/api/diligence/jobs/${state.run_id}/advance`,
  };
}

function normalizeStatePayload(state) {
  return {
    ok: true,
    ...state,
  };
}

function unwrapRendererOutput(rendererArtifact) {
  const output = rendererArtifact?.output || {};

  return {
    ok: true,
    status: output.status || "PUBLIC_REPORT_READY",
    html_report: output.html_report || output.rendered_report || "",
    report_json: output.report_json || output.renderer_output?.report_json || null,
    renderer_output: output.renderer_output || output,
    renderer_trace: output.renderer_trace || null,
    vault_assembly_handoff: output.vault_assembly_handoff || null,
    runtime_orchestration_manifest: output.runtime_orchestration_manifest || null,
  };
}

export async function createRun({ input = {}, baseDir } = {}) {
  const state = await createRunRecord({ input, baseDir });
  const scratchpad = createRunScratchpad({
    runId: state.run_id,
    input,
    state,
  });

  await writeRunScratchpad({
    runId: state.run_id,
    baseDir,
    scratchpad,
  });

  return normalizeCreatePayload(state);
}

export async function getRun({ runId, baseDir } = {}) {
  const state = await readRunState({ runId, baseDir });
  return normalizeStatePayload(state);
}

export async function advanceRun({ runId, callModel, baseDir } = {}) {
  const state = await readRunState({ runId, baseDir });

  if (state.status === "COMPLETE" || state.status === "FAILED") {
    return normalizeStatePayload(state);
  }

  const nodeId = state.next_node;

  if (!isAllowedJobNode(nodeId)) {
    const failedState = await markRunFailed({
      runId,
      failedNode: null,
      baseDir,
      error: `INVALID_NEXT_NODE:${nodeId || "missing"}`,
    });

    return {
      ok: false,
      ...failedState,
      error: `INVALID_NEXT_NODE:${nodeId || "missing"}`,
    };
  }

  const completedBefore = uniqueCompletedNodes(state.completed_nodes || []);
  const existingScratchpad = await readRunScratchpad({ runId, baseDir });
  let runScratchpad = ensureRunScratchpad({
    scratchpad: existingScratchpad,
    runId,
    input: state.input || {},
    state,
  });

  if (completedBefore.includes(nodeId)) {
    const nextNode = nextNodeAfter(nodeId);
    const repairedCompleted = uniqueCompletedNodes(completedBefore);
    const repairedStatus = nextNode ? "RUNNING" : "COMPLETE";

    const repairedState = await writeRunState({
      runId,
      baseDir,
      state: {
        status: repairedStatus,
        current_node: null,
        next_node: nextNode,
        completed_nodes: repairedCompleted,
        progress: progressFor(repairedCompleted.length),
        latest_message: nextNode
          ? `Skipped already completed ${nodeId}.`
          : "Run completed.",
      },
    });

    await writeRunScratchpad({
      runId,
      baseDir,
      scratchpad: ensureRunScratchpad({
        scratchpad: runScratchpad,
        runId,
        input: state.input || {},
        state: repairedState,
      }),
    });

    return normalizeStatePayload(repairedState);
  }

  const runningState = await writeRunState({
    runId,
    baseDir,
    state: {
      status: "RUNNING",
      current_node: nodeId,
      latest_message: `Running ${nodeId}.`,
    },
  });

  runScratchpad = markNodeStarted({
    scratchpad: runScratchpad,
    nodeId,
    state: runningState,
    runId,
    input: state.input || {},
  });

  await writeRunScratchpad({
    runId,
    baseDir,
    scratchpad: runScratchpad,
  });

  try {
    const artifacts = await readArtifacts({ runId, baseDir });
    const scratchpadContext = buildScratchpadContext({
      scratchpad: runScratchpad,
      nodeId,
    });

    const artifact = await runSingleNode({
      run: state.input,
      nodeId,
      artifacts,
      callModel,
      baseDir,
      scratchpadContext,
    });

    if (!artifact || artifact.ok === false) {
      const message = artifact?.error || artifact?.message || `${nodeId}_FAILED`;

      const failedState = await markRunFailed({
        runId,
        failedNode: nodeId,
        baseDir,
        error: message,
      });

      runScratchpad = markNodeFailed({
        scratchpad: runScratchpad,
        nodeId,
        error: message,
        nodeResult: artifact || null,
        state: failedState,
        runId,
        input: state.input || {},
      });

      const forensics = buildFailureForensics({
        runId,
        failedNode: nodeId,
        error: message,
        nodeResult: artifact || null,
        state: failedState,
        input: state.input || {},
        artifacts,
      });

      await writeRunScratchpad({
        runId,
        baseDir,
        scratchpad: runScratchpad,
      });

      await writeRunForensics({
        runId,
        baseDir,
        forensics,
      });

      return {
        ok: false,
        ...failedState,
        error: message,
        node_result: artifact || null,
      };
    }

    const savedArtifact = await writeArtifact({
      runId,
      nodeId,
      artifact,
      baseDir,
    });

    const completedNodes = uniqueCompletedNodes([...completedBefore, nodeId]);
    const nextNode = nextNodeAfter(nodeId);
    const isComplete = !nextNode;

    const nextState = await writeRunState({
      runId,
      baseDir,
      state: {
        status: isComplete ? "COMPLETE" : "RUNNING",
        current_node: null,
        next_node: nextNode,
        failed_node: null,
        completed_nodes: completedNodes,
        progress: progressFor(completedNodes.length),
        latest_message: NODE_COMPLETE_MESSAGES[nodeId] || `${nodeId} completed.`,
      },
    });

    runScratchpad = markNodeCompleted({
      scratchpad: runScratchpad,
      nodeId,
      artifact: savedArtifact,
      state: nextState,
      runId,
      input: state.input || {},
    });

    await writeRunScratchpad({
      runId,
      baseDir,
      scratchpad: runScratchpad,
    });

    return {
      ok: true,
      ...nextState,
      completed_node: nodeId,
      artifact: {
        node_id: savedArtifact.node_id,
        status: savedArtifact.status,
        persisted_at: savedArtifact.persisted_at,
      },
    };
  } catch (error) {
    const message = publicError(error);

    const failedState = await markRunFailed({
      runId,
      failedNode: nodeId,
      baseDir,
      error: message,
    });

    runScratchpad = markNodeFailed({
      scratchpad: runScratchpad,
      nodeId,
      error: message,
      nodeResult: null,
      state: failedState,
      runId,
      input: state.input || {},
    });

    const forensics = buildFailureForensics({
      runId,
      failedNode: nodeId,
      error: message,
      nodeResult: null,
      state: failedState,
      input: state.input || {},
    });

    await writeRunScratchpad({
      runId,
      baseDir,
      scratchpad: runScratchpad,
    });

    await writeRunForensics({
      runId,
      baseDir,
      forensics,
    });

    return {
      ok: false,
      ...failedState,
      error: message,
    };
  }
}

export async function getRunResult({ runId, baseDir } = {}) {
  const state = await readRunState({ runId, baseDir });

  if (state.status !== "COMPLETE") {
    return {
      ok: false,
      status: "RESULT_NOT_READY",
      run_id: runId,
      current_status: state.status,
      current_node: state.current_node,
      next_node: state.next_node,
      completed_nodes: state.completed_nodes || [],
      progress: state.progress || progressFor(0),
      latest_message: state.latest_message || null,
    };
  }

  const rendererArtifact = await readArtifact({
    runId,
    nodeId: "RENDERER",
    baseDir,
  });

  if (!rendererArtifact) {
    return {
      ok: false,
      status: "RESULT_ARTIFACT_MISSING",
      run_id: runId,
      current_status: state.status,
      completed_nodes: state.completed_nodes || [],
      error: "RENDERER_ARTIFACT_NOT_FOUND",
    };
  }

  const rendered = unwrapRendererOutput(rendererArtifact);

  return {
    ...rendered,
    run_id: runId,
    job_state: {
      status: state.status,
      completed_nodes: state.completed_nodes || [],
      progress: state.progress || progressFor(TOTAL_NODES),
      latest_message: state.latest_message || null,
    },
  };
}

export function getJobSequence() {
  return [...JOB_NODE_SEQUENCE];
}
