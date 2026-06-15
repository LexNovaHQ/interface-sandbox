import assert from "node:assert/strict";
import { buildStage5CanonicalInput } from "../src/diligence/stage5/stage5.runtime.js";
import { runStage5A } from "../src/diligence/stage5/5a/5a.runtime.js";
import { runStage5B } from "../src/diligence/stage5/5b/5b.runtime.js";
import { runStage5C } from "../src/diligence/stage5/5c/5c.runtime.js";
import { fixtureCompanyProfile, fixtureStage5Input, assertWindowIntegrity } from "./e2e-stage5-full-runtime.mjs";

const canonicalInput = buildStage5CanonicalInput({ companyProfile: fixtureCompanyProfile, stage5Input: fixtureStage5Input });
const stage5a = await runStage5A({ canonicalInput });
const stage5b = await runStage5B({ canonicalInput, stage5a });
const stage5c = await runStage5C({ canonicalInput, stage5a, stage5b });
assert.equal(stage5c.ok, true);
assert.equal(stage5c.complete_feature_records.length, stage5a.admitted_functions.length);
assert.ok(stage5c.complete_feature_records.every((row) => row.evidence_window_refs.length));
assert.ok(stage5c.complete_feature_records.every((row) => row.data_touchpoints.every((tp) => tp.source_window_refs.length)));
assert.ok(stage5c.complete_feature_records.every((row) => row.data_provenance.every((dp) => dp.source_window_refs.length)));
assertWindowIntegrity(canonicalInput, stage5a.feature_evidence_windows);
console.log("e2e:stage5c:complete-feature-records passed");
