import assert from "node:assert/strict";

import {
  buildFeatureCandidateInventoryBaseline,
  validateFeatureCandidateInventoryIndex
} from "../src/phases/05-activity-profile-review/services/activity-candidate-inventory-index.builder.js";
import {
  buildSemanticSupportUnavailableReceipt,
  reconcileSemanticCandidateSupport,
  validateSemanticCandidateSupportProposal,
  SEMANTIC_CANDIDATE_SUPPORT_REJECTION_CODES as R
} from "../src/phases/05-activity-profile-review/services/activity-candidate-inventory-semantic-support.js";

const sourceRoot = "lossless_root__product_service";
const pointer1 = pointer("LOC.001", "unit-product-1", "SRC.001");
const pointer2 = pointer("LOC.002", "unit-product-2", "SRC.002");
const pointer3 = pointer("LOC.003", "unit-product-3", "SRC.003");

const index = {
  run_id: "PHASE5-LAYER1-SEMANTIC-CHECK",
  activity_candidate_source_locator_map: [
    locator(pointer1, "Activity One"),
    locator(pointer2, "Activity Two"),
    locator(pointer3, "Activity Three")
  ]
};

const losslessUnitsByRoot = {
  [sourceRoot]: {
    units: [
      { unit_id: "unit-product-1", source_id: "SRC.001", title: "Activity One" },
      { unit_id: "unit-product-2", source_id: "SRC.002", title: "Activity Two" },
      { unit_id: "unit-product-3", source_id: "SRC.003", title: "Activity Three" }
    ]
  }
};

const baseline = buildFeatureCandidateInventoryBaseline(
  { activity_profile_source_index: index },
  losslessUnitsByRoot,
  { runId: "PHASE5-LAYER1-SEMANTIC-CHECK" }
);

assert.equal(validateFeatureCandidateInventoryIndex(baseline).status, "PASS");
assert.equal(baseline.candidates.length, 3);

const authority = {
  deterministicBaseline: baseline,
  routedArtifactNames: [sourceRoot],
  indexLocatorRows: index.activity_candidate_source_locator_map,
  indexMappedUnitIds: ["unit-product-1", "unit-product-2", "unit-product-3"],
  permittedEvidenceRoots: [sourceRoot]
};

assertAccepted(proposal("P.RECOVER", "RECOVER_CANDIDATE", [], [candidate("Recovered Activity", "PRODUCT_CAPABILITY_ROUTE", "recovered-activity")], [pointer3]));
assertAccepted(proposal("P.MERGE", "MERGE_CANDIDATES", ["FC.001", "FC.002"], [candidate("Merged Activity", "PRODUCT_CAPABILITY_ROUTE", "merged-activity")], [pointer1, pointer2]));
assertAccepted(proposal("P.SPLIT", "SPLIT_CANDIDATE", ["FC.001"], [candidate("Split Activity A", "PRODUCT_CAPABILITY_ROUTE", "split-a"), candidate("Split Activity B", "PRODUCT_CAPABILITY_ROUTE", "split-b")], [pointer1]));
assertAccepted(proposal("P.RENAME", "RENAME_CANDIDATE", ["FC.001"], [{ ...candidate("Renamed Activity One", baseline.candidates[0].activity_route_class, baseline.candidates[0].capability_key), candidate_type: baseline.candidates[0].candidate_type }], [pointer1]));
assertAccepted(proposal("P.REJECT", "REJECT_CANDIDATE", ["FC.001"], [], [pointer1]));

assertRejected({
  proposal: proposal("P.BAD.ACTION", "INVENT_ACTIVITY", [], [candidate("Bad", "PRODUCT_CAPABILITY_ROUTE", "bad")], [pointer1]),
  code: R.UNSUPPORTED_SEMANTIC_ACTION
});
assertRejected({
  proposal: proposal("P.UNKNOWN", "RENAME_CANDIDATE", ["FC.999"], [candidate("Bad", "PRODUCT_CAPABILITY_ROUTE", "bad")], [pointer1]),
  code: R.UNKNOWN_TARGET_CANDIDATE
});
assertRejected({
  proposal: proposal("P.UNROUTED", "RECOVER_CANDIDATE", [], [candidate("Bad", "PRODUCT_CAPABILITY_ROUTE", "bad")], [{ ...pointer1, source_artifact: "lossless_root__unrouted" }]),
  code: R.UNROUTED_SOURCE_POINTER
});
assertRejected({
  proposal: proposal("P.UNINDEXED", "RECOVER_CANDIDATE", [], [candidate("Bad", "PRODUCT_CAPABILITY_ROUTE", "bad")], [{ ...pointer1, unit_id: "missing-unit" }]),
  code: R.UNINDEXED_SOURCE_POINTER
});
assertRejected({
  proposal: proposal("P.ROOT", "RECOVER_CANDIDATE", [], [{ ...candidate("Bad", "PRODUCT_CAPABILITY_ROUTE", "bad"), source_root: "lossless_root__unauthorized" }], [{ ...pointer1, source_root: "lossless_root__unauthorized" }]),
  code: R.UNAUTHORIZED_SOURCE_ROOT
});
assertRejected({
  proposal: { ...proposal("P.TAX", "RECOVER_CANDIDATE", [], [candidate("Bad", "PRODUCT_CAPABILITY_ROUTE", "bad")], [pointer1]), package_id: "ai-governance" },
  code: R.PACKAGE_TAXONOMY_FORBIDDEN
});
assertRejected({
  proposal: { ...proposal("P.TEXT", "RECOVER_CANDIDATE", [], [candidate("Bad", "PRODUCT_CAPABILITY_ROUTE", "bad")], [pointer1]), text: "copied evidence" },
  code: R.EVIDENCE_TEXT_FORBIDDEN
});
assertRejected({
  proposal: { ...proposal("P.CONFIDENCE", "RECOVER_CANDIDATE", [], [candidate("Bad", "PRODUCT_CAPABILITY_ROUTE", "bad")], [pointer1]), confidence: 0.9 },
  code: R.CONFIDENCE_FIELD_FORBIDDEN
});

