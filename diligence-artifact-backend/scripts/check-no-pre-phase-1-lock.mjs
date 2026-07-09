import assert from "node:assert/strict";
import { runPrePhase1DomainPreflight } from "../src/runtime/domain-gate/pre-phase-1-domain-preflight.js";

const result = await runPrePhase1DomainPreflight({
  run: {
    run_id: "LN-TEST-NO-PRE-PHASE-1-LOCK",
    target: "sarvam.ai",
    user_declared_domain: "AI",
    product_description: "AI model and speech platform"
  }
});

const profile = result.output.domain_selection_profile;
const manifest = result.output.active_run_package_manifest;
assert.equal(Object.hasOwn(profile, "locked_primary_domain"), false, "locked_primary_domain must not exist");
assert.equal(Object.hasOwn(profile, "locked_capability_overlays"), false, "locked_capability_overlays must not exist");
assert.equal(Object.hasOwn(profile, "locked_regulatory_overlays"), false, "locked_regulatory_overlays must not exist");
for (const candidate of [
  ...profile.provisional_primary_domain_candidates,
  ...profile.provisional_capability_overlay_candidates,
  ...profile.provisional_regulatory_overlay_candidates
]) {
  assert.notEqual(candidate.status, "LOCKED", `candidate must not be LOCKED: ${candidate.package_id}`);
  assert.equal(candidate.lock_allowed, false, `candidate lock_allowed must be false: ${candidate.package_id}`);
}
assert.equal(manifest.primary_domain_package, null, "manifest primary_domain_package must be null");
assert.deepEqual(manifest.capability_overlays, [], "manifest capability_overlays must be empty");
assert.deepEqual(manifest.regulatory_overlays, [], "manifest regulatory_overlays must be empty");

console.log(JSON.stringify({ check: "no pre phase 1 lock", status: "PASS" }, null, 2));
