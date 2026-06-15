import assert from "node:assert/strict";
import { buildStage5CanonicalInput } from "../src/diligence/stage5/stage5.runtime.js";
import { runStage5A } from "../src/diligence/stage5/5a/5a.runtime.js";
import { fixtureCompanyProfile, fixtureStage5Input, assertWindowIntegrity } from "./e2e-stage5-full-runtime.mjs";

const canonicalInput = buildStage5CanonicalInput({ companyProfile: fixtureCompanyProfile, stage5Input: fixtureStage5Input });
const stage5a = await runStage5A({ canonicalInput });
assert.equal(stage5a.ok, true);
assert.ok(stage5a.admitted_functions.length >= 5);
assert.ok(stage5a.admitted_functions.every((row) => row.function_id && row.source_window_refs.length));
assertWindowIntegrity(canonicalInput, stage5a.feature_evidence_windows);
assert.ok(stage5a.prompt_input.reference_only.metadata_sidecar.length > 0);
assert.ok(stage5a.prompt_input.reference_only.navigation_index_sidecar.every((row) => row.verbatim_text === undefined));
console.log("e2e:stage5a:product-function-discovery passed");
