import assert from "node:assert/strict";
import { buildActiveRunPackageManifestV0 } from "../src/runtime/domain-gate/active-run-package-manifest.schema.js";
import { loadPackageCatalogV0 } from "../src/runtime/domain-gate/package-catalog.loader.js";
import { validateActiveRunPackageManifestV0 } from "../src/runtime/domain-gate/domain-preflight.validator.js";

const catalog = await loadPackageCatalogV0();
const manifest = buildActiveRunPackageManifestV0({ run: { run_id: "LN-TEST-MANIFEST" }, catalog });
const result = validateActiveRunPackageManifestV0(manifest, catalog);
assert.deepEqual(result.errors, []);
assert.equal(manifest.selection_stage, "PRE_PHASE_1");
assert.equal(manifest.primary_domain_package, null);
assert.equal(manifest.adapter_mode, "passive_manifest");
assert.ok(Object.values(manifest.runtime_flags).every((value) => value === false), "all runtime flags must be false");
assert.equal(manifest.review_overlay.package_id, "qualified-review");
assert.equal(manifest.review_overlay.status, "LOCKED");

console.log(JSON.stringify({ check: "active run package manifest v0", status: "PASS" }, null, 2));
