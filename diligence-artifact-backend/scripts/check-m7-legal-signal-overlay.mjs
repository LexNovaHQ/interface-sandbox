import assert from "node:assert/strict";
import { buildM7DeterministicLegalSignalOverlay, applyM7DeterministicLegalSignalOverlay } from "../src/m7-deterministic-legal-signal-overlay.js";

const artifacts = {
  legal_cartography_index: {
    legal_notice_locator: [
      {
        status: "FOUND_INDEXED",
        legal_entity_name: "Example AI, Inc.",
        source_url: "https://example.com/legal",
        source_ref: "L6_ENTITY_NOTICE.SRC.001"
      }
    ],
    governing_law_venue_locator: [
      {
        status: "FOUND_INDEXED",
        section_name: "Governing Law and Jurisdiction",
        source_url: "https://example.com/terms",
        source_ref: "L1_CORE_TERMS_PRIVACY.SRC.001"
      }
    ],
    dispute_resolution_locator: [],
    document_coverage_index: [],
    document_structure_index: [],
    control_language_locator: []
  },
  lossless_family__L1_CORE_TERMS_PRIVACY: {
    documents: [
      {
        source_url: "https://example.com/terms",
        clean_text: "These Terms are governed by the laws of the State of California. You consent to the exclusive jurisdiction of the courts located in San Francisco, California. Notices must be sent to 123 Market Street, San Francisco, California."
      }
    ]
  }
};

const overlay = buildM7DeterministicLegalSignalOverlay({ artifacts });
assert.equal(overlay.artifact_name, "m7_deterministic_legal_signal_overlay");
assert.equal(overlay.schema_version, "M7_DETERMINISTIC_LEGAL_SIGNAL_OVERLAY_v3");
assert.equal(overlay.model_generated, false);
assert.equal(overlay.reads_lossless_legal_families, false);
assert.equal(overlay.m7_reads_lossless_legal_families, false);
assert.deepEqual(overlay.deterministic_builder_source_scope, ["legal_cartography_index", "m9_loaded_legal_family_text"]);
assert.deepEqual(overlay.overlay_policy.allowed_fields, [
  "target_identity.legal_entity_name",
  "target_identity.entity_type",
  "jurisdiction_notice.registered_notice_location",
  "jurisdiction_notice.governing_law",
  "jurisdiction_notice.courts_venue"
]);
assert.equal(overlay.material_field_overlay["target_identity.legal_entity_name"], "Example AI, Inc.");
assert.equal(overlay.material_field_overlay["target_identity.entity_type"], "Incorporated company");
assert.equal(overlay.material_field_overlay["jurisdiction_notice.registered_notice_location"], "123 Market Street, San Francisco, California");
assert.equal(overlay.material_field_overlay["jurisdiction_notice.governing_law"], "State of California");
assert.equal(overlay.material_field_overlay["jurisdiction_notice.courts_venue"], "courts located in San Francisco, California");
assert.equal(overlay.field_derivation_ledger.find((row) => row.field_path === "target_identity.entity_type")?.status, "FOUND");
assert.equal(overlay.field_derivation_ledger.find((row) => row.field_path === "jurisdiction_notice.registered_notice_location")?.derivation_method, "deterministic_m9_legal_family_text_pattern");
assert.equal(overlay.field_derivation_ledger.find((row) => row.field_path === "jurisdiction_notice.governing_law")?.derivation_method, "deterministic_m9_legal_family_text_pattern");
assert.equal(overlay.field_derivation_ledger.find((row) => row.field_path === "jurisdiction_notice.courts_venue")?.derivation_method, "deterministic_m9_legal_family_text_pattern");

const output = {
  target_profile: {
    target_identity: {
      brand_name: "Example AI",
      legal_entity_name: "FIELD_LIMITED",
      entity_type: "FIELD_LIMITED",
      reviewed_website: "https://example.com",
      primary_domain: "example.com"
    },
    jurisdiction_notice: {
      registered_notice_location: "FIELD_LIMITED",
      governing_law: "FIELD_LIMITED",
      courts_venue: "FIELD_LIMITED"
    },
    business_context: {
      business_category: "AI product",
      primary_customer_type: "Business users",
      market_type_candidate: "B2B",
      industry_sector: "Technology",
      regulated_sector_hints: []
    },
    product_service_wrapper: {
      high_level_offering: "AI workflow tool",
      primary_public_claim: "AI assistant",
      product_service_wrapper_names: [],
      delivery_model_signals: []
    },
    target_profile_limitations: []
  }
};

applyM7DeterministicLegalSignalOverlay(output, overlay);
assert.equal(output.target_profile.target_identity.legal_entity_name, "Example AI, Inc.");
assert.equal(output.target_profile.target_identity.entity_type, "Incorporated company");
assert.equal(output.target_profile.jurisdiction_notice.registered_notice_location, "123 Market Street, San Francisco, California");
assert.equal(output.target_profile.jurisdiction_notice.governing_law, "State of California");
assert.equal(output.target_profile.jurisdiction_notice.courts_venue, "courts located in San Francisco, California");

console.log("m7 legal signal overlay: PASS");
