import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { buildQualifiedReviewPresentation } from "../src/phases/13-qualified-review/presentation/qualified-review-presentation.builder.js";
import { mergeDraft, validateDraft } from "../src/runtime/services/qualified-review-draft.service.js";
import { PHASE13_QUALIFIED_REVIEW_RUNTIME_CONTRACT, QUALIFIED_REVIEW_RUNTIME_WRITES } from "../src/runtime/contracts/phase13-runtime.contract.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const presentation = buildQualifiedReviewPresentation({
  run: { run_id: "qr-runtime-fixture", target: "Fixture AI" },
  phase13: {
    qr_registry_resolution_manifest: {
      active_registry_ids: ["UNIVERSAL_QR_BRIDGE_REGISTRY"],
      unresolved_activation_probe_field_ids: [],
      counts: { unresolved_activation_probe_count: 0 }
    },
    qr_active_field_ledger: {
      suppressed_field_ids: [],
      counts: { active_atomic_value_count: 2 },
      active_fields: [
        field("U01", "G01", "Legal entity name", "legal_entity_name", "Fixture AI Ltd.", "PHASE_12"),
        field("U02", "G01", "Entity type", "entity_type", "Private limited company", "MARKET_BASED")
      ],
      sections: [{ section_id: "G01", section_title: "Entity and public identity", registry_scope: "UNIVERSAL", lane: "SHARED", display_order: 1, operator_task: "Review identity.", field_ids: ["U01", "U02"], atomic_value_count: 2, activation_probe_field_ids: [] }]
    }
  }
});

const handoff = presentation.qualified_review_handoff;
assert.equal(handoff.confirmation_unit, "SECTION");
assert.equal(handoff.per_question_confirmation_forbidden, true);
assert.equal(handoff.sections.length, 1);
assert.equal(handoff.sections[0].attestation.confirmation_unit, "SECTION");
assert.equal(handoff.sections[0].fields.some((row) => row.ui?.per_question_confirmation_required === true), false);
assert.equal(presentation.qualified_review_validation_manifest.status, "PASS");

const empty = { artifact_type: "qualified_review_draft", run_id: "qr-runtime-fixture", revision: 0, field_edits: {}, section_attestations: { G01: { status: "ATTESTED", field_state_hash: handoff.sections[0].attestation.field_state_hash } }, reviewer: {} };
const unchanged = mergeDraft({ run: { run_id: "qr-runtime-fixture" }, handoff, current: empty, request_body: { field_edits: { U01: { atomic_values: { legal_entity_name: "Fixture AI Ltd." } }, U02: { atomic_values: { entity_type: "Private limited company" } } } } });
assert.deepEqual(unchanged.field_edits, {});
assert.equal(unchanged.section_attestations.G01.status, "ATTESTED");

const edited = mergeDraft({ run: { run_id: "qr-runtime-fixture" }, handoff, current: unchanged, request_body: { field_edits: { U01: { atomic_values: { legal_entity_name: "Corrected Fixture AI Ltd." } } } } });
assert.equal(edited.field_edits.U01.atomic_values.legal_entity_name, "Corrected Fixture AI Ltd.");
assert.equal(edited.section_attestations.G01, undefined);
assert.deepEqual(edited.changed_section_ids, ["G01"]);

const incomplete = validateDraft({ handoff, draft: edited, require_complete: true });
assert.equal(incomplete.status, "INCOMPLETE");
assert(incomplete.blocking_errors.includes("SECTION_ATTESTATION_REQUIRED:G01"));

assert.equal(PHASE13_QUALIFIED_REVIEW_RUNTIME_CONTRACT.next, "AWAITING_QUALIFIED_REVIEW");
assert.equal(PHASE13_QUALIFIED_REVIEW_RUNTIME_CONTRACT.confirmation_unit, "SECTION");
assert.equal(PHASE13_QUALIFIED_REVIEW_RUNTIME_CONTRACT.per_question_confirmation_forbidden, true);
assert.equal(QUALIFIED_REVIEW_RUNTIME_WRITES.length, 9);

