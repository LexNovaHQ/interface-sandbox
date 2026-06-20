import assert from "node:assert/strict";
import { buildStage5CanonicalInput } from "../src/diligence/stage5/stage5.runtime.js";
import { runStage5A } from "../src/diligence/stage5/5a/5a.runtime.js";
import { runStage5B } from "../src/diligence/stage5/5b/5b.runtime.js";
import { STAGE5B_ALLOWED_ARCHETYPE_CODES, STAGE5B_ALLOWED_SURFACE_TOKENS, STAGE5B_OUTPUT_VERSION } from "../src/diligence/stage5/5b/5b.dictionary.js";
import { fixtureCompanyProfile, fixtureStage5Input, assertWindowIntegrity } from "./e2e-stage5-full-runtime.mjs";

const canonicalInput = buildStage5CanonicalInput({ companyProfile: fixtureCompanyProfile, stage5Input: fixtureStage5Input });
const stage5a = await runStage5A({ canonicalInput });
const stage5b = await runStage5B({ canonicalInput, stage5a });

assert.equal(stage5b.ok, true);
assert.equal(stage5b.stage5b_output_version, STAGE5B_OUTPUT_VERSION);
assert.equal(stage5b.feature_tags.length, stage5a.admitted_functions.length);
assert.equal(stage5b.tagging_failures.length, 0);
assert.ok(stage5b.supplemental_evidence_windows.length >= stage5a.admitted_functions.length);
assert.ok(stage5b.feature_packets_for_5c.length === stage5b.feature_tags.length);
assert.equal(stage5b.validation.metadata_used_as_primary_source, false);
assert.equal(stage5b.validation.index_used_as_primary_source, false);
assert.equal(stage5b.validation.every_tag_has_inherited_and_supplemental_windows, true);

const allowedArchetypes = new Set(STAGE5B_ALLOWED_ARCHETYPE_CODES);
const allowedSurfaces = new Set(STAGE5B_ALLOWED_SURFACE_TOKENS);
const inheritedWindowIds = new Set(stage5a.feature_evidence_windows.map((window) => window.window_id));
const supplementalWindowIds = new Set(stage5b.supplemental_evidence_windows.map((window) => window.window_id));

for (const tag of stage5b.feature_tags) {
  assert.ok(tag.function_id, "tag must preserve function_id");
  assert.ok(tag.archetype_codes.length, "tag must have archetype codes");
  assert.ok(tag.surface_tokens.length, "tag must have surface tokens");
  assert.ok(tag.inherited_feature_window_refs.length, "tag must cite inherited 5A windows");
  assert.ok(tag.supplemental_tag_window_refs.length, "tag must cite supplemental 5B windows");
  assert.ok(tag.source_window_refs.length >= tag.inherited_feature_window_refs.length, "tag must cite source windows");
  assert.ok(tag.archetype_codes.every((code) => allowedArchetypes.has(code)), "archetype codes must be controlled");
  assert.ok(tag.surface_tokens.every((token) => allowedSurfaces.has(token)), "surface tokens must be controlled");
  assert.ok(tag.inherited_feature_window_refs.every((ref) => inheritedWindowIds.has(ref)), "inherited refs must point to 5A windows");
  assert.ok(tag.supplemental_tag_window_refs.every((ref) => supplementalWindowIds.has(ref)), "supplemental refs must point to 5B windows");
  assert.equal(tag.metadata_used_as_primary_source, false);
  assert.equal(tag.index_used_as_primary_source, false);
}

for (const window of stage5b.supplemental_evidence_windows) {
  assert.equal(window.created_by_substage, "5B");
  assert.equal(window.window_type, "TAGGING_CONTEXT_WINDOW");
  assert.ok(window.parent_window_id, "supplemental window must point to 5A parent window");
  assert.ok(window.used_for.includes("archetype_surface_tagging"));
  assert.ok(window.used_for.includes("5c_feature_record_handoff"));
  assert.equal(window.verbatim_tagging_text, window.verbatim_text);
}

assertWindowIntegrity(canonicalInput, stage5a.feature_evidence_windows);
assertWindowIntegrity(canonicalInput, stage5b.supplemental_evidence_windows);
console.log("e2e:stage5b:archetype-surface-tagging passed");
