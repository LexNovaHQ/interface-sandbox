import assert from "node:assert/strict";
import { buildStage6AModelOverlayPacket } from "../src/diligence/stage6aModelOverlayPacketBuilder.js";
import { normalizeStage6AModelOverlay } from "../src/diligence/stage6aModelOverlayNormalizer.js";
import { buildStage6ACartography } from "../src/diligence/stage6aLegalCartographyMerge.js";

const input = {
  target_profile: { target_profile_version: "target_profile_v2" },
  target_feature_profile: {
    feature_profile_version: "feature_profile_v2",
    feature_inventory: [{ feature_id: "F001", feature_name: "AI answer generation", feature_role: "CORE", archetype_codes: ["RDR"], surface_tokens: ["PII"] }]
  },
  source_bundle: {
    source_bundle_version: "source_bundle_v2_magna_carta",
    evidence_buffer: [
      {
        source_record_ref: "SRC_TOS",
        source_family: "legal_profile",
        final_url: "https://example.com/terms",
        title: "Terms of Service",
        clean_text_lossless: "Terms of Service. AI Output. The service uses artificial intelligence and outputs may be inaccurate. Liability Cap. Liability is limited.",
        structure: { title: "Terms of Service", headings: [{ level: 1, text: "Terms of Service" }, { level: 2, text: "AI Output" }, { level: 2, text: "Liability Cap" }] }
      },
      {
        source_record_ref: "SRC_PRIVACY",
        source_family: "legal_profile",
        final_url: "https://example.com/privacy",
        title: "Privacy Policy",
        clean_text_lossless: "Privacy Policy. How We Use Personal Data. We collect and use personal data to provide the service. Model Providers. We may use third party AI model providers.",
        structure: { title: "Privacy Policy", headings: [{ level: 1, text: "Privacy Policy" }, { level: 2, text: "How We Use Personal Data" }, { level: 2, text: "Model Providers" }] }
      }
    ]
  }
};

const packet = buildStage6AModelOverlayPacket(input, { textWindowChars: 400 });
assert.equal(packet.overlay_packet_version, "stage6a_model_overlay_packet_v1");
assert.ok(packet.document_inventory_seed.length >= 2);
assert.ok(packet.section_index_seed.length >= 4);
assert.ok(packet.section_index_seed.every((row) => row.nearby_text_window !== undefined));

const aiSection = packet.section_index_seed.find((row) => row.heading_text === "AI Output");
const privacySection = packet.section_index_seed.find((row) => row.heading_text === "How We Use Personal Data");
assert.ok(aiSection?.section_id);
assert.ok(privacySection?.section_id);

const rawOverlay = {
  stage6a_model_overlay_version: "stage6a_model_overlay_v1",
  section_classification_overlay: [
    { section_id: aiSection.section_id, section_function: "ai_disclosure", control_families: ["ai_disclosure", "hallucination_disclaimer", "not_a_control_family"], coverage_signal: "visible", basis_codes: ["source_text_classification"], confidence: "high", blocked_key_sample: "extra field should not survive" },
    { section_id: "DOC_UNKNOWN:S999", section_function: "ai_disclosure", control_families: ["ai_disclosure"], coverage_signal: "visible", basis_codes: ["source_text_classification"], confidence: "high" }
  ],
  document_relationship_overlay: [],
  document_control_overlay: [
    { section_id: privacySection.section_id, control_family: "privacy_notice", coverage_signal: "visible", feature_refs: ["F001", "F999"], data_flow_refs: ["DF001"], basis_codes: ["source_text_classification", "stage5_feature_ref"], confidence: "medium" }
  ],
  document_mismatch_overlay: [],
  feature_section_overlay: [
    { feature_id: "F001", section_ids: [aiSection.section_id, privacySection.section_id, "DOC_UNKNOWN:S999"], control_families: ["ai_disclosure", "privacy_notice"], basis_codes: ["stage5_feature_ref", "stage6_section_ref"], confidence: "medium" }
  ],
  overlay_limitations: []
};

const normalized = normalizeStage6AModelOverlay(rawOverlay, packet);
assert.equal(normalized.overlay.stage6a_model_overlay_version, "stage6a_model_overlay_v1");
assert.equal(normalized.overlay.section_classification_overlay.length, 1);
assert.ok(normalized.repairs.some((repair) => repair.code === "drop_section_overlay_unknown_section_id"));
assert.deepEqual(normalized.overlay.section_classification_overlay[0].control_families, ["ai_disclosure", "hallucination_disclaimer"]);
assert.deepEqual(normalized.overlay.document_control_overlay[0].feature_refs, ["F001"]);
assert.deepEqual(normalized.overlay.document_control_overlay[0].data_flow_refs, []);

const cartography = buildStage6ACartography(input, { normalized_overlay: normalized.overlay });
assert.equal(cartography.legal_stack_review_version, "legal_stack_review_v2");
assert.equal(cartography.stage_role, "stage7_navigation_index");
assert.ok(cartography.legal_document_cartography.legal_document_inventory.length >= 2);
assert.ok(cartography.legal_document_cartography.legal_document_index.length >= 4);
assert.ok(cartography.legal_document_cartography.document_control_signal_map.length >= 2);
assert.equal(cartography.stage7_navigation_index.feature_to_document_section_index.length, 1);
assert.ok(cartography.stage7_navigation_index.control_family_index.length >= 2);
assert.ok(cartography.stage7_navigation_index.document_source_locator_index.length >= 4);

for (const field of ["legal_stack", "document_stack_redline", "document_stack_synthesis", "legal_stack_assessment", "limitations", "data_provenance_profile", "feature_to_data_flow_index", "data_signal_index"]) {
  assert.equal(Object.prototype.hasOwnProperty.call(cartography, field), false, `unexpected top-level field: ${field}`);
}

console.log(JSON.stringify({
  ok: true,
  phase: "stage6a_intelligence_path_static_audit",
  packet_summary: {
    document_inventory_seed_count: packet.document_inventory_seed.length,
    section_index_seed_count: packet.section_index_seed.length,
    deterministic_control_seed_count: packet.deterministic_control_seed.length,
    feature_ref_count: packet.feature_refs.length
  },
  normalized_overlay_summary: {
    section_classification_overlay_count: normalized.overlay.section_classification_overlay.length,
    document_control_overlay_count: normalized.overlay.document_control_overlay.length,
    feature_section_overlay_count: normalized.overlay.feature_section_overlay.length,
    repair_count: normalized.repairs.length
  },
  cartography_summary: {
    legal_document_inventory_count: cartography.legal_document_cartography.legal_document_inventory.length,
    legal_document_index_count: cartography.legal_document_cartography.legal_document_index.length,
    document_control_signal_map_count: cartography.legal_document_cartography.document_control_signal_map.length,
    feature_to_document_section_index_count: cartography.stage7_navigation_index.feature_to_document_section_index.length,
    control_family_index_count: cartography.stage7_navigation_index.control_family_index.length,
    document_source_locator_index_count: cartography.stage7_navigation_index.document_source_locator_index.length
  }
}, null, 2));