const asyncSource = source("src/runtime/services/async-phase13.service.js");
assert.match(asyncSource, /const QR_JOB = "QUALIFIED_REVIEW"/);
assert.match(asyncSource, /const QR_PAUSE = "AWAITING_QUALIFIED_REVIEW"/);
assert.match(asyncSource, /dispatched_next: false/);
const operatorRoutes = source("src/runtime/routes/operator.routes.js");
assert.match(operatorRoutes, /async-phase13\.service\.js/);
const publicRoutes = source("src/runtime/routes/public.routes.js");
assert.match(publicRoutes, /qualified-review\/:run_id\/draft/);
assert.match(publicRoutes, /sections\/:section_id\/attestation/);
assert.match(publicRoutes, /qualified-review\/:run_id\/submit/);
assert.match(publicRoutes, /QUALIFIED_REVIEW_MATRIX_SUBMISSION_RETIRED/);
assert.doesNotMatch(publicRoutes, /qualified-review-submission\.service\.js/);
const ui = source("public/interface-diligence/diligence-system/qualified-review-system/qualified-review.js");
assert.match(ui, /confirmation_unit: "SECTION"/);
assert.match(ui, /Attest this section/);
assert.match(ui, /Section attestation reset because a field changed/);
assert.doesNotMatch(ui, /review-mode-/);
assert.doesNotMatch(ui, /Reviewer decision/);
assert.doesNotMatch(ui, /\["confirm", "Confirm"\]/);
const html = source("public/interface-diligence/diligence-system/qualified-review.html");
assert.match(html, /Review values and attest each section/);
assert.match(html, /Section-level attestation/);
const internalContract = source("src/runtime/contracts/internal-job.contract.js");
assert.match(internalContract, /phase13_qualified_review_runtime_override_active: true/);

console.log("Phase 13 QR runtime and UI: PASS");
console.log(JSON.stringify({ confirmation_unit: "SECTION", active_sections: 1, active_fields: 2, runtime_writes: QUALIFIED_REVIEW_RUNTIME_WRITES.length, unchanged_values_preserve_provenance: true, edit_resets_section_attestation: true, legacy_responses_endpoint_retired: true }, null, 2));

function field(id, sectionId, label, atomicKey, value, sourceType) {
  return { qr_field_id: id, canonical_key: id.toLowerCase(), label, registry_id: "UNIVERSAL_QR_BRIDGE_REGISTRY", registry_scope: "UNIVERSAL", lane: "SHARED", section_id: sectionId, shape: "SCALAR", fillability: "FULL", required_for_assembly: true, activation_probe: false, atomic_values: { [atomicKey]: { value, source: sourceType, value_state: sourceType === "MARKET_BASED" ? "PROPOSED_MARKET_BASED" : "RESOLVED", demo_not_evidence: sourceType === "MARKET_BASED", phase12_field_ids: sourceType === "PHASE_12" ? ["TP.ID.002"] : [], route_ids: sourceType === "PHASE_12" ? ["P12.ROUTE.TP.ID.002"] : [], report_artifacts: sourceType === "PHASE_12" ? ["report_section__03_target_entity_sector_profile"] : [] } }, source_mix: [sourceType], source_counts: { REVIEWER: 0, PHASE_12: sourceType === "PHASE_12" ? 1 : 0, MARKET_BASED: sourceType === "MARKET_BASED" ? 1 : 0, UNRESOLVED: 0 }, unresolved_atomic_fields: [], review_state: "UNCHANGED", limitation: "", not_applicable: false, document_bindings: [{ document_id: "DOC_AI_A_TOS", actions: ["POPULATE"], document_target: "Preamble" }], document_binding_count: 1, ui: { prompt: label } };
}
function source(path) { return readFileSync(resolve(root, path), "utf8"); }
