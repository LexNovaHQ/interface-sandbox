import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { assertLosslessPrimaryEvidence, assertNoPlaceholderEvidence, assertWindowIsVerbatim } from "../stage5.runtime.js";
import { buildStage5DIntegratorInput } from "./5d.prompt.js";
import { STAGE5D_INTERNAL_ONLY_FIELDS, STAGE5D_OUTPUT_VERSION, STAGE5D_REINVESTIGATION_STATUS, TARGET_FEATURE_PROFILE_HANDOFF_KEYS } from "./5d.dictionary.js";

function delivery(channels = []) {
  return {
    app: channels.includes("app") ? "true" : "unknown",
    api: channels.includes("api") ? "true" : "unknown",
    web: channels.includes("web") ? "true" : "unknown"
  };
}

function autonomy(value) {
  const text = String(value || "").trim().toLowerCase();
  if (["none", "no", "manual"].includes(text)) return "none";
  if (["draft", "assist", "assisted", "assistive"].includes(text)) return "draft";
  if (["recommend", "recommendation", "score"].includes(text)) return "recommend";
  if (["execute", "autonomous", "agentic"].includes(text)) return "execute";
  return "unknown";
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function windowMap(stage5a, stage5b, stage5c) {
  const windows = [
    ...(stage5a?.feature_evidence_windows || []),
    ...(stage5b?.supplemental_evidence_windows || []),
    ...(stage5c?.supplemental_evidence_windows || [])
  ];
  return new Map(windows.map((window) => [window.window_id, window]));
}

function sourceForWindow(canonicalInput, window) {
  return canonicalInput.primary_evidence.sources.find((source) => source.source_id === window.source_id);
}

function firstWindow(refs, windows) {
  return windows.get(refs[0]);
}

function schemaPath() {
  return path.resolve(process.cwd(), "..", "data", "schemas", "targetFeatureProfile.schema.json");
}

function validateWithSchema(profile, schemaValidator) {
  if (schemaValidator && typeof schemaValidator.validate === "function") return schemaValidator.validate("targetFeatureProfile", profile);
  const schema = JSON.parse(fs.readFileSync(schemaPath(), "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const ok = validate(profile);
  return { ok, errors: validate.errors || [] };
}

function profileRef(canonicalInput) {
  const ref = canonicalInput.target_profile_ref || {};
  const upstreamIdentity = canonicalInput.upstream_profile?.identity || {};
  return {
    target_profile_version: String(ref.target_profile_version || canonicalInput.upstream_profile?.target_profile_version || "target_profile_v2"),
    brand_name: String(ref.brand_name || upstreamIdentity.brand_name || "Unknown target"),
    legal_name: String(ref.legal_name || upstreamIdentity.legal_name || ""),
    domain: String(ref.domain || upstreamIdentity.domain || upstreamIdentity.website || "")
  };
}

function throwContractViolation(message, details = {}) {
  const error = new Error(message);
  error.code = "STAGE5D_DOWNSTREAM_CONTRACT_VIOLATION";
  error.details = details;
  throw error;
}

function sameStringSet(left = [], right = []) {
  const a = [...left].sort();
  const b = [...right].sort();
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

function isReinvestigationProfile(profile = {}) {
  return profile.classification_quality?.reinvestigation_required === true || profile.classification_quality?.status === STAGE5D_REINVESTIGATION_STATUS;
}

export function assertTargetFeatureProfileHandoffContract(profile = {}) {
  const topLevelKeys = Object.keys(profile);
  const reinvestigationProfile = isReinvestigationProfile(profile);
  if (!sameStringSet(topLevelKeys, TARGET_FEATURE_PROFILE_HANDOFF_KEYS)) {
    throwContractViolation("target_feature_profile top-level keys changed.", {
      expected: TARGET_FEATURE_PROFILE_HANDOFF_KEYS,
      actual: topLevelKeys
    });
  }
  for (const forbidden of STAGE5D_INTERNAL_ONLY_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(profile, forbidden)) {
      throwContractViolation("Internal Stage 5 field leaked into downstream target_feature_profile.", { field: forbidden });
    }
  }
  if (profile.feature_profile_version !== "feature_profile_v2") {
    throwContractViolation("target_feature_profile must preserve feature_profile_v2.", { feature_profile_version: profile.feature_profile_version });
  }
  if (!Array.isArray(profile.product_feature_map) || profile.product_feature_map.length !== 0) {
    throwContractViolation("product_feature_map must remain the empty legacy compatibility alias.", { product_feature_map_length: profile.product_feature_map?.length });
  }
  if (!Array.isArray(profile.feature_inventory)) {
    throwContractViolation("feature_inventory must remain the downstream feature array.");
  }
  if (!profile.feature_inventory.length && !reinvestigationProfile) {
    throwContractViolation("feature_inventory may be empty only when classification_quality.reinvestigation_required is true.");
  }
  if (reinvestigationProfile) {
    if (profile.classification_quality?.reinvestigation_required !== true) {
      throwContractViolation("Reinvestigation profiles must set classification_quality.reinvestigation_required=true.");
    }
    if (!Array.isArray(profile.unresolved_feature_candidates)) {
      throwContractViolation("Reinvestigation profiles must preserve unresolved_feature_candidates array.");
    }
    if (!Array.isArray(profile.evidence?.unresolved_questions)) {
      throwContractViolation("Reinvestigation profiles must preserve evidence.unresolved_questions array.");
    }
  }
  if (!Array.isArray(profile.data_provenance_map) || !Array.isArray(profile.regulated_surface_map)) {
    throwContractViolation("Stage 5D must emit flat downstream maps for data_provenance_map and regulated_surface_map.");
  }
  for (const [index, feature] of asArray(profile.feature_inventory).entries()) {
    for (const forbidden of STAGE5D_INTERNAL_ONLY_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(feature, forbidden)) {
        throwContractViolation("Internal Stage 5 field leaked into feature_inventory row.", { index, field: forbidden });
      }
    }
    if (!Array.isArray(feature.evidence_refs) || !feature.evidence_refs.length) {
      throwContractViolation("feature_inventory rows must retain evidence_refs for downstream stages.", { index, feature_id: feature.feature_id });
    }
  }
  return true;
}

function buildFeature(record, tag, windows) {
  const refs = record.evidence_window_refs;
  const window = firstWindow(refs, windows);
  const sourceUrl = window?.source_url || "";
  const dataProvenance = record.data_provenance.map((row) => ({
    data_origin: row.data_origin,
    data_subject: row.data_subject,
    data_category: row.data_category,
    processing_context: row.processing_context,
    storage_or_retention_signal: row.storage_or_retention_signal,
    training_or_finetuning_signal: row.training_or_finetuning_signal,
    source_url: sourceUrl,
    evidence_refs: row.source_window_refs,
    confidence: "high"
  }));
  return {
    feature_id: record.feature_id,
    feature_name: record.feature_name,
    feature_role: record.feature_role,
    commercial_function: record.commercial_function,
    business_label_or_product_area: record.core_product_name,
    feature_description: `${record.system_action}; ${record.output_or_result}.`,
    actor_or_user: record.actor_or_user,
    input_data: record.input_data,
    system_action: record.system_action,
    output_or_result: record.output_or_result,
    autonomy_level: autonomy(record.autonomy_level),
    human_review_signal: record.human_review_signal,
    external_action_signal: record.external_action_signal,
    delivery_channels: delivery(record.delivery_channels),
    data_provenance: dataProvenance,
    archetype_codes: record.archetype_codes,
    archetype_labels: record.archetype_labels,
    archetype_provenance: record.archetype_codes.map((code) => ({
      archetype_code: code,
      registry_key_detection_logic: "Assigned in 5B from cited product-function evidence windows.",
      matched_feature_behavior: record.system_action,
      source_url: sourceUrl,
      evidence_refs: tag?.source_window_refs || refs,
      confidence: "high"
    })),
    surface_tokens: record.surface_tokens,
    surface_provenance: record.surface_tokens.map((token) => ({
      surface_token: token,
      registry_key_surface_meaning: "Surface token assigned from cited function behavior.",
      matched_data_or_context: record.system_action,
      source_url: sourceUrl,
      evidence_refs: tag?.source_window_refs || refs,
      confidence: "high"
    })),
    confidence: "high",
    feature_source_url: sourceUrl,
    evidence_refs: refs,
    linked_threat_ids: []
  };
}

export async function runStage5D({ canonicalInput, stage5a, stage5b, stage5c, schemaValidator = null, runContext = {} } = {}) {
  assertLosslessPrimaryEvidence(canonicalInput);
  const windows = windowMap(stage5a, stage5b, stage5c);
  for (const window of windows.values()) assertWindowIsVerbatim(sourceForWindow(canonicalInput, window), window);
  for (const fn of stage5a?.admitted_functions || []) if (!fn.source_window_refs?.length) throw new Error("5D reinvestigation required: 5A function without source windows.");
  for (const tag of stage5b?.feature_tags || []) if (!tag.source_window_refs?.length) throw new Error("5D reinvestigation required: 5B tag without source windows.");
  for (const record of stage5c?.complete_feature_records || []) if (!record.evidence_window_refs?.length) throw new Error("5D reinvestigation required: 5C record without source windows.");

  const tagsByFunction = new Map((stage5b?.feature_tags || []).map((tag) => [tag.function_id, tag]));
  const featureInventory = (stage5c?.complete_feature_records || []).map((record) => buildFeature(record, tagsByFunction.get(record.function_id), windows));
  const dataProvenanceMap = featureInventory.flatMap((feature) => feature.data_provenance.map((row, index) => ({
    provenance_id: `${feature.feature_id}_DP_${String(index + 1).padStart(3, "0")}`,
    feature_id: feature.feature_id,
    data_origin: row.data_origin,
    data_subject: row.data_subject,
    data_category: row.data_category,
    processing_context: row.processing_context,
    storage_or_retention_signal: row.storage_or_retention_signal,
    training_or_finetuning_signal: row.training_or_finetuning_signal,
    source_url: row.source_url,
    evidence_refs: row.evidence_refs,
    confidence: row.confidence
  })));
  const regulatedSurfaceMap = featureInventory.flatMap((feature) => feature.surface_tokens.map((token, index) => ({
    surface_id: `${feature.feature_id}_SURF_${String(index + 1).padStart(3, "0")}`,
    feature_id: feature.feature_id,
    surface_token: token,
    int_ext_classification: token.includes("external") ? "external" : "both",
    basis: "Mapped from 5B surface tagging with source-window evidence.",
    confidence: "high",
    evidence_refs: feature.evidence_refs
  })));
  const profile = {
    feature_profile_version: "feature_profile_v2",
    target_profile_ref: profileRef(canonicalInput),
    feature_inventory: featureInventory,
    product_feature_map: [],
    data_provenance_map: dataProvenanceMap,
    regulated_surface_map: regulatedSurfaceMap,
    architecture_hints: [],
    classification_quality: {
      quality_version: "stage5_classification_quality_v2",
      status: "PASS",
      reinvestigation_required: false,
      reinvestigation_attempted: false,
      reinvestigation_pass_count: 0,
      unresolved_feature_count: 0,
      fallback_routing_required: false
    },
    unresolved_feature_candidates: [],
    commercial_scan: {
      distinct_commercial_outcomes_seen: featureInventory.map((feature) => feature.commercial_function),
      mapped_core_feature_ids: featureInventory.map((feature) => feature.feature_id),
      source_coverage: canonicalInput.primary_evidence.sources.map((source) => ({
        source_id: source.source_id,
        source_url: source.source_url,
        source_family: source.source_family,
        coverage_status: "mapped",
        mapped_feature_ids: featureInventory.filter((feature) => feature.evidence_refs.some((ref) => windows.get(ref)?.source_id === source.source_id)).map((feature) => feature.feature_id),
        unmapped_reason: "",
        evidence_refs: [...windows.values()].filter((window) => window.source_id === source.source_id).map((window) => window.window_id)
      })).filter((row) => row.evidence_refs.length),
      unmapped_outcomes_due_to_insufficient_detail: [],
      completeness_status: "COMPLETE",
      completeness_warnings: []
    },
    vault_feature_candidates: { baseline: {}, archetypes: {}, compliance: {} },
    evidence: {
      field_evidence_refs: featureInventory.map((feature) => ({
        field_path: `feature_inventory.${feature.feature_id}`,
        evidence_refs: feature.evidence_refs,
        basis: "Every material field traces to verbatim source windows.",
        confidence: "high"
      })),
      unresolved_questions: []
    },
    limitations: []
  };
  assertTargetFeatureProfileHandoffContract(profile);
  assertNoPlaceholderEvidence(profile, "target_feature_profile");
  const validation = validateWithSchema(profile, schemaValidator);
  if (!validation.ok) {
    const error = new Error("Stage 5D target_feature_profile schema validation failed; reinvestigation required.");
    error.code = "STAGE5D_SCHEMA_VALIDATION_REINVESTIGATION_REQUIRED";
    error.validation = validation;
    throw error;
  }
  return {
    ok: true,
    stage5d_output_version: STAGE5D_OUTPUT_VERSION,
    target_feature_profile: profile,
    prompt_input: buildStage5DIntegratorInput({ canonicalInput, stage5a, stage5b, stage5c }),
    validation: { ...validation, reinvestigation_required: false, blocking: false, reinvestigation_requests: [] },
    forensic_log: { substage: "5D", run_id: runContext?.runId || null }
  };
}
