import assert from "node:assert/strict";
import { buildStage5CanonicalInput } from "../src/diligence/stage5/stage5.runtime.js";
import { runStage5A } from "../src/diligence/stage5/5a/5a.runtime.js";
import { runStage5B } from "../src/diligence/stage5/5b/5b.runtime.js";
import { fixtureCompanyProfile, fixtureStage5Input, assertWindowIntegrity } from "./e2e-stage5-full-runtime.mjs";

const canonicalInput = buildStage5CanonicalInput({ companyProfile: fixtureCompanyProfile, stage5Input: fixtureStage5Input });
const stage5a = await runStage5A({ canonicalInput });
const stage5b = await runStage5B({ canonicalInput, stage5a });
assert.equal(stage5b.ok, true);
assert.equal(stage5b.feature_tags.length, stage5a.admitted_functions.length);
assert.ok(stage5b.feature_tags.every((row) => row.source_window_refs.length && row.archetype_codes.length && row.surface_tokens.length));
assertWindowIntegrity(canonicalInput, stage5a.feature_evidence_windows);
console.log("e2e:stage5b:archetype-surface-tagging passed");
