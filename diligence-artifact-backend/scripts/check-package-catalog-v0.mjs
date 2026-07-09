import assert from "node:assert/strict";
import { loadPackageCatalogV0 } from "../src/runtime/domain-gate/package-catalog.loader.js";

const catalog = await loadPackageCatalogV0();
assert.equal(catalog.catalog_id, "domain_package_catalog_v0");
assert.equal(catalog.version, "0.1");
assert.equal(catalog.runtime_mode, "passive_manifest");
for (const id of ["ai-governance", "fintech", "healthtech", "hrtech", "legaltech", "unknown"]) assert.ok(catalog.primary_domain_packages.includes(id), `missing primary domain ${id}`);
for (const id of ["ai-native", "payments", "biometrics", "identity-verification"]) assert.ok(catalog.capability_overlays.includes(id), `missing capability overlay ${id}`);
for (const id of ["privacy", "gdpr", "india-dpdp", "eu-ai-act", "hipaa"]) assert.ok(catalog.regulatory_overlays.includes(id), `missing regulatory overlay ${id}`);
assert.ok(catalog.review_overlays.includes("qualified-review"), "qualified-review review overlay required");

console.log(JSON.stringify({ check: "package catalog v0", status: "PASS" }, null, 2));