const duplicateReceipt = reconcileSemanticCandidateSupport({
  ...authority,
  semanticProposalInput: packet([
    proposal("P.DUP", "REJECT_CANDIDATE", ["FC.001"], [], [pointer1]),
    proposal("P.DUP", "REJECT_CANDIDATE", ["FC.002"], [], [pointer2])
  ])
}).receipt;
assert.equal(duplicateReceipt.status, "OUTPUT_REJECTED");
assert.ok(duplicateReceipt.rejected_proposals.some((entry) => entry.rejection_codes.includes(R.DUPLICATE_PROPOSAL_ID)));

const partial = reconcileSemanticCandidateSupport({
  ...authority,
  semanticProposalInput: packet([
    proposal("P.OK", "RENAME_CANDIDATE", ["FC.001"], [{ ...candidate("Renamed Activity One", baseline.candidates[0].activity_route_class, baseline.candidates[0].capability_key), candidate_type: baseline.candidates[0].candidate_type }], [pointer1]),
    proposal("P.BAD", "RENAME_CANDIDATE", ["FC.999"], [candidate("Missing", "PRODUCT_CAPABILITY_ROUTE", "missing")], [pointer2])
  ])
});
assert.equal(partial.receipt.status, "APPLIED");
assert.equal(partial.receipt.accepted_count, 1);
assert.equal(partial.receipt.rejected_count, 1);
assert.equal(validateFeatureCandidateInventoryIndex(partial.inventory).status, "PASS");

const unavailable = buildSemanticSupportUnavailableReceipt({ deterministicBaseline: baseline });
assert.equal(unavailable.status, "UNAVAILABLE");
assert.equal(unavailable.attempted, true);

const malformed = reconcileSemanticCandidateSupport({
  ...authority,
  semanticProposalInput: { semantic_candidate_support_proposal: { proposal_version: "v1", proposals: "not-array", limitations: [] } }
});
assert.equal(malformed.receipt.status, "OUTPUT_REJECTED");
assert.ok(malformed.receipt.limitations.includes("SEMANTIC_SUPPORT_PACKET_REJECTED"));

const oldPluralPacket = reconcileSemanticCandidateSupport({
  ...authority,
  semanticProposalInput: { semantic_candidate_support_proposals: [] }
});
assert.equal(oldPluralPacket.receipt.status, "OUTPUT_REJECTED");

const recovered = reconcileSemanticCandidateSupport({
  ...authority,
  semanticProposalInput: packet([
    proposal("P.RECOVER.FINAL", "RECOVER_CANDIDATE", [], [candidate("Recovered Activity", "PRODUCT_CAPABILITY_ROUTE", "recovered-activity")], [pointer3])
  ])
});
assert.equal(recovered.receipt.status, "APPLIED");
assert.equal(validateFeatureCandidateInventoryIndex(recovered.inventory).status, "PASS");
assert.deepEqual(recovered.inventory.candidates.map((entry) => entry.candidate_id), recovered.inventory.candidates.map((_, index) => `FC.${String(index + 1).padStart(3, "0")}`));

console.log("Activity candidate semantic support: PASS");

function assertAccepted(input) {
  const validation = validateSemanticCandidateSupportProposal({ ...authority, proposal: input });
  assert.equal(validation.status, "ACCEPTED", JSON.stringify(validation, null, 2));
}

function assertRejected({ proposal: input, code }) {
  const validation = validateSemanticCandidateSupportProposal({ ...authority, proposal: input });
  assert.equal(validation.status, "REJECTED");
  assert.ok(validation.rejection_codes.includes(code), JSON.stringify(validation, null, 2));
}

function packet(proposals, limitations = []) {
  return {
    semantic_candidate_support_proposal: {
      proposal_version: "v1",
      proposals,
      limitations
    }
  };
}

function proposal(proposal_id, action, target_candidate_ids, proposed_candidates, source_pointers) {
  return {
    proposal_id,
    action,
    target_candidate_ids,
    proposed_candidates,
    source_pointers
  };
}

function candidate(candidate_name, activity_route_class, capability_key) {
  return {
    candidate_name,
    candidate_type: "PRODUCT_CAPABILITY",
    activity_route_class,
    capability_key,
    source_root: sourceRoot
  };
}

function pointer(locator_id, unit_id, source_id) {
  return {
    source_artifact: sourceRoot,
    source_id,
    source_root: sourceRoot,
    route_class: "PRODUCT_CAPABILITY_ROUTE",
    route_code: "P2C-ACT-CAND",
    locator_id,
    unit_id,
    source_pointer: { artifact_name: sourceRoot, source_id },
    unit_pointer: { unit_id }
  };
}

function locator(sourcePointer, label) {
  return {
    ...sourcePointer,
    common_root: sourcePointer.source_root,
    route_action: "LOCATE_ONLY",
    candidate_creation_allowed: true,
    context_only: false,
    matched_signal_labels: [label]
  };
}
