import assert from "node:assert/strict";
import { loadDomainDerivationRegistryV0, validateAssembledRegistry, listPackageKeyFiles } from "../src/runtime/domain-gate/domain-derivation-registry.loader.js";

const { registry, catalog } = await loadDomainDerivationRegistryV0();
assert.equal(registry.registry_id, "DILIGENCE_DOMAIN_REGISTRY_v1");
const ids = new Set(registry.rules.map((r) => r.rule_id));
for (const req of ["PRIMARY_DOMAIN_AI_GOVERNANCE", "PRIMARY_DOMAIN_FINTECH", "AI_OVERLAY_MOUNTED", "NO_SUPPORTED_PRIMARY_DOMAIN_LOCK", "DOMAIN_FUSION_CANDIDATE"]) assert.ok(ids.has(req), `missing rule: ${req}`);
const keyFiles = await listPackageKeyFiles();
assert.ok(keyFiles["ai-governance"] && keyFiles.fintech, "auto-discovery must find both keys");
for (const r of registry.rules.filter((x) => x.rule_type === "PRIMARY_DOMAIN")) assert.ok(keyFiles[r.package_id], `primary rule package not discovered: ${r.package_id}`);
assert.ok(registry.grammar.controlled_vocabularies.rule_type.includes("REGULATORY_OVERLAY"));
assert.equal(validateAssembledRegistry({ registry, catalog }).status, "PASS");
assert.ok(!JSON.stringify(registry).includes(["DOMAIN", "DERIVATION", "REGISTRY", "v0"].join("_")));
console.log(JSON.stringify({ check: "domain registry assembled + auto-discovered", status: "PASS", rules: registry.rules.length }, null, 2));
