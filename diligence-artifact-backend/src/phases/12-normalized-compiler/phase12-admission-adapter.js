import { buildPhase10CompilerCompatibility } from "./phase10-downstream-compatibility.js";
import { assertPhase12ReportContract, loadPhase12ReportContract, uniqueOwnerArtifacts } from "./phase12-report-contract.js";

const FORBIDDEN_PHASE2G_INPUTS = Object.freeze([
  "phase_routing_manifest",
  "phase_route_runtime_packet",
  "phase_route_validation_manifest",
  "phase_2g_route_plan",
  "phase_2g_runtime_packet",
  "2g_bucket",
  "target_profile_bucket",
  "activity_profile_bucket",
  "data_privacy_bucket",
  "domain_control_obligation_bucket",
  "legal_governance_bucket"
]);

const REQUIRED_PHASE10_ARTIFACTS = Object.freeze([
  "active_threat_registry_manifest",
  "exposure_registry_route_plan",
  "exposure_registry_workpad_98",
  "exposure_registry_controlled_profile",
  "exposure_registry_triggered_profile",
  "challenge_gate"
]);

export function buildPhase12AdmissionAdapter({ run = {}, artifacts = {}, contract = loadPhase12ReportContract() } = {}) {
  const reportContract = assertPhase12ReportContract(contract);
  const failures = [];
  const warnings = [];
  for (const key of FORBIDDEN_PHASE2G_INPUTS) {
    if (Object.prototype.hasOwnProperty.call(artifacts, key)) failures.push(`PHASE12_FORBIDDEN_PHASE2G_INPUT_PRESENT:${key}`);
  }
  for (const key of REQUIRED_PHASE10_ARTIFACTS) {
    if (!hasArtifact(artifacts, key)) failures.push(`PHASE12_REQUIRED_PHASE10_ARTIFACT_MISSING:${key}`);
  }
  const phase10 = buildPhase10CompilerCompatibility({ artifacts }).phase10_downstream_compatibility;
  if (phase10.validation?.status === "CONTROLLED_FAILURE") failures.push(...phase10.validation.failures.map((failure) => `PHASE10_GATE:${failure}`));
  if (phase10.validation?.status === "PASS_WITH_LIMITATION") warnings.push(...(phase10.validation.warnings || []).map((warning) => `PHASE10_GATE:${warning}`));

  const requiredOwnerArtifacts = uniqueOwnerArtifacts(reportContract);
  const missingOwnerArtifacts = requiredOwnerArtifacts.filter((name) => !hasArtifact(artifacts, name));
  if (missingOwnerArtifacts.length) failures.push(...missingOwnerArtifacts.map((name) => `PHASE12_OWNER_ARTIFACT_MISSING:${name}`));

  const status = failures.length ? "CONTROLLED_FAILURE" : warnings.length ? "PASS_WITH_LIMITATION" : "PASS";
  return {
    phase12_admission: {
      schema_version: "phase12_admission.v1.direct_profile_exact_gate",
      status,
      run_id: run.run_id || run.id || "",
      doctrine: "Upstream phases decide. Phase 12 arranges.",
      route_contract_status: "CO_P12_03_ACTIVE",
      compiler_runtime_cutover_status: "ADAPTER_READY_NOT_COMPILER_SWAPPED",
      phase2g_inputs_forbidden: true,
      phase2g_inputs_present: FORBIDDEN_PHASE2G_INPUTS.filter((key) => Object.prototype.hasOwnProperty.call(artifacts, key)),
      required_phase10_artifacts: REQUIRED_PHASE10_ARTIFACTS,
      required_owner_artifacts: requiredOwnerArtifacts,
      missing_owner_artifacts: missingOwnerArtifacts,
      phase10_downstream_compatibility: phase10,
      report_contract_validation: reportContract.validation,
      validation: {
        status,
        failures,
        warnings,
        direct_profile_artifacts_only: failures.every((failure) => !failure.startsWith("PHASE12_FORBIDDEN_PHASE2G_INPUT_PRESENT")),
        exact_phase11_gate_enforced: phase10.validation?.phase11_exact_gate_enforced === true,
        route_contract_loaded: reportContract.validation.status === "PASS"
      }
    }
  };
}

export function assertPhase12Admission(value) {
  const admission = value?.phase12_admission || value;
  if (admission?.validation?.status === "CONTROLLED_FAILURE") throw new Error(`PHASE12_ADMISSION_FAILED:${(admission.validation.failures || []).join("|")}`);
  return admission;
}

export { FORBIDDEN_PHASE2G_INPUTS, REQUIRED_PHASE10_ARTIFACTS };

function hasArtifact(artifacts, key) {
  if (!Object.prototype.hasOwnProperty.call(artifacts, key)) return false;
  const value = artifacts[key];
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return String(value).trim().length > 0;
}
