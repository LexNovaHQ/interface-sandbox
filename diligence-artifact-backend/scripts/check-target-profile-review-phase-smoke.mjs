import assert from "node:assert/strict";
import { TARGET_PROFILE_REVIEW_CONTRACT, targetProfileReviewReadArtifacts } from "../src/phases/03-target-profile-review/index.js";
import { validateTargetProfileReviewOutput } from "../src/m7-validator.js";

const allowedReads = targetProfileReviewReadArtifacts();
assert.deepEqual(allowedReads, [
  "source_discovery_handoff",
  "lossless_family__T0_ROOT",
  "lossless_family__T1_IDENTITY",
  "lossless_family__T2_LEGAL_IDENTITY",
  "lossless_family__T3_OPERATOR_ENTITY",
  "lossless_family__T4_SUPPORTING_IDENTITY",
  "legal_signal_derivation_profile"
]);
assert.equal(allowedReads.includes("legal_cartography_index"), false);
assert.equal(allowedReads.some((name) => name.startsWith("lossless_family__L")), false);
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.material_job.writes.length, 1);
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.material_job.writes[0], "target_profile");

const derivedOutput = buildTargetProfileReviewSmokeOutput(buildAllowedArtifactFixture({ conflict: false }));
validateTargetProfileReviewOutput(derivedOutput);
assert.equal(derivedOutput.target_profile.target_identity.brand_name, "Example AI");
assert.equal(derivedOutput.target_profile.target_identity.legal_entity_name, "Example AI Private Limited");
assert.equal(derivedOutput.target_profile.jurisdiction_notice.governing_law, "India");
assert.equal(derivedOutput.target_profile.jurisdiction_notice.courts_venue, "Bengaluru courts");
assert.equal(derivedOutput.target_profile.business_context.business_category, "AI software product");
assert.equal(derivedOutput.target_profile.product_service_wrapper.high_level_offering, "AI assistant platform");
assertNoForbiddenLeakage(derivedOutput);

const conflictOutput = buildTargetProfileReviewSmokeOutput(buildAllowedArtifactFixture({ conflict: true }));
validateTargetProfileReviewOutput(conflictOutput);
assert.equal(conflictOutput.target_profile.jurisdiction_notice.governing_law, "FIELD_CONFLICTED");
assert.equal(conflictOutput.target_profile.jurisdiction_notice.courts_venue, "FIELD_CONFLICTED");
assert.equal(conflictOutput.target_profile.target_profile_limitations.some((row) => String(row).includes("conflict")), true);
assertNoForbiddenLeakage(conflictOutput);

const absentSignalOutput = buildTargetProfileReviewSmokeOutput(buildAllowedArtifactFixture({ omitLegalSignals: true }));
validateTargetProfileReviewOutput(absentSignalOutput);
assert.equal(absentSignalOutput.target_profile.jurisdiction_notice.governing_law, "FIELD_NOT_FOUND");
assert.equal(absentSignalOutput.target_profile.jurisdiction_notice.courts_venue, "FIELD_NOT_FOUND");
assert.equal(absentSignalOutput.target_profile.target_profile_limitations.some((row) => String(row).includes("legal signal")), true);
assertNoForbiddenLeakage(absentSignalOutput);

console.log("Target Profile Review self-contained smoke: PASS");

