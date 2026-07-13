import { compileFinalOutputHandoff } from "./compiler.js";

export const PHASE12_DIRECT_COMPILER_RUNNER_STATUS = Object.freeze({
  runner: "phase12-compiler.runner",
  phase_owned_path: "src/phases/12-normalized-compiler",
  input_authority: "DIRECT_MATERIAL_PROFILE_ARTIFACTS",
  phase2g_dependency_forbidden: true,
  forensic_inputs_forbidden: true,
  route_workpad_inputs_forbidden: true,
  compiler_mode: "DETERMINISTIC_CLEAN_REPORT_PROJECTION"
});

export async function runPhase12Compiler({ run, internalJobId = "NORMALIZED_COMPILER", contract, readArtifacts } = {}) {
  assertCallback(readArtifacts, "readArtifacts");
  const reads = Array.isArray(contract?.reads) ? contract.reads : [];
  for (const forbidden of ["phase_routing_manifest", "phase_route_runtime_packet", "phase_route_validation_manifest"]) {
    if (reads.includes(forbidden)) throw new Error(`PHASE12_DIRECT_COMPILER_FORBIDDEN_READ:${forbidden}`);
  }
  const artifacts = await readArtifacts({
    reads,
    agent_id: contract?.actor_id || contract?.agent_id || "compiler",
    strict: true
  });
  const output = compileFinalOutputHandoff({ run, artifacts });
  const validation = output?.phase12_compiler_validation?.validation || {};
  if (validation.status === "CONTROLLED_FAILURE") {
    throw new Error(`PHASE12_DIRECT_COMPILER_VALIDATION_FAILED:${(validation.failures || []).join("|")}`);
  }
  if (!output?.report_manifest || !output?.report_handoff || !output?.final_output_handoff) {
    throw new Error("PHASE12_DIRECT_COMPILER_OUTPUT_INCOMPLETE");
  }
  if (Object.keys(output).some((key) => key.startsWith("normalized_section__"))) {
    throw new Error("PHASE12_DIRECT_COMPILER_LEGACY_SECTION_EMITTED");
  }
  if (output.normalized_report_manifest || output.review_ready_section_handoff) {
    throw new Error("PHASE12_DIRECT_COMPILER_LEGACY_ALIAS_EMITTED");
  }
  const phaseLockStatus = validation.status === "PASS" ? "LOCKED" : "LOCKED_WITH_LIMITATIONS";
  return Object.freeze({
    ok: true,
    output,
    phase_lock_status: phaseLockStatus,
    input_mode: "DIRECT_MATERIAL_PROFILE_ARTIFACTS",
    phase2g_dependency_forbidden: true,
    artifacts_read: Object.keys(artifacts).sort()
  });
}

function assertCallback(fn, label) {
  if (typeof fn !== "function") throw new Error(`PHASE12_DIRECT_COMPILER_MISSING_CALLBACK:${label}`);
}
