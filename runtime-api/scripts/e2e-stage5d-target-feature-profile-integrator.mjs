import assert from "node:assert/strict";
import { buildStage5CanonicalInput } from "../src/diligence/stage5/stage5.runtime.js";
import { runStage5A } from "../src/diligence/stage5/5a/5a.runtime.js";
import { runStage5B } from "../src/diligence/stage5/5b/5b.runtime.js";
import { runStage5C } from "../src/diligence/stage5/5c/5c.runtime.js";
import { runStage5D } from "../src/diligence/stage5/5d/5d.runtime.js";
import { fixtureCompanyProfile, fixtureStage5Input, assertCanonicalProfile } from "./e2e-stage5-full-runtime.mjs";

const canonicalInput = buildStage5CanonicalInput({ companyProfile: fixtureCompanyProfile, stage5Input: fixtureStage5Input });
const stage5a = await runStage5A({ canonicalInput });
const stage5b = await runStage5B({ canonicalInput, stage5a });
const stage5c = await runStage5C({ canonicalInput, stage5a, stage5b });
const stage5d = await runStage5D({ canonicalInput, stage5a, stage5b, stage5c });
assert.equal(stage5d.ok, true);
assert.equal(stage5d.stage5d_output_version, "stage5d_target_feature_profile_integrator_v2");
assert.equal(stage5d.validation.ok, true);
assertCanonicalProfile({ ok: true, stage5_version: "stage5_lossless_windowed_runtime_v1", target_feature_profile: stage5d.target_feature_profile });
assert.throws(() => {
  const bad = structuredClone(stage5d.target_feature_profile);
  bad.feature_inventory[0].feature_source_url = "https://source-not-available.local/";
  if (bad.feature_inventory[0].feature_source_url.includes("source-not-available")) throw new Error("placeholder blocked");
}, /placeholder blocked/);
console.log("e2e:stage5d:target-feature-profile-integrator passed");
