import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const files = Object.freeze({
  dispatch: "src/phases/11-operator-challenge/operator-challenge-dispatch.runtime.js",
  checkpoint: "src/phases/11-operator-challenge/operator-challenge-dispatch-checkpoint.js",
  classifier: "src/phases/11-operator-challenge/operator-challenge-attempt-classifier.js",
  ownerAdjudication: "src/phases/11-operator-challenge/operator-challenge-owner-adjudication.js",
  layer3: "src/phases/11-operator-challenge/operator-challenge-adjudication.js",
  semantic: "src/phases/11-operator-challenge/operator-challenge-semantic.js",
  runner: "src/phases/11-operator-challenge/operator-challenge.runner.js",
  registry: "src/phases/11-operator-challenge/operator-challenge-owner-adapter.registry.js",
  commit: "src/phases/11-operator-challenge/operator-challenge-targeted-commit.js",
  phase10: "src/phases/11-operator-challenge/phase10-targeted-reinvestigation.js",
  compiler: "src/phases/12-normalized-compiler/phase10-downstream-compatibility.js"
});

const text = {};
for (const [key, rel] of Object.entries(files)) text[key] = await read(rel);

assertIncludes(text.dispatch, "runPhase11RegisteredOwnerAdapter", "dispatch uses targeted adapter registry");
assertNotIncludes(text.dispatch, "runDomainDerivationPhase", "dispatch must not import ordinary Phase 3 runner");
assertNotIncludes(text.dispatch, "runActivityProfileReviewPhase", "dispatch must not import ordinary Phase 5 runner");
assertNotIncludes(text.dispatch, "runDataProvenanceProfilePhase", "dispatch must not import ordinary Phase 7 runner");
assertNotIncludes(text.dispatch, "runDomainControlObligationProfilePhase", "dispatch must not import ordinary Phase 8 runner");
assertIncludes(text.dispatch, "classifyPhase11AttemptOutcome", "dispatch classifies substantive versus non-substantive outcomes");
assertIncludes(text.dispatch, "NON_SUBSTANTIVE_RETRY_REQUIRED", "dispatch can stop without consuming a substantive attempt");
assertIncludes(text.dispatch, "persistence_before_mutation_guard: false", "dispatch receipts assert no persistence before guard");

assertIncludes(text.checkpoint, "lease_token", "lease requires token");
assertIncludes(text.checkpoint, "renewPhase11DispatchLease", "lease renewal is available");
assertIncludes(text.checkpoint, "PHASE11_DISPATCH_LEASE_TOKEN_MISMATCH", "stale worker cannot release a newer lease");
assertIncludes(text.checkpoint, "sameBaselineVersions", "checkpoint resume validates baseline versions");

assertIncludes(text.classifier, "attempts_used_increment_allowed: false", "classifier can prevent attempt increment");
assertIncludes(text.classifier, "SUBSTANTIVE_ATTEMPT_COMMITTED", "classifier identifies committed substantive attempts");
assertIncludes(text.classifier, "mutation_guard_rejection_is_not_substantive_attempt", "guard rejection is non-substantive");

assertIncludes(text.ownerAdjudication, "substring_order_owner_selection_forbidden", "owner routing forbids substring-order selection");
assertIncludes(text.layer3, "resolvePhase11Owner", "Layer 3 uses deterministic owner resolver");
assertIncludes(text.layer3, "owner_relation", "Layer 3 directives carry owner relation");

assertIncludes(text.semantic, "buildOperatorChallengeSemanticFallbackLedger", "semantic fallback is implemented");
assertIncludes(text.runner, "PASS_WITH_FALLBACK", "runner uses fallback instead of throwing false blocker");
assertNotIncludes(text.runner, "PHASE11_LAYER2_SEMANTIC_LEDGER_INVALID", "runner must not throw on repaired-but-invalid Layer 2 output");

for (const owner of ["P3_DOMAIN_DERIVATION_LAYER", "M8_TARGET_FEATURE_PROFILE", "DATA_PROVENANCE_PROFILE_LAYER4", "DOMAIN_CONTROL_OBLIGATION_PROFILE", "M11"]) assertIncludes(text.registry, owner, `registry contains ${owner}`);
assertIncludes(text.registry, "pending_owner_jobs: []", "all targeted owner adapters are registered");

assertIncludes(text.commit, "validatePhase11WriteManifest", "commit validates exact write manifest");
assertIncludes(text.commit, "validatePhase11TargetedMutation", "commit runs mutation guard before saving");
assertIncludes(text.commit, "persistence_before_mutation_guard: false", "commit receipt asserts guarded persistence");

assertNotIncludes(text.phase10, "saveRuntimeArtifact", "Phase 10 targeted adapter must not save directly");
assertIncludes(text.phase10, "buildPhase11TargetedMutationProposal", "Phase 10 returns staged proposal");

assertIncludes(text.compiler, "PHASE11_CHALLENGE_GATE_NOT_COMPILER_READY", "compiler rejects non-ready challenge gate");
assertIncludes(text.compiler, "phase11_warning_projection", "compiler projects Phase 11 warnings");
assertIncludes(text.compiler, "LOCAL_COUNSEL_REVIEW_REQUIRED", "warnings carry local counsel review route");

console.log("Phase 11 production closure acceptance: PASS");

async function read(rel) { return readFile(path.join(ROOT, rel), "utf8"); }
function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) throw new Error(`FAIL:${label}:${needle}`);
}
function assertNotIncludes(haystack, needle, label) {
  if (haystack.includes(needle)) throw new Error(`FAIL:${label}:${needle}`);
}
