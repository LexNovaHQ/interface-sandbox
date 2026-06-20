import assert from "node:assert/strict";
import { buildStage5CanonicalInput } from "../src/diligence/stage5/stage5.runtime.js";
import { runStage5A } from "../src/diligence/stage5/5a/5a.runtime.js";
import { fixtureCompanyProfile, fixtureStage5Input, assertWindowIntegrity } from "./e2e-stage5-full-runtime.mjs";

const canonicalInput = buildStage5CanonicalInput({ companyProfile: fixtureCompanyProfile, stage5Input: fixtureStage5Input });
const stage5a = await runStage5A({ canonicalInput, runContext: { runId: "stage5a_phase4_fixture" } });

assert.equal(stage5a.ok, true);
assert.equal(stage5a.stage5a_output_version, "stage5a_product_function_discovery_v3");
assert.ok(stage5a.admitted_functions.length >= 5);
assert.ok(stage5a.core_products.length >= 5);
assert.ok(stage5a.feature_evidence_windows.length >= 5);
assert.ok(stage5a.admitted_functions.every((row) => row.status === "ADMITTED"));
assert.ok(stage5a.admitted_functions.every((row) => row.function_id && row.core_product_id && row.source_window_refs.length));
assert.ok(stage5a.admitted_functions.every((row) => row.source_window_refs.every((ref) => stage5a.feature_evidence_windows.some((window) => window.window_id === ref))));
assertWindowIntegrity(canonicalInput, stage5a.feature_evidence_windows);
assert.ok(stage5a.feature_evidence_windows.every((window) => window.verbatim_feature_text === window.verbatim_text));
assert.ok(stage5a.feature_evidence_windows.every((window) => window.created_by_substage === "5A"));
assert.ok(stage5a.feature_evidence_windows.every((window) => window.used_for.includes("5b_feature_evidence_handoff")));
assert.equal(stage5a.validation.metadata_used_as_primary_source, false);
assert.equal(stage5a.validation.index_used_as_primary_source, false);
assert.equal(stage5a.forensic_log.handoff_to_5b_contains_verbatim_feature_windows, true);
assert.ok(stage5a.prompt_input.reference_only.metadata_sidecar.length > 0);
assert.ok(stage5a.prompt_input.reference_only.navigation_index_sidecar.every((row) => row.verbatim_text === undefined));
assert.ok(stage5a.prompt_input.source_reading_windows.every((window) => window.verbatim_text && window.source_sha256));

console.log("e2e:stage5a:product-function-discovery passed");