function buildTargetProfileReviewSmokeOutput(artifacts) {
  assertAllowedArtifactEnvelope(artifacts);
  const targetText = collectTargetText(artifacts);
  const signalRows = getLegalSignalRows(artifacts.legal_signal_derivation_profile);
  const governingLawSignal = pickSignal(signalRows, "TP.JUR.003");
  const courtsVenueSignal = pickSignal(signalRows, "TP.JUR.005");
  const limitations = [];
  const legalEntityName = extractAfter(targetText, /legal entity\s*:\s*([^\n]+)/i) || "FIELD_NOT_PUBLIC";
  if (legalEntityName === "FIELD_NOT_PUBLIC") limitations.push("Legal entity name was not visible in target-family materials.");

  const governingLaw = translateSignalToTargetValue(governingLawSignal, "governing law", limitations);
  const courtsVenue = translateSignalToTargetValue(courtsVenueSignal, "courts venue", limitations);

  return {
    target_profile: {
      target_identity: {
        brand_name: extractAfter(targetText, /brand\s*:\s*([^\n]+)/i) || "Example AI",
        legal_entity_name: legalEntityName,
        entity_type: extractAfter(targetText, /entity type\s*:\s*([^\n]+)/i) || "Company",
        reviewed_website: artifacts.source_discovery_handoff.target_url,
        primary_domain: "example.test"
      },
      jurisdiction_notice: {
        registered_notice_location: "FIELD_LIMITED",
        governing_law: governingLaw,
        courts_venue: courtsVenue
      },
      business_context: {
        business_category: extractAfter(targetText, /business category\s*:\s*([^\n]+)/i) || "AI software product",
        primary_customer_type: extractAfter(targetText, /primary customer\s*:\s*([^\n]+)/i) || "Businesses",
        market_type_candidate: extractAfter(targetText, /market type\s*:\s*([^\n]+)/i) || "B2B SaaS",
        industry_sector: extractAfter(targetText, /industry\s*:\s*([^\n]+)/i) || "AI software",
        regulated_sector_hints: []
      },
      product_service_wrapper: {
        high_level_offering: extractAfter(targetText, /offering\s*:\s*([^\n]+)/i) || "AI assistant platform",
        primary_public_claim: extractAfter(targetText, /public claim\s*:\s*([^\n]+)/i) || "Helps teams draft and review content",
        product_service_wrapper_names: ["Example AI"],
        delivery_model_signals: ["Web application"]
      },
      target_profile_limitations: limitations.length ? limitations : ["Registered notice location requires qualified review confirmation."]
    }
  };
}

function assertAllowedArtifactEnvelope(artifacts) {
  const keys = Object.keys(artifacts).sort();
  const allowed = new Set(allowedReads);
  for (const key of keys) assert.equal(allowed.has(key), true, `forbidden artifact supplied to Target Profile Review smoke: ${key}`);
}

function collectTargetText(artifacts) {
  return [
    artifacts.lossless_family__T0_ROOT,
    artifacts.lossless_family__T1_IDENTITY,
    artifacts.lossless_family__T2_LEGAL_IDENTITY,
    artifacts.lossless_family__T3_OPERATOR_ENTITY,
    artifacts.lossless_family__T4_SUPPORTING_IDENTITY
  ].flatMap((family) => Array.isArray(family?.sources) ? family.sources : []).map((source) => source.lossless_text || source.clean_text || source.text || "").join("\n");
}

function getLegalSignalRows(profile) {
  if (!profile) return [];
  const root = profile.legal_signal_derivation_profile || profile;
  if (Array.isArray(root.field_derivations)) return root.field_derivations;
  const maps = root.signal_maps && typeof root.signal_maps === "object" ? root.signal_maps : root;
  return Object.values(maps).flatMap((value) => Array.isArray(value) ? value : []);
}

function pickSignal(rows, fieldId) {
  return rows.find((row) => row?.field_id === fieldId);
}

function translateSignalToTargetValue(row, label, limitations) {
  if (!row) {
    limitations.push(`Missing ${label} legal signal; field not invented.`);
    return "FIELD_NOT_FOUND";
  }
  switch (row.derivation_status) {
    case "DERIVED":
      return typeof row.value === "string" && row.value.trim() ? row.value.trim() : "FIELD_LIMITED";
    case "DERIVED_WITH_LIMITATION":
      limitations.push(`${label} direct legal signal is limited and requires qualified review.`);
      return typeof row.value === "string" && row.value.trim() ? row.value.trim() : "FIELD_LIMITED";
    case "SOURCE_CONFLICT":
      limitations.push(`${label} direct legal signal has a source conflict; Target Profile Review must not choose a winner.`);
      return "FIELD_CONFLICTED";
    case "LOCATOR_FOUND_VALUE_NOT_VISIBLE":
    case "SOURCE_NOT_PUBLIC":
    case "NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN":
      limitations.push(`${label} direct legal signal did not provide a usable public value; field not invented.`);
      return row.derivation_status === "SOURCE_NOT_PUBLIC" ? "FIELD_NOT_PUBLIC" : "FIELD_NOT_FOUND";
    case "NOT_APPLICABLE_CONTEXTUAL":
      limitations.push(`${label} direct legal signal is contextually not applicable.`);
      return "FIELD_LIMITED";
    default:
      limitations.push(`${label} direct legal signal had unsupported status; field not invented.`);
      return "FIELD_LIMITED";
  }
}

