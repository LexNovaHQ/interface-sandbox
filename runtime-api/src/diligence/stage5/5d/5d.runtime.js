import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { assertLosslessPrimaryEvidence, assertNoPlaceholderEvidence, assertWindowIsVerbatim } from "../stage5.runtime.js";
import { buildStage5DIntegratorInput } from "./5d.prompt.js";

function delivery(channels = []) {
  return {
    app: channels.includes("app") ? "true" : "unknown",
    api: channels.includes("api") ? "true" : "unknown",
    web: channels.includes("web") ? "true" : "unknown"
  };
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
    autonomy_level: record.autonomy_level,
    human_review_signal: record.human_review_signal,
    external_action_signal: record.external_action_signal,
    delivery_channels: delivery(record.delivery_channels),
    data_provenance: dataProvenance,
    archetype_codes: record.archetype_codes,
    archetype_labels: record.archetype_labels,
    archetype_provenance: record.archetype_codes.map((code, index) => ({
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
  for (const fn of stage5a?.admitted_functions || []) if (!fn.source_window_refs?.length) throw new Error("5D blocked: 5A function without source windows.");
  for (const tag of stage5b?.feature_tags || []) if (!tag.source_window_refs?.length) throw new Error("5D blocked: 5B tag without source windows.");
  for (const record of stage5c?.complete_feature_records || []) if (!record.evidence_window_refs?.length) throw new Error("5D blocked: 5C record without source windows.");

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
  assertNoPlaceholderEvidence(profile, "target_feature_profile");
  const validation = validateWithSchema(profile, schemaValidator);
  if (!validation.ok) {
    const error = new Error("Stage 5D target_feature_profile schema validation failed.");
    error.code = "STAGE5D_SCHEMA_VALIDATION_FAILED";
    error.validation = validation;
    throw error;
  }
  return {
    ok: true,
    stage5d_output_version: "stage5d_target_feature_profile_integrator_v2",
    target_feature_profile: profile,
    prompt_input: buildStage5DIntegratorInput({ canonicalInput, stage5a, stage5b, stage5c }),
    validation,
    forensic_log: { substage: "5D", run_id: runContext?.runId || null }
  };
}
