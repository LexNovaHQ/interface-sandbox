import { M11_PHASE2G_RUNTIME_STATUS as CORE_STATUS, runM11OrchestratedPhase as runCoreM11 } from "./m11-orchestrator-m11v2.js";

const STATIC_PACKAGE_REFERENCE_NAMES = new Set([
  "AI_THREAT_REGISTRY.yaml",
  "AI_Registry_Key.yml",
  "FinTech_Threat_Registry.yaml",
  "FinTech_Registry_Key.yml"
]);
const SHARED_REFERENCE_NAMES = Object.freeze([
  "03_REGISTRY_EVALUATION_RULES.yaml",
  "Diligence_Field_Derivation_Registry.yml",
  "FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml"
]);

export const M11_PHASE2G_RUNTIME_STATUS = Object.freeze({
  ...CORE_STATUS,
  final_runtime_package_sync: "CO_11_COMPLETE",
  runtime_contract_version: "v18_final_runtime_package_downstream_sync",
  static_package_reference_injection_forbidden: true,
  selected_registry_references_loaded_dynamically: true,
  dedicated_validation_suite: "check:phase10-full",
  downstream_compatibility_status: "CO_13_ACTIVE"
});

export async function runM11OrchestratedPhase({ contract = {}, ...args } = {}) {
  const synchronizedContract = {
    ...contract,
    references: synchronizeReferences(contract.references),
    phase10_runtime_contract_version: "v18_final_runtime_package_downstream_sync",
    static_package_reference_injection_forbidden: true,
    selected_registry_references_loaded_dynamically: true
  };
  return runCoreM11({ ...args, contract: synchronizedContract });
}

export function synchronizeReferences(references = []) {
  const supplied = Array.isArray(references) ? references : [];
  const filtered = supplied.filter((value) => !STATIC_PACKAGE_REFERENCE_NAMES.has(String(value || "").split("/").pop()));
  return [...new Set([...filtered, ...SHARED_REFERENCE_NAMES])];
}
