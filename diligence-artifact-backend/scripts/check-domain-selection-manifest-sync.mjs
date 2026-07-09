import assert from "node:assert/strict";
import { runPrePhase1DomainPreflight } from "../src/runtime/domain-gate/pre-phase-1-domain-preflight.js";
import { validateDomainSelectionManifestSync } from "../src/runtime/domain-gate/domain-preflight.validator.js";

const result = await runPrePhase1DomainPreflight({
  run: {
    run_id: "LN-TEST-DOMAIN-MANIFEST-SYNC",
    target: "https://example.com",
    user_declared_domain: "HealthTech AI triage",
    product_description: "AI triage workflow for clinics"
  }
});

const profile = result.output.domain_selection_profile;
const manifest = result.output.active_run_package_manifest;
const validation = validateDomainSelectionManifestSync({ domain_selection_profile: profile, active_run_package_manifest: manifest });
assert.deepEqual(validation.errors, []);
assert.equal(profile.run_id, manifest.run_id);
assert.equal(profile.selection_stage, manifest.selection_stage);
assert.equal(manifest.primary_domain_package, null);
assert.ok(profile.provisional_primary_domain_candidates.some((candidate) => candidate.package_id === "healthtech"), "healthtech must be provisional from triage intake");
assert.ok(profile.provisional_capability_overlay_candidates.some((candidate) => candidate.package_id === "ai-native"), "ai-native must be provisional from AI intake");

console.log(JSON.stringify({ check: "domain selection manifest sync", status: "PASS" }, null, 2));
