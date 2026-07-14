import fs from "node:fs";

const manifestFile = "src/runtime/domain-gate/active-run-package-manifest.schema.js";
let manifest = fs.readFileSync(manifestFile, "utf8");
manifest = replaceAllExact(manifest, 'version: "0.2.lifecycle-gated"', 'version: "0.1"');
manifest = manifest.replace(
  'artifact_name: ACTIVE_RUN_PACKAGE_MANIFEST_ARTIFACT_NAME,\n    version: "0.1",',
  'artifact_name: ACTIVE_RUN_PACKAGE_MANIFEST_ARTIFACT_NAME,\n    version: "0.1",\n    lifecycle_schema_version: "DOMAIN_PACKAGE_LIFECYCLE_v1",'
);
manifest = manifest.replace(
  'artifact_name: ACTIVE_RUN_PACKAGE_MANIFEST_ARTIFACT_NAME,\n    version: before.version || "0.1",',
  'artifact_name: ACTIVE_RUN_PACKAGE_MANIFEST_ARTIFACT_NAME,\n    version: before.version || "0.1",\n    lifecycle_schema_version: "DOMAIN_PACKAGE_LIFECYCLE_v1",'
);
fs.writeFileSync(manifestFile, manifest);

const hygieneFile = "scripts/check-phase12-post-clean-production.mjs";
let hygiene = fs.readFileSync(hygieneFile, "utf8");
hygiene = hygiene.replace(
  '  "check:domain-gate-v0",\n',
  '  "check:domain-gate-v0",\n  "check:e2e-authority",\n'
);
hygiene = hygiene.replace(
  'assert.equal(pkg.scripts["check:phase1-16-production"], "node scripts/run-production-gate.mjs");\n',
  'assert.equal(pkg.scripts["check:phase1-16-production"], "node scripts/run-production-gate.mjs");\nassert.equal(pkg.scripts["check:e2e-authority"], "node scripts/check-e2e-outcome-domain-authority.mjs");\n'
);
fs.writeFileSync(hygieneFile, hygiene);
console.log("Certification contracts synchronized");

function replaceAllExact(value, from, to) {
  if (!value.includes(from)) throw new Error(`PATCH_ANCHOR_MISSING:${from}`);
  return value.split(from).join(to);
}
