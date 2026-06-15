import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { runStage5Runtime, buildStage5CanonicalInput, createVerbatimSourceWindow, assertWindowIsVerbatim, assertNoPlaceholderEvidence } from "../src/diligence/stage5/stage5.runtime.js";
import { TARGET_FEATURE_PROFILE_HANDOFF_KEYS, STAGE5D_INTERNAL_ONLY_FIELDS } from "../src/diligence/stage5/5d/5d.dictionary.js";

export const fixtureText = [
  "Speech-to-text API transcribes audio into text transcripts for developers.",
  "Text-to-speech API turns text into natural spoken audio.",
  "Document digitisation API performs OCR and document extraction for uploaded files.",
  "Translation API translates text between languages.",
  "Voice agent interaction supports conversational call automation."
].join("\n");

export const fixtureCompanyProfile = {
  target_profile_version: "target_profile_v2",
  identity: { brand_name: "Fixture AI", legal_name: "Fixture AI Inc.", domain: "fixture.example", website: "https://fixture.example" }
};

export const fixtureStage5Input = {
  target_profile_ref: { target_profile_version: "target_profile_v2", brand_name: "Fixture AI", legal_name: "Fixture AI Inc.", domain: "fixture.example" },
  product_family_primary_sources: [{ source_id: "SRC_001", source_url: "https://fixture.example/product", source_title: "Fixture Product" }],
  source_bundle: {
    evidence_buffer: [
      {
        source_id: "SRC_001",
        source_url: "https://fixture.example/product",
        source_title: "Fixture Product",
        source_family: "product_family",
        clean_text_lossless: fixtureText
      },
      {
        source_id: "META_ONLY",
        source_url: "https://fixture.example/pricing",
        source_title: "Metadata only pricing"
      }
    ]
  }
};

export function assertWindowIntegrity(canonicalInput, windows) {
  const sources = new Map(canonicalInput.primary_evidence.sources.map((source) => [source.source_id, source]));
  for (const window of windows) {
    const source = sources.get(window.source_id);
    assert.ok(source, "window maps to source");
    assert.equal(source.clean_text_lossless.slice(window.char_start, window.char_end), window.verbatim_text);
    assert.equal(window.source_sha256, source.source_sha256);
    assert.ok(window.verbatim_text.length > 0);
    assert.ok(!/^PLACEHOLDER/i.test(window.window_id));
  }
}

function assertNoInternalStage5Leak(value, path = "target_feature_profile") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoInternalStage5Leak(item, `${path}[${index}]`));
    return;
  }
  for (const key of Object.keys(value)) {
    assert.ok(!STAGE5D_INTERNAL_ONLY_FIELDS.includes(key), `${path}.${key} must not leak into downstream target_feature_profile`);
    assertNoInternalStage5Leak(value[key], `${path}.${key}`);
  }
}

export function assertCanonicalProfile(result) {
  assert.equal(result.ok, true);
  assert.equal(result.stage5_version, "stage5_lossless_windowed_runtime_v1");
  assert.deepEqual(Object.keys(result.target_feature_profile).sort(), [...TARGET_FEATURE_PROFILE_HANDOFF_KEYS].sort());
  assert.equal(result.target_feature_profile.feature_profile_version, "feature_profile_v2");
  assert.deepEqual(result.target_feature_profile.product_feature_map, []);
  assert.ok(result.target_feature_profile.feature_inventory.length >= 5);
  assert.ok(Array.isArray(result.target_feature_profile.data_provenance_map));
  assert.ok(Array.isArray(result.target_feature_profile.regulated_surface_map));
  assertNoInternalStage5Leak(result.target_feature_profile);
  assert.deepEqual(Object.keys({ companyProfile: {}, targetFeatureProfile: result.target_feature_profile }), ["companyProfile", "targetFeatureProfile"]);
  for (const feature of result.target_feature_profile.feature_inventory) {
    assert.ok(feature.evidence_refs.length > 0);
    assert.ok(feature.feature_source_url && !feature.feature_source_url.includes("source-not-available"));
    assert.ok(feature.data_provenance.every((row) => row.evidence_refs.length > 0));
  }
}

async function main() {
  const canonicalInput = buildStage5CanonicalInput({ companyProfile: fixtureCompanyProfile, stage5Input: fixtureStage5Input });
  assert.ok(canonicalInput.primary_evidence.sources.length === 1);
  assert.ok(canonicalInput.primary_evidence.sources[0].clean_text_lossless.length > 0);
  assert.ok(canonicalInput.primary_evidence.sources[0].source_sha256);
  assert.ok(canonicalInput.reference.metadata_sidecar.some((row) => row.source_id === "SRC_001"));
  assert.ok(canonicalInput.reference.navigation_index_sidecar.every((row) => row.verbatim_text === undefined));

  const source = canonicalInput.primary_evidence.sources[0];
  const goodWindow = createVerbatimSourceWindow(source, { char_start: 0, char_end: 10 }, { window_id: "SRC_001#5A#W999", created_by_substage: "5A" });
  assert.equal(goodWindow.verbatim_text, source.clean_text_lossless.slice(0, 10));
  const badWindow = { window_id: "BAD", source_id: source.source_id, char_start: 0, char_end: 5, verbatim_text: "wrong", source_sha256: source.source_sha256 };
  assert.throws(() => assertWindowIsVerbatim(source, badWindow), /exact clean_text_lossless substring/);
  assert.throws(() => assertNoPlaceholderEvidence({ evidence_refs: ["S5E_SOURCE_REF_NOT_AVAILABLE"] }), /Placeholder evidence/);
  assert.throws(() => buildStage5CanonicalInput({ stage5Input: { source_bundle: { evidence_buffer: [{ source_id: "BAD", source_url: "https://fixture.example" }] } } }), /primary_evidence/);

  const result = await runStage5Runtime({ companyProfile: fixtureCompanyProfile, stage5Input: fixtureStage5Input, runContext: { runId: "stage5_full_fixture" } });
  assertWindowIntegrity(canonicalInput, result.substage_outputs.stage5a.feature_evidence_windows);
  assertCanonicalProfile(result);
  assert.ok(result.substage_outputs.stage5a.admitted_functions.every((row) => row.source_window_refs.length));
  assert.ok(result.substage_outputs.stage5b.feature_tags.every((row) => row.source_window_refs.length));
  assert.ok(result.substage_outputs.stage5c.complete_feature_records.every((row) => row.evidence_window_refs.length));
  assert.ok(result.substage_outputs.stage5c.complete_feature_records.every((row) => row.data_touchpoints.every((tp) => tp.source_window_refs.length)));
  console.log("e2e:stage5:full-runtime passed");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
