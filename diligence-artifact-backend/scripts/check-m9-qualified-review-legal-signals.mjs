import assert from "node:assert/strict";
import { compileM9HybridCartography } from "../src/m9-hybrid-compiler-v2.js";

const output = compileM9HybridCartography({
  deterministicMap: {
    legal_cartography_deterministic_map: {
      document_map: [
        {
          document_id: "DOC-TOS",
          document_or_artifact: "Terms of Service",
          artifact_class: "TERMS_OF_SERVICE",
          source: "https://example.test/terms",
          source_type: "URL",
          source_corpus_status: "FOUND_AS_PRIMARY_SOURCE",
          status: "FOUND_INDEXED"
        }
      ],
      macro_unit_map: [
        {
          section_id: "SEC-NOTICE",
          unit_id: "UNIT-NOTICE",
          document_id: "DOC-TOS",
          heading_label: "Legal Notices",
          location_reference: { lossless_artifact_name: "lossless_family__L1_CORE_TERMS_PRIVACY", char_start: 100, char_end: 220 },
          status: "FOUND_INDEXED"
        },
        {
          section_id: "SEC-LIABILITY",
          unit_id: "UNIT-LIABILITY",
          document_id: "DOC-TOS",
          heading_label: "Limitation of Liability",
          location_reference: { lossless_artifact_name: "lossless_family__L1_CORE_TERMS_PRIVACY", char_start: 500, char_end: 700 },
          status: "FOUND_INDEXED"
        },
        {
          section_id: "SEC-SUPPORT",
          unit_id: "UNIT-SUPPORT",
          document_id: "DOC-TOS",
          heading_label: "Support Services",
          location_reference: { lossless_artifact_name: "lossless_family__L1_CORE_TERMS_PRIVACY", char_start: 900, char_end: 1100 },
          status: "FOUND_INDEXED"
        }
      ],
      semantic_label_queue: [
        { queue_id: "Q-NOTICE", unit_id: "UNIT-NOTICE", priority: "P0", semantic_label_required: true },
        { queue_id: "Q-LIABILITY", unit_id: "UNIT-LIABILITY", priority: "P0", semantic_label_required: true },
        { queue_id: "Q-SUPPORT", unit_id: "UNIT-SUPPORT", priority: "P0", semantic_label_required: true }
      ],
      control_language_candidate_map: [],
      missing_source_map: [],
      legal_notice_contact_signal_map: [
        {
          signal_id: "LGC-NOT-010",
          document_id: "DOC-TOS",
          unit_id: "UNIT-NOTICE",
          heading_label: "Legal Notices",
          legal_notice_emails: ["legal@example.test"],
          legal_notice_contact_route: "Email notice route",
          legal_notice_contact_source: "Terms of Service notice section",
          legal_notice_contact_limitation: "Confirm current address before reliance.",
          registry_basis: ["LGC.NOT.010"],
          navigation_pointer: { lossless_artifact_name: "lossless_family__L1_CORE_TERMS_PRIVACY", char_start: 100, char_end: 220 }
        }
      ],
      liability_cap_signal_map: [
        {
          signal_id: "LGC-LOL-001",
          document_id: "DOC-TOS",
          unit_id: "UNIT-LIABILITY",
          heading_label: "Limitation of Liability",
          clause_location: "Terms of Service / Limitation of Liability",
          cap_formula_reference_basis: "Fees paid reference locator",
          cap_period_lookback_window: "Prior 12 months reference locator",
          exclusions_carveouts_signal: "Exclusions locator available",
          fees_pricing_reference_signal: "Pricing reference locator available",
          private_value_required: "Confirm paid fees during qualified review.",
          registry_basis: ["LGC.LOL.001"],
          navigation_pointer: { lossless_artifact_name: "lossless_family__L1_CORE_TERMS_PRIVACY", char_start: 500, char_end: 700 }
        }
      ],
      sla_support_signal_map: [
        {
          signal_id: "LGC-SLA-001",
          document_id: "DOC-TOS",
          unit_id: "UNIT-SUPPORT",
          heading_label: "Support Services",
          sla_support_artifact_found: "Support locator found",
          availability_uptime_commitment_signal: "Availability locator available",
          service_credit_remedy_signal: "Service credit locator available",
          support_tier_response_commitment_signal: "Support tier locator available",
          standard_vs_custom_sla_posture: "Confirm standard or custom posture during qualified review.",
          sla_exclusions_dependencies_signal: "SLA exclusions locator available",
          private_confirmation_required: "Confirm customer support terms.",
          registry_basis: ["LGC.SLA.001"],
          navigation_pointer: { lossless_artifact_name: "lossless_family__L1_CORE_TERMS_PRIVACY", char_start: 900, char_end: 1100 }
        }
      ],
      lock_status: "LOCKED"
    }
  },
  semanticProfile: {
    legal_cartography_semantic_profile: {
      semantic_navigation_index: [
        { queue_id: "Q-NOTICE", unit_id: "UNIT-NOTICE", subcats: ["CNS"], control_families: ["CONTACT_ROUTES"], confidence: "CLEAR" },
        { queue_id: "Q-LIABILITY", unit_id: "UNIT-LIABILITY", subcats: ["LIA"], control_families: ["COMMERCIAL_LEGAL_ALLOCATION"], confidence: "CLEAR" },
        { queue_id: "Q-SUPPORT", unit_id: "UNIT-SUPPORT", subcats: ["CNS"], control_families: ["COMMERCIAL_LEGAL_ALLOCATION"], confidence: "CLEAR" }
      ],
      semantic_integrity: { ready_for_compiler: true, coverage_ratio: 1 },
      lock_status: "LOCKED"
    }
  }
});

const signals = output.legal_cartography_index.qualified_review_legal_signals;
assert.ok(signals);
assert.equal(signals.question_rows.length, 3);
assert.ok(signals.question_index["QR-004"]);
assert.ok(signals.question_index["QR-013"]);
assert.ok(signals.question_index["QR-016"]);

for (const branch of [signals.legal_notice_contact, signals.liability_cap_basis, signals.sla_support_posture]) {
  assert.ok(branch.signal_status);
  assert.ok(Array.isArray(branch.evidence_basis));
  assert.ok(Array.isArray(branch.locator_refs));
}

assert.equal(output.legal_cartography_index.downstream_rules.qualified_review_legal_signals_true_derived_object, true);
assert.equal(signals.full_clause_text_copied, false);
assert.equal(hasFullClauseTextField(signals), false);

console.log("m9 qualified review legal signals: PASS");

function hasFullClauseTextField(value) {
  if (!value || typeof value !== "object") return false;
  for (const [key, item] of Object.entries(value)) {
    if (key !== "full_clause_text_copied" && /full_?clause_?text|clause_?text/i.test(key)) return true;
    if (hasFullClauseTextField(item)) return true;
  }
  return false;
}
