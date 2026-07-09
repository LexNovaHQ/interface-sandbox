import assert from "node:assert/strict";
import { runPrePhase1DomainPreflight } from "../src/runtime/domain-gate/pre-phase-1-domain-preflight.js";

const result = await runPrePhase1DomainPreflight({
  run: {
    run_id: "LN-TEST-DOMAIN-GATE-V0",
    target: "https://example.com",
    user_declared_domain: "AI underwriting platform",
    product_description: "AI underwriting platform for lending workflows",
    jurisdiction_hint: "US/EU",
    customer_segment_hint: "financial services",
    regulated_activity_hint: "credit underwriting"
  }
});

const profile = result.output.domain_selection_profile;
const manifest = result.output.active_run_package_manifest;
assert.equal(result.ok, true);
assert.equal(profile.selection_stage, "PRE_PHASE_1");
assert.equal(profile.hook_name, "pre_phase_1_domain_preflight");
assert.ok(profile.provisional_primary_domain_candidates.some((candidate) => candidate.package_id === "fintech"), "fintech must be provisional for underwriting intake");
assert.ok(profile.provisional_capability_overlay_candidates.some((candidate) => candidate.package_id === "ai-native"), "ai-native must be provisional for AI intake");
assert.ok(profile.discovery_hints.every((hint) => hint.may_narrow_discovery === false), "discovery hints must not narrow discovery");
assert.ok(profile.discovery_hints.every((hint) => hint.may_exclude_sources === false), "discovery hints must not exclude sources");
assert.equal(manifest.primary_domain_package, null);
assert.equal(manifest.review_overlay.package_id, "qualified-review");
assert.equal(manifest.review_overlay.status, "LOCKED");
assert.equal(manifest.adapter_mode, "passive_manifest");

console.log(JSON.stringify({ check: "pre phase 1 domain preflight", status: "PASS" }, null, 2));