function extractAfter(text, pattern) {
  const match = String(text || "").match(pattern);
  return match?.[1]?.trim().replace(/[.;]$/, "") || "";
}

function assertNoForbiddenLeakage(output) {
  const json = JSON.stringify(output);
  for (const forbidden of [
    "legal_cartography_index",
    "m7_deterministic_legal_signal_overlay",
    "lossless_family__L1_CORE_TERMS_PRIVACY",
    "lossless_family__L2_B2B_CONTRACTING",
    "lossless_family__L3_AI_USAGE_GOVERNANCE",
    "lossless_family__L4_PRIVACY_ADJACENT_NOTICES",
    "lossless_family__L5_LEGAL_HUB_HOSTED",
    "lossless_family__L6_ENTITY_NOTICE",
    "privacy_grievance_contact_signal_map",
    "consent_manager_signal_map",
    "legal_signal_derivation_profile",
    "data_provenance_profile",
    "target_feature_profile",
    "qualified_review_handoff",
    "renderer_payload"
  ]) assert.equal(json.includes(forbidden), false, `Target Profile Review output leaked ${forbidden}`);
}

function buildAllowedArtifactFixture({ conflict = false, omitLegalSignals = false } = {}) {
  const signals = omitLegalSignals ? [] : [
    signal("LGC.NOT.010", "legal_notice_contact_signal_map", "DERIVED", "legal@example.test"),
    signal("TP.JUR.003", "jurisdiction_dispute_signal_map", conflict ? "SOURCE_CONFLICT" : "DERIVED", conflict ? "" : "India"),
    signal("TP.JUR.005", "jurisdiction_dispute_signal_map", conflict ? "SOURCE_CONFLICT" : "DERIVED", conflict ? "" : "Bengaluru courts"),
    signal("DAP.CM.001", "consent_manager_signal_map", "DERIVED", "Ignored by Target Profile Review"),
    signal("DAP.CONTACT.001", "privacy_grievance_contact_signal_map", "DERIVED", "privacy@example.test")
  ];
  return {
    source_discovery_handoff: { run_id: "TPR-SMOKE", target_url: "https://example.test", status: "LOCKED" },
    lossless_family__T0_ROOT: family("T0_ROOT", [targetSource("root", "Brand: Example AI\nPublic claim: Helps teams draft and review content")]),
    lossless_family__T1_IDENTITY: family("T1_IDENTITY", [targetSource("identity", "Brand: Example AI\nLegal entity: Example AI Private Limited\nEntity type: Company")]),
    lossless_family__T2_LEGAL_IDENTITY: family("T2_LEGAL_IDENTITY", []),
    lossless_family__T3_OPERATOR_ENTITY: family("T3_OPERATOR_ENTITY", [targetSource("operator", "Business category: AI software product\nPrimary customer: Businesses\nMarket type: B2B SaaS\nIndustry: AI software")]),
    lossless_family__T4_SUPPORTING_IDENTITY: family("T4_SUPPORTING_IDENTITY", [targetSource("support", "Offering: AI assistant platform")]),
    legal_signal_derivation_profile: { artifact_name: "legal_signal_derivation_profile", field_derivations: signals, coverage_summary: { emitted_field_count: signals.length } }
  };
}

function family(rootFamily, sources) {
  return { artifact_name: `lossless_family__${rootFamily}`, root_family: rootFamily, sources };
}

function targetSource(id, lossless_text) {
  return { source_id: `TARGET.${id}`, final_url: `https://example.test/${id}`, lossless_text };
}

function signal(field_id, field_family, derivation_status, value) {
  return { field_id, field_family, derivation_status, value, evidence_basis: [], locator_basis: [], scanned_sources: [], failure_reason: "", limitation: "", confidence: "SMOKE", downstream_consumers: ["Target Profile Review smoke"] };
}
