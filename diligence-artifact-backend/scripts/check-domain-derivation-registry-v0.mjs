import { loadDomainDerivationRegistryV0 } from "../src/runtime/domain-gate/domain-derivation-registry.loader.js";

const { registry } = await loadDomainDerivationRegistryV0();

console.log(JSON.stringify({
  check: "domain derivation registry v0",
  status: "PASS",
  registry_id: registry.registry_id,
  schema_version: registry.schema_version,
  rule_count: registry.rules.length,
  enforced_gates: [
    "REGISTRY_ID_LOCKED",
    "PACKAGE_IDS_MATCH_CATALOG",
    "AI_GOVERNANCE_PRIMARY_RULE_PRESENT",
    "FINTECH_PRIMARY_RULE_PRESENT",
    "AI_OVERLAY_RULE_PRESENT",
    "TRIGGER_IF_REFERENCES_DECLARED_CONDITIONS_ONLY",
    "PHASE2_INDEX_AS_EVIDENCE_FORBIDDEN",
    "NO_AI_UNDERSCORE_PACKAGE_ID_DRIFT"
  ]
}, null, 2));
