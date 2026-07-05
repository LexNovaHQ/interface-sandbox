import assert from "node:assert/strict";
import { compileM9HybridCartography } from "../src/m9-hybrid-compiler-v2.js";
import { buildLegalSignalDerivation } from "../src/phases/02-legal-cartography-index/index.js";

const compiled = compileM9HybridCartography({
  deterministicMap: {
    legal_cartography_deterministic_map: {
      document_map: [{ document_id: "DOC-TOS", document_or_artifact: "Terms of Service", artifact_class: "TERMS_OF_SERVICE", source: "https://example.test/terms", source_type: "URL", source_corpus_status: "FOUND_AS_PRIMARY_SOURCE", status: "FOUND_INDEXED" }],
      macro_unit_map: [{ section_id: "SEC-NOTICE", unit_id: "UNIT-NOTICE", document_id: "DOC-TOS", heading_label: "Legal Notices", location_reference: { lossless_artifact_name: "lossless_family__L1_CORE_TERMS_PRIVACY", char_start: 100, char_end: 220 }, status: "FOUND_INDEXED" }],
      semantic_label_queue: [{ queue_id: "Q-NOTICE", unit_id: "UNIT-NOTICE", priority: "P0", semantic_label_required: true }],
      control_language_candidate_map: [],
      missing_source_map: [],
      lock_status: "LOCKED"
    }
  },
  semanticProfile: {
    legal_cartography_semantic_profile: {
      semantic_navigation_index: [{ queue_id: "Q-NOTICE", unit_id: "UNIT-NOTICE", subcats: ["CNS"], control_families: ["CONTACT_ROUTES"], confidence: "CLEAR" }],
      semantic_integrity: { ready_for_compiler: true, coverage_ratio: 1 },
      lock_status: "LOCKED"
    }
  }
});

assert.ok(compiled.legal_cartography_index);
assert.equal(compiled.legal_cartography_index.qualified_review_legal_signals, undefined);
assert.equal(JSON.stringify(compiled).includes("QR-004"), false);
assert.equal(JSON.stringify(compiled).includes("reviewer_question"), false);

const signalOutput = await buildLegalSignalDerivation({
  run: { run_id: "CHECK_M9_SIGNAL" },
  artifacts: {
    legal_cartography_index: {
      contact_grievance_locator: [{ text: "Legal notices and privacy requests may be sent to legal@example.test. Consent may be withdrawn by email." }],
      governing_law_venue_locator: [{ text: "These terms are governed by the laws of India and courts in Bengaluru shall have jurisdiction." }]
    }
  }
});

const profile = signalOutput.legal_signal_derivation_profile;
assert.equal(profile.artifact_name, "legal_signal_derivation_profile");
assert.equal(profile.model_generated, false);
assert.equal(profile.coverage_summary.emitted_field_count, 21);
assert.equal(profile.validation_manifest.qr_pollution_present, false);
assert.equal(profile.validation_manifest.unknown_status_present, false);
assert.ok(profile.field_derivations.some((row) => row.field_id === "LGC.NOT.010"));
assert.ok(profile.field_derivations.some((row) => row.field_id === "DAP.CM.001"));
assert.ok(profile.field_derivations.some((row) => row.field_id === "TP.JUR.003"));

console.log("m9 legal signal derivation profile: PASS");
